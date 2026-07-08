import { useState } from "react";
import { Camera } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BOARD_SIZE_OPTIONS, DEFAULT_BOARD_SIZE } from "@/game/board";
import QrScanDialog from "./QrScanDialog";

interface HomeScreenProps {
  onCreate: (size: number) => void;
  joinCode: string;
  onJoinCodeChange: (value: string) => void;
  onJoin: () => void;
}

export default function HomeScreen({
  onCreate,
  joinCode,
  onJoinCodeChange,
  onJoin,
}: HomeScreenProps) {
  const [boardSize, setBoardSize] = useState<number>(DEFAULT_BOARD_SIZE);
  const [scanOpen, setScanOpen] = useState(false);

  function handleScan(value: string) {
    setScanOpen(false);
    onJoinCodeChange(value);
    onJoin();
  }

  return (
    <div className="ark-card w-full max-w-md p-6 flex flex-col gap-5">
      <div>
        <h2 className="ark-section-title text-lg font-bold">Bem-vindo, treinador</h2>
        <p className="ark-muted text-sm">Crie uma partida ou entre em uma já existente.</p>
      </div>

      <Tabs defaultValue="create">
        <TabsList className="ark-tabs-list">
          <TabsTrigger value="create" className="ark-tabs-trigger">
            🏕️ Criar
          </TabsTrigger>
          <TabsTrigger value="join" className="ark-tabs-trigger">
            ⚔️ Entrar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="flex flex-col gap-4">
          <p className="ark-muted text-sm">
            Gere um código e compartilhe com um amigo para começar.
          </p>
          <div className="flex flex-col gap-2">
            <span className="ark-muted text-sm">Tamanho do grid</span>
            <div className="flex gap-2">
              {BOARD_SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  onClick={() => setBoardSize(size)}
                  className={
                    (boardSize === size ? "ark-btn-secondary" : "ark-btn-ghost") + " flex-1"
                  }
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
        </TabsContent>

        <TabsContent value="join" className="flex flex-col gap-4">
          <p className="ark-muted text-sm">Cole o código que recebeu.</p>
          <input
            value={joinCode}
            onChange={(e) => onJoinCodeChange(e.target.value)}
            placeholder="cole o código aqui"
            className="ark-input"
          />
          <button onClick={() => setScanOpen(true)} className="ark-btn-ghost" type="button">
            <Camera className="w-4 h-4 inline-block mr-1.5" />
            Escanear QR Code
          </button>
          <button onClick={onJoin} className="ark-btn-primary" type="button">
            Conectar
          </button>
          <QrScanDialog open={scanOpen} onOpenChange={setScanOpen} onScan={handleScan} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
