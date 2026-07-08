import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { PeerService } from "@/game/peer";
import {
  BOARD_SIZE,
  canPlace,
  cellsFor,
  key,
  occupiedSet,
  randomPlacement,
  resolveAttack,
} from "@/game/board";
import { DINO_SPECS, type Coord, type DinoKind, type NetMsg, type Orientation, type PlacedDino } from "@/game/types";
import { play } from "@/game/sound";

type Phase =
  | "home"
  | "creating"
  | "joining"
  | "waiting"
  | "connecting"
  | "placement"
  | "waiting-opponent"
  | "my-turn"
  | "their-turn"
  | "victory"
  | "defeat"
  | "lost-connection";

interface Shot {
  coord: Coord;
  result: "miss" | "hit" | "sunk";
}

const COLS = "ABCDEFGHIJ".split("");

export default function ArkGame() {
  const [phase, setPhase] = useState<Phase>("home");
  const [myPeerId, setMyPeerId] = useState<string>("");
  const [remoteId, setRemoteId] = useState<string>("");
  const [joinCode, setJoinCode] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [copyOk, setCopyOk] = useState(false);

  const [myDinos, setMyDinos] = useState<PlacedDino[]>([]);
  const [placingIdx, setPlacingIdx] = useState(0);
  const [orientation, setOrientation] = useState<Orientation>("H");
  const [hover, setHover] = useState<Coord | null>(null);

  const [myShotsReceived, setMyShotsReceived] = useState<Shot[]>([]); // shots on my board
  const [myShotsFired, setMyShotsFired] = useState<Shot[]>([]); // on enemy board
  const [readyBoth, setReadyBoth] = useState({ me: false, them: false });

  const peerRef = useRef<PeerService | null>(null);
  const myDinosRef = useRef<PlacedDino[]>([]);
  useEffect(() => { myDinosRef.current = myDinos; }, [myDinos]);

  // ---- Peer lifecycle ----
  useEffect(() => {
    return () => peerRef.current?.destroy();
  }, []);

  function initPeer(onOpen: (id: string) => void) {
    const p = new PeerService();
    peerRef.current = p;
    p.onOpen = (id) => { setMyPeerId(id); onOpen(id); };
    p.onConnected = () => {
      setStatus("Conectado");
      setPhase("placement");
    };
    p.onMessage = handleMessage;
    p.onDisconnect = () => setPhase("lost-connection");
    p.onError = (e) => { console.error(e); setStatus("Erro de conexão"); };
    p.init();
  }

  function handleMessage(msg: NetMsg) {
    if (msg.type === "ready") {
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
        gameOver: res.gameOver,
      });
      if (res.gameOver) { play("lose"); setPhase("defeat"); }
      else { play(res.result === "miss" ? "miss" : "hit"); setPhase("my-turn"); }

    } else if (msg.type === "result") {
      setMyShotsFired((s) => [...s, { coord: msg.coord, result: msg.result }]);
      if (msg.gameOver) { play("win"); setPhase("victory"); }
      else { play(msg.result === "miss" ? "miss" : "hit"); setPhase("their-turn"); }
    } else if (msg.type === "restart") {
      resetLocal();
    }
  }

  // ---- Home actions ----
  function createMatch() {
    setPhase("creating");
    setStatus("Gerando código...");
    initPeer((id) => {
      setStatus("Aguardando adversário...");
      setPhase("waiting");
      setRemoteId(id);
    });
  }

  function startJoin() { setPhase("joining"); }

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
    setOrientation("H");
    setMyShotsReceived([]);
    setMyShotsFired([]);
    setReadyBoth({ me: false, them: false });
  }

  // ---- Placement ----
  const currentSpec = DINO_SPECS[placingIdx];
  function tryPlace(row: number, col: number) {
    if (!currentSpec) return;
    if (!canPlace(myDinos, currentSpec.kind, row, col, orientation)) return;
    const newDino: PlacedDino = {
      kind: currentSpec.kind,
      size: currentSpec.size,
      orientation,
      row,
      col,
      hits: Array(currentSpec.size).fill(false),
    };
    setMyDinos((d) => [...d, newDino]);
    setPlacingIdx((i) => i + 1);
    play("click");
  }

  function autoPlace() {
    setMyDinos(randomPlacement());
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
    // host is the one who created the match: remoteId (their own id) === myPeerId AND they showed the code
    // Simpler: whoever has the lexicographically smaller peer id is host
    return myPeerId && peerRef.current && myPeerId < (getConnRemoteId(peerRef.current) ?? "");
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
    const cs = cellsFor(hover.row, hover.col, currentSpec.size, orientation);
    return new Set(cs.map(key));
  }, [hover, currentSpec, orientation, placingIdx]);

  const previewValid = useMemo(() => {
    if (!hover || !currentSpec || placingIdx >= DINO_SPECS.length) return true;
    return canPlace(myDinos, currentSpec.kind, hover.row, hover.col, orientation);
  }, [hover, currentSpec, orientation, myDinos, placingIdx]);

  // ---- UI ----
  return (
    <div className="min-h-screen ark-bg text-foreground">
      <header className="px-4 py-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="ark-logo">🦖</div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-wide ark-title">ARK Dino Wars</h1>
            <p className="text-xs text-muted-foreground">Batalha de tribos com dinossauros</p>
          </div>
        </div>
        {phase !== "home" && (
          <div className="flex items-center gap-2 text-xs">
            <span className={`h-2 w-2 rounded-full ${peerRef.current ? "bg-emerald-400" : "bg-red-500"} animate-pulse`} />
            <span className="hidden sm:inline">{phaseLabel(phase)}</span>
            <button onClick={disconnect} className="ark-btn-ghost ml-2">Sair</button>
          </div>
        )}
      </header>

      <main className="px-4 pb-10 md:px-8 max-w-6xl mx-auto">
        {phase === "home" && (
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="ark-card p-6 flex flex-col gap-4">
              <h2 className="text-lg font-bold">Criar partida</h2>
              <p className="text-sm text-muted-foreground">Gere um código e compartilhe com um amigo para começar.</p>
              <button onClick={createMatch} className="ark-btn-primary">Criar partida</button>
            </div>
            <div className="ark-card p-6 flex flex-col gap-4">
              <h2 className="text-lg font-bold">Entrar em partida</h2>
              <p className="text-sm text-muted-foreground">Cole o código que recebeu.</p>
              <button onClick={startJoin} className="ark-btn-secondary">Entrar em partida</button>
            </div>
          </div>
        )}

        {phase === "waiting" && (
          <div className="ark-card p-6 mt-6 max-w-lg mx-auto text-center flex flex-col gap-4">
            <h2 className="text-lg font-bold">Seu código de sala</h2>
            <div className="ark-code select-all">{myPeerId || "..."}</div>
            <div className="flex gap-2 justify-center">
              <button onClick={copyCode} className="ark-btn-secondary">{copyOk ? "Copiado!" : "Copiar código"}</button>
              <button onClick={disconnect} className="ark-btn-ghost">Cancelar</button>
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">Aguardando conexão do adversário...</p>
          </div>
        )}

        {phase === "joining" && (
          <div className="ark-card p-6 mt-6 max-w-lg mx-auto flex flex-col gap-4">
            <h2 className="text-lg font-bold">Código da partida</h2>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="cole o código aqui"
              className="ark-input"
            />
            <div className="flex gap-2">
              <button onClick={doJoin} className="ark-btn-primary flex-1">Conectar</button>
              <button onClick={() => setPhase("home")} className="ark-btn-ghost">Voltar</button>
            </div>
          </div>
        )}

        {(phase === "creating" || phase === "connecting") && (
          <div className="text-center mt-10 text-muted-foreground animate-pulse">{status}</div>
        )}

        {(phase === "placement" || phase === "waiting-opponent") && (
          <PlacementView
            myDinos={myDinos}
            placingIdx={placingIdx}
            orientation={orientation}
            onRotate={() => setOrientation((o) => (o === "H" ? "V" : "H"))}
            onCellEnter={(c) => setHover(c)}
            onCellLeave={() => setHover(null)}
            onCellClick={tryPlace}
            previewCells={previewCells}
            previewValid={previewValid}
            myOcc={myOcc}
            onAuto={autoPlace}
            onClear={clearPlacement}
            onConfirm={confirmPlacement}
            confirmed={readyBoth.me}
            themReady={readyBoth.them}
          />
        )}

        {(phase === "my-turn" || phase === "their-turn" || phase === "victory" || phase === "defeat") && (
          <BattleView
            phase={phase}
            myDinos={myDinos}
            receivedMap={receivedMap}
            firedMap={firedMap}
            myOcc={myOcc}
            onFire={fireAt}
          />
        )}

        {(phase === "victory" || phase === "defeat") && (
          <div className="ark-card p-6 mt-6 text-center flex flex-col gap-4 max-w-lg mx-auto">
            <h2 className="text-2xl font-bold">
              {phase === "victory" ? "🏆 Vitória!" : "💀 Derrota"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {phase === "victory" ? "Você conquistou a base inimiga." : "Sua base foi conquistada."}
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => { resetLocal(); peerRef.current?.send({ type: "restart" }); setPhase("placement"); }} className="ark-btn-primary">Reiniciar partida</button>
              <button onClick={disconnect} className="ark-btn-ghost">Sair</button>
            </div>
          </div>
        )}

        {phase === "lost-connection" && (
          <div className="ark-card p-6 mt-10 text-center max-w-lg mx-auto">
            <h2 className="text-lg font-bold">Conexão perdida</h2>
            <p className="text-sm text-muted-foreground mt-2">O adversário foi desconectado.</p>
            <button onClick={disconnect} className="ark-btn-primary mt-4">Voltar ao início</button>
          </div>
        )}
      </main>
    </div>
  );
}

