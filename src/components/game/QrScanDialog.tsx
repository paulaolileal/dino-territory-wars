import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface QrScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (value: string) => void;
}

export default function QrScanDialog({ open, onOpenChange, onScan }: QrScanDialogProps) {
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!open || !videoEl) return;

    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Este navegador não permite acesso à câmera nesta página (é necessário HTTPS).");
      return;
    }

    let scanner: QrScanner | null = null;
    try {
      scanner = new QrScanner(videoEl, (result) => onScanRef.current(result.data), {
        highlightScanRegion: true,
        highlightCodeOutline: true,
      });
      scanner.start().catch((e) => {
        console.error(e);
        setError("Não foi possível acessar a câmera.");
      });
    } catch (e) {
      console.error(e);
      setError("Não foi possível iniciar o leitor de QR code.");
    }

    return () => scanner?.destroy();
  }, [open, videoEl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="ark-card border-none text-[#e8ead8]">
        <DialogHeader>
          <DialogTitle className="ark-section-title">Escanear código da sala</DialogTitle>
        </DialogHeader>
        {error ? (
          <p className="ark-muted text-sm">{error}</p>
        ) : (
          <video ref={setVideoEl} className="w-full rounded-lg" muted playsInline />
        )}
      </DialogContent>
    </Dialog>
  );
}
