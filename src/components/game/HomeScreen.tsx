import { useState } from "react";
import { BOARD_SIZE_OPTIONS, DEFAULT_BOARD_SIZE } from "@/game/board";

interface HomeScreenProps {
  onCreate: (size: number) => void;
  onJoin: () => void;
}

export default function HomeScreen({ onCreate, onJoin }: HomeScreenProps) {
  const [boardSize, setBoardSize] = useState<number>(DEFAULT_BOARD_SIZE);

  return (
    <div className="grid md:grid-cols-2 gap-4 mt-6">
      <div className="ark-card p-6 flex flex-col gap-4">
        <h2 className="text-lg font-bold">🏕️ Criar partida</h2>
        <p className="text-sm text-muted-foreground">
          Gere um código e compartilhe com um amigo para começar.
        </p>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">Tamanho do grid</span>
          <div className="flex gap-2">
            {BOARD_SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                onClick={() => setBoardSize(size)}
                className={boardSize === size ? "ark-btn-secondary" : "ark-btn-ghost"}
                type="button"
                aria-pressed={boardSize === size}
              >
                {size}x{size}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => onCreate(boardSize)} className="ark-btn-primary" type="button">
          Criar partida
        </button>
      </div>
      <div className="ark-card p-6 flex flex-col gap-4">
        <h2 className="text-lg font-bold">⚔️ Entrar em partida</h2>
        <p className="text-sm text-muted-foreground">Cole o código que recebeu.</p>
        <button onClick={onJoin} className="ark-btn-secondary" type="button">
          Entrar em partida
        </button>
      </div>
    </div>
  );
}
