import { waitFor } from 'src/utils/wait-for';
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { FeatureCollection, Point, Polygon } from 'geojson';
import { BackendGeoJsonProperties } from 'src/dtos/backend-geojson-properties';
import {
  BackendPrivacyParameters,
  toQueryString,
} from 'src/dtos/backend-privacy-parameters';

@Injectable()
export class TrustedService {
  private logger = new Logger('TrustedService');
  constructor(private http: HttpService) {}

  async getAverageNoise(
    lat: number,
    long: number,
    privacyOptions: BackendPrivacyParameters,
  ) {
    return (
      await this.http
        .get(
          `${
            process.env.UNTRUSTED_BACKEND_ENDPOINT
          }?lat=${lat}&long=${long}&${toQueryString(privacyOptions)}`,
        )
        .toPromise()
    ).data;
  }

  async sendFeatureCollection(
    featureCollection: FeatureCollection<
      Point | Polygon,
      BackendGeoJsonProperties
    >,
  ) {
    let done = true;
    do {
      try {
        (
          await this.http
            .post(process.env.UNTRUSTED_BACKEND_ENDPOINT, featureCollection)
            .toPromise()
        ).data;
        done = true;
      } catch (e: any) {
        done = false;
        this.logger.warn('Error sending feature collection');
        this.logger.warn(e);
        this.logger.warn('Retrying in 500 ms');
        await waitFor(500);
      }
    } while (!done);
  }
}
