import { GeoJsonProperties } from 'geojson';
import { TrustedPrivacyParameters } from './trusted-privacy-parameters';

export class TrustedGeojsonProperties
  extends TrustedPrivacyParameters
  implements GeoJsonProperties
{
  timeStamp: number;
  noiseLevel: number;
}
