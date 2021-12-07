import * as proj4 from 'proj4';

const epsg4326 = '+proj=longlat +datum=WGS84 +no_defs';
const epsg3857 =
  '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs';

export function to3857(coordinates: number[]) {
  return proj4(epsg4326, epsg3857, coordinates);
}

export function to4326(coordinates: number[]) {
  return proj4(epsg3857, epsg4326, coordinates);
}
