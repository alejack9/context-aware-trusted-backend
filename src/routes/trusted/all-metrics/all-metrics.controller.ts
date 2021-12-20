import { Body, Controller, Logger, Post } from '@nestjs/common';
import { FeatureCollection, Point } from 'geojson';
import { TrustedGeojsonProperties } from 'src/dtos/trusted-geojson-properties';
import { PrivacyService } from '../../../utils/privacy/privacy.service';
import { TrustedService } from '../trusted.service';
import {
  dummyUpdatesCount,
  dummyUpdatesRadiusMin,
  dummyUpdatesRadiusRange,
  perturbatorDecimals,
} from './privacy-meters-parameters';

@Controller('trusted')
export class AllMetricsController {
  private logger = new Logger('AllMetricsController');

  constructor(
    private trustedService: TrustedService,
    private privacyService: PrivacyService,
  ) {}

  @Post('allMetrics')
  async insertWithAllPrivacySettings(
    @Body()
    featColl: FeatureCollection<Point, TrustedGeojsonProperties>,
  ) {
    this.logger.log(
      `New ${featColl.features.length} true locations received from "allMetrics"`,
    );

    for (const [i, feature] of featColl.features.entries()) {
      this.logger.log(`${i + 1} / ${featColl.features.length}...`);
      await this.trustedService.sendFeatureCollection(
        this.privacyService.allMetrics(
          feature,
          perturbatorDecimals,
          dummyUpdatesRadiusMin,
          dummyUpdatesRadiusRange,
          dummyUpdatesCount,
        ),
      );
      this.logger.log(`...${i + 1}/${featColl.features.length} done`);
    }
  }
}
