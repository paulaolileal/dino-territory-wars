import { Suspense, lazy } from "react";
import { useArkMatch, type Phase } from "@/game/useArkMatch";
import { useBackgroundMusic } from "@/hooks/use-background-music";
import MusicToggle from "./MusicToggle";
import HomeScreen from "./HomeScreen";
import { ConnectingStatus, LostConnection, WaitingRoom } from "./LobbyScreens";
import ResultBanner from "./ResultBanner";

const PlacementView = lazy(() => import("./PlacementView"));
const BattleView = lazy(() => import("./BattleView"));

export default function ArkGame() {
  const match = useArkMatch();
  const music = useBackgroundMusic(match.phase);

  function handleCreate(size: number) {
    music.unlock();
    match.createMatch(size);
  }

  function handleJoin() {
    music.unlock();
    match.doJoin();
  }

  return (
    <div className="min-h-screen ark-bg text-foreground flex flex-col">
      <header className="ark-header px-4 py-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/assets/branding/ark-logo.png" alt="ARK" className="ark-logo-img" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-wide ark-title">
              ARK: Territory Wars
            </h1>
            <p className="ark-muted text-xs">Batalha de tribos com dinossauros</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <MusicToggle
            muted={music.muted}
            onToggle={music.toggleMuted}
            volume={music.volume}
            onVolumeChange={music.setVolume}
            blocked={music.blocked}
            onUnlock={music.unlock}
          />
          {match.phase !== "home" && (
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${match.connected ? "bg-emerald-400" : "bg-red-500"} animate-pulse`}
              />
              <span className="hidden sm:inline">{phaseLabel(match.phase)}</span>
              <button onClick={match.disconnect} className="ark-btn-ghost ml-2" type="button">
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      <main
        className={
          match.phase === "home"
            ? "flex-1 flex items-center justify-center px-4 pb-16 md:px-8"
            : "px-4 pb-16 md:px-8"
        }
      >
        {match.phase === "home" && (
          <HomeScreen
            onCreate={handleCreate}
            joinCode={match.joinCode}
            onJoinCodeChange={match.setJoinCode}
            onJoin={handleJoin}
          />
        )}

        {match.phase === "waiting" && (
          <WaitingRoom
            code={match.myPeerId}
            copyOk={match.copyOk}
            onCopy={match.copyCode}
            onCancel={match.disconnect}
          />
        )}

        {(match.phase === "creating" || match.phase === "connecting") && (
          <ConnectingStatus status={match.status} />
        )}

        {(match.phase === "placement" || match.phase === "waiting-opponent") && (
          <Suspense fallback={null}>
            <PlacementView
              boardSize={match.boardSize}
              myDinos={match.myDinos}
              placingIdx={match.placingIdx}
              rotation={match.rotation}
              onRotate={match.rotate}
              onCellEnter={match.onCellEnter}
              onCellLeave={match.onCellLeave}
              onCellClick={match.tryPlace}
              previewCells={match.previewCells}
              previewValid={match.previewValid}
              myOcc={match.myOcc}
              onAuto={match.autoPlace}
              onClear={match.clearPlacement}
              onConfirm={match.confirmPlacement}
              confirmed={match.readyBoth.me}
              themReady={match.readyBoth.them}
            />
          </Suspense>
        )}

        {(match.phase === "my-turn" ||
          match.phase === "their-turn" ||
          match.phase === "victory" ||
          match.phase === "defeat") && (
          <Suspense fallback={null}>
            <BattleView
              phase={match.phase}
              boardSize={match.boardSize}
              myDinos={match.myDinos}
              receivedMap={match.receivedMap}
              firedMap={match.firedMap}
              enemyRevealed={match.enemyRevealed}
              onFire={match.fireAt}
            />
          </Suspense>
        )}

        {(match.phase === "victory" || match.phase === "defeat") && (
          <ResultBanner
            victory={match.phase === "victory"}
            onRestart={match.restart}
            onDisconnect={match.disconnect}
          />
        )}

        {match.phase === "lost-connection" && <LostConnection onBack={match.disconnect} />}
      </main>

      <footer className="ark-footer fixed inset-x-0 bottom-0 z-20 flex justify-center py-2 pointer-events-none">
        <a
          href="https://lealtek.com"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto rounded px-3 py-1 opacity-60 transition-opacity hover:opacity-90"
          title="Desenvolvido por LealTEK"
        >
          <img
            src="/assets/branding/lealtek-full.png"
            alt="LealTEK"
            className="h-5 object-contain"
          />
        </a>
      </footer>
    </div>
  );
}

function phaseLabel(p: Phase): string {
  const m: Record<Phase, string> = {
    home: "Início",
    creating: "Criando...",
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
