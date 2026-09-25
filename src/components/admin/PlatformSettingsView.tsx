import React, { useState, useEffect } from 'react';
import {
  Settings,
  DollarSign,
  Percent,
  Cpu,
  FlaskConical,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Shield,
  Layers,
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface PlatformConfig {
  beekeeperPayoutPct: number;
  platformFeePct: number;
  fssaiMaxMoisture: number;
  fssaiMaxHmf: number;
  fssaiMinFgRatio: number;
  iotMinTemp: number;
  iotMaxTemp: number;
  iotMinHumidity: number;
  iotMaxHumidity: number;
  paymentMode: 'TEST_GATEWAY' | 'LIVE_GATEWAY';
  maintenanceMode: boolean;
}

const DEFAULT_CONFIG: PlatformConfig = {
  beekeeperPayoutPct: 88,
  platformFeePct: 12,
  fssaiMaxMoisture: 20.0,
  fssaiMaxHmf: 80.0,
  fssaiMinFgRatio: 1.0,
  iotMinTemp: 32.0,
  iotMaxTemp: 36.5,
  iotMinHumidity: 55.0,
  iotMaxHumidity: 70.0,
  paymentMode: 'TEST_GATEWAY',
  maintenanceMode: false,
};

export const PlatformSettingsView: React.FC = () => {
  const [config, setConfig] = useState<PlatformConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'platform_config'));
        if (snap.exists()) {
          setConfig({ ...DEFAULT_CONFIG, ...(snap.data() as Partial<PlatformConfig>) });
        }
      } catch (e) {
        console.warn('Could not load remote config, using defaults:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await setDoc(doc(db, 'settings', 'platform_config'), {
        ...config,
        updatedAt: new Date().toISOString(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (e) {
      console.error('Save platform settings error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset platform settings to factory FSSAI and 88/12 payout defaults?')) {
      setConfig(DEFAULT_CONFIG);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-amber-500/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              System Orchestrator
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-amber-500" />
            Platform & Governance Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure transparent marketplace commission splits, statutory FSSAI lab parameters, and IoT alert boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Defaults</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Platform configuration saved and synchronized with server engine.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: Marketplace Payout Split */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Percent className="w-4 h-4 text-purple-500" />
              <span>Revenue Distribution Split</span>
            </div>
            <p className="text-xs text-slate-500">
              Contractually guaranteed direct remittance to certified beekeepers vs Honey Chain operational maintenance.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Beekeeper Direct Payout (%)
                </label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={config.beekeeperPayoutPct}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setConfig({
                      ...config,
                      beekeeperPayoutPct: val,
                      platformFeePct: 100 - val,
                    });
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Platform Fee (%)
                </label>
                <input
                  type="number"
                  disabled
                  value={config.platformFeePct}
                  className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-300">
              For every ₹100 earned in marketplace sales, ₹{config.beekeeperPayoutPct} goes directly to the beekeeper's registered UPI/Bank account.
            </div>
          </div>

          {/* Section 2: FSSAI Lab Quality Standards */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <FlaskConical className="w-4 h-4 text-teal-500" />
              <span>Statutory FSSAI Laboratory Thresholds</span>
            </div>
            <p className="text-xs text-slate-500">
              Enforced during batch quality gates before digital pack generation and on-chain hash certification.
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Max Moisture (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.fssaiMaxMoisture}
                  onChange={(e) => setConfig({ ...config, fssaiMaxMoisture: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
                <span className="text-[10px] text-slate-400">Std: ≤ 20.0%</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Max HMF (mg/kg)
                </label>
                <input
                  type="number"
                  step="1"
                  value={config.fssaiMaxHmf}
                  onChange={(e) => setConfig({ ...config, fssaiMaxHmf: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
                <span className="text-[10px] text-slate-400">Std: ≤ 80 mg/kg</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Min F/G Ratio
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={config.fssaiMinFgRatio}
                  onChange={(e) => setConfig({ ...config, fssaiMinFgRatio: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
                <span className="text-[10px] text-slate-400">Std: ≥ 1.0</span>
              </div>
            </div>
          </div>

          {/* Section 3: IoT Sensor Telemetry Range */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Cpu className="w-4 h-4 text-amber-500" />
              <span>Brood Chamber IoT Telemetry Range</span>
            </div>
            <p className="text-xs text-slate-500">
              Triggers instant automated health alert flags if telemetry deviates outside these limits.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Brood Temp Range (°C)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={config.iotMinTemp}
                    onChange={(e) => setConfig({ ...config, iotMinTemp: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                  <span className="text-slate-400 text-xs">to</span>
                  <input
                    type="number"
                    step="0.5"
                    value={config.iotMaxTemp}
                    onChange={(e) => setConfig({ ...config, iotMaxTemp: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Relative Humidity Range (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    value={config.iotMinHumidity}
                    onChange={(e) => setConfig({ ...config, iotMinHumidity: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                  <span className="text-slate-400 text-xs">to</span>
                  <input
                    type="number"
                    step="1"
                    value={config.iotMaxHumidity}
                    onChange={(e) => setConfig({ ...config, iotMaxHumidity: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Gateway & System Flags */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Gateway Mode & Security</span>
            </div>
            <p className="text-xs text-slate-500">
              Safe test simulation status and platform maintenance mode switches.
            </p>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Razorpay Payment Gateway Test Simulation
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Safe testing mode active (allows full order simulation without live payment keys).
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.paymentMode === 'TEST_GATEWAY'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      paymentMode: e.target.checked ? 'TEST_GATEWAY' : 'LIVE_GATEWAY',
                    })
                  }
                  className="rounded text-amber-500 focus:ring-amber-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Platform Maintenance Mode
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Pauses public marketplace checkout for scheduled blockchain database syncing.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.maintenanceMode}
                  onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-amber-500 h-4 w-4"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Platform Config...' : 'Save Platform Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
