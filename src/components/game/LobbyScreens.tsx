import { Copy, MessageCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface WaitingRoomProps {
  code: string;
  copyOk: boolean;
  onCopy: () => void;
  onCancel: () => void;
}

export function WaitingRoom({ code, copyOk, onCopy, onCancel }: WaitingRoomProps) {
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Vem batalhar comigo em ARK: Territory Wars! 🦖 Código da sala: ${code}`,
  )}`;

  return (
    <div className="ark-card p-6 mt-6 max-w-lg mx-auto text-center flex flex-col gap-4">
      <h2 className="text-lg font-bold">Seu código de sala</h2>
      {code && (
        <div className="mx-auto rounded-lg bg-white p-3">
          <QRCodeSVG value={code} size={180} bgColor="#ffffff" fgColor="#000000" />
        </div>
      )}
      <div className="ark-code select-all">{code || "..."}</div>
      <div className="flex gap-2 justify-center flex-wrap">
        <button onClick={onCopy} className="ark-btn-secondary" type="button">
          <Copy className="w-4 h-4 inline-block mr-1.5" />
          {copyOk ? "Copiado!" : "Copiar código"}
        </button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ark-btn-secondary"
        >
          <MessageCircle className="w-4 h-4 inline-block mr-1.5" />
          WhatsApp
        </a>
        <button onClick={onCancel} className="ark-btn-ghost" type="button">
          Cancelar
        </button>
      </div>
      <p className="ark-muted text-sm animate-pulse">Aguardando conexão do adversário...</p>
    </div>
  );
}

export function ConnectingStatus({ status }: { status: string }) {
  return <div className="ark-muted text-center mt-10 animate-pulse">{status}</div>;
}

export function LostConnection({ onBack }: { onBack: () => void }) {
  return (
    <div className="ark-card p-6 mt-10 text-center max-w-lg mx-auto">
      <h2 className="text-lg font-bold">Conexão perdida</h2>
      <p className="ark-muted text-sm mt-2">O adversário foi desconectado.</p>
      <button onClick={onBack} className="ark-btn-primary mt-4" type="button">
        Voltar ao início
      </button>
    </div>
  );
}
