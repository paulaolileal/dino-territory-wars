import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import QrScannerWorkerPath from "qr-scanner/qr-scanner-worker.min.js?url";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

QrScanner.WORKER_PATH = QrScannerWorkerPath;

interface QrScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (value: string) => void;
}

export default function QrScanDialog({ open, onOpenChange, onScan }: QrScanDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !videoRef.current) return;

    setError(null);
    const scanner = new QrScanner(videoRef.current, (result) => onScan(result.data), {
      highlightScanRegion: true,
      highlightCodeOutline: true,
    });
    scanner.start().catch(() => setError("Não foi possível acessar a câmera."));

    return () => scanner.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escanear código da sala</DialogTitle>
        </DialogHeader>
        {error ? (
          <p className="ark-muted text-sm">{error}</p>
        ) : (
          <video ref={videoRef} className="w-full rounded-lg" muted playsInline />
        )}
      </DialogContent>
    </Dialog>
  );
}
