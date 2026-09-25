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
import { LabProfile, LabSample, LabReport, LabTestParameters, BatchRecord } from '../../types';
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

  // Tab mode: Testing Queue vs Map vs Analytics vs AI Insights vs State/District Search
  const [activeLabTab, setActiveLabTab] = useState<'queue' | 'map' | 'analytics' | 'ai_insights' | 'regional_search'>('queue');

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

  // Acknowledge receipt
  const handleAcknowledgeSample = async (sample: LabSample) => {
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
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeLabTab === 'queue'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Samples Queue ({samples.length})</span>
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
                          <button
                            onClick={() => handleAcknowledgeSample(s)}
                            className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                          >
                            Acknowledge Receipt
                          </button>
                        )}

                        {s.status === 'in_testing' && (
                          <button
                            onClick={() => {
                              setSelectedSample(s);
                              setShowTestModal(true);
                            }}
                            className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 shadow-xs"
                          >
                            Enter Test Results
                          </button>
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
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="rounded-xl border px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTest}
                  className="rounded-xl bg-teal-600 px-5 py-2 text-sm font-bold text-white hover:bg-teal-700 shadow-md shadow-teal-600/20 disabled:opacity-50"
                >
                  {submittingTest ? 'Certifying & Hashing...' : 'Certify Purity & Compute SHA-256 Hash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
