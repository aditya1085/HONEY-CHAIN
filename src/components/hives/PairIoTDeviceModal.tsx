import React, { useState } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { X, QrCode, Cpu, Key, Copy, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { db } from '../../firebase/config';
import { handleFirestoreError, OperationType } from '../../firebase/errors';
import { useAuth } from '../../context/AuthContext';
import { logActivity } from '../../services/activityLogger';
import { HiveRecord } from '../../types';
import { QRScanner } from '../camera/QRScanner';

interface PairIoTDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  hives: HiveRecord[];
  initialHiveId?: string;
  onPaired?: () => void;
}

export const PairIoTDeviceModal: React.FC<PairIoTDeviceModalProps> = ({
  isOpen,
  onClose,
  hives,
  initialHiveId,
  onPaired,
}) => {
  const { beekeeperProfile, currentUser } = useAuth();

  const [deviceSerial, setDeviceSerial] = useState('');
  const [selectedHiveId, setSelectedHiveId] = useState(initialHiveId || hives[0]?.hiveId || '');
  const [deviceModel, setDeviceModel] = useState('HoneyNode ESP32-S3 (Temp/Hum/Weight)');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Once generated, key shown ONCE
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  if (!isOpen) return null;

  // SHA-256 helper
  const computeHash = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const handlePair = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanSerial = deviceSerial.trim().toUpperCase();
    if (!cleanSerial) {
      setErrorMsg('Device Serial is required.');
      return;
    }
    if (!selectedHiveId) {
      setErrorMsg('Please select a hive to pair with.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Generate cryptographically strong random API Key
      const randomBytes = new Uint8Array(16);
      crypto.getRandomValues(randomBytes);
      const randomHex = Array.from(randomBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const rawApiKey = `hc_iot_${randomHex}`;
      const apiKeyHash = await computeHash(rawApiKey);

      const bkId = beekeeperProfile?.beekeeperId || 'B001';

      // 2. Save IoT Device Document
      const deviceRef = doc(db, 'iotDevices', cleanSerial);
      await setDoc(deviceRef, {
        id: cleanSerial,
        deviceSerial: cleanSerial,
        apiKeyHash,
        hiveId: selectedHiveId,
        beekeeperId: bkId,
        model: deviceModel,
        batteryPercent: 100,
        status: 'online',
        lastReadingAt: new Date().toISOString(),
        isSample: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 3. Link iotDeviceId to the Hive
      const targetHive = hives.find((h) => h.hiveId === selectedHiveId);
      if (targetHive) {
        const hiveRef = doc(db, 'hives', targetHive.id);
        await updateDoc(hiveRef, {
          iotDeviceId: cleanSerial,
          updatedAt: new Date().toISOString(),
        });
      }

      // 4. Log Activity
      await logActivity({
        action: 'IOT_DEVICE_PAIRED',
        entityType: 'HIVE',
        entityId: selectedHiveId,
        details: `Paired IoT Node ${cleanSerial} with Hive ${selectedHiveId}`,
        actorRole: 'BEEKEEPER',
      });

      setGeneratedApiKey(rawApiKey);
      if (onPaired) onPaired();
    } catch (err) {
      console.error('Pairing failed:', err);
      handleFirestoreError(err, OperationType.WRITE, `iotDevices/${cleanSerial}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedApiKey) return;
    navigator.clipboard.writeText(generatedApiKey);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative flex flex-col w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-amber-400 text-sm">Pair IoT Colony Sensor Node</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          {generatedApiKey ? (
            /* Key Shown Once Screen */
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                  IoT Device Paired Successfully!
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Node <span className="font-mono font-bold text-slate-900 dark:text-white">{deviceSerial}</span> is now linked to Hive <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedHiveId}</span>.
                </p>
              </div>

              {/* Warning Banner */}
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-500/30 text-red-700 dark:text-red-300 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <div className="space-y-1">
                  <span className="font-bold block">Important Security Notice:</span>
                  <p className="text-[11px] leading-relaxed">
                    This is your device's private ingestion key. <strong>It will never be displayed again</strong>. Copy and paste this key into your ESP32 or gateway configuration now.
                  </p>
                </div>
              </div>

              {/* API Key Box */}
              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Device Ingestion API Key (x-api-key)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedApiKey}
                    className="flex-1 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white select-all font-bold"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 transition shrink-0"
                  >
                    {hasCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{hasCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition"
                >
                  Done (I have saved the key)
                </button>
              </div>
            </div>
          ) : (
            /* Pairing Form */
            <form onSubmit={handlePair} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Hive *
                </label>
                <select
                  value={selectedHiveId}
                  onChange={(e) => setSelectedHiveId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  {hives.map((h) => (
                    <option key={h.hiveId} value={h.hiveId}>
                      {h.hiveId} — {h.colonyType} ({h.area})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Device Serial / MAC *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 hover:underline text-[11px]"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Scan QR on Hardware
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={deviceSerial}
                  onChange={(e) => setDeviceSerial(e.target.value)}
                  placeholder="e.g. HC-IOT-09821 or 24:6F:28:XX:XX"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hardware Model / Sensor Suite
                </label>
                <input
                  type="text"
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Generating Secure Ingestion Credentials...' : 'Pair & Generate API Key'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* QR Scanner */}
      <QRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code) => setDeviceSerial(code)}
        title="Scan Hardware Device QR"
        subtitle="Point camera at device sticker barcode or QR"
      />
    </div>
  );
};
