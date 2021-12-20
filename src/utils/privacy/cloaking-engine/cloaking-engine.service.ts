import { Injectable, Logger } from '@nestjs/common';
import { RBush3D } from 'rbush-3d';
import { UndirectedGraph } from 'graphology';
import { MinHeap } from 'heap-min-max';
import { BackendGeoJsonProperties } from 'src/dtos/backend-geojson-properties';
import { subgraph } from 'graphology-operators';
import { MBR } from './mbr';
import { Message, unique } from './message';
import { subSet, isClique, within } from './set-operations';

@Injectable()
export class CloakingEngineService {
  private logger = new Logger('CloakingEngineService');
  // private messagesQueue: Message[] = [];
  private Im = new RBush3D();
  private constraintGraph = new UndirectedGraph<Message>();
  private expirationHeap = new MinHeap();

  newMessage(message: Message) {
    // this.messagesQueue.push(message);
    this.msgPertEngine(message);
    setTimeout(() => this.checkExpired(), message.dt + 10);
  }

  private Bcn = (message: Message): number[][] => [
    this.phi(message.x, message.dx),
    this.phi(message.y, message.dy),
    this.phi(message.t, message.dt),
  ];

  private LmToBBox(Lm: { x: number; y: number; t: number }, msc: Message) {
    return {
      minX: Lm.x,
      maxX: Lm.x,
      minY: Lm.y,
      maxY: Lm.y,
      minZ: Lm.t,
      maxZ: Lm.t,
      C: msc,
    };
  }

  private BcnToBBox(Bcn: number[][], msc: Message) {
    return {
      minX: Bcn[0][0],
      maxX: Bcn[0][1],
      minY: Bcn[1][0],
      maxY: Bcn[1][1],
      minZ: Bcn[2][0],
      maxZ: Bcn[2][1],
      C: msc,
    };
  }

  private Lm = (msg: Message) => {
    return {
      x: msg.x,
      y: msg.y,
      t: msg.t,
    };
  };

  private phi(v: number, d: number): number[] {
    return [v - d, v + d];
  }

  private makeMBR(M: Message[]) {
    const toRet = new MBR();
    M.forEach((m) => toRet.add(m));
    return toRet;
  }

  private makePert(M: Message[], ms: BackendGeoJsonProperties) {
    return {
      mbr: this.makeMBR(M),
      m: ms,
    };
  }

  private msgPertEngine(msc: Message) {
    // if Qm != EMPTY
    // if (this.messagesQueue.length !== 0) {
    // Pop the first item in Qm
    // const msc = this.messagesQueue.pop();
    // Add msc into Im with Lm(msc)
    this.Im.insert(this.LmToBBox(this.Lm(msc), msc));
    // Add msc into Hm with (msc.t + msc.dt)
    this.expirationHeap.push(msc.t + msc.dt, msc);
    // Add the message msc into Gm as a node
    this.constraintGraph.addNode(unique(msc), msc);

    const Bcn = this.BcnToBBox(this.Bcn(msc), msc);
    // Range search Im using Bcn(msc)
    const N = this.Im.search(Bcn);

    // foreach ms ⊂ N, ms != msc
    // if L(msc) ⊂ Bcn(ms)
    for (const ms of N.filter((ms) => unique(ms.C) !== unique(msc)))
      if (within(this.Lm(msc), this.Bcn(ms.C)))
        // Add the edge (msc, ms) into Gm
        this.constraintGraph.addUndirectedEdge(unique(msc), unique(ms.C));

    // G'm <- subgraph of Gm consisting of messages in N
    const Gm1 = subgraph(
      this.constraintGraph,
      N.map((v) => unique(v.C)),
    );
    // M <- LOCAL-k_SEARCH(msc.k, msc, G'm)
    const M = this.localKSearch(msc.k, msc, Gm1);
    // if M != EMPTY
    if (M.length > 0) {
      // foreach ms in M
      for (const ms of M) {
        // Output perturbated message Mt <- <h(ms.uid||ms.rno), Bm(M), ms.C>
        ms.cb(this.makePert(M, ms.C));
        // Remove the message ms from Gm
        this.constraintGraph.dropNode(unique(ms));
        // Remove the message ms from Im
        this.Im.remove(
          this.LmToBBox(this.Lm(ms), ms),
          (a, b) => unique(a.C) === unique(b.C),
        );
        // Pop the top most element in Hm
        this.expirationHeap.pop();
      }
    }
    // }

    // this.checkExpired();
  }

  private i = 0;

  private checkExpired() {
    if (!this.expirationHeap.top()) return;
    const ii = this.i++;
    this.logger.log(`${ii} - RUNNING`);
    while (true) {
      // ms <- Topmost item in Hm
      const expTime = this.expirationHeap.topKey();
      // if ms.t + ms.dt >= now { break }
      if (!expTime || expTime >= Date.now()) break;
      // Pop the top most element in Hm
      const ms = this.expirationHeap.pop()[1];
      // Remove the message ms from Gm
      this.constraintGraph.dropNode(unique(ms));
      // Remove the message ms from Im
      this.Im.remove(
        this.LmToBBox(this.Lm(ms), ms),
        (a, b) => unique(a.C) === unique(b.C),
      );
      ms.fail();
    }
  }

  private localKSearch(
    k: number,
    msc: Message,
    Gm1: UndirectedGraph<Message>,
  ): Message[] {
    // U <- { ms | ms ⊂ nbr(msc, G'm) and ms.k <= k }
    const U = Gm1.filterNeighbors(unique(msc), (_, ms) => ms.k <= k);

    // if |U| < k - 1 { return EMPTY }
    if (U.length < k - 1) return [];
    // l <- 0
    let l = 0;
    // while l != |U|
    while (l != U.length) {
      // l <- |U|
      l = U.length;
      // foreach ms ⊂ U
      for (const msUnique of U) {
        // intersectedLength <- |nbr(ms,G'm) ∩ U|
        const intersectedLength = Gm1.neighbors(msUnique).filter((v) =>
          U.includes(v),
        ).length;
        // if(intersectedLength < k - 2)
        if (intersectedLength < k - 2)
          // U <- U\{ms}
          U.splice(
            U.findIndex((v) => v === msUnique),
            1,
          );
      }
    }
    // find any subset M ⊂ U, s.t. |M| = k - 1 and M ∪ {msc} forms a clique
    for (const candidateM of subSet(U, k - 1)) {
      candidateM.push(unique(msc));
      if (isClique(subgraph(Gm1, candidateM))) {
        return candidateM.map(
          (name) =>
            // getAttribute() is bugged
            [...this.constraintGraph.nodeEntries()].filter(
              (n_a) => n_a.node === name,
            )[0].attributes,
        );
      }
    }
  }
}
