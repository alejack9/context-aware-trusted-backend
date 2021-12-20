import { ApiProperty, ApiPropertyOptional, ApiQuery } from '@nestjs/swagger';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export class TrustedPrivacyParameters {
  @ApiProperty()
  reqId: string;
  @ApiProperty()
  reqNr: number;
  @ApiProperty()
  alpha: boolean;
  @ApiProperty()
  cloaking: boolean;
  @ApiProperty()
  dummyLocation: boolean;
  @ApiProperty()
  gpsPerturbated: boolean;
  @ApiPropertyOptional()
  alphaValue?: number;
  @ApiPropertyOptional()
  cloakingTimeout?: number;
  @ApiPropertyOptional()
  cloakingK?: number;
  @ApiPropertyOptional()
  cloakingSizeX?: number;
  @ApiPropertyOptional()
  cloakingSizeY?: number;
  @ApiPropertyOptional()
  dummyUpdatesCount?: number;
  @ApiPropertyOptional()
  perturbatorDecimals?: number;
  @ApiPropertyOptional()
  dummyUpdatesRadiusMin?: number;
  @ApiPropertyOptional()
  dummyUpdatesRadiusStep?: number;
}

function fromQuery(query: any): TrustedPrivacyParameters {
  return {
    reqId: query.reqId,
    reqNr: query.reqNr,
    alpha: /true/i.test(query.alpha),
    alphaValue: Number(query.alphaValue),
    cloaking: /true/i.test(query.cloaking),
    cloakingK: Number(query.cloakingSizeK),
    cloakingSizeX: Number(query.cloakingSizeX),
    cloakingSizeY: Number(query.cloakingSizeY),
    cloakingTimeout: Number(query.cloakingTimeout),
    dummyLocation: /true/i.test(query.dummyLocation),
    dummyUpdatesCount: Number(query.dummyUpdatesCount),
    dummyUpdatesRadiusMin: Number(query.dummyUpdatesRadiusMin),
    dummyUpdatesRadiusStep: Number(query.dummyUpdatesRadiusStep),
    gpsPerturbated: /true/i.test(query.gpsPerturbated),
    perturbatorDecimals: Number(query.perturbatorDecimals),
  };
}

export const TrustedPrivacyOptions = createParamDecorator(
  (_, ctx: ExecutionContext): TrustedPrivacyParameters =>
    fromQuery(ctx.switchToHttp().getRequest().query),
  [
    (t: any, k: string) => {
      ApiQuery({
        type: [TrustedPrivacyParameters],
      })(t, k, Object.getOwnPropertyDescriptor(t, k));
    },
  ],
);
