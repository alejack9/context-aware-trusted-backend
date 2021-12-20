export class MBR {
  min: {
    x: number;
    y: number;
    t: number;
  } = {
    x: Infinity,
    y: Infinity,
    t: Infinity,
  };
  max: {
    x: number;
    y: number;
    t: number;
  } = {
    x: -Infinity,
    y: -Infinity,
    t: -Infinity,
  };

  add(p: { x: number; y: number; t: number }) {
    this.min.x = Math.min(p.x, this.min.x);
    this.min.y = Math.min(p.y, this.min.y);
    this.min.t = Math.min(p.t, this.min.t);
    this.max.x = Math.max(p.x, this.max.x);
    this.max.y = Math.max(p.y, this.max.y);
    this.max.t = Math.max(p.t, this.max.t);
  }
}
