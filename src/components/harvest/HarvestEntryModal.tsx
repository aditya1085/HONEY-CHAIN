import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, Droplets, Calendar, Scale, Layers } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { HiveRecord, FloralSource } from '../../types';
import { logActivity } from '../../services/activityLogger';
import { useAuth } from '../../context/AuthContext';

interface HarvestEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  hives: HiveRecord[];
  beekeeperId: string;
  beekeeperName?: string;
  beekeeperState: string;
  onSuccess?: () => void;
}

const FLORAL_SOURCES: FloralSource[] = [
  'Mustard',
  'Acacia',
  'Multiflora',
  'Jamun',
  'Eucalyptus',
  'Lychee',
  'Wildflower',
  'Kashmir White',
  'Other',
];

export const HarvestEntryModal: React.FC<HarvestEntryModalProps> = ({
  isOpen,
  onClose,
  hives,
  beekeeperId,
  beekeeperName,
  beekeeperState,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [hiveId, setHiveId] = useState(hives[0]?.hiveId || '');
  const [floralSource, setFloralSource] = useState<FloralSource>('Mustard');
  const [quantityKg, setQuantityKg] = useState<string>('25.5');
  const [moisture, setMoisture] = useState<string>('18.2');
  const [extractionDate, setExtractionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [extractionMethod, setExtractionMethod] = useState<string>('Centrifugal Cold Extraction');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hiveId) {
      setError('Please select an approved hive for this harvest.');
      return;
    }
    const qty = parseFloat(quantityKg);
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid harvest quantity in kg.');
      return;
    }
    const moist = parseFloat(moisture);
    if (isNaN(moist) || moist < 10 || moist > 30) {
      setError('Moisture content must be between 10% and 30%. (Standard honey is 16-20%)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const harvestId = `HVST_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();

      const harvestRecord = {
        id: harvestId,
        beekeeperId,
        beekeeperName: beekeeperName || currentUser?.displayName || 'Beekeeper',
        hiveId,
        state: beekeeperState || 'UP',
        floralSource,
        quantityKg: qty,
        moisture: moist,
        extractionDate,
        extractionMethod,
        notes,
        status: 'unbatched',
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'harvests', harvestId), harvestRecord);

      await logActivity({
        actorRole: 'BEEKEEPER',
        action: 'RECORD_HARVEST',
        entityType: 'HIVE',
        entityId: hiveId,
        details: `Harvested ${qty}kg of ${floralSource} honey from Hive ${hiveId} (Moisture: ${moist}%)`,
      });

      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving harvest record:', err);
      setError('Failed to record harvest. Please check connection.');
      setLoading(false);
    }
  };

  const isMoistureHigh = parseFloat(moisture) > 20;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
            <Droplets className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Record Honey Harvest</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Log fresh extraction details to submit into the traceable honey pool
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
              Source Hive
            </label>
            {hives.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg">
                No active approved hives available. Please register or select an active hive first.
              </p>
            ) : (
              <select
                value={hiveId}
                onChange={(e) => setHiveId(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-xs focus:border-amber-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                {hives.map((h) => (
                  <option key={h.hiveId} value={h.hiveId}>
                    {h.hiveId} ({h.colonyType} • {h.hiveType})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                Floral Source
              </label>
              <select
                value={floralSource}
                onChange={(e) => setFloralSource(e.target.value as FloralSource)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-xs focus:border-amber-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                {FLORAL_SOURCES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                Harvest Quantity (Kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(e.target.value)}
                  required
                  placeholder="e.g. 25.5"
                  className="w-full rounded-xl border border-zinc-300 bg-white pl-3.5 pr-8 py-2.5 text-sm text-zinc-900 shadow-xs focus:border-amber-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <Scale className="absolute right-3 top-3 h-4 w-4 text-zinc-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                Moisture %
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={moisture}
                  onChange={(e) => setMoisture(e.target.value)}
                  required
                  placeholder="e.g. 18.0"
                  className={`w-full rounded-xl border pl-3.5 pr-8 py-2.5 text-sm shadow-xs focus:outline-hidden ${
                    isMoistureHigh
                      ? 'border-red-400 text-red-700 bg-red-50/50'
                      : 'border-zinc-300 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-zinc-400 font-bold">%</span>
              </div>
              <p className={`mt-1 text-[11px] ${isMoistureHigh ? 'text-red-500 font-medium' : 'text-zinc-500'}`}>
                {isMoistureHigh ? '⚠️ >20% exceeds FSSAI standard' : 'Standard grade: 16% - 20%'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                Extraction Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={extractionDate}
                  onChange={(e) => setExtractionDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-300 bg-white pl-3.5 pr-8 py-2.5 text-sm text-zinc-900 shadow-xs focus:border-amber-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <Calendar className="absolute right-3 top-3 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
              Extraction Method
            </label>
            <input
              type="text"
              value={extractionMethod}
              onChange={(e) => setExtractionMethod(e.target.value)}
              placeholder="e.g. Centrifugal Cold Extraction (Raw Unfiltered)"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-xs focus:border-amber-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
              Inspection Notes / Flora Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Harvested during peak mustard blossom. Golden amber clarity."
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 shadow-xs focus:border-amber-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || hives.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 disabled:opacity-50"
            >
              {loading ? (
                <span>Recording...</span>
              ) : (
                <>
                  <Layers className="h-4 w-4" />
                  <span>Submit Harvest Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
