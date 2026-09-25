import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Printer, Hexagon, ShieldCheck, MapPin } from 'lucide-react';
import { HiveRecord } from '../../types';

interface PrintableHiveStickerProps {
  hive: HiveRecord;
  onClose: () => void;
}

export const PrintableHiveSticker: React.FC<PrintableHiveStickerProps> = ({ hive, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const generateQr = async () => {
      try {
        const url = `${window.location.origin}/verify/hive/${hive.hiveId}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 260,
          margin: 1,
          color: {
            dark: '#1c1917',
            light: '#ffffff',
          },
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('Failed to generate QR sticker:', err);
      }
    };
    generateQr();
  }, [hive]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative flex flex-col w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 text-white border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <Hexagon className="w-5 h-5 text-amber-500 fill-amber-500/20" />
            <h3 className="font-bold text-amber-400 text-sm">Printable Hive QR Sticker</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Printable Sticker Sheet */}
        <div className="p-6 md:p-8 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 print:bg-white print:p-0">
          <div
            id="hive-sticker-printable"
            className="w-full max-w-[360px] bg-white text-slate-950 p-6 rounded-2xl border-4 border-amber-500 shadow-xl print:shadow-none print:border-4 print:border-black flex flex-col items-center text-center space-y-3"
          >
            {/* Top Brand Banner */}
            <div className="flex items-center justify-center gap-1.5 border-b border-amber-500/30 pb-2 w-full">
              <Hexagon className="w-5 h-5 text-amber-600 fill-amber-500/20" />
              <span className="font-black text-sm tracking-tight">HONEY CHAIN APIARY ID</span>
            </div>

            {/* QR Code */}
            <div className="p-2 bg-white rounded-xl border border-slate-200">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt={hive.hiveId} className="w-48 h-48 object-contain mx-auto" />
              ) : (
                <div className="w-48 h-48 bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}
            </div>

            {/* Hive Identifier */}
            <div className="w-full pt-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">
                Official Hive Identifier
              </span>
              <div className="text-xl font-black font-mono tracking-tight text-amber-700 print:text-black">
                {hive.hiveId}
              </div>
            </div>

            {/* Hive Details Table */}
            <div className="w-full grid grid-cols-2 gap-2 text-left bg-amber-50 print:bg-slate-50 p-2.5 rounded-xl text-[11px] border border-amber-500/20">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Colony Type</span>
                <span className="font-bold text-slate-900 truncate block">{hive.colonyType}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Hive Architecture</span>
                <span className="font-bold text-slate-900 truncate block">{hive.hiveType}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Beekeeper ID</span>
                <span className="font-bold font-mono text-amber-800 print:text-black">{hive.beekeeperId}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Setup Date</span>
                <span className="font-semibold text-slate-900">{hive.setupDate || '2026-09'}</span>
              </div>
            </div>

            {/* GPS coordinates & Disclaimer */}
            <div className="text-[9px] text-slate-500 w-full pt-1 border-t border-slate-200 flex justify-between items-center">
              <span className="font-mono">
                {hive.lat != null && hive.lng != null ? `${Number(hive.lat).toFixed(4)}°N, ${Number(hive.lng).toFixed(4)}°E` : 'GPS Coordinates N/A'}
              </span>
              <span className="font-semibold text-amber-700 print:text-black flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> NBB Madhukranti Verified
              </span>
            </div>
          </div>
        </div>

        {/* Footer with Print Action */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between print:hidden">
          <p className="text-xs text-slate-500">
            Print on weatherproof adhesive vinyl for apiary box mounting.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-md transition"
            >
              <Printer className="w-4 h-4" /> Print Sticker
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
