import { UndirectedGraph } from 'graphology';
import { Message } from './message';
export function subSet<T>(arr: T[], k: number): T[][] {
  const subs = [];
  for (let i = 0; i < Math.pow(2, arr.length); i++) {
    const sub = [];
    for (let j = 0; j < arr.length; j++)
      if (((i >> j) & 1) === 1) sub.push(arr[j]);
    if (sub.length === k) subs.push(sub);
  }
  return subs;
}

export function isClique(graph: UndirectedGraph<Message>) {
  let clique = true;
  const nodes = graph.nodes();

  while (clique && nodes.length > 0) {
    const node = nodes.pop();
    let i = 0;
    while (clique && i < nodes.length)
      if (!graph.hasEdge(node, nodes[i++])) clique = false;
  }
  return clique;
}

export function within(
  point: { x: number; y: number; t: number },
  box: number[][],
) {
  return (
    box[0][0] <= point.x &&
    point.x <= box[0][1] &&
    box[1][0] <= point.y &&
    point.y <= box[1][1] &&
    box[2][0] <= point.t &&
    point.t <= box[2][1]
  );
}
