import Peer, { type DataConnection } from "peerjs";
import type { NetMsg } from "./types";

export class PeerService {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  public onOpen: (id: string) => void = () => {};
  public onConnected: () => void = () => {};
  public onMessage: (msg: NetMsg) => void = () => {};
  public onDisconnect: () => void = () => {};
  public onError: (err: unknown) => void = () => {};

  init() {
    this.peer = new Peer();
    this.peer.on("open", (id) => this.onOpen(id));
    this.peer.on("connection", (c) => this.attach(c));
    this.peer.on("error", (e) => this.onError(e));
  }

  connectTo(id: string) {
    if (!this.peer) return;
    const c = this.peer.connect(id, { reliable: true });
    this.attach(c);
  }

  private attach(c: DataConnection) {
    this.conn = c;
    c.on("open", () => this.onConnected());
    c.on("data", (d) => this.onMessage(d as NetMsg));
    c.on("close", () => this.onDisconnect());
    c.on("error", (e) => this.onError(e));
  }

  send(msg: NetMsg) {
    this.conn?.send(msg);
  }

  peerId(): string | undefined {
    return this.peer?.id;
  }

  destroy() {
    this.conn?.close();
    this.peer?.destroy();
  }
}
