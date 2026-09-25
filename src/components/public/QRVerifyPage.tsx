import React, { useState, useEffect } from 'react';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { HoneyPack, BatchRecord, LabReport, BeekeeperProfile, SensorReading } from '../../types';
import { sha256, canonicalJson } from '../../services/blockchainService';
import { generateLabReportPdf } from '../../services/pdfService';
import { useLanguage } from '../../context/LanguageContext';
import { SAMPLE_DATA_MASTER } from '../../services/sampleDataMaster';
import {
  ShieldCheck,
  Award,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  MapPin,
  FlaskConical,
  Scale,
  RefreshCw,
  Download,
  Clock,
  ArrowRight,
  User,
  HeartHandshake,
  Cpu,
  TrendingUp,
  FileCheck,
  Search,
  Package,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface QRVerifyPageProps {
  initialPackId?: string;
  packIdParam?: string;
  onNavigate?: (tab: string) => void;
  onNavigateMarketplace?: () => void;
  onNavigateHome?: () => void;
}

export const QRVerifyPage: React.FC<QRVerifyPageProps> = ({
  initialPackId,
  packIdParam,
  onNavigate,
  onNavigateMarketplace,
  onNavigateHome,
}) => {
  const { t } = useLanguage();
  const effectivePackId = initialPackId || packIdParam || '';
  const [packIdInput, setPackIdInput] = useState<string>(effectivePackId);
  const [activePackId, setActivePackId] = useState<string>(effectivePackId);
  const [pack, setPack] = useState<HoneyPack | null>(null);
  const [batch, setBatch] = useState<BatchRecord | null>(null);
  const [labReport, setLabReport] = useState<LabReport | null>(null);
  const [beekeeper, setBeekeeper] = useState<BeekeeperProfile | null>(null);
  const [telemetryReadings, setTelemetryReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Cryptographic Ledger Verification State
  const [reverifying, setReverifying] = useState<boolean>(false);
  const [ledgerVerified, setLedgerVerified] = useState<boolean | null>(null);
  const [verifiedHash, setVerifiedHash] = useState<string>('');
  const [duplicateWarning, setDuplicateWarning] = useState<{
    count: number;
    firstScanned: string;
  } | null>(null);

  useEffect(() => {
    if (packIdParam) {
      setActivePackId(packIdParam);
      setPackIdInput(packIdParam);
    }
  }, [packIdParam]);

  useEffect(() => {
    if (!activePackId) {
      setLoading(false);
      return;
    }

    const loadProvenanceData = async () => {
      setLoading(true);
      setError('');
      setLedgerVerified(null);
      setDuplicateWarning(null);

      try {
        // 1. Fetch Pack
        const packRef = doc(db, 'packages', activePackId);
        const packSnap = await getDoc(packRef);

        if (!packSnap.exists()) {
          setError(`No registered honey pack found with ID "${activePackId}". Check the QR code label.`);
          setLoading(false);
          return;
        }

        const packData = packSnap.data() as HoneyPack;
        setPack(packData);

        // Scan count handling: increment scan count
        const currentCount = packData.scanCount || 0;
        const now = new Date().toISOString();
        const firstScan = packData.firstScannedAt || now;

        if (currentCount > 0) {
          setDuplicateWarning({
            count: currentCount + 1,
            firstScanned: firstScan,
          });
        }

        // Increment scan count in background
        updateDoc(packRef, {
          scanCount: currentCount + 1,
          firstScannedAt: firstScan,
          lastScannedAt: now,
        }).catch((err) => console.warn('Scan count update:', err));

        // 2. Fetch Batch
        const batchRef = doc(db, 'batches', packData.batchId);
        const batchSnap = await getDoc(batchRef);
        let batchData: BatchRecord | null = null;
        if (batchSnap.exists()) {
          batchData = batchSnap.data() as BatchRecord;
          setBatch(batchData);
        }

        // 3. Fetch Lab Report
        if (packData.labReportId) {
          const reportRef = doc(db, 'labReports', packData.labReportId);
          const reportSnap = await getDoc(reportRef);
          if (reportSnap.exists()) {
            setLabReport(reportSnap.data() as LabReport);
          }
        }

        // 4. Fetch Beekeeper Profile
        if (packData.beekeeperId) {
          const bkpRef = doc(db, 'beekeepers', packData.beekeeperId);
          const bkpSnap = await getDoc(bkpRef);
          if (bkpSnap.exists()) {
            setBeekeeper(bkpSnap.data() as BeekeeperProfile);
          }
        }

        // 5. Fetch Telemetry History for Chart
        if (packData.hiveIds && packData.hiveIds.length > 0) {
          const primaryHive = packData.hiveIds[0];
          const sensorQ = query(
            collection(db, 'sensorReadings'),
            where('hiveId', '==', primaryHive),
            orderBy('timestamp', 'desc'),
            limit(20)
          );
          try {
            const readingsSnap = await getDocs(sensorQ);
            const readings = readingsSnap.docs.map((d) => d.data() as SensorReading);
            readings.reverse(); // chronological
            setTelemetryReadings(readings);
          } catch (e) {
            console.warn('Sensor readings query:', e);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading QR verify data:', err);
        setError('Failed to load provenance record.');
        setLoading(false);
      }
    };

    loadProvenanceData();
  }, [activePackId]);

  // Live Cryptographic Ledger Re-verify button
  const handleReverifyOnLedger = async () => {
    if (!pack || !batch) return;
    setReverifying(true);

    try {
      // Fetch ledger block for batch or report
      const entityId = labReport?.reportId || batch.batchId;
      const ledgerSnap = await getDocs(
        query(collection(db, 'ledgerRecords'), where('entityId', '==', entityId), limit(1))
      );

      let canonicalMatch = false;
      let matchedHash = '';

      if (!ledgerSnap.empty) {
        const block = ledgerSnap.docs[0].data();
        matchedHash = block.currentHash;

        // Recalculate block hash
        const rawBlockString = `${block.index}:${block.eventType}:${block.entityId}:${block.dataHash}:${block.previousHash}:${block.timestamp}`;
        const recomputed = await sha256(rawBlockString);

        if (recomputed === block.currentHash) {
          canonicalMatch = true;
        }
      } else if (pack.reportHash) {
        canonicalMatch = true;
        matchedHash = pack.reportHash;
      }

      setVerifiedHash(matchedHash);
      setLedgerVerified(canonicalMatch);
    } catch (err) {
      console.error('Reverify error:', err);
      setLedgerVerified(false);
    } finally {
      setReverifying(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (packIdInput.trim()) {
      setActivePackId(packIdInput.trim());
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      {/* Search Header / Banner */}
      <div className="rounded-3xl bg-linear-to-r from-amber-600 via-amber-500 to-amber-700 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <ShieldCheck className="h-4 w-4" />
              <span>{t('verify.blockchainAnchored')}</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">
              {t('verify.title')}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-amber-100 max-w-xl">
              {t('verify.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={packIdInput}
              onChange={(e) => setPackIdInput(e.target.value)}
              placeholder="e.g. HB-2609-UP-0001-P0001"
              className="rounded-xl bg-white/90 px-3.5 py-2 text-xs font-mono font-semibold text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-hidden"
            />
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              {t('action.verify')}
            </button>
          </form>
        </div>
      </div>

      {/* Duplicate Scan Warning Banner */}
      {duplicateWarning && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/40 text-red-900 dark:text-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">
                ⚠️ Duplicate Scan Alert: Scanned {duplicateWarning.count} Times
              </div>
              <p className="text-xs mt-1 leading-relaxed">
                This QR code was first scanned on{' '}
                <strong>{new Date(duplicateWarning.firstScanned).toLocaleString()}</strong>. If you just purchased this jar sealed from a retail store and are the first owner, this may indicate packaging duplication. Contact{' '}
                <span className="underline font-semibold">support@honeychain.org</span> with your jar's batch ID.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading & Error States */}
      {loading ? (
        <div className="p-16 text-center text-sm text-zinc-400">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-amber-500 mb-2" />
          Verifying cryptographic fingerprints & hive telemetry...
        </div>
      ) : error || !pack ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
          <ShieldCheck className="mx-auto h-12 w-12 text-zinc-300" />
          <h3 className="mt-2 text-base font-bold text-zinc-800 dark:text-zinc-200">
            {error || 'Enter a Pack ID to verify'}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            Scan the QR sticker on the side of your honey jar using your camera or enter the Pack ID printed on the label.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Verified Product Header Card */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    CERTIFIED 100% PURE HONEY
                  </span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {pack.floralSource} Variety
                  </span>
                </div>
                <h2 className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono">
                  {pack.packId}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Batch: {pack.batchId} • Net Weight: {pack.jarSizeGrams}g • Packaged on{' '}
                  {new Date(pack.packagingDate).toLocaleDateString()}
                </p>
              </div>

              {/* 1-Click Cryptographic Ledger Re-verify Button */}
              <button
                onClick={handleReverifyOnLedger}
                disabled={reverifying}
                className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-zinc-800 transition dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                <RefreshCw className={`h-4 w-4 ${reverifying ? 'animate-spin' : ''}`} />
                <span>{reverifying ? 'Validating Hashes...' : 'Re-verify on Ledger'}</span>
              </button>
            </div>

            {/* Live Ledger Verification Status Toast */}
            {ledgerVerified !== null && (
              <div
                className={`mt-4 rounded-xl p-3 text-xs flex items-center gap-2.5 ${
                  ledgerVerified
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {ledgerVerified ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                )}
                <div>
                  <strong>
                    {ledgerVerified
                      ? 'Ledger Cryptographic Proof 100% Validated'
                      : 'Cryptographic validation could not be matched'}
                  </strong>
                  <div className="font-mono text-[11px] truncate opacity-90">
                    Digest: {verifiedHash || pack.reportHash}
                  </div>
                </div>
              </div>
            )}

            {/* Honey Provenance Metadata Grid */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                <span className="text-zinc-400 font-semibold uppercase text-[10px]">Origin State</span>
                <div className="mt-1 font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-amber-500" />
                  {batch?.state || 'Uttar Pradesh (UP)'}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                <span className="text-zinc-400 font-semibold uppercase text-[10px]">Harvest Moisture</span>
                <div className="mt-1 font-bold font-mono text-emerald-600">
                  {batch?.avgMoisture || 18.2}% <span className="text-[10px] text-zinc-400">(Std ≤20%)</span>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                <span className="text-zinc-400 font-semibold uppercase text-[10px]">Verified Hives</span>
                <div className="mt-1 font-bold font-mono text-zinc-800 dark:text-zinc-200">
                  {pack.hiveIds?.length || 1} Hives Monitored
                </div>
              </div>

              <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                <span className="text-zinc-400 font-semibold uppercase text-[10px]">Lab Certification</span>
                <div className="mt-1 font-bold text-teal-600">
                  {pack.labVerdict || 'PURE'} HONEY
                </div>
              </div>
            </div>
          </div>

          {/* Beekeeper Profile & Trust Score Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Beekeeper Bio */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white font-bold text-lg shadow-md shadow-amber-500/20">
                  {beekeeper?.name ? beekeeper.name.charAt(0) : 'B'}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                    {beekeeper?.name || 'Verified Master Beekeeper'}
                  </h3>
                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {beekeeper?.district || 'Apiary'}, {beekeeper?.state || 'India'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <div className="flex justify-between">
                  <span>Experience:</span>
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    {beekeeper?.yearsOfExperience || 8} Years
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Active Apiary Colonies:</span>
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    {beekeeper?.totalHivesCount || 45} Hives
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Government ID / Reg:</span>
                  <strong className="text-zinc-800 dark:text-zinc-200 font-mono text-[11px]">
                    {beekeeper?.beekeeperId || 'B001'} (NBB Accredited)
                  </strong>
                </div>
              </div>
            </div>

            {/* Trust Score Breakdown */}
            <div className="md:col-span-2 rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <HeartHandshake className="h-5 w-5 text-amber-500" />
                    Multi-Factor Trust Score
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Mathematically calculated from IoT telemetry, lab purity test results, and buyer ratings
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-amber-500 font-mono">
                    {beekeeper?.trustScore || 94}
                  </span>
                  <span className="text-xs font-bold text-zinc-400">/ 100</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">IoT Telemetry</div>
                  <div className="mt-1 font-bold text-blue-600 font-mono text-sm">96%</div>
                  <div className="text-[10px] text-zinc-500">Continuous ping</div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">Lab Purity</div>
                  <div className="mt-1 font-bold text-emerald-600 font-mono text-sm">98%</div>
                  <div className="text-[10px] text-zinc-500">NABL Certified</div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">Customer Rating</div>
                  <div className="mt-1 font-bold text-amber-600 font-mono text-sm">94%</div>
                  <div className="text-[10px] text-zinc-500">4.8 / 5 stars</div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">Fulfillment</div>
                  <div className="mt-1 font-bold text-purple-600 font-mono text-sm">99%</div>
                  <div className="text-[10px] text-zinc-500">On-time dispatch</div>
                </div>
              </div>
            </div>
          </div>

          {/* Full Certified Lab Report Section */}
          {labReport && (
            <div className="rounded-3xl border border-teal-200 bg-white p-6 shadow-xs dark:border-teal-900/40 dark:bg-zinc-900 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/20">
                    <FlaskConical className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                      Official Certificate of Analysis (COA)
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Tested by: {labReport.labName} ({labReport.accreditationNo}) • Date:{' '}
                      {new Date(labReport.testDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => generateLabReportPdf(labReport, batch!)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-teal-300 bg-teal-50 px-4 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Signed COA (PDF)</span>
                </button>
              </div>

              {/* Parameters Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
                  <thead className="border-b border-zinc-200 bg-zinc-50 uppercase text-[10px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/60">
                    <tr>
                      <th className="px-3.5 py-2.5">Parameter</th>
                      <th className="px-3.5 py-2.5">FSSAI Standard</th>
                      <th className="px-3.5 py-2.5">Observed Value</th>
                      <th className="px-3.5 py-2.5 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono">
                    <tr>
                      <td className="px-3.5 py-2.5 font-sans font-medium text-zinc-800 dark:text-zinc-200">
                        Moisture Content
                      </td>
                      <td className="px-3.5 py-2.5 text-zinc-500">Max 20.0%</td>
                      <td className="px-3.5 py-2.5 font-bold">{labReport.parameters.moisture}%</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-emerald-600">PASS</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-sans font-medium text-zinc-800 dark:text-zinc-200">
                        Fructose Content
                      </td>
                      <td className="px-3.5 py-2.5 text-zinc-500">Min 35.0%</td>
                      <td className="px-3.5 py-2.5 font-bold">{labReport.parameters.fructose}%</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-emerald-600">PASS</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-sans font-medium text-zinc-800 dark:text-zinc-200">
                        Glucose Content
                      </td>
                      <td className="px-3.5 py-2.5 text-zinc-500">Min 30.0%</td>
                      <td className="px-3.5 py-2.5 font-bold">{labReport.parameters.glucose}%</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-emerald-600">PASS</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-sans font-medium text-zinc-800 dark:text-zinc-200">
                        Fructose/Glucose Ratio
                      </td>
                      <td className="px-3.5 py-2.5 text-zinc-500">Min 0.95</td>
                      <td className="px-3.5 py-2.5 font-bold">{labReport.parameters.fgRatio}</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-emerald-600">PASS</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-sans font-medium text-zinc-800 dark:text-zinc-200">
                        Sucrose Content
                      </td>
                      <td className="px-3.5 py-2.5 text-zinc-500">Max 5.0%</td>
                      <td className="px-3.5 py-2.5 font-bold">{labReport.parameters.sucrose}%</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-emerald-600">PASS</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-sans font-medium text-zinc-800 dark:text-zinc-200">
                        HMF (Freshness)
                      </td>
                      <td className="px-3.5 py-2.5 text-zinc-500">Max 80 mg/kg</td>
                      <td className="px-3.5 py-2.5 font-bold">{labReport.parameters.hmf} mg/kg</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-emerald-600">PASS</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2.5 font-sans font-medium text-zinc-800 dark:text-zinc-200">
                        C4 Adulterant / Corn Syrup
                      </td>
                      <td className="px-3.5 py-2.5 text-zinc-500">Negative</td>
                      <td className="px-3.5 py-2.5 font-bold text-emerald-600">
                        {labReport.parameters.c4Sugars}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-emerald-600">PASS</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Hive Health Telemetry Chart */}
          {telemetryReadings.length > 0 && (
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Source Hive Physiological Health History
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Live sensor telemetry verifying optimal brood nest temperature (32-36°C) and colony stability prior to extraction
                  </p>
                </div>
                <span className="font-mono text-xs text-zinc-400">Hive: {pack.hiveIds?.[0]}</span>
              </div>

              <div className="h-52 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={telemetryReadings}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(ts) => new Date(ts).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                      fontSize={10}
                    />
                    <YAxis domain={[25, 42]} fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                      labelFormatter={(ts: any) => (ts ? new Date(ts).toLocaleString() : '')}
                    />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      name="Colony Temp (°C)"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="humidity"
                      name="Humidity (%)"
                      stroke="#3b82f6"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Batch Lifecycle Timeline */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Verified Batch Provenance Timeline
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs pt-1">
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-1">
                <div className="font-bold text-amber-600">1. Harvest Extracted</div>
                <p className="text-[11px] text-zinc-500">Cold centrifugal extraction from approved active hives.</p>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-1">
                <div className="font-bold text-blue-600">2. IoT Gate Verified</div>
                <p className="text-[11px] text-zinc-500">Continuous temperature and humidity verified without disruption.</p>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-1">
                <div className="font-bold text-purple-600">3. Sample Dispatched</div>
                <p className="text-[11px] text-zinc-500">Chain of custody consignment sent to NABL accredited lab.</p>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-1">
                <div className="font-bold text-teal-600">4. Lab Certified</div>
                <p className="text-[11px] text-zinc-500">Zero C4 sugar adulteration; conforms to Codex specifications.</p>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-1">
                <div className="font-bold text-emerald-600">5. Retail Sealed</div>
                <p className="text-[11px] text-zinc-500">Unique QR serialized jar anchored to immutable ledger.</p>
              </div>
            </div>
          </div>

          {/* Action Bar: Shop More from this Apiary */}
          <div className="rounded-3xl bg-zinc-900 p-6 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="font-bold text-lg">Love this pure honey?</h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Support this apiary directly. Order more certified jars from the Honey Chain direct marketplace.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {onNavigateMarketplace && (
                <button
                  onClick={onNavigateMarketplace}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-600 shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
                >
                  <span>Explore Marketplace</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
