import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Send,
  Package,
  FileText,
  Clock,
  Layers,
  FlaskConical,
  Scale,
  MapPin,
  ExternalLink,
  Printer,
  FileCheck,
} from 'lucide-react';
import { doc, updateDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { BatchRecord, LabProfile, LabSample, HoneyPack } from '../../types';
import { generateLabSampleId, generatePackIds } from '../../services/idGenerators';
import { recordLedgerBlock } from '../../services/blockchainService';
import { logActivity } from '../../services/activityLogger';
import { generatePackQRPdf } from '../../services/pdfService';

interface BatchDetailModalProps {
  batch: BatchRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onBatchUpdated?: (updated: BatchRecord) => void;
}

export const BatchDetailModal: React.FC<BatchDetailModalProps> = ({
  batch,
  isOpen,
  onClose,
  onBatchUpdated,
}) => {
  const [currentBatch, setCurrentBatch] = useState<BatchRecord | null>(batch);
  const [labs, setLabs] = useState<LabProfile[]>([]);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  // Sample Dispatch Form
  const [showDispatchModal, setShowDispatchModal] = useState<boolean>(false);
  const [selectedLabId, setSelectedLabId] = useState<string>('');
  const [courierTracking, setCourierTracking] = useState<string>('');

  // Packaging Form
  const [showPackagingModal, setShowPackagingModal] = useState<boolean>(false);
  const [jarSize, setJarSize] = useState<number>(500);
  const [packCount, setPackCount] = useState<number>(20);

  useEffect(() => {
    setCurrentBatch(batch);
  }, [batch]);

  // Fetch registered labs
  useEffect(() => {
    if (!isOpen) return;
    const fetchLabs = async () => {
      try {
        const snap = await getDocs(collection(db, 'labs'));
        const list = snap.docs.map((d) => d.data() as LabProfile);
        setLabs(list);
        if (list.length > 0 && !selectedLabId) {
          setSelectedLabId(list[0].id);
        }
      } catch (err) {
        console.error('Error fetching labs:', err);
      }
    };
    fetchLabs();
  }, [isOpen]);

  if (!isOpen || !currentBatch) return null;

  // 1. Run Verification Gate
  const handleRunVerificationGate = async () => {
    setLoadingAction(true);
    setActionError('');
    setActionSuccess('');

    try {
      const response = await fetch('/api/batches/verify-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: currentBatch.batchId,
          hiveIds: currentBatch.hiveIds,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Verification check failed');
      }

      const now = new Date().toISOString();
      const updatedStatus = result.passed ? 'verified' : 'verification_failed';

      const verificationDetails = {
        verifiedAt: now,
        verifiedBy: 'Admin Verification Gate',
        passed: result.passed,
        summary: result.summary,
        hiveEvaluations: result.hiveEvaluations,
      };

      await updateDoc(doc(db, 'batches', currentBatch.batchId), {
        status: updatedStatus,
        verificationDetails,
        updatedAt: now,
      });

      let ledgerBlock;
      if (result.passed) {
        ledgerBlock = await recordLedgerBlock('BATCH_VERIFIED', currentBatch.batchId, {
          batchId: currentBatch.batchId,
          hiveCount: currentBatch.hiveIds.length,
          verifiedAt: now,
          passed: true,
        });

        await logActivity({
          actorRole: 'ADMIN',
          action: 'VERIFY_BATCH',
          entityType: 'BATCH',
          entityId: currentBatch.batchId,
          details: `Batch ${currentBatch.batchId} passed IoT verification gate across all ${currentBatch.hiveIds.length} hives. Anchored to ledger.`,
        });
      }

      const updated = {
        ...currentBatch,
        status: updatedStatus,
        verificationDetails,
        ledgerBlockIndex: ledgerBlock?.index,
        ledgerHash: ledgerBlock?.currentHash,
        updatedAt: now,
      } as BatchRecord;

      setCurrentBatch(updated);
      if (onBatchUpdated) onBatchUpdated(updated);

      if (result.passed) {
        setActionSuccess('Verification Gate PASSED! Batch is cryptographically certified for lab dispatch.');
      } else {
        setActionError('Verification Gate BLOCKED. Inspect failing hives below.');
      }
    } catch (err) {
      console.error('Gate error:', err);
      setActionError(`Verification error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // 2. Dispatch Sample to Lab
  const handleDispatchSample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLabId) {
      setActionError('Please select an accredited laboratory.');
      return;
    }

    setLoadingAction(true);
    setActionError('');

    try {
      const chosenLab = labs.find((l) => l.id === selectedLabId) || labs[0];
      const { sampleId } = await generateLabSampleId();
      const now = new Date().toISOString();

      const sampleDoc: LabSample = {
        id: sampleId,
        sampleId,
        batchId: currentBatch.batchId,
        beekeeperId: currentBatch.beekeeperIds[0] || 'various',
        labId: chosenLab.id,
        labName: chosenLab.labName,
        floralSource: currentBatch.floralSource,
        quantityMl: 250,
        dispatchedAt: now,
        courierTracking: courierTracking || `IND-POST-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'dispatched',
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'labSamples', sampleId), sampleDoc);

      await updateDoc(doc(db, 'batches', currentBatch.batchId), {
        status: 'sample_sent',
        sampleId,
        labId: chosenLab.id,
        labName: chosenLab.labName,
        updatedAt: now,
      });

      await logActivity({
        actorRole: 'ADMIN',
        action: 'DISPATCH_LAB_SAMPLE',
        entityType: 'LAB_SAMPLE',
        entityId: sampleId,
        details: `Dispatched 250ml sample ${sampleId} for batch ${currentBatch.batchId} to ${chosenLab.labName}`,
      });

      const updated = {
        ...currentBatch,
        status: 'sample_sent',
        sampleId,
        labId: chosenLab.id,
        labName: chosenLab.labName,
        updatedAt: now,
      } as BatchRecord;

      setCurrentBatch(updated);
      if (onBatchUpdated) onBatchUpdated(updated);
      setShowDispatchModal(false);
      setActionSuccess(`Sample ${sampleId} dispatched to ${chosenLab.labName}!`);
    } catch (err) {
      console.error('Dispatch error:', err);
      setActionError(`Failed to dispatch sample: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // 3. Package Batch into Jars
  const handlePackageBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (packCount <= 0 || jarSize <= 0) {
      setActionError('Pack count and jar size must be greater than zero.');
      return;
    }

    setLoadingAction(true);
    setActionError('');

    try {
      // Generate bulk pack IDs
      const packIds = await generatePackIds(currentBatch.batchId, packCount);
      const now = new Date().toISOString();

      const createdPacks: HoneyPack[] = [];

      for (const pId of packIds) {
        const packDoc: HoneyPack = {
          id: pId,
          packId: pId,
          batchId: currentBatch.batchId,
          hiveIds: currentBatch.hiveIds,
          beekeeperId: currentBatch.beekeeperIds[0] || 'various',
          floralSource: currentBatch.floralSource,
          jarSizeGrams: jarSize,
          packagingDate: now,
          labReportId: currentBatch.labReportId,
          labVerdict: currentBatch.labVerdict || 'PURE',
          reportHash: currentBatch.reportHash,
          status: 'packaged',
          createdAt: now,
        };
        await setDoc(doc(db, 'packages', pId), packDoc);
        createdPacks.push(packDoc);
      }

      // Record Packaging in Ledger
      const ledgerBlock = await recordLedgerBlock('PACKAGING_COMPLETED', currentBatch.batchId, {
        batchId: currentBatch.batchId,
        packCount,
        jarSizeGrams: jarSize,
        startPackId: packIds[0],
        endPackId: packIds[packIds.length - 1],
      });

      // Update Batch
      const packagingDetails = {
        jarSizeGrams: jarSize,
        packCount,
        packagedAt: now,
        packIds,
      };

      await updateDoc(doc(db, 'batches', currentBatch.batchId), {
        status: 'packaged',
        packagingDetails,
        updatedAt: now,
      });

      await logActivity({
        actorRole: 'ADMIN',
        action: 'PACKAGE_BATCH',
        entityType: 'PACK',
        entityId: currentBatch.batchId,
        details: `Packaged ${packCount} units of ${jarSize}g jars for batch ${currentBatch.batchId} (${packIds[0]} - ${packIds[packIds.length - 1]})`,
      });

      // Auto-generate Printable PDF Stickers!
      await generatePackQRPdf(currentBatch, createdPacks, jarSize);

      const updated = {
        ...currentBatch,
        status: 'packaged',
        packagingDetails,
        ledgerBlockIndex: ledgerBlock?.index,
        ledgerHash: ledgerBlock?.currentHash,
        updatedAt: now,
      } as BatchRecord;

      setCurrentBatch(updated);
      if (onBatchUpdated) onBatchUpdated(updated);
      setShowPackagingModal(false);
      setActionSuccess(`Successfully packaged ${packCount} jars! Downloaded printable QR stickers PDF.`);
    } catch (err) {
      console.error('Packaging error:', err);
      setActionError(`Packaging failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'created':
        return (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            Batch Created
          </span>
        );
      case 'verified':
        return (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            IoT Verified
          </span>
        );
      case 'verification_failed':
        return (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 dark:bg-red-900/40 dark:text-red-300">
            Verification Blocked
          </span>
        );
      case 'sample_sent':
        return (
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
            Sample in Lab Testing
          </span>
        );
      case 'lab_tested':
        return (
          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
            Lab Certified Pure
          </span>
        );
      case 'packaged':
        return (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            Packaged & QR Tagged
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative my-8 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-start justify-between pr-8">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {currentBatch.batchId}
              </h2>
              {getStatusBadge(currentBatch.status)}
            </div>
            <p className="text-sm text-zinc-500 mt-1">
              Origin: {currentBatch.state} • Variety: {currentBatch.floralSource} Honey • {currentBatch.totalQuantityKg} kg total
            </p>
          </div>
        </div>

        {/* Action Alerts */}
        {actionError && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Batch Status Stepper */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
            Traceability & Verification Pipeline
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                currentBatch.status !== 'created'
                  ? 'border-emerald-300 bg-emerald-50/50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300'
                  : 'border-blue-300 bg-blue-50 text-blue-800'
              }`}
            >
              <Layers className="h-4 w-4 shrink-0" />
              <span>1. Aggregated</span>
            </div>

            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                ['verified', 'sample_sent', 'lab_tested', 'packaged'].includes(currentBatch.status)
                  ? 'border-emerald-300 bg-emerald-50/50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300'
                  : currentBatch.status === 'verification_failed'
                  ? 'border-red-300 bg-red-50 text-red-800'
                  : 'border-zinc-200 bg-white text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900'
              }`}
            >
              <Cpu className="h-4 w-4 shrink-0" />
              <span>2. IoT Gate</span>
            </div>

            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                ['lab_tested', 'packaged'].includes(currentBatch.status)
                  ? 'border-emerald-300 bg-emerald-50/50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300'
                  : currentBatch.status === 'sample_sent'
                  ? 'border-purple-300 bg-purple-50 text-purple-800'
                  : 'border-zinc-200 bg-white text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900'
              }`}
            >
              <FlaskConical className="h-4 w-4 shrink-0" />
              <span>3. Lab Testing</span>
            </div>

            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                currentBatch.status === 'packaged'
                  ? 'border-emerald-300 bg-emerald-50/50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300'
                  : 'border-zinc-200 bg-white text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900'
              }`}
            >
              <Package className="h-4 w-4 shrink-0" />
              <span>4. Packaging</span>
            </div>
          </div>
        </div>

        {/* Gate Actions Container */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Action 1: IoT Gate Verification */}
          {['created', 'verification_failed'].includes(currentBatch.status) && (
            <button
              onClick={handleRunVerificationGate}
              disabled={loadingAction}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50"
            >
              <Cpu className={`h-4 w-4 ${loadingAction ? 'animate-spin' : ''}`} />
              <span>{loadingAction ? 'Verifying Telemetry...' : 'Execute IoT Verification Gate'}</span>
            </button>
          )}

          {/* Action 2: Dispatch Sample */}
          {currentBatch.status === 'verified' && (
            <button
              onClick={() => setShowDispatchModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-600/20 hover:bg-purple-700"
            >
              <Send className="h-4 w-4" />
              <span>Dispatch Honey Sample to Lab</span>
            </button>
          )}

          {/* Action 3: Package Batch */}
          {currentBatch.status === 'lab_tested' && currentBatch.labVerdict === 'PURE' && (
            <button
              onClick={() => setShowPackagingModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600"
            >
              <Package className="h-4 w-4" />
              <span>Package Jars & Generate QR Sheet</span>
            </button>
          )}

          {/* Action 4: Re-print Stickers if already packaged */}
          {currentBatch.status === 'packaged' && currentBatch.packagingDetails && (
            <button
              onClick={async () => {
                // Fetch packs and re-download PDF
                const snap = await getDocs(
                  collection(db, 'packages')
                );
                const packs = snap.docs
                  .map((d) => d.data() as HoneyPack)
                  .filter((p) => p.batchId === currentBatch.batchId);
                await generatePackQRPdf(currentBatch, packs, currentBatch.packagingDetails!.jarSizeGrams);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <Printer className="h-4 w-4" />
              <span>Print Sticker Sheet (PDF)</span>
            </button>
          )}
        </div>

        {/* Verification Evaluation Breakdown */}
        {currentBatch.verificationDetails && (
          <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-blue-500" />
                IoT Verification Gate Results
              </h4>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  currentBatch.verificationDetails.passed
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                }`}
              >
                {currentBatch.verificationDetails.passed ? 'ALL HIVES PASSED' : 'GATE BLOCKED'}
              </span>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {currentBatch.verificationDetails.summary}
            </p>

            <div className="space-y-2 mt-2">
              {currentBatch.verificationDetails.hiveEvaluations.map((hEval) => (
                <div
                  key={hEval.hiveId}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    hEval.passed
                      ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300'
                      : 'border-red-200 bg-red-50/50 text-red-900 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-mono font-bold">
                    {hEval.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <span>{hEval.hiveId}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    {hEval.readingCount > 0 ? (
                      <span className="text-[11px] text-zinc-500">
                        {hEval.readingCount} readings • Avg {hEval.avgTemp}°C / {hEval.avgHumidity}%
                      </span>
                    ) : (
                      <span className="text-[11px] text-red-600 font-semibold">0 Readings</span>
                    )}
                    <span className="font-medium text-right max-w-xs truncate">{hEval.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lab Certification Fingerprint (If Tested) */}
        {currentBatch.labReportId && (
          <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4 dark:border-teal-900/40 dark:bg-teal-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-teal-900 dark:text-teal-200">
                <FileCheck className="h-4 w-4 text-teal-600" />
                <span>Certified Lab Report: {currentBatch.labReportId}</span>
              </div>
              <span className="rounded-md bg-teal-200 px-2 py-0.5 text-xs font-bold text-teal-900">
                {currentBatch.labVerdict} HONEY
              </span>
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              Tested by: <strong className="text-zinc-800 dark:text-zinc-200">{currentBatch.labName}</strong>
            </div>
            {currentBatch.reportHash && (
              <div className="rounded-lg bg-white/80 p-2 font-mono text-[11px] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 break-all border border-teal-100 dark:border-teal-900">
                SHA-256 Hash: {currentBatch.reportHash}
              </div>
            )}
          </div>
        )}

        {/* Source Hives & Harvests summary */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
              Source Hives ({currentBatch.hiveIds.length})
            </div>
            <div className="font-mono text-zinc-600 dark:text-zinc-400 space-y-0.5">
              {currentBatch.hiveIds.map((hid) => (
                <div key={hid}>• {hid}</div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
              Associated Harvests ({currentBatch.harvestIds.length})
            </div>
            <div className="font-mono text-zinc-600 dark:text-zinc-400 space-y-0.5">
              {currentBatch.harvestIds.map((hid) => (
                <div key={hid}>• {hid}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Dispatch Sample Sub-Modal */}
        {showDispatchModal && (
          <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4 dark:border-purple-900 dark:bg-purple-950/30 space-y-4">
            <h4 className="font-bold text-sm text-purple-900 dark:text-purple-200 flex items-center gap-2">
              <Send className="h-4 w-4" />
              Dispatch Honey Sample to Laboratory
            </h4>
            <form onSubmit={handleDispatchSample} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Select Accredited Testing Facility
                </label>
                <select
                  value={selectedLabId}
                  onChange={(e) => setSelectedLabId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  {labs.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.labName} ({l.accreditationNo} • {l.state})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Courier / Consignment Tracking Number
                </label>
                <input
                  type="text"
                  value={courierTracking}
                  onChange={(e) => setCourierTracking(e.target.value)}
                  placeholder="e.g. DTDC-7749210 or SPEEDPOST-IN8829"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="rounded-lg border px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-purple-700"
                >
                  Confirm Dispatch & Generate Sample ID
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Packaging Sub-Modal */}
        {showPackagingModal && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/30 space-y-4">
            <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Package Honey into Retail Jars & Generate Sticker Sheet
            </h4>
            <form onSubmit={handlePackageBatch} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Jar / Pack Size
                  </label>
                  <select
                    value={jarSize}
                    onChange={(e) => setJarSize(parseInt(e.target.value))}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value={250}>250g Jar</option>
                    <option value={500}>500g Jar</option>
                    <option value={1000}>1000g (1 kg) Jar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Number of Packs to Generate
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={packCount}
                    onChange={(e) => setPackCount(parseInt(e.target.value) || 1)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPackagingModal(false)}
                  className="rounded-lg border px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-600 shadow-md shadow-amber-500/20"
                >
                  Generate Bulk Pack IDs & Download Stickers PDF
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
