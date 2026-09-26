import React, { useState } from 'react';
import { X, Cpu, Activity, AlertTriangle, CheckCircle2, RefreshCw, Flame, Snowflake, Droplets, Gauge } from 'lucide-react';

interface IoTSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  hiveId: string;
  colonyType?: string;
  onSuccess?: () => void;
}

export const IoTSimulatorModal: React.FC<IoTSimulatorModalProps> = ({
  isOpen,
  onClose,
  hiveId,
  colonyType = 'Apis cerana indica',
  onSuccess,
}) => {
  const [temperature, setTemperature] = useState<number>(34.5);
  const [humidity, setHumidity] = useState<number>(62);
  const [weight, setWeight] = useState<number>(25.6);
  const [battery, setBattery] = useState<number>(95);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<{
    success: boolean;
    alertsCreated: number;
    message: string;
    reading?: any;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const applyPreset = (preset: 'normal' | 'heat_stress' | 'chilled' | 'high_humidity') => {
    switch (preset) {
      case 'normal':
        setTemperature(34.5);
        setHumidity(60);
        setWeight(26.2);
        setBattery(98);
        break;
      case 'heat_stress':
        setTemperature(39.2);
        setHumidity(48);
        setWeight(25.0);
        setBattery(92);
        break;
      case 'chilled':
        setTemperature(28.5);
        setHumidity(68);
        setWeight(24.8);
        setBattery(88);
        break;
      case 'high_humidity':
        setTemperature(33.8);
        setHumidity(86);
        setWeight(25.4);
        setBattery(94);
        break;
    }
    setResult(null);
    setErrorMsg(null);
  };

  const handlePushTelemetry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/iot/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hiveId,
          temperature: Number(temperature),
          humidity: Number(humidity),
          weight: Number(weight),
          battery: Number(battery),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to simulate sensor telemetry');
      }

      setResult({
        success: true,
        alertsCreated: data.alertsCreated || 0,
        message: data.alertsCreated > 0
          ? `Telemetry pushed! Triggered ${data.alertsCreated} health alert(s) due to out-of-range sensor values.`
          : 'Telemetry pushed successfully! Readings are within normal species thresholds.',
        reading: data.reading,
      });

      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Telemetry push failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/30 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-400">
                IoT Sensor Simulator
              </h3>
              <p className="text-xs text-slate-400">
                Push live telemetry for <strong className="font-mono text-white">{hiveId}</strong> ({colonyType})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Quick Simulation Presets */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Simulation Presets
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => applyPreset('normal')}
                className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-semibold text-left flex items-center gap-2 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-bold">Normal Reading</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">34.5°C • 60% RH</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('heat_stress')}
                className="p-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-800 dark:text-red-300 font-semibold text-left flex items-center gap-2 transition"
              >
                <Flame className="w-4 h-4 text-red-500 shrink-0" />
                <div>
                  <div className="font-bold">Thermal Stress Alert</div>
                  <div className="text-[10px] text-red-600 dark:text-red-400 font-normal">39.2°C • Brood Overheating</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('chilled')}
                className="p-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-800 dark:text-blue-300 font-semibold text-left flex items-center gap-2 transition"
              >
                <Snowflake className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                  <div className="font-bold">Chilled Brood Alert</div>
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">28.5°C • Below Safe Min</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('high_humidity')}
                className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-800 dark:text-purple-300 font-semibold text-left flex items-center gap-2 transition"
              >
                <Droplets className="w-4 h-4 text-purple-500 shrink-0" />
                <div>
                  <div className="font-bold">Excessive Moisture</div>
                  <div className="text-[10px] text-purple-600 dark:text-purple-400 font-normal">86% RH • Fungal Risk</div>
                </div>
              </button>
            </div>
          </div>

          {/* Result / Error Banners */}
          {result && (
            <div
              className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs font-semibold animate-in fade-in ${
                result.alertsCreated > 0
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
              }`}
            >
              {result.alertsCreated > 0 ? (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              )}
              <div>
                <div>{result.message}</div>
                <div className="text-[11px] font-mono opacity-80 mt-1">
                  Recorded at {new Date().toLocaleTimeString()} • Hive dashboard updated live
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form with Sliders / Inputs */}
          <form onSubmit={handlePushTelemetry} className="space-y-3.5 pt-1">
            {/* Temperature Slider */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1 font-semibold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" /> Brood Temperature
                </span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {temperature.toFixed(1)}°C
                </span>
              </div>
              <input
                type="range"
                min="24"
                max="44"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>24°C (Cold)</span>
                <span className="text-emerald-600 font-bold">32°C - 36°C (Safe Range)</span>
                <span>44°C (Lethal)</span>
              </div>
            </div>

            {/* Humidity Slider */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1 font-semibold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" /> Relative Humidity
                </span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {humidity.toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="95"
                step="1"
                value={humidity}
                onChange={(e) => setHumidity(parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>30% (Dry)</span>
                <span className="text-emerald-600 font-bold">50% - 70% (Optimal)</span>
                <span>95% (Saturated)</span>
              </div>
            </div>

            {/* Weight and Battery Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hive Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Node Battery (%)
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={battery}
                  onChange={(e) => setBattery(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Pushing Reading...
                  </>
                ) : (
                  <>
                    <Activity className="w-3.5 h-3.5" /> Push Telemetry to Hive
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
