import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { Sliders, Save, Sparkles, Check, AlertCircle, Thermometer, Droplets } from 'lucide-react';
import { db } from '../../firebase/config';
import { handleFirestoreError, OperationType } from '../../firebase/errors';
import { SpeciesThreshold, ColonyType } from '../../types';
import { logActivity } from '../../services/activityLogger';

const DEFAULT_SEEDS: Array<{
  colonyType: ColonyType;
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
  notes: string;
}> = [
  {
    colonyType: 'Apis cerana indica',
    tempMin: 32,
    tempMax: 36,
    humidityMin: 55,
    humidityMax: 70,
    notes: 'Native Indian hive bee. Highly sensitive to absconding if temperature rises above 36.5°C.',
  },
  {
    colonyType: 'Apis mellifera',
    tempMin: 33,
    tempMax: 36,
    humidityMin: 50,
    humidityMax: 65,
    notes: 'European honey bee. Requires tightly regulated brood temperature (34.5°C to 35.5°C) to prevent deformed wing virus.',
  },
  {
    colonyType: 'Apis dorsata',
    tempMin: 30,
    tempMax: 37,
    humidityMin: 50,
    humidityMax: 75,
    notes: 'Wild giant rock bee. Open single-comb nest builder with wider tolerance margins.',
  },
  {
    colonyType: 'Apis florea',
    tempMin: 30,
    tempMax: 38,
    humidityMin: 45,
    humidityMax: 70,
    notes: 'Dwarf honey bee. Adapted to arid and semi-arid plains, high heat tolerance.',
  },
  {
    colonyType: 'Stingless',
    tempMin: 28,
    tempMax: 35,
    humidityMin: 60,
    humidityMax: 80,
    notes: 'Tetragonula iridipennis / Dammer bee. Thrives in humid tropical climates, produces highly medicinal honey.',
  },
];

export const SpeciesThresholdsEditor: React.FC = () => {
  const [thresholds, setThresholds] = useState<SpeciesThreshold[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'speciesThresholds'),
      (snapshot) => {
        const list: SpeciesThreshold[] = [];
        snapshot.forEach((d) => list.push(d.data() as SpeciesThreshold));
        setThresholds(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'speciesThresholds');
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSeedDefaults = async () => {
    setIsSeeding(true);
    try {
      for (const item of DEFAULT_SEEDS) {
        const id = item.colonyType.replace(/[^a-zA-Z0-9]/g, '_');
        await setDoc(doc(db, 'speciesThresholds', id), {
          id,
          colonyType: item.colonyType,
          tempMin: item.tempMin,
          tempMax: item.tempMax,
          humidityMin: item.humidityMin,
          humidityMax: item.humidityMax,
          notes: item.notes,
          updatedAt: new Date().toISOString(),
        });
      }

      await logActivity({
        action: 'SPECIES_THRESHOLDS_SEEDED',
        entityType: 'SYSTEM',
        entityId: 'ALL',
        details: 'Seeded default safe sensor thresholds for 5 colony species',
        actorRole: 'ADMIN',
      });
    } catch (err) {
      console.error('Failed to seed thresholds:', err);
      handleFirestoreError(err, OperationType.WRITE, 'speciesThresholds');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleUpdate = async (item: SpeciesThreshold) => {
    setSavingId(item.id);
    try {
      await setDoc(doc(db, 'speciesThresholds', item.id), {
        ...item,
        updatedAt: new Date().toISOString(),
      });

      await logActivity({
        action: 'SPECIES_THRESHOLD_UPDATED',
        entityType: 'SYSTEM',
        entityId: item.colonyType,
        details: `Updated thresholds for ${item.colonyType}: Temp (${item.tempMin}-${item.tempMax}°C), Humidity (${item.humidityMin}-${item.humidityMax}%)`,
        actorRole: 'ADMIN',
      });

      setSaveSuccess(item.id);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      console.error('Update failed:', err);
      handleFirestoreError(err, OperationType.UPDATE, `speciesThresholds/${item.id}`);
    } finally {
      setSavingId(null);
    }
  };

  const handleChangeValue = (id: string, field: keyof SpeciesThreshold, value: any) => {
    setThresholds((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-500" />
            Species Sensor Thresholds Configuration
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time IoT sensor telemetry is continuously compared against these thresholds. Readings outside these ranges instantly trigger colony health alerts.
          </p>
        </div>

        <button
          onClick={handleSeedDefaults}
          disabled={isSeeding}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          {isSeeding ? 'Seeding...' : 'Seed National Bee Board Defaults'}
        </button>
      </div>

      {thresholds.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <p className="text-xs text-slate-500">
            No thresholds found in the database. Click "Seed National Bee Board Defaults" to populate baseline ranges.
          </p>
          <button
            onClick={handleSeedDefaults}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
          >
            Seed Defaults
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {thresholds.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {item.colonyType}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {item.id}
                  </span>
                </div>

                <button
                  onClick={() => handleUpdate(item)}
                  disabled={savingId === item.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-500 hover:text-slate-950 dark:bg-slate-800 dark:hover:bg-amber-500 dark:hover:text-slate-950 text-slate-800 dark:text-slate-200 text-xs font-bold transition disabled:opacity-50"
                >
                  {saveSuccess === item.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Save Changes
                    </>
                  )}
                </button>
              </div>

              {/* Temperature inputs */}
              <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-slate-800/40 border border-amber-500/20 space-y-2">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-amber-500" /> Temperature Limits (°C)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Min Safe Temp (°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={item.tempMin}
                      onChange={(e) =>
                        handleChangeValue(item.id, 'tempMin', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Max Safe Temp (°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={item.tempMax}
                      onChange={(e) =>
                        handleChangeValue(item.id, 'tempMax', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Humidity inputs */}
              <div className="p-3 rounded-2xl bg-blue-50/50 dark:bg-slate-800/40 border border-blue-500/20 space-y-2">
                <span className="text-[11px] font-bold text-blue-800 dark:text-blue-400 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" /> Humidity Limits (%)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Min Safe Humidity (%)</label>
                    <input
                      type="number"
                      value={item.humidityMin}
                      onChange={(e) =>
                        handleChangeValue(item.id, 'humidityMin', parseInt(e.target.value) || 0)
                      }
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Max Safe Humidity (%)</label>
                    <input
                      type="number"
                      value={item.humidityMax}
                      onChange={(e) =>
                        handleChangeValue(item.id, 'humidityMax', parseInt(e.target.value) || 0)
                      }
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Biological notes */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">
                  Apiculture Biological Reference Notes:
                </label>
                <textarea
                  rows={2}
                  value={item.notes || ''}
                  onChange={(e) => handleChangeValue(item.id, 'notes', e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
