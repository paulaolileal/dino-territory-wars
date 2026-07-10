import Peer, { type DataConnection, type PeerError, type PeerErrorType } from "peerjs";
import type { NetMsg } from "./types";

const PEER_ERROR_MESSAGES: Partial<Record<PeerErrorType, string>> = {
  "peer-unavailable": "Sala não encontrada. O código pode ter expirado ou está incorreto.",
  network: "Falha de rede ao conectar. Verifique sua internet e tente novamente.",
  "server-error": "Servidor de conexão indisponível no momento. Tente novamente em instantes.",
  disconnected: "Conexão com o servidor perdida. Tente novamente.",
  "socket-error": "Falha de rede ao conectar. Verifique sua internet e tente novamente.",
  "socket-closed": "Conexão com o servidor perdida. Tente novamente.",
};

export function describePeerError(err: unknown): string {
  const type = (err as Partial<PeerError<PeerErrorType>> | undefined)?.type;
  return (type && PEER_ERROR_MESSAGES[type]) || "Erro de conexão. Tente novamente.";
}

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
