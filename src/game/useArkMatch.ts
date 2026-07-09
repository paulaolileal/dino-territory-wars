import { useEffect, useMemo, useRef, useState } from "react";
import { PeerService } from "@/game/peer";
import {
  DEFAULT_BOARD_SIZE,
  canPlace,
  cellsFor,
  inferPlacedDino,
  key,
  occupiedSet,
  randomPlacement,
  resolveAttack,
} from "@/game/board";
import { DINO_SPECS, type Coord, type NetMsg, type PlacedDino, type Rotation } from "@/game/types";
import { play, playDinoDamage, playDinoSpawn } from "@/game/sound";

export type Phase =
  | "home"
  | "creating"
  | "waiting"
  | "connecting"
  | "placement"
  | "waiting-opponent"
  | "my-turn"
  | "their-turn"
  | "victory"
  | "defeat"
  | "lost-connection";

export interface Shot {
  coord: Coord;
  result: "miss" | "hit" | "sunk";
}

function getConnRemoteId(p: PeerService): string | undefined {
  // @ts-expect-error private
  return p.conn?.peer;
}

export function useArkMatch() {
  const [phase, setPhase] = useState<Phase>("home");
  const [myPeerId, setMyPeerId] = useState<string>("");
  const [joinCode, setJoinCode] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [copyOk, setCopyOk] = useState(false);
  const [boardSize, setBoardSize] = useState<number>(DEFAULT_BOARD_SIZE);

  const [myDinos, setMyDinos] = useState<PlacedDino[]>([]);
  const [placingIdx, setPlacingIdx] = useState(0);
  const [rotation, setRotation] = useState<Rotation>(0);
  const [hover, setHover] = useState<Coord | null>(null);

  const [myShotsReceived, setMyShotsReceived] = useState<Shot[]>([]); // shots on my board
  const [myShotsFired, setMyShotsFired] = useState<Shot[]>([]); // on enemy board
  const [readyBoth, setReadyBoth] = useState({ me: false, them: false });
  const [enemyRevealed, setEnemyRevealed] = useState<PlacedDino[]>([]);

  const peerRef = useRef<PeerService | null>(null);
  const myDinosRef = useRef<PlacedDino[]>([]);
  useEffect(() => {
    myDinosRef.current = myDinos;
  }, [myDinos]);

  useEffect(() => {
    return () => peerRef.current?.destroy();
  }, []);

  function initPeer(onOpen: (id: string) => void, hostBoardSize?: number) {
    const p = new PeerService();
    peerRef.current = p;
    p.onOpen = (id) => {
      setMyPeerId(id);
      onOpen(id);
    };
    p.onConnected = () => {
      setStatus("Conectado");
      if (hostBoardSize) {
        peerRef.current?.send({ type: "hello", boardSize: hostBoardSize });
      }
      setPhase("placement");
    };
    p.onMessage = handleMessage;
    p.onDisconnect = () => setPhase("lost-connection");
    p.onError = (e) => {
      console.error(e);
      setStatus("Erro de conexão");
    };
    p.init();
  }

  function handleMessage(msg: NetMsg) {
    if (msg.type === "hello") {
      setBoardSize(msg.boardSize);
    } else if (msg.type === "ready") {
      setReadyBoth((r) => ({ ...r, them: true }));
    } else if (msg.type === "start") {
      const first = msg.firstPeer;
      const mine = peerRef.current?.peerId();
      setPhase(first === mine ? "my-turn" : "their-turn");
    } else if (msg.type === "attack") {
      const dinos = myDinosRef.current.map((d) => ({ ...d, hits: [...d.hits] }));
      const res = resolveAttack(dinos, msg.coord);
      setMyDinos(dinos);
      setMyShotsReceived((s) => [...s, { coord: msg.coord, result: res.result }]);
      peerRef.current?.send({
        type: "result",
        coord: msg.coord,
        result: res.result,
        sunkCells: res.sunkCells,
        kind: res.kind,
        gameOver: res.gameOver,
      });
      if (res.result === "miss") {
        play("miss");
      } else if (res.kind) {
        playDinoDamage(res.kind);
      }
      if (res.gameOver) {
        play("lose");
        setPhase("defeat");
      } else {
        setPhase("my-turn");
      }
    } else if (msg.type === "result") {
      setMyShotsFired((s) => [...s, { coord: msg.coord, result: msg.result }]);
      if (msg.result === "sunk" && msg.kind && msg.sunkCells) {
        setEnemyRevealed((r) => [...r, inferPlacedDino(msg.kind!, msg.sunkCells!)]);
      }
      if (msg.result === "miss") {
        play("miss");
      } else if (msg.kind) {
        playDinoDamage(msg.kind);
      }
      if (msg.gameOver) {
        play("win");
        setPhase("victory");
      } else {
        setPhase("their-turn");
      }
    } else if (msg.type === "restart") {
      resetLocal();
    }
  }

  // ---- Home actions ----
  function createMatch(size: number) {
    setBoardSize(size);
    setPhase("creating");
    setStatus("Gerando código...");
    initPeer(() => {
      setStatus("Aguardando adversário...");
      setPhase("waiting");
    }, size);
  }

  function doJoin() {
    if (!joinCode.trim()) return;
    setPhase("connecting");
    setStatus("Conectando...");
    initPeer(() => {
      peerRef.current?.connectTo(joinCode.trim());
    });
  }

  function copyCode() {
    navigator.clipboard?.writeText(myPeerId).then(() => {
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 1500);
    });
  }

  function disconnect() {
    peerRef.current?.destroy();
    peerRef.current = null;
    resetLocal();
    setPhase("home");
  }

  function resetLocal() {
    setMyDinos([]);
    setPlacingIdx(0);
    setRotation(0);
    setMyShotsReceived([]);
    setMyShotsFired([]);
    setReadyBoth({ me: false, them: false });
    setEnemyRevealed([]);
  }

  function restart() {
    resetLocal();
    peerRef.current?.send({ type: "restart" });
    setPhase("placement");
  }

  // ---- Placement ----
  const currentSpec = DINO_SPECS[placingIdx];

  function tryPlace(row: number, col: number) {
    if (!currentSpec) return;
    if (!canPlace(myDinos, currentSpec.kind, row, col, rotation, boardSize)) return;
    const newDino: PlacedDino = {
      kind: currentSpec.kind,
      rotation,
      row,
      col,
      hits: Array(currentSpec.cells.length).fill(false),
    };
    setMyDinos((d) => [...d, newDino]);
    setPlacingIdx((i) => i + 1);
    playDinoSpawn(currentSpec.kind);
  }

  const ROTATION_ORDER: Rotation[] = [0, 90, 180, 270];

  function rotate(direction: "cw" | "ccw" = "cw") {
    setRotation((r) => {
      const idx = ROTATION_ORDER.indexOf(r);
      const step = direction === "cw" ? 1 : -1;
      return ROTATION_ORDER[(idx + step + ROTATION_ORDER.length) % ROTATION_ORDER.length];
    });
  }

  function autoPlace() {
    setMyDinos(randomPlacement(boardSize));
    setPlacingIdx(DINO_SPECS.length);
  }

  function clearPlacement() {
    setMyDinos([]);
    setPlacingIdx(0);
  }

  function confirmPlacement() {
    setReadyBoth((r) => ({ ...r, me: true }));
    peerRef.current?.send({ type: "ready" });
  }

  // When both ready, host decides who starts
  const isHost = useMemo(() => {
    return Boolean(
      myPeerId && peerRef.current && myPeerId < (getConnRemoteId(peerRef.current) ?? ""),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPeerId, readyBoth]);

  useEffect(() => {
    if (readyBoth.me && readyBoth.them && phase === "waiting-opponent") {
      if (isHost) {
        const ids = [myPeerId, getConnRemoteId(peerRef.current!) ?? ""];
        const first = ids[Math.floor(Math.random() * 2)];
        peerRef.current?.send({ type: "start", firstPeer: first });
        setPhase(first === myPeerId ? "my-turn" : "their-turn");
      }
    }
  }, [readyBoth, phase, isHost, myPeerId]);

  useEffect(() => {
    if (readyBoth.me && !readyBoth.them) setPhase("waiting-opponent");
    if (readyBoth.me && readyBoth.them && phase === "placement") setPhase("waiting-opponent");
  }, [readyBoth, phase]);

  // ---- Attack ----
  function fireAt(coord: Coord) {
    if (phase !== "my-turn") return;
    if (myShotsFired.some((s) => s.coord.row === coord.row && s.coord.col === coord.col)) return;
    peerRef.current?.send({ type: "attack", coord });
    setPhase("their-turn"); // wait for result
    play("click");
  }

  // ---- Rendering helpers ----
  const myOcc = useMemo(() => occupiedSet(myDinos), [myDinos]);
  const receivedMap = useMemo(() => {
    const m = new Map<string, Shot>();
    myShotsReceived.forEach((s) => m.set(key(s.coord), s));
    return m;
  }, [myShotsReceived]);
  const firedMap = useMemo(() => {
    const m = new Map<string, Shot>();
    myShotsFired.forEach((s) => m.set(key(s.coord), s));
    return m;
  }, [myShotsFired]);

  const previewCells = useMemo<Set<string>>(() => {
    if (!hover || !currentSpec || placingIdx >= DINO_SPECS.length) return new Set();
    const cs = cellsFor({ kind: currentSpec.kind, row: hover.row, col: hover.col, rotation });
    return new Set(cs.map(key));
  }, [hover, currentSpec, rotation, placingIdx]);

  const previewValid = useMemo(() => {
    if (!hover || !currentSpec || placingIdx >= DINO_SPECS.length) return true;
    return canPlace(myDinos, currentSpec.kind, hover.row, hover.col, rotation, boardSize);
  }, [hover, currentSpec, rotation, myDinos, placingIdx, boardSize]);

  return {
    boardSize,
    phase,
    setPhase,
    myPeerId,
    joinCode,
    setJoinCode,
    status,
    copyOk,
    connected: Boolean(peerRef.current),

    myDinos,
    placingIdx,
    rotation,
    currentSpec,
    enemyRevealed,

    myShotsReceived,
    myShotsFired,
    readyBoth,

    myOcc,
    receivedMap,
    firedMap,
    previewCells,
    previewValid,

    createMatch,
    doJoin,
    copyCode,
    disconnect,
    restart,

    tryPlace,
    rotate,
    autoPlace,
    clearPlacement,
    confirmPlacement,
    onCellEnter: setHover,
    onCellLeave: () => setHover(null),

    fireAt,
  };
}

export type ArkMatchApi = ReturnType<typeof useArkMatch>;
