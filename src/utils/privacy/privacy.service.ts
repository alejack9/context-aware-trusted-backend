import { Injectable, Logger } from '@nestjs/common';
import { Feature, FeatureCollection, Point, Polygon } from 'geojson';
import { product } from 'cartesian-product-generator';
import {
  BackendGeoJsonProperties,
  createFeature,
} from 'src/dtos/backend-geojson-properties';
import { TrustedGeojsonProperties } from 'src/dtos/trusted-geojson-properties';
import { to3857, to4326 } from 'src/utils/coordinates';
import { randomInt, countDecimals, randomDouble, round } from 'src/utils/math';
import { makeMessage } from './cloaking-engine/message';
import { CloakingEngineService } from './cloaking-engine/cloaking-engine.service';
import { MBR } from './cloaking-engine/mbr';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class PrivacyService {
  private logger = new Logger('CoordinatesService');

  constructor(
    private http: HttpService,
    private engineService: CloakingEngineService,
  ) {}

  /**
   * @param coords in EPSG:4326
   * @param min_radius in meters
   * @param diff_radius in meters
   * @returns
   */
  private dummyPositionFromCoord(
    coords: number[],
    min_radius: number,
    diff_radius: number,
  ) {
    const projected = to3857(coords);
    // Random angle from 0 to 2Pi
    const theta = randomDouble(0, 2 * Math.PI);
    const step = randomDouble(min_radius, min_radius + diff_radius);
    const offset = [Math.sin(theta), Math.cos(theta)].map((x) => x * step);
    return to4326(projected.map((v, i) => v + offset[i]));
  }

  /**
   * @param coords in EPSG:4326
   * @param realDecimalDigits operates on EPSG:4326 coordinates
   * @returns
   */
  private perturbateCoords(coords: number[], realDecimalDigits: number) {
    return coords.map((coord) => {
      const decimalsDigits = countDecimals(coord);
      const fakeDigits = decimalsDigits - realDecimalDigits;

      const realPart = round(coord, realDecimalDigits);
      const fakePart = randomInt(
        Math.pow(10, fakeDigits - 2),
        Math.pow(10, fakeDigits - 1) - 1,
      );

      const res =
        realPart +
        Math.pow(10, -(decimalsDigits - 1)) * fakePart +
        Math.pow(10, -decimalsDigits) * randomInt(1, 9);

      return round(res, decimalsDigits);
    });
  }

  async fromAlpha(
    feature: Feature<Point, TrustedGeojsonProperties>,
  ): Promise<Feature<Point | Polygon, BackendGeoJsonProperties>[]> {
    const res: {
      dummyMin: number;
      dummyCount: number;
      dummyStep: number;
      pertDecimals: number;
    } = JSON.parse(
      (
        await this.http
          .get(
            `${process.env.ALPHA_ENDPOINT}?alpha=${feature.properties.alphaValue}&gpsPert=${feature.properties.gpsPerturbated}&dumUpd=${feature.properties.dummyLocation}`,
          )
          .toPromise()
      ).data,
    );
    const toTransform: Feature<Point, TrustedGeojsonProperties> = {
      geometry: feature.geometry,
      type: 'Feature',
      properties: feature.properties,
    };

    toTransform.properties.alpha = false;
    toTransform.properties.dummyUpdatesCount = res.dummyCount;
    toTransform.properties.dummyUpdatesRadiusMin = res.dummyMin;
    toTransform.properties.dummyUpdatesRadiusStep = res.dummyStep;
    toTransform.properties.perturbatorDecimals = res.pertDecimals;

    return this.fromFeature(toTransform);
  }

  async fromFeature(
    realFeature: Feature<Point, TrustedGeojsonProperties>,
  ): Promise<Feature<Point | Polygon, BackendGeoJsonProperties>[]> {
    if (realFeature.properties.alpha) return await this.fromAlpha(realFeature);

    const toRet: Feature<Point | Polygon, BackendGeoJsonProperties>[] = [];

    for (const _ of [
      ...Array(
        (realFeature.properties.dummyLocation
          ? realFeature.properties.dummyUpdatesCount
          : 2) - 1,
      ).keys(),
    ]) {
      let coords = realFeature.geometry.coordinates;
      if (realFeature.properties.gpsPerturbated)
        coords = this.perturbateCoords(
          coords,
          realFeature.properties.perturbatorDecimals,
        );
      if (realFeature.properties.dummyLocation)
        coords = this.dummyPositionFromCoord(
          coords,
          realFeature.properties.dummyUpdatesRadiusMin,
          realFeature.properties.dummyUpdatesRadiusStep,
        );

      toRet.push(
        createFeature(
          coords,
          realFeature.properties.noiseLevel,
          realFeature.properties.timeStamp,
          {
            dummyLocation: realFeature.properties.dummyLocation,
            gpsPerturbated: realFeature.properties.gpsPerturbated,
            cloaking: realFeature.properties.cloaking,
            dummyUpdatesRadiusMin: realFeature.properties.dummyUpdatesRadiusMin,
            dummyUpdatesRadiusStep:
              realFeature.properties.dummyUpdatesRadiusStep,
            perturbatorDecimals: realFeature.properties.perturbatorDecimals,
          },
        ),
      );
    }

    if (!realFeature.properties.cloaking)
      return [
        ...toRet,
        createFeature(
          realFeature.geometry.coordinates,
          realFeature.properties.noiseLevel,
          realFeature.properties.timeStamp,
          {
            dummyLocation: false,
            gpsPerturbated: false,
            cloaking: false,
          },
        ),
      ];

    return this.cloaking(
      realFeature,
      toRet as Feature<Point, BackendGeoJsonProperties>[],
    );
  }

  async cloaking(
    realFeature: Feature<Point, TrustedGeojsonProperties>,
    messages: Feature<Point, BackendGeoJsonProperties>[],
  ): Promise<Feature<Polygon, BackendGeoJsonProperties>[]> {
    const toRet = [];

    return new Promise((res) => {
      let done = 0;
      const cbCalled = () => {
        if (++done === messages.length) res(toRet);
      };
      const success = (rect: { mbr: MBR; m: BackendGeoJsonProperties }) => {
        toRet.push({
          type: 'Feature',
          properties: rect.m,
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [rect.mbr.min.x, rect.mbr.min.y],
                [rect.mbr.max.x, rect.mbr.min.y],
                [rect.mbr.max.x, rect.mbr.max.y],
                [rect.mbr.min.x, rect.mbr.max.y],
                [rect.mbr.min.x, rect.mbr.min.y],
              ],
            ],
          },
        });
        cbCalled();
      };
      const fail = cbCalled;

      for (const [i, msg] of messages.entries()) {
        this.engineService.newMessage(
          makeMessage(
            realFeature.properties.reqId,
            realFeature.properties.reqNr + i,
            realFeature.properties.timeStamp,
            msg.geometry.coordinates[0],
            msg.geometry.coordinates[1],
            realFeature.properties.cloakingK,
            realFeature.properties.cloakingTimeout,
            realFeature.properties.cloakingSizeX,
            realFeature.properties.cloakingSizeY,
            {
              dummyLocation: realFeature.properties.dummyLocation,
              gpsPerturbated: realFeature.properties.gpsPerturbated,
              cloaking: realFeature.properties.cloaking,
              noiseLevel: realFeature.properties.noiseLevel,
              timeStamp: realFeature.properties.timeStamp,
              dummyUpdatesRadiusMin:
                realFeature.properties.dummyUpdatesRadiusMin,
              dummyUpdatesRadiusStep:
                realFeature.properties.dummyUpdatesRadiusStep,
              perturbatorDecimals: realFeature.properties.perturbatorDecimals,
            },
            success,
            fail,
          ),
        );
      }
    });
  }

  allMetrics(
    feature: Feature<Point, TrustedGeojsonProperties>,
    perturbatorDecimals: number[],
    dummyUpdatesRadiusMin: number[],
    dummyUpdatesRadiusRange: number[],
    dummyUpdatesCount: number,
  ): FeatureCollection<Point, BackendGeoJsonProperties> {
    const toRet: FeatureCollection<Point, BackendGeoJsonProperties> = {
      type: 'FeatureCollection',
      features: [],
    };

    // perturbated
    toRet.features.push(
      ...perturbatorDecimals.map((pert) =>
        createFeature(
          this.perturbateCoords(feature.geometry.coordinates, pert),
          feature.properties.noiseLevel,
          feature.properties.timeStamp,
          {
            dummyLocation: false,
            gpsPerturbated: true,
            cloaking: false,
            perturbatorDecimals: pert,
          },
        ),
      ),
    );

    // dummy
    for (const [min, range, _] of product(
      dummyUpdatesRadiusMin,
      dummyUpdatesRadiusRange,
      [...Array(dummyUpdatesCount - 1).keys()], // repeat "dummyUpdates - 1" times
    ))
      toRet.features.push(
        createFeature(
          this.dummyPositionFromCoord(feature.geometry.coordinates, min, range),
          feature.properties.noiseLevel,
          feature.properties.timeStamp,
          {
            dummyLocation: true,
            gpsPerturbated: false,
            cloaking: false,
            dummyUpdatesRadiusMin: min,
            dummyUpdatesRadiusStep: range,
          },
        ),
      );

    // dummy perturbated
    for (const [min, range, pert, _] of product(
      dummyUpdatesRadiusMin,
      dummyUpdatesRadiusRange,
      perturbatorDecimals,
      [...Array(dummyUpdatesCount - 1).keys()], // repeat "dummyUpdates - 1" times
    ))
      toRet.features.push(
        createFeature(
          this.perturbateCoords(
            this.dummyPositionFromCoord(
              feature.geometry.coordinates,
              min,
              range,
            ),
            pert,
          ),
          feature.properties.noiseLevel,
          feature.properties.timeStamp,
          {
            dummyLocation: true,
            gpsPerturbated: true,
            cloaking: false,
            dummyUpdatesRadiusMin: min,
            dummyUpdatesRadiusStep: range,
            perturbatorDecimals: pert,
          },
        ),
      );

    toRet.features.splice(
      randomInt(0, toRet.features.length),
      0,
      createFeature(
        feature.geometry.coordinates,
        feature.properties.noiseLevel,
        feature.properties.timeStamp,
        {
          dummyLocation: false,
          gpsPerturbated: false,
          cloaking: false,
        },
      ),
    );

    return toRet;
  }
}
