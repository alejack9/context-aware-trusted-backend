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
import {
  BackendPrivacyOptions,
  BackendPrivacyParameters,
} from 'src/dtos/backend-privacy-parameters';
import { v4 as uuid4 } from 'uuid';
import { TrustedGeojsonProperties } from 'src/dtos/trusted-geojson-properties';
import { PrivacyService } from '../../utils/privacy/privacy.service';
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

  @Get('id')
  getNewId() {
    return uuid4();
  }

  @Post()
  async insert(
    @Body()
    featColl: FeatureCollection<Point, TrustedGeojsonProperties>,
  ) {
    await Promise.all(
      featColl.features.map(async (realFeature) => {
        return this.trustedService.sendFeatureCollection({
          type: 'FeatureCollection',
          features: await this.privacyService.fromFeature(realFeature),
        });
      }),
    );
  }
}
