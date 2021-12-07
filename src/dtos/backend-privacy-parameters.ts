import { ApiProperty, ApiPropertyOptional, ApiQuery } from '@nestjs/swagger';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export class BackendPrivacyParameters {
  @ApiProperty()
  dummyLocation: boolean;
  @ApiProperty()
  gpsPerturbated: boolean;
  @ApiPropertyOptional()
  perturbatorDecimals?: number;
  @ApiPropertyOptional()
  dummyUpdatesRadiusMin?: number;
  @ApiPropertyOptional()
  dummyUpdatesRadiusStep?: number;
}

export function fromQueryMap(query: any): BackendPrivacyParameters {
  return {
    dummyLocation: /true/i.test(query.dummyLocation),
    dummyUpdatesRadiusMin: Number(query.dummyUpdatesRadiusMin),
    dummyUpdatesRadiusStep: Number(query.dummyUpdatesRadiusStep),
    gpsPerturbated: /true/i.test(query.gpsPerturbated),
    perturbatorDecimals: Number(query.perturbatorDecimals),
  };
}

export const BackendPrivacyOptions = createParamDecorator(
  (_, ctx: ExecutionContext): BackendPrivacyParameters =>
    fromQueryMap(ctx.switchToHttp().getRequest().query),
  [
    (t: any, k: string) => {
      ApiQuery({
        type: [BackendPrivacyParameters],
      })(t, k, Object.getOwnPropertyDescriptor(t, k));
    },
  ],
);

export function toQueryString(props: BackendPrivacyParameters) {
  return Object.keys(props)
    .map((prop) => `${prop}=${props[prop]}`)
    .join('&');
}