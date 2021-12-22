import { BackendGeoJsonProperties } from 'src/dtos/backend-geojson-properties';
import { MBR } from './mbr';

export class Message {
  uId: string;
  rNo: number;
  t: number;
  x: number;
  y: number;
  k: number;
  dt: number;
  dx: number;
  dy: number;
  C: BackendGeoJsonProperties;
  cb: (mt: { mbr: MBR; m: BackendGeoJsonProperties }) => void;
  fail: () => void;
}

export function unique(msg: Message) {
  return `${msg.uId}${msg.rNo}`;
}

export function makeMessage(
  uId: string,
  rNo: number,
  t: number,
  x: number,
  y: number,
  k: number,
  dt: number,
  dx: number,
  dy: number,
  C: BackendGeoJsonProperties,
  cb: (mt: { mbr: MBR; m: BackendGeoJsonProperties }) => void,
  fail: () => void,
): Message {
  return {
    uId,
    rNo,
    t,
    x,
    y,
    k,
    dt,
    dx,
    dy,
    C,
    cb,
    fail,
  };
}
