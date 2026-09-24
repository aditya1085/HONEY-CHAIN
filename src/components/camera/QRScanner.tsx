import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, X, Upload, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
  subtitle?: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Scan Honey Chain QR Code',
  subtitle = 'Scan batch pack QR, hive sticker, IoT device, or lab sample',
}) => {
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scannerRegionId = 'honeychain-qr-scanner-region';

  useEffect(() => {
    let activeScanner: Html5Qrcode | null = null;

    if (isOpen) {
      setErrorMsg(null);
      setScanning(true);

      const startScanner = async () => {
        try {
          // Delay briefly to allow DOM element to render
          await new Promise((resolve) => setTimeout(resolve, 200));

          const html5QrCode = new Html5Qrcode(scannerRegionId);
          scannerRef.current = html5QrCode;
          activeScanner = html5QrCode;

          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          };

          await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
              if (html5QrCode.isScanning) {
                html5QrCode.stop().then(() => {
                  onScanSuccess(decodedText);
                  onClose();
                }).catch(() => {
                  onScanSuccess(decodedText);
                  onClose();
                });
              }
            },
            () => {
              // frame scanned without QR - silent pass
            }
          );
        } catch (err: unknown) {
          console.warn('QR Scanner start error:', err);
          setErrorMsg('Camera access unavailable or blocked. Please upload a QR image or enter code manually.');
          setScanning(false);
        }
      };

      startScanner();
    }

    return () => {
      if (activeScanner && activeScanner.isScanning) {
        activeScanner.stop().catch(() => {});
      }
      scannerRef.current = null;
    };
  }, [isOpen, onScanSuccess, onClose]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode(scannerRegionId);
      const decoded = await html5QrCode.scanFile(file, true);
      onScanSuccess(decoded);
      onClose();
    } catch (err) {
      console.warn('QR scan from file failed:', err);
      setErrorMsg('No readable QR code found in this image. Please try another image or enter ID manually.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onScanSuccess(manualCode.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative flex flex-col w-full max-w-md bg-slate-900 rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 text-white">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-400 text-sm">{title}</h3>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Scanner Container */}
        <div className="relative bg-black min-h-[300px] flex items-center justify-center overflow-hidden">
          <div id={scannerRegionId} className="w-full h-full" />

          {errorMsg && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
              <p className="text-sm text-slate-300 mb-4">{errorMsg}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition shadow"
              >
                <Upload className="w-4 h-4" /> Scan QR from Photo
              </button>
            </div>
          )}
        </div>

        {/* Manual ID Input & Upload Fallback */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Or paste code: HB-2609-UP-0001..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition"
            >
              Verify
            </button>
          </form>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-amber-400 hover:underline"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Image with QR
            </button>
            <span>Auto-detect active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
