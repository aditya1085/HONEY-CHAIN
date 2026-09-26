import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LabProfile, LabSample, LabReport, LabTestParameters, BatchRecord, HiveRecord } from '../../types';
import { recordLedgerBlock } from '../../services/blockchainService';
import { logActivity } from '../../services/activityLogger';
import { generateLabReportPdf } from '../../services/pdfService';
import { useLanguage } from '../../context/LanguageContext';
import { SAMPLE_DATA_MASTER } from '../../services/sampleDataMaster';
import { StateDistrictSearch } from '../common/StateDistrictSearch';
import { IndiaHivesMap } from '../common/IndiaHivesMap';
import { LabAnalyticsView } from './LabAnalyticsView';
import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Award,
  Clock,
  Send,
  Download,
  Building,
  ShieldCheck,
  Scale,
  Sparkles,
  Lock,
  MapPin,
  TrendingUp,
  Search,
} from 'lucide-react';

interface LabPortalProps {
  currentUserId?: string;
  userRole?: string;
}

const DEFAULT_LAB: LabProfile = {
  id: 'LAB_CBRTI_PUNE',
  userId: 'lab_cbrti_user',
  labName: 'Central Bee Research & Training Institute (CBRTI) National Lab',
  accreditationNo: 'NABL-TC-0841 • FSSAI-2024',
  contactPerson: 'Dr. Ramesh K. Sharma',
  email: 'cbrti.testing@honeychain.gov.in',
  phone: '+91 20 2565 1204',
  state: 'Maharashtra',
  district: 'Pune',
  address: '1153 Ganeshkhind Road, Shivajinagar, Pune, Maharashtra 411016',
  status: 'approved',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const SAMPLE_LAB_SAMPLES: LabSample[] = SAMPLE_DATA_MASTER.batches.slice(0, 16).map((b, idx) => ({
  id: b.sampleId || `LS-2609-${1000 + idx}`,
  sampleId: b.sampleId || `LS-2609-${1000 + idx}`,
  batchId: b.batchId,
  beekeeperId: b.beekeeperIds[0] || 'BK-1001',
  labId: 'LAB_CBRTI_PUNE',
  labName: 'Central Bee Research & Training Institute (CBRTI)',
  floralSource: b.floralSource,
  quantityMl: 250,
  dispatchedAt: b.createdAt,
  courierTracking: `DELHIVERY-LS-${1000 + idx}`,
  status: idx < 5 ? 'dispatched' : idx < 9 ? 'in_testing' : 'completed',
  reportId: b.labReportId,
  isSample: true,
  createdAt: b.createdAt,
  updatedAt: b.updatedAt,
}));

const INITIAL_REPORTS_MAP: Record<string, LabReport> = {};
SAMPLE_DATA_MASTER.labReports.forEach((r) => {
  INITIAL_REPORTS_MAP[r.sampleId] = r;
});

export const LabPortal: React.FC<LabPortalProps> = ({ currentUserId, userRole }) => {
  const { t } = useLanguage();
  const [labs, setLabs] = useState<LabProfile[]>([DEFAULT_LAB]);
  const [activeLab, setActiveLab] = useState<LabProfile | null>(DEFAULT_LAB);
  const [samples, setSamples] = useState<LabSample[]>(SAMPLE_LAB_SAMPLES);
  const [selectedSample, setSelectedSample] = useState<LabSample | null>(null);
  const [reports, setReports] = useState<Record<string, LabReport>>(INITIAL_REPORTS_MAP);
  const [loading, setLoading] = useState<boolean>(false);

  // Tab mode: Testing Queue vs Hive Health vs Map vs Analytics vs AI Insights vs State/District Search
  const [activeLabTab, setActiveLabTab] = useState<'queue' | 'hive_health' | 'map' | 'analytics' | 'ai_insights' | 'regional_search'>('queue');

  // Hives for Stage 2 Lab Health Verification
  const [hives, setHives] = useState<HiveRecord[]>(SAMPLE_DATA_MASTER.hives);
  const [selectedHiveForHealth, setSelectedHiveForHealth] = useState<HiveRecord | null>(null);
  const [hiveVerdict, setHiveVerdict] = useState<'HEALTHY' | 'UNHEALTHY'>('HEALTHY');
  const [hiveVerdictNotes, setHiveVerdictNotes] = useState<string>(
    'Colony inspected in accordance with ICAR/NABL biosecurity protocol. Brood chamber active, zero signs of American/European foulbrood, queen healthy.'
  );
  const [hiveInspector, setHiveInspector] = useState<string>('Dr. R. K. Sharma (Senior Apiary Entomologist)');
  const [submittingHiveCheck, setSubmittingHiveCheck] = useState<boolean>(false);
  const [hiveCheckError, setHiveCheckError] = useState<string>('');
  const [hiveCheckSuccess, setHiveCheckSuccess] = useState<string>('');

  // Form State for Recording Report
  const [showTestModal, setShowTestModal] = useState<boolean>(false);
  const [testedBy, setTestedBy] = useState<string>('Dr. R. K. Sharma (Senior Apiary Chemist)');
  const [moisture, setMoisture] = useState<number>(18.0);
  const [fructose, setFructose] = useState<number>(38.5);
  const [glucose, setGlucose] = useState<number>(33.2);
  const [sucrose, setSucrose] = useState<number>(2.4);
  const [hmf, setHmf] = useState<number>(14.5);
  const [pollenCount, setPollenCount] = useState<number>(0.92);
  const [c4Sugars, setC4Sugars] = useState<'Negative' | 'Positive'>('Negative');
  const [antibiotics, setAntibiotics] = useState<'Pass' | 'Fail'>('Pass');
  const [heavyMetals, setHeavyMetals] = useState<'Pass' | 'Fail'>('Pass');
  const [remarks, setRemarks] = useState<string>('Conforms to all FSSAI & Codex Alimentarius Honey Standards.');
  const [submittingTest, setSubmittingTest] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<string>('');

  // Auto-calculated F/G Ratio
  const fgRatio = glucose > 0 ? Math.round((fructose / glucose) * 100) / 100 : 1.0;

  // Determine standard verdict
  const isPure =
    moisture <= 20 &&
    fructose >= 35 &&
    glucose >= 30 &&
    fgRatio >= 0.95 &&
    sucrose <= 5 &&
    hmf <= 80 &&
    c4Sugars === 'Negative' &&
    antibiotics === 'Pass' &&
    heavyMetals === 'Pass';

  const suggestedVerdict = isPure ? 'PURE' : c4Sugars === 'Positive' ? 'ADULTERATED' : 'SUB_STANDARD';

  // Fetch Labs & Samples
  useEffect(() => {
    const fetchLabsAndSamples = async () => {
      try {
        const labsSnap = await getDocs(collection(db, 'labs'));
        const labList = labsSnap.docs.map((d) => d.data() as LabProfile);
        setLabs(labList);

        if (labList.length > 0) {
          setActiveLab(labList[0]);
        }
      } catch (err) {
        console.error('Error fetching labs:', err);
      }
    };
    fetchLabsAndSamples();
  }, []);

  // Real-time listener for samples
  useEffect(() => {
    const q = collection(db, 'labSamples');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as LabSample);
        // Sort by dispatchedAt desc
        list.sort((a, b) => new Date(b.dispatchedAt).getTime() - new Date(a.dispatchedAt).getTime());
        setSamples(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to lab samples:', err);
        setLoading(false);
      }
    );

    // Also fetch reports
    const qReports = collection(db, 'labReports');
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      const repMap: Record<string, LabReport> = {};
      snapshot.docs.forEach((d) => {
        const rep = d.data() as LabReport;
        repMap[rep.sampleId] = rep;
      });
      setReports(repMap);
    });

    return () => {
      unsubscribe();
      unsubReports();
    };
  }, []);

  // Real-time listener for hives awaiting Lab Health Verification
  useEffect(() => {
    const unsubHives = onSnapshot(
      collection(db, 'hives'),
      (snapshot) => {
        const liveList: HiveRecord[] = [];
        snapshot.forEach((d) => liveList.push(d.data() as HiveRecord));
        if (liveList.length > 0) {
          const liveIds = new Set(liveList.map((h) => h.id || h.hiveId));
          const combined = [
            ...liveList,
            ...SAMPLE_DATA_MASTER.hives.filter((h) => !liveIds.has(h.id || h.hiveId)),
          ];
          setHives(combined);
        }
      },
      (err) => {
        console.warn('LabPortal hives listener notice:', err);
      }
    );

    return () => unsubHives();
  }, []);

  const handleSubmitHiveHealthCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHiveForHealth) return;
    setHiveCheckError('');
    setHiveCheckSuccess('');
    setSubmittingHiveCheck(true);

    try {
      const nowIso = new Date().toISOString();
      const hiveRef = doc(db, 'hives', selectedHiveForHealth.id);

      await updateDoc(hiveRef, {
        approvalStage: 'STAGE_3_ADMIN_FINAL',
        labVerdict: hiveVerdict,
        labVerdictNotes: hiveVerdictNotes.trim(),
        labVerifiedBy: hiveInspector.trim(),
        labVerifiedAt: nowIso,
        labId: activeLab?.id || 'LAB_CBRTI_PUNE',
        updatedAt: nowIso,
      });

      // Notify Admin
      try {
        const adminNotifId = `notif_admin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, 'notifications', adminNotifId), {
          id: adminNotifId,
          userId: 'admin',
          title: `🔬 Lab Health Check: ${selectedHiveForHealth.hiveId}`,
          message: `Accredited Lab ${activeLab?.labName || 'CBRTI'} submitted verdict (${hiveVerdict}) for Hive ${selectedHiveForHealth.hiveId}. Awaiting final Admin live activation.`,
          type: 'INFO',
          read: false,
          createdAt: nowIso,
        });
      } catch {}

      // Notify Beekeeper
      try {
        const beekeeperNotifId = `notif_bk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, 'notifications', beekeeperNotifId), {
          id: beekeeperNotifId,
          userId: selectedHiveForHealth.beekeeperId,
          title: `🔬 Lab Health Verdict: ${hiveVerdict}`,
          message: `Accredited Lab ${activeLab?.labName || 'CBRTI'} verified your Hive ${selectedHiveForHealth.hiveId} with verdict: ${hiveVerdict}. It is now in the final Admin review queue for live activation.`,
          type: hiveVerdict === 'HEALTHY' ? 'SUCCESS' : 'ALERT',
          read: false,
          createdAt: nowIso,
        });
      } catch {}

      await logActivity({
        actorRole: 'LAB',
        action: 'HIVE_LAB_HEALTH_VERIFIED',
        entityType: 'HIVE',
        entityId: selectedHiveForHealth.hiveId,
        details: `Accredited Lab certified health check for Hive ${selectedHiveForHealth.hiveId}. Verdict: ${hiveVerdict}. Notes: ${hiveVerdictNotes.trim()}`,
      });

      setHiveCheckSuccess(`Lab health verdict (${hiveVerdict}) submitted for Hive ${selectedHiveForHealth.hiveId}. Awaiting Admin final live sign-off.`);
      setSelectedHiveForHealth(null);
      setTimeout(() => setHiveCheckSuccess(''), 5000);
    } catch (err: unknown) {
      console.error('Submit hive check failed:', err);
      setHiveCheckError(err instanceof Error ? err.message : 'Failed to record health verdict.');
    } finally {
      setSubmittingHiveCheck(false);
    }
  };

  // Acknowledge receipt
  const handleAcknowledgeSample = async (sample: LabSample) => {
    if (userRole !== 'LAB') {
      alert('Access Denied: Only certified Laboratory Personnel (LAB role) can acknowledge sample receipt.');
      return;
    }
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, 'labSamples', sample.sampleId), {
        status: 'in_testing',
        receivedAt: now,
        updatedAt: now,
      });

      await logActivity({
        actorRole: 'LAB',
        action: 'RECEIVE_SAMPLE',
        entityType: 'LAB_SAMPLE',
        entityId: sample.sampleId,
        details: `Sample ${sample.sampleId} received and testing initiated by ${activeLab?.labName || 'Testing Lab'}`,
      });
    } catch (err) {
      console.error('Error acknowledging sample:', err);
    }
  };

  // Submit test report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSample || !activeLab) return;

    if (userRole !== 'LAB') {
      setSubmitError('Access Denied: Only certified Laboratory Specialists (LAB role) can record test parameters. Admin cannot edit lab values.');
      return;
    }

    setSubmittingTest(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const now = new Date().toISOString();
      const reportId = `LBR-${selectedSample.sampleId.replace('LS-', '')}`;

      const parameters: LabTestParameters = {
        moisture,
        fructose,
        glucose,
        fgRatio,
        sucrose,
        hmf,
        pollenCountMillion: pollenCount,
        c4Sugars,
        antibioticsResidue: antibiotics,
        heavyMetals,
      };

      // 1. Compute SHA-256 Hash via backend endpoint
      const hashResp = await fetch('/api/lab/compute-report-hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleId: selectedSample.sampleId,
          batchId: selectedSample.batchId,
          labId: activeLab.id,
          accreditationNo: activeLab.accreditationNo,
          parameters,
          verdict: suggestedVerdict,
          testedBy,
          testDate: now,
        }),
      });

      const hashData = await hashResp.json();
      if (!hashData.success || !hashData.reportHash) {
        throw new Error('Failed to generate cryptographic report hash');
      }

      const reportHash = hashData.reportHash;

      // 2. Anchor to Blockchain / Cryptographic Ledger
      const ledgerBlock = await recordLedgerBlock('LAB_REPORT_HASHED', selectedSample.batchId, {
        batchId: selectedSample.batchId,
        sampleId: selectedSample.sampleId,
        reportId,
        labId: activeLab.id,
        verdict: suggestedVerdict,
        reportHash,
      });

      // 3. Save Lab Report Doc
      const reportDoc: LabReport = {
        id: reportId,
        reportId,
        sampleId: selectedSample.sampleId,
        batchId: selectedSample.batchId,
        labId: activeLab.id,
        labName: activeLab.labName,
        accreditationNo: activeLab.accreditationNo,
        testedBy,
        testDate: now,
        parameters,
        verdict: suggestedVerdict,
        remarks,
        reportHash,
        ledgerBlockIndex: ledgerBlock?.index,
        ledgerHash: ledgerBlock?.currentHash,
        createdAt: now,
      };

      await setDoc(doc(db, 'labReports', reportId), reportDoc);

      // 4. Update Sample Status
      await updateDoc(doc(db, 'labSamples', selectedSample.sampleId), {
        status: 'completed',
        reportId,
        completedAt: now,
        updatedAt: now,
      });

      // 5. Update Batch Status to `lab_tested`
      await updateDoc(doc(db, 'batches', selectedSample.batchId), {
        status: 'lab_tested',
        labReportId: reportId,
        labVerdict: suggestedVerdict,
        reportHash,
        updatedAt: now,
      });

      // 6. Log Activity
      await logActivity({
        actorRole: 'LAB',
        action: 'SUBMIT_LAB_REPORT',
        entityType: 'LAB_SAMPLE',
        entityId: selectedSample.sampleId,
        details: `Laboratory certified report ${reportId} for batch ${selectedSample.batchId} with verdict: ${suggestedVerdict} (SHA-256: ${reportHash.substring(0, 16)}...)`,
      });

      // 7. Auto-download COA PDF
      const dummyBatch: BatchRecord = {
        id: selectedSample.batchId,
        batchId: selectedSample.batchId,
        state: activeLab.state,
        floralSource: selectedSample.floralSource,
        beekeeperIds: [selectedSample.beekeeperId],
        hiveIds: [],
        harvestIds: [],
        totalQuantityKg: 0,
        avgMoisture: moisture,
        status: 'lab_tested',
        createdAt: now,
        updatedAt: now,
      };
      await generateLabReportPdf(reportDoc, dummyBatch);

      setSubmitSuccess(`Report ${reportId} successfully certified and anchored to ledger! Downloaded Certificate of Analysis.`);
      setShowTestModal(false);
      setSubmittingTest(false);
    } catch (err) {
      console.error('Report submission error:', err);
      setSubmitError(`Failed to certify report: ${err instanceof Error ? err.message : String(err)}`);
      setSubmittingTest(false);
    }
  };

  const stage2Hives = hives.filter((h) => h.approvalStage === 'STAGE_2_LAB_VERIFICATION');
  const verifiedHivesHistory = hives.filter((h) => h.labVerdict != null);

  return (
    <div className="space-y-6">
      {/* Header & Lab Accreditation Card */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-6 dark:border-teal-900/40 dark:bg-teal-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/30">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {activeLab?.labName || 'Government Accredited Honey Quality Laboratory'}
                </h2>
                <span className="rounded-full bg-teal-200 px-2.5 py-0.5 text-xs font-bold text-teal-900 dark:bg-teal-900 dark:text-teal-200">
                  {activeLab?.accreditationNo || 'NABL / FSSAI ACCREDITED'}
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                Official Laboratory Purity Testing Portal • FSSAI Codex Alimentarius Compliance Gate
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
            <Lock className="h-4 w-4 text-teal-600" />
            <span>Cryptographic Lab-Only Write Protected</span>
          </div>
        </div>
      </div>

      {/* Action Alerts */}
      {submitError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {submitSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* Lab Sub-navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveLabTab('queue')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeLabTab === 'queue'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Honey Batches Queue ({samples.length})</span>
        </button>

        <button
          onClick={() => setActiveLabTab('hive_health')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeLabTab === 'hive_health'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Hive Health Verification ({stage2Hives.length})</span>
        </button>

        <button
          onClick={() => setActiveLabTab('map')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeLabTab === 'map'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Testing Origin Map</span>
        </button>

        <button
          onClick={() => setActiveLabTab('analytics')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeLabTab === 'analytics'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Turnaround & Quality Charts</span>
        </button>

        <button
          onClick={() => setActiveLabTab('ai_insights')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeLabTab === 'ai_insights'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>AI Quality Patterns</span>
        </button>

        <button
          onClick={() => setActiveLabTab('regional_search')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeLabTab === 'regional_search'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Search className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>State / District Audit</span>
        </button>
      </div>

      {activeLabTab === 'map' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-900 dark:text-teal-200">
            <strong>Geographic Honey Testing Scope:</strong> Displaying origin apiaries and honey batches assigned for NABL purity validation. Filter by state or district to evaluate regional compliance.
          </div>
          <IndiaHivesMap role="LAB" heightClass="h-[540px]" />
        </div>
      ) : activeLabTab === 'analytics' ? (
        <LabAnalyticsView labId={activeLab?.id} initialTab="charts" />
      ) : activeLabTab === 'ai_insights' ? (
        <LabAnalyticsView labId={activeLab?.id} initialTab="ai_insights" />
      ) : activeLabTab === 'regional_search' ? (
        <StateDistrictSearch role="LAB" />
      ) : activeLabTab === 'hive_health' ? (
        <div className="space-y-5 animate-in fade-in">
          {/* Header Banner */}
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <h4 className="font-bold text-teal-900 dark:text-teal-200 text-sm flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                Apiary Colony Biosecurity & Health Verification (Stage 2)
              </h4>
              <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">
                Accredited testing labs review physical colony observations, sensor readings, and biosecurity indicators before Admin issues live hive activation.
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-teal-600 text-white font-bold text-xs shrink-0 self-start sm:self-auto">
              {stage2Hives.length} Hives Awaiting Verification
            </span>
          </div>

          {hiveCheckSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{hiveCheckSuccess}</span>
            </div>
          )}

          {/* Grid of Hives Awaiting Lab Health Verification */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stage2Hives.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-2">
                <ShieldCheck className="w-10 h-10 text-zinc-300 mx-auto" />
                <h4 className="font-bold text-zinc-700 dark:text-zinc-200 text-sm">No Hives in Stage 2 Queue</h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  When the Administrator approves Stage 1 for newly registered hives, they will appear here for laboratory health and biosecurity evaluation.
                </p>
              </div>
            ) : (
              stage2Hives.map((hive) => (
                <div
                  key={hive.id}
                  className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-teal-500/40 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-base font-black text-teal-600 dark:text-teal-400">
                        {hive.hiveId}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        Stage 2: Lab Review
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{hive.colonyType}</h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-teal-500" />
                        {hive.area} ({hive.landType || 'Farmland'})
                      </p>
                      <div className="text-[11px] text-zinc-600 dark:text-zinc-300 font-mono mt-0.5">
                        Beekeeper: <strong className="text-amber-600 dark:text-amber-400">{hive.beekeeperId}</strong>
                      </div>
                    </div>

                    {/* Sensor Telemetry snapshot simulation / safe metrics */}
                    <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 space-y-1.5 text-[11px]">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Biosecurity Telemetry Check:</span>
                      <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                        <span>Safe Core Temp: 32°C – 36°C</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">✓ In-Range</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                        <span>Hive Humidity: 50% – 65% RH</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">✓ In-Range</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                        <span>Brood Pathogen Test</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">✓ Negative</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHiveForHealth(hive);
                        setHiveVerdict('HEALTHY');
                        setHiveCheckError('');
                      }}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Conduct Health Check</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Section: Recently Verified Hives History */}
          {verifiedHivesHistory.length > 0 && (
            <div className="pt-6 space-y-3">
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Recently Certified Hives ({verifiedHivesHistory.length})
              </h4>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Hive ID</th>
                      <th className="p-3">Colony Species</th>
                      <th className="p-3">Beekeeper</th>
                      <th className="p-3">Verdict</th>
                      <th className="p-3">Verified On</th>
                      <th className="p-3">Inspector Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {verifiedHivesHistory.slice(0, 10).map((vh) => (
                      <tr key={vh.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                        <td className="p-3 font-mono font-bold text-teal-600 dark:text-teal-400">{vh.hiveId}</td>
                        <td className="p-3">{vh.colonyType}</td>
                        <td className="p-3 font-mono">{vh.beekeeperId}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              vh.labVerdict === 'HEALTHY'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            }`}
                          >
                            {vh.labVerdict || 'HEALTHY'}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-500">
                          {vh.labVerifiedAt ? new Date(vh.labVerifiedAt).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="p-3 text-zinc-600 dark:text-zinc-300 italic max-w-xs truncate">
                          "{vh.labVerdictNotes || 'Certified'}"
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Assigned Samples Queue */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-teal-600" />
              Honey Samples Queue ({samples.length})
            </h3>
            <p className="text-xs text-zinc-500">
              Samples dispatched by beekeepers and administrators awaiting purity verification
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-zinc-400">Loading samples...</div>
        ) : samples.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-zinc-200 rounded-xl dark:border-zinc-800">
            <FlaskConical className="h-10 w-10 text-zinc-300 mx-auto" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mt-2">
              No samples currently in the testing queue
            </p>
            <p className="text-xs text-zinc-400">
              When batches pass the IoT verification gate, samples can be dispatched here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/60">
                <tr>
                  <th className="px-4 py-3.5">Sample ID</th>
                  <th className="px-4 py-3.5">Batch ID</th>
                  <th className="px-4 py-3.5">Floral Variety</th>
                  <th className="px-4 py-3.5">Dispatched Date</th>
                  <th className="px-4 py-3.5">Courier Tracking</th>
                  <th className="px-4 py-3.5">Testing Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {samples.map((s) => {
                  const report = reports[s.sampleId];
                  return (
                    <tr key={s.sampleId} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
                        {s.sampleId}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                        {s.batchId}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          {s.floralSource}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-zinc-500">
                        {new Date(s.dispatchedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-zinc-500">
                        {s.courierTracking || 'N/A'}
                      </td>
                      <td className="px-4 py-3.5">
                        {s.status === 'dispatched' ? (
                          <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
                            Dispatched / In Transit
                          </span>
                        ) : s.status === 'in_testing' ? (
                          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                            Under Analysis
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            Certified {report?.verdict || 'PURE'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-2">
                        {s.status === 'dispatched' && (
                          userRole === 'LAB' ? (
                            <button
                              onClick={() => handleAcknowledgeSample(s)}
                              className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                            >
                              Acknowledge Receipt
                            </button>
                          ) : (
                            <span className="text-[11px] text-zinc-400 italic">
                              Awaiting Lab Receipt
                            </span>
                          )
                        )}

                        {s.status === 'in_testing' && (
                          userRole === 'LAB' ? (
                            <button
                              onClick={() => {
                                setSelectedSample(s);
                                setShowTestModal(true);
                              }}
                              className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 shadow-xs"
                            >
                              Enter Test Results
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-md" title="Admin cannot edit lab values">
                              <Lock className="w-3 h-3" /> Lab Specialists Only
                            </span>
                          )
                        )}

                        {s.status === 'completed' && report && (
                          <button
                            onClick={async () => {
                              const dummyBatch: BatchRecord = {
                                id: s.batchId,
                                batchId: s.batchId,
                                state: activeLab?.state || 'UP',
                                floralSource: s.floralSource,
                                beekeeperIds: [s.beekeeperId],
                                hiveIds: [],
                                harvestIds: [],
                                totalQuantityKg: 0,
                                avgMoisture: report.parameters.moisture,
                                status: 'lab_tested',
                                createdAt: report.createdAt,
                                updatedAt: report.createdAt,
                              };
                              await generateLabReportPdf(report, dummyBatch);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-300"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>COA PDF</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}

      {/* Enter Test Results Modal */}
      {showTestModal && selectedSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-teal-200 dark:border-zinc-800 space-y-5">
            <div className="flex items-center justify-between border-b pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                    FSSAI Honey Purity Analysis — {selectedSample.sampleId}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Batch: {selectedSample.batchId} • Variety: {selectedSample.floralSource}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowTestModal(false)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Testing Officer / Chemist Name
                </label>
                <input
                  type="text"
                  value={testedBy}
                  onChange={(e) => setTestedBy(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* FSSAI Standard Parameters Grid */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Standard Physicochemical & Adulteration Parameters
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Moisture % (Std: ≤ 20%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={moisture}
                      onChange={(e) => setMoisture(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Fructose % (Std: ≥ 35%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={fructose}
                      onChange={(e) => setFructose(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Glucose % (Std: ≥ 30%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={glucose}
                      onChange={(e) => setGlucose(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      F/G Ratio (Std: ≥ 0.95)
                    </label>
                    <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-mono font-bold text-sm text-zinc-800 dark:text-zinc-200">
                      {fgRatio} {fgRatio >= 0.95 ? '✔' : '⚠️'}
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Sucrose % (Std: ≤ 5%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={sucrose}
                      onChange={(e) => setSucrose(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      HMF mg/kg (Std: ≤ 80)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={hmf}
                      onChange={(e) => setHmf(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      C4 Sugars / Corn Syrup
                    </label>
                    <select
                      value={c4Sugars}
                      onChange={(e) => setC4Sugars(e.target.value as 'Negative' | 'Positive')}
                      className="w-full rounded-lg border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      <option value="Negative">Negative (Pure)</option>
                      <option value="Positive">Positive (Adulterated)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Antibiotic Residues
                    </label>
                    <select
                      value={antibiotics}
                      onChange={(e) => setAntibiotics(e.target.value as 'Pass' | 'Fail')}
                      className="w-full rounded-lg border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      <option value="Pass">Pass (Below LOD)</option>
                      <option value="Fail">Fail (Residues Found)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Heavy Metals (Pb/Cd/As)
                    </label>
                    <select
                      value={heavyMetals}
                      onChange={(e) => setHeavyMetals(e.target.value as 'Pass' | 'Fail')}
                      className="w-full rounded-lg border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      <option value="Pass">Pass (Compliant)</option>
                      <option value="Fail">Fail (Exceeded)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Live Verdict Banner */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  suggestedVerdict === 'PURE'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                    : 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200'
                }`}
              >
                <div>
                  <div className="font-bold text-sm">Calculated Verdict: {suggestedVerdict} HONEY</div>
                  <div className="text-xs opacity-80">
                    {suggestedVerdict === 'PURE'
                      ? 'Sample complies with all Gazette of India FSSAI specifications.'
                      : 'Parameters fail standard safety or purity limits.'}
                  </div>
                </div>
                <Award className="h-6 w-6" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Analytical Remarks
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                {userRole !== 'LAB' && (
                  <span className="text-xs text-red-500 font-semibold mr-auto">
                    * Admin/Auditor accounts cannot submit test results. LAB login required.
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="rounded-xl border px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTest || userRole !== 'LAB'}
                  className="rounded-xl bg-teal-600 px-5 py-2 text-sm font-bold text-white hover:bg-teal-700 shadow-md shadow-teal-600/20 disabled:opacity-50"
                >
                  {submittingTest ? 'Certifying & Hashing...' : 'Certify Purity & Compute SHA-256 Hash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Conduct Hive Colony Biosecurity & Health Verification */}
      {selectedHiveForHealth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative my-8 w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-teal-200 dark:border-zinc-800 space-y-5">
            <div className="flex items-center justify-between border-b pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    Colony Health Verification — {selectedHiveForHealth.hiveId}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Species: {selectedHiveForHealth.colonyType} • Beekeeper: {selectedHiveForHealth.beekeeperId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedHiveForHealth(null)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {hiveCheckError && (
              <div className="p-3 rounded-xl bg-red-50 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {hiveCheckError}
              </div>
            )}

            <form onSubmit={handleSubmitHiveHealthCheck} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Accredited Inspector / Apiary Entomologist Name *
                </label>
                <input
                  type="text"
                  required
                  value={hiveInspector}
                  onChange={(e) => setHiveInspector(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 p-2 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Colony Health & Biosecurity Verdict *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setHiveVerdict('HEALTHY')}
                    className={`p-3 rounded-xl border text-center font-bold text-xs transition cursor-pointer flex flex-col items-center gap-1 ${
                      hiveVerdict === 'HEALTHY'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>HEALTHY (Optimal Colony)</span>
                    <span className="text-[10px] font-normal text-zinc-500">Disease-free, active queen & brood</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHiveVerdict('UNHEALTHY')}
                    className={`p-3 rounded-xl border text-center font-bold text-xs transition cursor-pointer flex flex-col items-center gap-1 ${
                      hiveVerdict === 'UNHEALTHY'
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-800 dark:text-red-300 ring-2 ring-red-500'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span>UNHEALTHY (Flagged)</span>
                    <span className="text-[10px] font-normal text-zinc-500">Pathogen, mite signs, or colony stress</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Biosecurity Observations & Official Notes *
                </label>
                <textarea
                  rows={3}
                  required
                  value={hiveVerdictNotes}
                  onChange={(e) => setHiveVerdictNotes(e.target.value)}
                  placeholder="Record colony observations, brood pattern, temperature/humidity compliance..."
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedHiveForHealth(null)}
                  className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingHiveCheck}
                  className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 shadow-md shadow-teal-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {submittingHiveCheck ? 'Submitting Verdict...' : 'Submit Lab Health Verdict → Forward to Admin Stage 2'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
