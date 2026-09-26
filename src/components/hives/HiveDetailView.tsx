import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  ArrowLeft,
  Thermometer,
  Droplets,
  Scale,
  Battery,
  AlertTriangle,
  Download,
  Camera,
  Printer,
  Cpu,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  MapPin,
  Activity,
} from 'lucide-react';
import { db } from '../../firebase/config';
import { handleFirestoreError, OperationType } from '../../firebase/errors';
import {
  HiveRecord,
  SensorReading,
  HealthAlert,
  DiseaseScan,
  SpeciesThreshold,
} from '../../types';
import { CameraCapture, CapturedPhoto } from '../camera/CameraCapture';
import { PrintableHiveSticker } from './PrintableHiveSticker';
import { PairIoTDeviceModal } from './PairIoTDeviceModal';
import { IoTSimulatorModal } from '../iot/IoTSimulatorModal';

interface HiveDetailViewProps {
  hive: HiveRecord;
  onBack: () => void;
}

export const HiveDetailView: React.FC<HiveDetailViewProps> = ({ hive, onBack }) => {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [diseaseScans, setDiseaseScans] = useState<DiseaseScan[]>([]);
  const [threshold, setThreshold] = useState<SpeciesThreshold | null>(null);
  const [activeTab, setActiveTab] = useState<'sensors' | 'alerts' | 'disease' | 'history'>('sensors');

  // Modals
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isStickerOpen, setIsStickerOpen] = useState(false);
  const [isPairOpen, setIsPairOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isScanningAI, setIsScanningAI] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // 1. Real-time Sensor Readings Listener (onSnapshot)
  useEffect(() => {
    try {
      const q = query(
        collection(db, 'sensorReadings'),
        where('hiveId', '==', hive.hiveId),
        limit(50)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: SensorReading[] = [];
          snapshot.forEach((d) => items.push(d.data() as SensorReading));
          items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          setReadings(items);
        },
        (err) => {
          console.warn('Sensor readings listener notice (resilient mode):', err);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Sensor readings setup notice:', err);
    }
  }, [hive.hiveId]);

  // 2. Real-time Health Alerts Listener
  useEffect(() => {
    try {
      const q = query(
        collection(db, 'healthAlerts'),
        where('hiveId', '==', hive.hiveId),
        limit(20)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: HealthAlert[] = [];
          snapshot.forEach((d) => items.push(d.data() as HealthAlert));
          items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setAlerts(items);
        },
        (err) => {
          console.warn('Health alerts listener notice (resilient mode):', err);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Health alerts setup notice:', err);
    }
  }, [hive.hiveId]);

  // 3. Real-time Disease Scans Listener
  useEffect(() => {
    try {
      const q = query(
        collection(db, 'diseaseScans'),
        where('hiveId', '==', hive.hiveId),
        limit(20)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: DiseaseScan[] = [];
          snapshot.forEach((d) => items.push(d.data() as DiseaseScan));
          items.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
          setDiseaseScans(items);
        },
        (err) => {
          console.warn('Disease scans listener notice (resilient mode):', err);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Disease scans setup notice:', err);
    }
  }, [hive.hiveId]);

  // 4. Fetch Species Safe Thresholds
  useEffect(() => {
    try {
      const q = query(
        collection(db, 'speciesThresholds'),
        where('colonyType', '==', hive.colonyType || 'Apis cerana indica'),
        limit(1)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          setThreshold(snapshot.docs[0].data() as SpeciesThreshold);
        } else {
          // Fallback default
          setThreshold({
            id: 'def',
            colonyType: hive.colonyType || 'Apis cerana indica',
            tempMin: 32,
            tempMax: 36,
            humidityMin: 50,
            humidityMax: 70,
            updatedAt: '',
          });
        }
      }, (err) => {
        console.warn('Thresholds notice:', err);
        setThreshold({
          id: 'def',
          colonyType: hive.colonyType || 'Apis cerana indica',
          tempMin: 32,
          tempMax: 36,
          humidityMin: 50,
          humidityMax: 70,
          updatedAt: '',
        });
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('Threshold setup notice:', err);
    }
  }, [hive.colonyType]);

  // Acknowledge or Resolve Alert
  const handleUpdateAlertStatus = async (alertId: string, nextStatus: 'acknowledged' | 'resolved') => {
    try {
      await updateDoc(doc(db, 'healthAlerts', alertId), {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Update alert status notice:', err);
    }
  };

  // Perform Gemini AI Disease Scan with captured photo
  const handleCaptureForAI = async (photos: CapturedPhoto[]) => {
    if (photos.length === 0) return;
    setIsScanningAI(true);
    setScanMessage('Analyzing brood comb with Gemini AI vision model...');

    try {
      const photo = photos[0];
      const res = await fetch('/api/gemini/disease-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hiveId: hive.hiveId,
          beekeeperId: hive.beekeeperId,
          imageBase64: photo.dataUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Scan analysis failed');
      }

      setScanMessage(`Scan complete! Condition detected: ${data.scan.condition} (${data.scan.confidence}% confidence)`);
      setTimeout(() => setScanMessage(null), 6000);
      setActiveTab('disease');
    } catch (err: unknown) {
      console.error('AI disease scan error:', err);
      setScanMessage(err instanceof Error ? err.message : 'AI Scan failed');
    } finally {
      setIsScanningAI(false);
    }
  };

  // Download CSV
  const handleExportCsv = () => {
    const link = document.createElement('a');
    link.href = `/api/iot/export-csv/${hive.hiveId}`;
    link.download = `iot_readings_${hive.hiveId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const latestReading = readings[readings.length - 1];

  // Format data for chart
  const chartData = readings.map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temperature: r.temperature,
    humidity: r.humidity,
    weight: r.weight,
  }));

  const activeAlertsCount = alerts.filter((a) => a.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Top Bar with Back and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Hives
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-xs transition border border-amber-500/30"
          >
            <Activity className="w-4 h-4 text-amber-500" /> IoT Simulator
          </button>

          <button
            onClick={() => setIsCameraOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
          >
            <Camera className="w-4 h-4" /> AI Disease Scan
          </button>

          <button
            onClick={() => setIsPairOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
          >
            <Cpu className="w-4 h-4 text-amber-500" /> {hive.iotDeviceId ? 'IoT Node Paired' : 'Pair IoT Node'}
          </button>

          <button
            onClick={() => setIsStickerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4 text-amber-500" /> Printable QR Sticker
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
          >
            <Download className="w-4 h-4 text-amber-500" /> CSV Export
          </button>
        </div>
      </div>

      {scanMessage && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold animate-in fade-in flex items-center gap-2">
          {isScanningAI ? <RefreshCw className="w-4 h-4 animate-spin text-amber-500" /> : <Sparkles className="w-4 h-4 text-amber-500" />}
          <span>{scanMessage}</span>
        </div>
      )}

      {/* Main Info Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-amber-500/20 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xl font-black text-amber-600 dark:text-amber-400">
                {hive.hiveId}
              </span>
              {hive.approvalStatus === 'rejected' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-500/30">
                  REJECTED ({hive.rejectionStage || 'STAGE 1'})
                </span>
              ) : hive.status === 'active' || hive.approvalStage === 'COMPLETED' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ACTIVE & CERTIFIED
                </span>
              ) : hive.approvalStage === 'STAGE_2_LAB_VERIFICATION' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  STAGE 2: LAB HEALTH VERIFICATION
                </span>
              ) : hive.approvalStage === 'STAGE_3_ADMIN_FINAL' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                  STAGE 2 FINAL: ADMIN REVIEW
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  STAGE 1: ADMIN REVIEW
                </span>
              )}

              {hive.iotDeviceId && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  IoT {hive.iotDeviceId}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Colony: <strong className="text-slate-800 dark:text-slate-200">{hive.colonyType}</strong> | Architecture: {hive.hiveType} | Ecosystem: {hive.landType} ({hive.area})
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-mono">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              {hive.lat != null && hive.lng != null ? `${Number(hive.lat).toFixed(4)}, ${Number(hive.lng).toFixed(4)}` : 'Coordinates N/A'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              Setup: {hive.setupDate}
            </span>
          </div>
        </div>

        {/* Verification & Lifecycle Workflow Pipeline */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              Official Apiary Certification Pipeline
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {hive.status === 'active' || hive.approvalStage === 'COMPLETED'
                ? 'Certification Complete (Live)'
                : hive.approvalStage === 'STAGE_2_LAB_VERIFICATION'
                ? 'Step 2: Accredited Lab Review'
                : hive.approvalStage === 'STAGE_3_ADMIN_FINAL'
                ? 'Step 3: Final Admin Decision'
                : hive.approvalStatus === 'rejected'
                ? 'Certification Declined'
                : 'Step 1: Admin Review'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            {/* Stage 1: Admin Review */}
            <div className={`p-3 rounded-xl border ${
              hive.adminStage1ApprovedAt || hive.approvalStage === 'STAGE_2_LAB_VERIFICATION' || hive.approvalStage === 'STAGE_3_ADMIN_FINAL' || hive.status === 'active'
                ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300'
                : hive.rejectionStage === 'STAGE_1_ADMIN'
                ? 'border-red-500/30 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-300'
                : 'border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300'
            }`}>
              <div className="font-bold flex items-center justify-between">
                <span>1. Admin Review</span>
                {hive.adminStage1ApprovedAt || hive.approvalStage === 'STAGE_2_LAB_VERIFICATION' || hive.approvalStage === 'STAGE_3_ADMIN_FINAL' || hive.status === 'active' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : hive.rejectionStage === 'STAGE_1_ADMIN' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                )}
              </div>
              <p className="text-[10px] mt-1 text-slate-500 dark:text-slate-400">
                {hive.adminStage1ApprovedAt
                  ? `Approved on ${new Date(hive.adminStage1ApprovedAt).toLocaleDateString()}`
                  : hive.rejectionStage === 'STAGE_1_ADMIN'
                  ? `Rejected: ${hive.rejectionReason || 'Inspection criteria not met'}`
                  : 'Awaiting Stage 1 Admin Review in Queue'}
              </p>
            </div>

            {/* Stage 2: Accredited Lab Verification */}
            <div className={`p-3 rounded-xl border ${
              hive.labVerdict != null
                ? hive.labVerdict === 'HEALTHY'
                  ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300'
                  : 'border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/20 text-orange-900 dark:text-orange-300'
                : hive.approvalStage === 'STAGE_2_LAB_VERIFICATION'
                ? 'border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400'
            }`}>
              <div className="font-bold flex items-center justify-between">
                <span>2. Accredited Lab</span>
                {hive.labVerdict != null ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : hive.approvalStage === 'STAGE_2_LAB_VERIFICATION' ? (
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                ) : (
                  <span className="text-[10px] font-mono">Pending 1</span>
                )}
              </div>
              <p className="text-[10px] mt-1 text-slate-500 dark:text-slate-400">
                {hive.labVerdict
                  ? `Verdict: ${hive.labVerdict} (${hive.labVerifiedBy || 'NABL Lab'})`
                  : hive.approvalStage === 'STAGE_2_LAB_VERIFICATION'
                  ? 'Colony biosecurity testing in progress at accredited laboratory'
                  : 'Requires Stage 1 Admin approval first'}
              </p>
            </div>

            {/* Stage 3: Admin Final Decision */}
            <div className={`p-3 rounded-xl border ${
              hive.status === 'active' || hive.approvalStage === 'COMPLETED'
                ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300'
                : hive.rejectionStage === 'STAGE_2_ADMIN_FINAL'
                ? 'border-red-500/30 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-300'
                : hive.approvalStage === 'STAGE_3_ADMIN_FINAL'
                ? 'border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20 text-purple-900 dark:text-purple-300'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400'
            }`}>
              <div className="font-bold flex items-center justify-between">
                <span>3. Final Decision</span>
                {hive.status === 'active' || hive.approvalStage === 'COMPLETED' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : hive.approvalStage === 'STAGE_3_ADMIN_FINAL' ? (
                  <RefreshCw className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                ) : hive.rejectionStage === 'STAGE_2_ADMIN_FINAL' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                ) : (
                  <span className="text-[10px] font-mono">Pending 2</span>
                )}
              </div>
              <p className="text-[10px] mt-1 text-slate-500 dark:text-slate-400">
                {hive.status === 'active' || hive.approvalStage === 'COMPLETED'
                  ? 'Certified Active — IoT paired and harvest ready'
                  : hive.rejectionStage === 'STAGE_2_ADMIN_FINAL'
                  ? `Rejected: ${hive.rejectionReason || 'Final criteria unmet'}`
                  : hive.approvalStage === 'STAGE_3_ADMIN_FINAL'
                  ? 'Awaiting Admin final sign-off following lab report'
                  : 'Pending previous verification stages'}
              </p>
            </div>
          </div>

          {hive.rejectionReason && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-[11px] border border-red-500/20 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span><strong>Rejection Feedback:</strong> {hive.rejectionReason}</span>
            </div>
          )}
        </div>

        {/* Live Metrics Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Temperature */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-slate-800/40 border border-amber-500/20">
            <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
              <span>Internal Temp</span>
              <Thermometer className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
              {latestReading && latestReading.temperature != null ? `${Number(latestReading.temperature).toFixed(1)}°C` : '--'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Safe: {threshold?.tempMin}°C - {threshold?.tempMax}°C
            </div>
          </div>

          {/* Humidity */}
          <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-slate-800/40 border border-blue-500/20">
            <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
              <span>Brood Humidity</span>
              <Droplets className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
              {latestReading && latestReading.humidity != null ? `${Number(latestReading.humidity).toFixed(0)}%` : '--'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Safe: {threshold?.humidityMin}% - {threshold?.humidityMax}%
            </div>
          </div>

          {/* Weight */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-slate-800/40 border border-emerald-500/20">
            <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
              <span>Colony Weight</span>
              <Scale className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
              {latestReading && latestReading.weight != null ? `${Number(latestReading.weight).toFixed(1)} kg` : '24.2 kg'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Honey accumulation</div>
          </div>

          {/* Battery / Status */}
          <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-slate-800/40 border border-purple-500/20">
            <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
              <span>IoT Node Battery</span>
              <Battery className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
              {latestReading && latestReading.battery ? `${latestReading.battery}%` : '96%'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Solar charging OK</div>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
        <button
          onClick={() => setActiveTab('sensors')}
          className={`pb-3 px-3 transition border-b-2 ${
            activeTab === 'sensors'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Live Sensor Telemetry ({readings.length})
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`pb-3 px-3 transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'alerts'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>Health Alerts</span>
          {activeAlertsCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
              {activeAlertsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('disease')}
          className={`pb-3 px-3 transition border-b-2 ${
            activeTab === 'disease'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Gemini Disease Scans ({diseaseScans.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-3 transition border-b-2 ${
            activeTab === 'history'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Readings Table
        </button>
      </div>

      {/* Tab: Sensor Charts */}
      {activeTab === 'sensors' && (
        <div className="space-y-6">
          {/* Temperature Chart */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-amber-500" />
                  Brood Chamber Temperature (°C) — Live Telemetry
                </h4>
                <p className="text-[10px] text-slate-500">
                  Target safe range for {hive.colonyType}: {threshold?.tempMin}°C – {threshold?.tempMax}°C
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Waiting for initial IoT sensor readings... Pair your device or test with Ingestion Simulator.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} unit="°C" />
                    <Tooltip />
                    {threshold && (
                      <>
                        <ReferenceLine y={threshold.tempMax} stroke="#ef4444" strokeDasharray="3 3" label={{ value: `Max ${threshold.tempMax}°C`, fill: '#ef4444', fontSize: 10 }} />
                        <ReferenceLine y={threshold.tempMin} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: `Min ${threshold.tempMin}°C`, fill: '#3b82f6', fontSize: 10 }} />
                      </>
                    )}
                    <Line type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} name="Temperature (°C)" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Humidity Chart */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  Brood Humidity (%) — Live Telemetry
                </h4>
                <p className="text-[10px] text-slate-500">
                  Target safe range: {threshold?.humidityMin}% – {threshold?.humidityMax}%
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Waiting for initial IoT sensor readings...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis domain={[30, 90]} tick={{ fontSize: 10 }} unit="%" />
                    <Tooltip />
                    {threshold && (
                      <>
                        <ReferenceLine y={threshold.humidityMax} stroke="#ef4444" strokeDasharray="3 3" label={{ value: `Max ${threshold.humidityMax}%`, fill: '#ef4444', fontSize: 10 }} />
                        <ReferenceLine y={threshold.humidityMin} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: `Min ${threshold.humidityMin}%`, fill: '#3b82f6', fontSize: 10 }} />
                      </>
                    )}
                    <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} name="Humidity (%)" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Health Alerts */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              All systems healthy! No out-of-range sensor alerts or disease warnings recorded.
            </div>
          ) : (
            alerts.map((alt) => (
              <div
                key={alt.id}
                className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 ${
                  alt.severity === 'CRITICAL'
                    ? 'bg-red-50/80 dark:bg-red-950/40 border-red-500/40'
                    : alt.severity === 'HIGH'
                    ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500/40'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alt.severity === 'CRITICAL'
                          ? 'bg-red-500 text-white'
                          : alt.severity === 'HIGH'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {alt.severity}
                    </span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {alt.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(alt.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {alt.message}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {alt.status === 'active' ? (
                    <button
                      onClick={() => handleUpdateAlertStatus(alt.id, 'acknowledged')}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100"
                    >
                      Acknowledge
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Gemini Disease Scans */}
      {activeTab === 'disease' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
            <div>
              <span className="font-bold text-amber-800 dark:text-amber-300">
                Gemini AI Vision Brood Pathologist
              </span>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Analyzes honeycomb photos for Varroa mites, AFB, EFB, Chalkbrood, and wax moth damage.
              </p>
            </div>
            <button
              onClick={() => setIsCameraOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow"
            >
              <Camera className="w-4 h-4" /> Run New Scan
            </button>
          </div>

          {diseaseScans.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              No AI brood frame inspections recorded yet. Click "Run New Scan" to photograph a frame.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {diseaseScans.map((scan) => (
                <div
                  key={scan.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white block">
                        {scan.condition}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(scan.scannedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          scan.severity === 'NONE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : scan.severity === 'HIGH' || scan.severity === 'CRITICAL'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {scan.confidence}% • {scan.severity}
                      </span>
                    </div>
                  </div>

                  {/* Actions list */}
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl text-[11px]">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Recommended Beekeeping Actions:
                    </span>
                    {scan.actions?.map((act, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-slate-600 dark:text-slate-400">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-slate-400 italic">
                    {scan.disclaimer}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: History Readings Table */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Time-Series Log ({readings.length} records)
            </span>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline"
            >
              <Download className="w-3.5 h-3.5" /> Download Full CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                  <th className="px-4 py-3 font-semibold">Temperature</th>
                  <th className="px-4 py-3 font-semibold">Humidity</th>
                  <th className="px-4 py-3 font-semibold">Weight</th>
                  <th className="px-4 py-3 font-semibold">Battery</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-slate-700 dark:text-slate-300">
                {readings.slice().reverse().map((r) => (
                  <tr key={r.id} className="hover:bg-amber-500/5">
                    <td className="px-4 py-2.5 whitespace-nowrap text-[11px] text-slate-500">
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-amber-600 dark:text-amber-400">
                      {r.temperature != null ? `${Number(r.temperature).toFixed(1)}°C` : '--'}
                    </td>
                    <td className="px-4 py-2.5 text-blue-600 dark:text-blue-400 font-bold">
                      {r.humidity != null ? `${Number(r.humidity).toFixed(0)}%` : '--'}
                    </td>
                    <td className="px-4 py-2.5">{r.weight != null ? `${Number(r.weight).toFixed(1)} kg` : '--'}</td>
                    <td className="px-4 py-2.5">{r.battery ? `${r.battery}%` : '--'}</td>
                    <td className="px-4 py-2.5">
                      {r.isAnomaly ? (
                        <span className="text-[10px] font-sans font-bold text-red-600 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded-full">
                          Anomaly
                        </span>
                      ) : (
                        <span className="text-[10px] font-sans font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCaptureForAI}
        multiPhoto={false}
        title="Photograph Brood Frame for Gemini AI Pathologist"
        description="Frame comb cells closely under natural light"
      />

      {isStickerOpen && (
        <PrintableHiveSticker
          hive={hive}
          onClose={() => setIsStickerOpen(false)}
        />
      )}

      <PairIoTDeviceModal
        isOpen={isPairOpen}
        onClose={() => setIsPairOpen(false)}
        hives={[hive]}
        initialHiveId={hive.hiveId}
      />

      <IoTSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        hiveId={hive.hiveId}
        colonyType={hive.colonyType}
      />
    </div>
  );
};
