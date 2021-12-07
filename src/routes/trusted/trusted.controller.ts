import {
  Body,
  Controller,
  Get,
  Logger,
  ParseFloatPipe,
  Post,
  Query,
} from '@nestjs/common';
import { FeatureCollection, Point } from 'geojson';
import { createFeature } from 'src/dtos/backend-geojson-properties';
import {
  BackendPrivacyOptions,
  BackendPrivacyParameters,
} from 'src/dtos/backend-privacy-parameters';
import { TrustedGeojsonProperties } from 'src/dtos/trusted-geojson-properties';
import { PrivacyService } from './privacy.service';
import { TrustedService } from './trusted.service';

@Controller()
export class TrustedController {
  private logger = new Logger('TrustedController');
  constructor(
    private trustedService: TrustedService,
    private privacyService: PrivacyService,
  ) {}

  @Get()
  async getAverageNoise(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('long', ParseFloatPipe) long: number,
    @BackendPrivacyOptions() privacyOptions: BackendPrivacyParameters,
  ) {
    return await this.trustedService.getAverageNoise(lat, long, privacyOptions);
  }

  @Post()
  async insert(
    @Body()
    featColl: FeatureCollection<Point, TrustedGeojsonProperties>,
  ) {
    await Promise.all(
      featColl.features.map(async (realFeature) =>
        this.trustedService.sendFeatureCollection({
          type: 'FeatureCollection',
          features: [
            ...(await this.privacyService.fromFeature(realFeature)),
            createFeature(
              realFeature.geometry.coordinates,
              realFeature.properties.noiseLevel,
              realFeature.properties.timeStamp,
              {
                dummyLocation: false,
                gpsPerturbated: false,
              },
            ),
          ],
        }),
      ),
    );
  }
}
