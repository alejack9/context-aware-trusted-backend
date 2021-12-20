import { BackendGeoJsonProperties } from 'src/dtos/backend-geojson-properties';
import { MBR } from './mbr';

type ResultHandlerFunction = (mt: {
  mbr: MBR;
  m: BackendGeoJsonProperties;
}) => void;

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
  cb: ResultHandlerFunction;
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
  cb: ResultHandlerFunction,
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