function getConnRemoteId(p: PeerService): string | undefined {
  // @ts-expect-error private
  return p.conn?.peer;
}

function phaseLabel(p: Phase): string {
  const m: Record<Phase, string> = {
    home: "Início",
    creating: "Criando...",
    joining: "Entrando...",
    waiting: "Aguardando jogador...",
    connecting: "Conectando...",
    placement: "Posicionando criaturas",
    "waiting-opponent": "Aguardando adversário",
    "my-turn": "Seu turno",
    "their-turn": "Turno inimigo",
    victory: "Vitória",
    defeat: "Derrota",
    "lost-connection": "Conexão perdida",
  };
  return m[p];
}

// ---------- Placement view ----------
interface PlacementProps {
  myDinos: PlacedDino[];
  placingIdx: number;
  orientation: Orientation;
  onRotate: () => void;
  onCellEnter: (c: Coord) => void;
  onCellLeave: () => void;
  onCellClick: (row: number, col: number) => void;
  previewCells: Set<string>;
  previewValid: boolean;
  myOcc: Set<string>;
  onAuto: () => void;
  onClear: () => void;
  onConfirm: () => void;
  confirmed: boolean;
  themReady: boolean;
}

function PlacementView(p: PlacementProps) {
  const done = p.placingIdx >= DINO_SPECS.length;
  const current = DINO_SPECS[p.placingIdx];
  const dinoAt = (row: number, col: number): DinoKind | null => {
    for (const d of p.myDinos) {
      const cs = cellsFor(d.row, d.col, d.size, d.orientation);
      if (cs.some((c) => c.row === row && c.col === col)) return d.kind;
    }
    return null;
  };

  return (
    <div className="mt-4 grid md:grid-cols-[1fr_320px] gap-4">
      <div className="ark-card p-3 md:p-4">
        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Meu território</h3>
        <BoardGrid
          onEnter={p.onCellEnter}
          onLeave={p.onCellLeave}
          onClick={(r, c) => p.onCellClick(r, c)}
          renderCell={(row, col) => {
            const k = `${row},${col}`;
            const kind = dinoAt(row, col);
            const isPreview = p.previewCells.has(k);
            return (
              <div
                className={`ark-cell ${kind ? "ark-cell-dino" : ""} ${isPreview ? (p.previewValid ? "ark-cell-preview-ok" : "ark-cell-preview-bad") : ""}`}
              >
                {kind && <span className="text-xs">{DINO_SPECS.find((d) => d.kind === kind)!.emoji}</span>}
              </div>
            );
          }}
        />
      </div>

      <aside className="ark-card p-4 flex flex-col gap-3">
        <h3 className="font-bold">Posicionamento</h3>
        {!done && current && (
          <div className="text-sm">
            Posicionando: <b>{current.emoji} {current.name}</b> ({current.size} casas)
          </div>
        )}
        {done && <div className="text-sm text-emerald-300">Todos posicionados!</div>}
        <div className="flex gap-2 flex-wrap">
          <button onClick={p.onRotate} disabled={done} className="ark-btn-secondary">
            Rotacionar ({p.orientation === "H" ? "→" : "↓"})
          </button>
          <button onClick={p.onAuto} disabled={p.confirmed} className="ark-btn-ghost">Aleatório</button>
          <button onClick={p.onClear} disabled={p.confirmed} className="ark-btn-ghost">Limpar</button>
        </div>

        <div className="mt-2 border-t border-white/10 pt-3">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Criaturas</h4>
          <ul className="text-sm space-y-1">
            {DINO_SPECS.map((s, i) => (
              <li key={s.kind} className={`flex items-center justify-between ${i === p.placingIdx ? "text-emerald-300 font-bold" : ""}`}>
                <span>{s.emoji} {s.name}</span>
                <span className="text-xs text-muted-foreground">{s.size} casas {i < p.placingIdx ? "✓" : ""}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={p.onConfirm}
          disabled={!done || p.confirmed}
          className="ark-btn-primary mt-auto"
        >
          {p.confirmed ? (p.themReady ? "Aguardando..." : "Aguardando adversário...") : "Confirmar"}
        </button>
      </aside>
    </div>
  );
}

// ---------- Battle view ----------
interface BattleProps {
  phase: Phase;
  myDinos: PlacedDino[];
  receivedMap: Map<string, Shot>;
  firedMap: Map<string, Shot>;
  myOcc: Set<string>;
  onFire: (c: Coord) => void;
}

function BattleView(p: BattleProps) {
  const dinoAt = (row: number, col: number): DinoKind | null => {
    for (const d of p.myDinos) {
      const cs = cellsFor(d.row, d.col, d.size, d.orientation);
      if (cs.some((c) => c.row === row && c.col === col)) return d.kind;
    }
    return null;
  };

  return (
    <div className="mt-4 grid md:grid-cols-2 gap-4">
      <div className={`ark-card p-3 md:p-4 ${p.phase === "their-turn" ? "ark-active" : ""}`}>
        <h3 className="text-sm font-semibold mb-2 text-muted-foreground flex items-center justify-between">
          <span>Meu território</span>
          {p.phase === "their-turn" && <span className="text-xs text-amber-300 animate-pulse">sob ataque</span>}
        </h3>
        <BoardGrid
          renderCell={(row, col) => {
            const k = `${row},${col}`;
            const kind = dinoAt(row, col);
            const shot = p.receivedMap.get(k);
            return (
              <div className={`ark-cell ${kind ? "ark-cell-dino" : ""}`}>
                {kind && !shot && <span className="text-xs">{DINO_SPECS.find((d) => d.kind === kind)!.emoji}</span>}
                {shot?.result === "miss" && <span className="ark-miss">•</span>}
                {shot?.result === "hit" && <span className="ark-hit">✕</span>}
                {shot?.result === "sunk" && <span className="ark-sunk">💥</span>}
              </div>
            );
          }}
        />
      </div>

      <div className={`ark-card p-3 md:p-4 ${p.phase === "my-turn" ? "ark-active" : ""}`}>
        <h3 className="text-sm font-semibold mb-2 text-muted-foreground flex items-center justify-between">
          <span>Território inimigo</span>
          {p.phase === "my-turn" && <span className="text-xs text-emerald-300 animate-pulse">seu turno</span>}
        </h3>
        <BoardGrid
          onClick={(row, col) => p.onFire({ row, col })}
          renderCell={(row, col) => {
            const k = `${row},${col}`;
            const shot = p.firedMap.get(k);
            const clickable = p.phase === "my-turn" && !shot;
            return (
              <div className={`ark-cell ark-fog ${clickable ? "ark-cell-target" : ""}`}>
                {shot?.result === "miss" && <span className="ark-miss">•</span>}
                {shot?.result === "hit" && <span className="ark-hit">✕</span>}
                {shot?.result === "sunk" && <span className="ark-sunk">💥</span>}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

// ---------- Board grid ----------
interface GridProps {
  renderCell: (row: number, col: number) => React.ReactNode;
  onClick?: (row: number, col: number) => void;
  onEnter?: (c: Coord) => void;
  onLeave?: () => void;
}

function BoardGrid({ renderCell, onClick, onEnter, onLeave }: GridProps) {
  return (
    <div className="ark-board" onMouseLeave={onLeave}>
      <div className="ark-corner" />
      {COLS.map((c) => (
        <div key={c} className="ark-axis">{c}</div>
      ))}
      {Array.from({ length: BOARD_SIZE }).map((_, row) => (
        <Fragment key={`row-${row}`}>
          <div className="ark-axis">{row + 1}</div>
          {Array.from({ length: BOARD_SIZE }).map((_, col) => (
            <button
              key={`${row}-${col}`}
              onMouseEnter={() => onEnter?.({ row, col })}
              onClick={() => onClick?.(row, col)}
              className="ark-cell-wrap"
              type="button"
            >
              {renderCell(row, col)}
            </button>
          ))}
        </Fragment>
      ))}

    </div>
  );
}
