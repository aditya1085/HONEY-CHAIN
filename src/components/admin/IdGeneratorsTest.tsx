import React, { useState } from 'react';
import QRCode from 'qrcode';
import { Cpu, RefreshCw, CheckCircle2, QrCode, ArrowRight, Layers, FileCode, ShoppingBag, FlaskConical } from 'lucide-react';
import {
  generateBeekeeperId,
  generateHiveId,
  generateBatchId,
  generatePackIds,
  generateLabSampleId,
  generateOrderId,
} from '../../services/idGenerators';

export const IdGeneratorsTest: React.FC = () => {
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [results, setResults] = useState<
    Array<{ type: string; id: string; qrDataUrl?: string; timestamp: string }>
  >([]);

  const handleGenerate = async (type: 'beekeeper' | 'hive' | 'batch' | 'pack' | 'labSample' | 'order') => {
    setLoadingType(type);
    try {
      let generatedId = '';

      if (type === 'beekeeper') {
        const res = await generateBeekeeperId();
        generatedId = res.beekeeperId;
      } else if (type === 'hive') {
        const res = await generateHiveId('Uttar Pradesh', 'B045');
        generatedId = res.hiveId;
      } else if (type === 'batch') {
        const res = await generateBatchId('Uttar Pradesh');
        generatedId = res.batchId;
      } else if (type === 'pack') {
        const ids = await generatePackIds('HB-2609-UP-0012', 1);
        generatedId = ids[0];
      } else if (type === 'labSample') {
        const res = await generateLabSampleId();
        generatedId = res.sampleId;
      } else if (type === 'order') {
        const res = await generateOrderId();
        generatedId = res.orderId;
      }

      // Generate a QR code image preview for this ID
      const qrDataUrl = await QRCode.toDataURL(generatedId, {
        width: 180,
        margin: 1,
        color: {
          dark: '#78350f',
          light: '#ffffff',
        },
      });

      setResults((prev) => [
        {
          type,
          id: generatedId,
          qrDataUrl,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 19),
      ]);
    } catch (err) {
      console.error(`ID generation error for ${type}:`, err);
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-amber-500" />
          Atomic ID Generation Engine
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Every ID in Honey Chain is generated atomically via Firestore transactions on counter documents. No user or admin can edit or type IDs.
        </p>
      </div>

      {/* Generator Triggers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Beekeeper ID */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-amber-500/20 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-white text-xs">Beekeeper ID</span>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              B[Seq]
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Assigned atomically on admin approval. Example: <span className="font-mono text-slate-700 dark:text-slate-300">B045</span>.
          </p>
          <button
            onClick={() => handleGenerate('beekeeper')}
            disabled={loadingType === 'beekeeper'}
            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
          >
            {loadingType === 'beekeeper' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Increment & Generate'}
          </button>
        </div>

        {/* Hive ID */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-amber-500/20 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-white text-xs">Hive ID</span>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              HC-[State]-[Bk]-H[Seq]
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Per-beekeeper counter, immutable. Example: <span className="font-mono text-slate-700 dark:text-slate-300">HC-UP-B045-H03</span>.
          </p>
          <button
            onClick={() => handleGenerate('hive')}
            disabled={loadingType === 'hive'}
            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
          >
            {loadingType === 'hive' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Generate Hive ID'}
          </button>
        </div>

        {/* Batch ID */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-amber-500/20 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-white text-xs">Batch ID</span>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              HB-[YYMM]-[State]-[Seq]
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Created at batch creation. Example: <span className="font-mono text-slate-700 dark:text-slate-300">HB-2609-UP-0012</span>.
          </p>
          <button
            onClick={() => handleGenerate('batch')}
            disabled={loadingType === 'batch'}
            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
          >
            {loadingType === 'batch' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Generate Batch ID'}
          </button>
        </div>

        {/* Pack ID */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-amber-500/20 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-white text-xs">Pack ID</span>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              [BatchID]-P[Seq]
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Bulk-generated at packaging. Example: <span className="font-mono text-slate-700 dark:text-slate-300">HB-2609-UP-0012-P0345</span>.
          </p>
          <button
            onClick={() => handleGenerate('pack')}
            disabled={loadingType === 'pack'}
            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
          >
            {loadingType === 'pack' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Generate Pack ID'}
          </button>
        </div>

        {/* Lab Sample ID */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-amber-500/20 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-white text-xs">Lab Sample ID</span>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              LS-[YYMM]-[Seq]
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Government lab sample bottle tracking. Example: <span className="font-mono text-slate-700 dark:text-slate-300">LS-2609-0001</span>.
          </p>
          <button
            onClick={() => handleGenerate('labSample')}
            disabled={loadingType === 'labSample'}
            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
          >
            {loadingType === 'labSample' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Generate Sample ID'}
          </button>
        </div>

        {/* Order ID */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-amber-500/20 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-white text-xs">Order ID</span>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              HC-ORD-[YYMM]-[Seq]
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Direct marketplace checkout orders. Example: <span className="font-mono text-slate-700 dark:text-slate-300">HC-ORD-2609-0001</span>.
          </p>
          <button
            onClick={() => handleGenerate('order')}
            disabled={loadingType === 'order'}
            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
          >
            {loadingType === 'order' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Generate Order ID'}
          </button>
        </div>
      </div>

      {/* Generated Stream and QR code previews */}
      {results.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Generated Records & QR Codes
            </span>
            <button
              onClick={() => setResults([])}
              className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {results.map((r, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-3"
              >
                {r.qrDataUrl && (
                  <img
                    src={r.qrDataUrl}
                    alt={r.id}
                    className="w-14 h-14 rounded-lg bg-white p-1 border border-amber-500/30 shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
                    {r.type}
                  </div>
                  <div className="font-mono text-xs font-bold text-slate-900 dark:text-white truncate">
                    {r.id}
                  </div>
                  <div className="text-[10px] text-slate-400">{r.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
