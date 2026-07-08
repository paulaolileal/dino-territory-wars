interface ResultBannerProps {
  victory: boolean;
  onRestart: () => void;
  onDisconnect: () => void;
}

export default function ResultBanner({ victory, onRestart, onDisconnect }: ResultBannerProps) {
  return (
    <div className="ark-card p-6 mt-6 text-center flex flex-col gap-4 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold">{victory ? "🏆 Vitória!" : "💀 Derrota"}</h2>
      <p className="text-sm text-muted-foreground">
        {victory ? "Você conquistou a base inimiga." : "Sua base foi conquistada."}
      </p>
      <div className="flex gap-2 justify-center">
        <button onClick={onRestart} className="ark-btn-primary" type="button">
          Reiniciar partida
        </button>
        <button onClick={onDisconnect} className="ark-btn-ghost" type="button">
          Sair
        </button>
      </div>
    </div>
  );
}
