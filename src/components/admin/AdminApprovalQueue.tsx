import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import {
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  Search,
  Filter,
  ExternalLink,
  MapPin,
  Eye,
  CheckSquare,
  RefreshCw,
  Layers,
  Hexagon,
  FlaskConical,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { db } from '../../firebase/config';
import { handleFirestoreError, OperationType } from '../../firebase/errors';
import { BeekeeperProfile, BeekeeperStatus, HiveRecord, HiveApprovalStage } from '../../types';
import { generateBeekeeperId } from '../../services/idGenerators';
import { logActivity } from '../../services/activityLogger';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { SAMPLE_DATA_MASTER } from '../../services/sampleDataMaster';

export const AdminApprovalQueue: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  // Primary Tab: Beekeepers vs Hives
  const [mainTab, setMainTab] = useState<'beekeepers' | 'hives'>('beekeepers');

  // Beekeepers state
  const [beekeepers, setBeekeepers] = useState<BeekeeperProfile[]>(SAMPLE_DATA_MASTER.beekeepers);
  const [loadingBk, setLoadingBk] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBeekeeper, setSelectedBeekeeper] = useState<BeekeeperProfile | null>(null);
  const [checklist, setChecklist] = useState({
    aadhaarMatched: false,
    madhukrantiValid: false,
    locationVerified: false,
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Hives state
  const [hives, setHives] = useState<HiveRecord[]>(SAMPLE_DATA_MASTER.hives);
  const [loadingHives, setLoadingHives] = useState(false);
  const [hiveFilterStage, setHiveFilterStage] = useState<string>('pending_all');
  const [hiveSearchTerm, setHiveSearchTerm] = useState('');
  const [selectedHive, setSelectedHive] = useState<HiveRecord | null>(null);
  const [hiveRejectionReason, setHiveRejectionReason] = useState('');
  const [showHiveRejectModal, setShowHiveRejectModal] = useState(false);
  const [isHiveProcessing, setIsHiveProcessing] = useState(false);
  const [hiveActionError, setHiveActionError] = useState<string | null>(null);

  // Real-time Beekeepers listener
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'beekeepers'),
      (snapshot) => {
        const liveList: BeekeeperProfile[] = [];
        snapshot.forEach((d) => {
          liveList.push(d.data() as BeekeeperProfile);
        });

        const liveIds = new Set(liveList.map((b) => b.id));
        const combined = [
          ...liveList,
          ...SAMPLE_DATA_MASTER.beekeepers.filter((b) => !liveIds.has(b.id)),
        ];

        combined.sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (b.status === 'pending' && a.status !== 'pending') return 1;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

        setBeekeepers(combined);
        setLoadingBk(false);
      },
      (err) => {
        console.warn('AdminApprovalQueue beekeepers notice:', err);
        setLoadingBk(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time Hives listener
  useEffect(() => {
    const unsubHives = onSnapshot(
      collection(db, 'hives'),
      (snapshot) => {
        const liveList: HiveRecord[] = [];
        snapshot.forEach((d) => {
          liveList.push(d.data() as HiveRecord);
        });

        const liveIds = new Set(liveList.map((h) => h.id || h.hiveId));
        const combined = [
          ...liveList,
          ...SAMPLE_DATA_MASTER.hives.filter((h) => !liveIds.has(h.id || h.hiveId)),
        ];

        // Sort: pending review first, then by date
        combined.sort((a, b) => {
          const aPending = a.approvalStage === 'STAGE_1_ADMIN_REVIEW' || a.approvalStage === 'STAGE_3_ADMIN_FINAL';
          const bPending = b.approvalStage === 'STAGE_1_ADMIN_REVIEW' || b.approvalStage === 'STAGE_3_ADMIN_FINAL';
          if (aPending && !bPending) return -1;
          if (!aPending && bPending) return 1;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

        setHives(combined);
        setLoadingHives(false);
      },
      (err) => {
        console.warn('AdminApprovalQueue hives notice:', err);
        setLoadingHives(false);
      }
    );

    return () => unsubHives();
  }, []);

  // ===================== BEEKEEPER HANDLERS =====================
  const openInspection = (bk: BeekeeperProfile) => {
    setSelectedBeekeeper(bk);
    setChecklist({
      aadhaarMatched: false,
      madhukrantiValid: false,
      locationVerified: false,
    });
    setRejectionReason('');
    setActionError(null);
    setShowRejectModal(false);
  };

  const handleApprove = async () => {
    if (!selectedBeekeeper || !currentUser) return;
    setIsProcessing(true);
    setActionError(null);

    try {
      const { beekeeperId, seq } = await generateBeekeeperId();
      const nowIso = new Date().toISOString();

      const bkRef = doc(db, 'beekeepers', selectedBeekeeper.id);
      await updateDoc(bkRef, {
        status: 'approved',
        beekeeperId,
        beekeeperSeq: seq,
        approvedBy: currentUser.uid,
        approvedAt: nowIso,
        updatedAt: nowIso,
      });

      if (selectedBeekeeper.userId) {
        try {
          const userRef = doc(db, 'users', selectedBeekeeper.userId);
          await updateDoc(userRef, {
            beekeeperId,
            role: 'BEEKEEPER',
            updatedAt: nowIso,
          });
        } catch (uErr) {
          console.warn('User doc update notice:', uErr);
        }

        try {
          const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await setDoc(doc(db, 'notifications', notifId), {
            id: notifId,
            userId: selectedBeekeeper.userId,
            title: '🎉 Apiary Registration Approved!',
            message: `Your Honey Chain Beekeeper credentials have been approved by the Administrator. Your Official Beekeeper ID is ${beekeeperId}. You can now register hives and log honey harvests.`,
            type: 'SUCCESS',
            read: false,
            createdAt: nowIso,
          });
        } catch {}
      }

      await logActivity({
        action: 'BEEKEEPER_APPROVED',
        entityType: 'BEEKEEPER',
        entityId: selectedBeekeeper.id,
        details: `Approved beekeeper ${selectedBeekeeper.name} with new assigned ID: ${beekeeperId}`,
        actorRole: 'ADMIN',
      });

      setSelectedBeekeeper(null);
    } catch (err: unknown) {
      console.error('Approve failed:', err);
      setActionError(err instanceof Error ? err.message : 'Approval failed. Check database permissions.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedBeekeeper || !currentUser) return;
    if (!rejectionReason.trim()) {
      setActionError('Please enter a rejection reason.');
      return;
    }

    setIsProcessing(true);
    setActionError(null);

    try {
      const nowIso = new Date().toISOString();
      const bkRef = doc(db, 'beekeepers', selectedBeekeeper.id);
      await updateDoc(bkRef, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
        updatedAt: nowIso,
      });

      if (selectedBeekeeper.userId) {
        try {
          const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await setDoc(doc(db, 'notifications', notifId), {
            id: notifId,
            userId: selectedBeekeeper.userId,
            title: '⚠️ Apiary Registration Status Update',
            message: `Your registration could not be verified at this time. Reason: ${rejectionReason.trim()}`,
            type: 'ALERT',
            read: false,
            createdAt: nowIso,
          });
        } catch {}
      }

      await logActivity({
        action: 'BEEKEEPER_REJECTED',
        entityType: 'BEEKEEPER',
        entityId: selectedBeekeeper.id,
        details: `Rejected beekeeper ${selectedBeekeeper.name}. Reason: ${rejectionReason.trim()}`,
        actorRole: 'ADMIN',
      });

      setSelectedBeekeeper(null);
      setShowRejectModal(false);
    } catch (err: unknown) {
      console.error('Reject failed:', err);
      setActionError(err instanceof Error ? err.message : 'Rejection failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ===================== HIVE HANDLERS (STAGE 1 & STAGE 2) =====================
  const openHiveInspection = (hive: HiveRecord) => {
    setSelectedHive(hive);
    setHiveRejectionReason('');
    setHiveActionError(null);
    setShowHiveRejectModal(false);
  };

  // Stage 1: Admin accepts hive -> forwards to Accredited Lab for health verification
  const handleHiveStage1Accept = async () => {
    if (!selectedHive || !currentUser) return;
    setIsHiveProcessing(true);
    setHiveActionError(null);

    try {
      const nowIso = new Date().toISOString();
      const hiveRef = doc(db, 'hives', selectedHive.id);

      await updateDoc(hiveRef, {
        approvalStage: 'STAGE_2_LAB_VERIFICATION',
        approvalStatus: 'pending',
        adminStage1ApprovedBy: currentUser.uid,
        adminStage1ApprovedAt: nowIso,
        updatedAt: nowIso,
      });

      // Notify Beekeeper
      try {
        const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          userId: selectedHive.beekeeperId,
          title: '✅ Hive Stage 1 Approved — Sent to Lab',
          message: `Hive ${selectedHive.hiveId} has passed Stage 1 Admin Review! It has been forwarded to the Accredited Testing Laboratory for colony health & biosecurity verification.`,
          type: 'INFO',
          read: false,
          createdAt: nowIso,
        });
      } catch {}

      await logActivity({
        action: 'HIVE_STAGE_1_APPROVED',
        entityType: 'HIVE',
        entityId: selectedHive.hiveId,
        details: `Admin approved Stage 1 for Hive ${selectedHive.hiveId}. Forwarded to Accredited Lab for biosecurity check.`,
        actorRole: 'ADMIN',
      });

      setSelectedHive(null);
    } catch (err: unknown) {
      console.error('Stage 1 accept failed:', err);
      setHiveActionError(err instanceof Error ? err.message : 'Operation failed.');
    } finally {
      setIsHiveProcessing(false);
    }
  };

  // Stage 2: Admin gives FINAL APPROVAL after Lab Verdict -> Hive becomes ACTIVE
  const handleHiveFinalApprove = async () => {
    if (!selectedHive || !currentUser) return;
    setIsHiveProcessing(true);
    setHiveActionError(null);

    try {
      const nowIso = new Date().toISOString();
      const hiveRef = doc(db, 'hives', selectedHive.id);

      await updateDoc(hiveRef, {
        status: 'active',
        approvalStatus: 'approved',
        approvalStage: 'COMPLETED',
        finalApprovedBy: currentUser.uid,
        finalApprovedAt: nowIso,
        updatedAt: nowIso,
      });

      // Notify Beekeeper
      try {
        const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          userId: selectedHive.beekeeperId,
          title: '🎉 Hive Live & Certified Active!',
          message: `Congratulations! Your Hive ${selectedHive.hiveId} has received final Admin certification following Accredited Lab health check. The hive is now LIVE — you can pair IoT telemetry hardware and log honey harvests.`,
          type: 'SUCCESS',
          read: false,
          createdAt: nowIso,
        });
      } catch {}

      await logActivity({
        action: 'HIVE_FINAL_APPROVED_ACTIVATED',
        entityType: 'HIVE',
        entityId: selectedHive.hiveId,
        details: `Admin gave final approval for Hive ${selectedHive.hiveId} (Lab Verdict: ${selectedHive.labVerdict || 'HEALTHY'}). Hive is now ACTIVE.`,
        actorRole: 'ADMIN',
      });

      setSelectedHive(null);
    } catch (err: unknown) {
      console.error('Final approve failed:', err);
      setHiveActionError(err instanceof Error ? err.message : 'Operation failed.');
    } finally {
      setIsHiveProcessing(false);
    }
  };

  // Reject Hive (Can happen at Stage 1 or Stage 2 Final)
  const handleHiveReject = async (stage: 'STAGE_1_ADMIN' | 'STAGE_2_ADMIN_FINAL') => {
    if (!selectedHive || !currentUser) return;
    if (!hiveRejectionReason.trim()) {
      setHiveActionError('Please provide a specific rejection reason.');
      return;
    }

    setIsHiveProcessing(true);
    setHiveActionError(null);

    try {
      const nowIso = new Date().toISOString();
      const hiveRef = doc(db, 'hives', selectedHive.id);

      await updateDoc(hiveRef, {
        status: 'inactive',
        approvalStatus: 'rejected',
        approvalStage: 'REJECTED',
        rejectionStage: stage,
        rejectionReason: hiveRejectionReason.trim(),
        rejectedBy: currentUser.uid,
        rejectedAt: nowIso,
        updatedAt: nowIso,
      });

      // Notify Beekeeper
      try {
        const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          userId: selectedHive.beekeeperId,
          title: '❌ Hive Registration Rejected',
          message: `Hive ${selectedHive.hiveId} was rejected during ${stage === 'STAGE_1_ADMIN' ? 'Stage 1 Admin Review' : 'Stage 2 Final Admin Review'}. Reason: ${hiveRejectionReason.trim()}`,
          type: 'ALERT',
          read: false,
          createdAt: nowIso,
        });
      } catch {}

      await logActivity({
        action: 'HIVE_REJECTED',
        entityType: 'HIVE',
        entityId: selectedHive.hiveId,
        details: `Hive ${selectedHive.hiveId} rejected during ${stage}. Reason: ${hiveRejectionReason.trim()}`,
        actorRole: 'ADMIN',
      });

      setSelectedHive(null);
      setShowHiveRejectModal(false);
    } catch (err: unknown) {
      console.error('Hive rejection failed:', err);
      setHiveActionError(err instanceof Error ? err.message : 'Rejection failed.');
    } finally {
      setIsHiveProcessing(false);
    }
  };

  // ===================== FILTERS & COUNTS =====================
  const pendingBeekeepersCount = beekeepers.filter((b) => b.status === 'pending').length;

  const stage1Hives = hives.filter(
    (h) => h.approvalStage === 'STAGE_1_ADMIN_REVIEW' || (!h.approvalStage && h.approvalStatus === 'pending')
  );
  const stage2LabPendingHives = hives.filter((h) => h.approvalStage === 'STAGE_2_LAB_VERIFICATION');
  const stage2FinalHives = hives.filter((h) => h.approvalStage === 'STAGE_3_ADMIN_FINAL');
  const pendingHivesCount = stage1Hives.length + stage2FinalHives.length;

  // Filtered Beekeepers
  const filteredBeekeepers = beekeepers.filter((b) => {
    const matchesFilter = filterStatus === 'all' || b.status === filterStatus;
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      (b.name || '').toLowerCase().includes(s) ||
      (b.madhukrantiId || '').toLowerCase().includes(s) ||
      (b.state || '').toLowerCase().includes(s) ||
      (b.beekeeperId || '').toLowerCase().includes(s);
    return matchesFilter && matchesSearch;
  });

  // Filtered Hives
  const filteredHives = hives.filter((h) => {
    let matchesStage = true;
    if (hiveFilterStage === 'pending_all') {
      matchesStage =
        h.approvalStage === 'STAGE_1_ADMIN_REVIEW' ||
        h.approvalStage === 'STAGE_3_ADMIN_FINAL' ||
        (!h.approvalStage && h.approvalStatus === 'pending');
    } else if (hiveFilterStage === 'STAGE_1_ADMIN_REVIEW') {
      matchesStage = h.approvalStage === 'STAGE_1_ADMIN_REVIEW' || (!h.approvalStage && h.approvalStatus === 'pending');
    } else if (hiveFilterStage === 'STAGE_2_LAB_VERIFICATION') {
      matchesStage = h.approvalStage === 'STAGE_2_LAB_VERIFICATION';
    } else if (hiveFilterStage === 'STAGE_3_ADMIN_FINAL') {
      matchesStage = h.approvalStage === 'STAGE_3_ADMIN_FINAL';
    } else if (hiveFilterStage === 'active') {
      matchesStage = h.status === 'active' && h.approvalStatus !== 'rejected';
    } else if (hiveFilterStage === 'rejected') {
      matchesStage = h.approvalStatus === 'rejected';
    }

    const s = hiveSearchTerm.toLowerCase();
    const matchesSearch =
      (h.hiveId || '').toLowerCase().includes(s) ||
      (h.beekeeperId || '').toLowerCase().includes(s) ||
      (h.colonyType || '').toLowerCase().includes(s) ||
      (h.area || '').toLowerCase().includes(s);

    return matchesStage && matchesSearch;
  });

  const allChecklistPassed =
    checklist.aadhaarMatched && checklist.madhukrantiValid && checklist.locationVerified;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            Verification & Approval Queue
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            2-Stage verification workflow for beekeeper registrations and live hive activations.
          </p>
        </div>

        {/* Primary Queue Selector Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setMainTab('beekeepers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              mainTab === 'beekeepers'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Beekeepers</span>
            {pendingBeekeepersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-slate-950 text-amber-400">
                {pendingBeekeepersCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMainTab('hives')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              mainTab === 'hives'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Hexagon className="w-4 h-4" />
            <span>Hives (2-Stage)</span>
            {pendingHivesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-slate-950 text-amber-400">
                {pendingHivesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* VIEW 1: BEEKEEPER APPROVAL QUEUE                               */}
      {/* ============================================================== */}
      {mainTab === 'beekeepers' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, state, ID, or Madhukranti number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Review ({pendingBeekeepersCount})</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Madhukranti ID</th>
                    <th className="py-3 px-4">Aadhaar (Last 4)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBeekeepers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No beekeepers matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredBeekeepers.map((bk) => (
                      <tr key={bk.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{bk.name}</div>
                          <div className="text-[11px] text-slate-500">{bk.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-900 dark:text-slate-200">{bk.district}, {bk.state}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            GPS: {bk.lat?.toFixed(2)}, {bk.lng?.toFixed(2)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {bk.madhukrantiId || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                          •••• {bk.aadhaarLast4}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              bk.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : bk.status === 'pending'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : bk.status === 'rejected'
                                ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {bk.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => openInspection(bk)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 dark:hover:bg-amber-500 dark:hover:text-slate-950 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{bk.status === 'pending' ? 'Review Application' : 'Inspect'}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: HIVE 2-STAGE APPROVAL WORKFLOW                         */}
      {/* ============================================================== */}
      {mainTab === 'hives' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Sub-tabs / Pipeline Filter */}
          <div className="flex flex-wrap items-center gap-2 pb-1">
            <button
              type="button"
              onClick={() => setHiveFilterStage('pending_all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                hiveFilterStage === 'pending_all'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              Action Required ({pendingHivesCount})
            </button>

            <button
              type="button"
              onClick={() => setHiveFilterStage('STAGE_1_ADMIN_REVIEW')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                hiveFilterStage === 'STAGE_1_ADMIN_REVIEW'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Stage 1: Initial Review ({stage1Hives.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setHiveFilterStage('STAGE_2_LAB_VERIFICATION')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                hiveFilterStage === 'STAGE_2_LAB_VERIFICATION'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Stage 2: At Lab ({stage2LabPendingHives.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setHiveFilterStage('STAGE_3_ADMIN_FINAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                hiveFilterStage === 'STAGE_3_ADMIN_FINAL'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>Stage 2 Final Decision ({stage2FinalHives.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setHiveFilterStage('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                hiveFilterStage === 'active'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              Active Hives
            </button>

            <button
              type="button"
              onClick={() => setHiveFilterStage('rejected')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                hiveFilterStage === 'rejected'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              Rejected
            </button>
          </div>

          {/* Search */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Hive ID, Beekeeper ID, species, area..."
                value={hiveSearchTerm}
                onChange={(e) => setHiveSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Hives Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHives.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                No hives matching the selected pipeline filter.
              </div>
            ) : (
              filteredHives.map((hive) => {
                const isStage1 =
                  hive.approvalStage === 'STAGE_1_ADMIN_REVIEW' ||
                  (!hive.approvalStage && hive.approvalStatus === 'pending');
                const isStage2Lab = hive.approvalStage === 'STAGE_2_LAB_VERIFICATION';
                const isStage2Final = hive.approvalStage === 'STAGE_3_ADMIN_FINAL';
                const isActive = hive.status === 'active' && hive.approvalStatus !== 'rejected';
                const isRejected = hive.approvalStatus === 'rejected';

                return (
                  <div
                    key={hive.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Top Bar */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-base font-black text-amber-600 dark:text-amber-400">
                          {hive.hiveId}
                        </span>

                        {isStage1 && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Stage 1: Admin Review
                          </span>
                        )}

                        {isStage2Lab && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            Stage 2: At Lab
                          </span>
                        )}

                        {isStage2Final && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                            Stage 2 Final: Admin
                          </span>
                        )}

                        {isActive && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/30">
                            Active
                          </span>
                        )}

                        {isRejected && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-500/30">
                            Rejected
                          </span>
                        )}
                      </div>

                      {/* Colony & Beekeeper Info */}
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                          {hive.colonyType}
                        </h4>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-500" />
                          <span>{hive.area} ({hive.landType || 'Farmland'})</span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                          Beekeeper: <strong className="text-amber-600 dark:text-amber-400">{hive.beekeeperId}</strong>
                        </div>
                      </div>

                      {/* Stage 2 Lab Health Result Banner (if submitted) */}
                      {isStage2Final && (
                        <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-500/30 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-purple-900 dark:text-purple-200 text-[11px] uppercase tracking-wide">
                              Lab Health Verdict
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                hive.labVerdict === 'HEALTHY'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              }`}
                            >
                              {hive.labVerdict || 'HEALTHY'}
                            </span>
                          </div>
                          {hive.labVerdictNotes && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                              "{hive.labVerdictNotes}"
                            </p>
                          )}
                          <div className="text-[10px] text-slate-400">
                            Verified by: {hive.labVerifiedBy || 'Accredited Lab Inspector'}
                          </div>
                        </div>
                      )}

                      {/* Rejection Notice */}
                      {isRejected && (
                        <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-[11px] text-red-700 dark:text-red-300 border border-red-500/20">
                          <span className="font-bold block">Rejection Reason:</span>
                          <span>{hive.rejectionReason || 'Verification requirements not fulfilled.'}</span>
                        </div>
                      )}

                      <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span>Setup: {hive.setupDate || 'Recent'}</span>
                        <span>Est: {hive.expectedProduction || 15} kg</span>
                      </div>
                    </div>

                    {/* Action Buttons based on stage */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                      {isStage1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedHive(hive);
                              setShowHiveRejectModal(true);
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => openHiveInspection(hive)}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>Stage 1 Review</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {isStage2Lab && (
                        <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 py-1">
                          <FlaskConical className="w-3.5 h-3.5" />
                          <span>Awaiting Lab Health Verdict</span>
                        </div>
                      )}

                      {isStage2Final && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedHive(hive);
                              setShowHiveRejectModal(true);
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => openHiveInspection(hive)}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>Final Decision</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {(isActive || isRejected) && (
                        <button
                          type="button"
                          onClick={() => openHiveInspection(hive)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
                        >
                          Inspect Record
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: BEEKEEPER INSPECTION & APPROVAL                       */}
      {/* ============================================================== */}
      {selectedBeekeeper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/30 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-amber-400">
                  Beekeeper Application Audit
                </h3>
                <p className="text-xs text-slate-400">
                  Government & Madhukranti portal verification
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBeekeeper(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {actionError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-300">
                  {actionError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Applicant Name</span>
                  <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{selectedBeekeeper.name}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Contact Email</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedBeekeeper.email}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Madhukranti Portal ID</span>
                  <div className="font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {selectedBeekeeper.madhukrantiId || 'Pending'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Aadhaar Last 4</span>
                  <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    •••• •••• {selectedBeekeeper.aadhaarLast4}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">State & District</span>
                  <div className="text-slate-900 dark:text-white mt-0.5">{selectedBeekeeper.district}, {selectedBeekeeper.state}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Planned Hives</span>
                  <div className="text-slate-900 dark:text-white mt-0.5">{selectedBeekeeper.totalHivesPlanned || 10} boxes</div>
                </div>
              </div>

              {/* Verification Checklist */}
              <div className="space-y-2 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <h4 className="font-bold text-amber-900 dark:text-amber-300 text-xs">
                  Required Admin Audit Verification:
                </h4>
                <label className="flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={checklist.aadhaarMatched}
                    onChange={(e) => setChecklist({ ...checklist, aadhaarMatched: e.target.checked })}
                    className="rounded text-amber-500"
                  />
                  <span>Last 4 digits of Aadhaar verified against Govt Identity Proof</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={checklist.madhukrantiValid}
                    onChange={(e) => setChecklist({ ...checklist, madhukrantiValid: e.target.checked })}
                    className="rounded text-amber-500"
                  />
                  <span>National Honey Board / Madhukranti API registration status confirmed</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={checklist.locationVerified}
                    onChange={(e) => setChecklist({ ...checklist, locationVerified: e.target.checked })}
                    className="rounded text-amber-500"
                  />
                  <span>Apiary coordinates match agricultural foraging cluster</span>
                </label>
              </div>

              {showRejectModal && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-500/30 space-y-2">
                  <label className="block font-bold text-red-700 dark:text-red-300">
                    Rejection Reason:
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection to notify beekeeper..."
                    className="w-full p-2.5 rounded-xl border border-red-300 dark:border-red-900 bg-white dark:bg-slate-900 text-xs"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectModal(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={isProcessing || !rejectionReason.trim()}
                      className="px-4 py-1.5 rounded-lg bg-red-600 text-white font-bold disabled:opacity-50 cursor-pointer"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-700 dark:text-red-300 font-semibold text-xs transition cursor-pointer"
              >
                Reject Application
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={isProcessing || !allChecklistPassed || selectedBeekeeper.status === 'approved'}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-40 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating Atomic ID...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Approve & Issue Beekeeper ID
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: HIVE INSPECTION & APPROVAL (STAGE 1 & STAGE 2 FINAL)  */}
      {/* ============================================================== */}
      {selectedHive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/30 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                  <Hexagon className="w-4 h-4" />
                  <span>Hive Review: {selectedHive.hiveId}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedHive.approvalStage === 'STAGE_3_ADMIN_FINAL'
                    ? 'Stage 2 Final Decision (Lab Verdict attached)'
                    : 'Stage 1 Admin Documentation & Apiary Review'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHive(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {hiveActionError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-300">
                  {hiveActionError}
                </div>
              )}

              {/* Hive Photo if present */}
              {selectedHive.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-48">
                  <img
                    src={selectedHive.imageUrl}
                    alt="Apiary box"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Hive ID</span>
                  <div className="font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">{selectedHive.hiveId}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Beekeeper ID</span>
                  <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{selectedHive.beekeeperId}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Species / Colony</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedHive.colonyType}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Hive Architecture</span>
                  <div className="text-slate-900 dark:text-white mt-0.5">{selectedHive.hiveType}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Flora & Land Type</span>
                  <div className="text-slate-900 dark:text-white mt-0.5">{selectedHive.area} ({selectedHive.landType})</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Expected Yield</span>
                  <div className="text-slate-900 dark:text-white mt-0.5">{selectedHive.expectedProduction} kg / cycle</div>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Apiary GPS & Address</span>
                  <div className="text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{selectedHive.address} (GPS: {selectedHive.lat?.toFixed(4)}, {selectedHive.lng?.toFixed(4)})</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Registration Date</span>
                  <div className="text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedHive.registrationDate ? new Date(selectedHive.registrationDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>

              {/* STAGE 2 LAB VERDICT CARD (Visible for final approval) */}
              {selectedHive.approvalStage === 'STAGE_3_ADMIN_FINAL' && (
                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="font-bold text-purple-900 dark:text-purple-200 text-sm">
                        Accredited Laboratory Health Inspection Result
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        selectedHive.labVerdict === 'HEALTHY'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-500/30'
                      }`}
                    >
                      {selectedHive.labVerdict === 'HEALTHY' ? '✓ HEALTHY COLONY' : '⚠ UNHEALTHY / FLAGGED'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/50 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Inspector Observations:</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      "{selectedHive.labVerdictNotes || 'Colony health evaluated according to NABL apiary biosecurity guidelines.'}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-purple-700 dark:text-purple-300 pt-1">
                    <span>Inspector: {selectedHive.labVerifiedBy || 'Accredited Entomologist'}</span>
                    <span>Date: {selectedHive.labVerifiedAt ? new Date(selectedHive.labVerifiedAt).toLocaleString() : 'Recent'}</span>
                  </div>
                </div>
              )}

              {/* Rejection input box */}
              {showHiveRejectModal && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-500/30 space-y-2">
                  <label className="block font-bold text-red-700 dark:text-red-300">
                    Specify Rejection Reason:
                  </label>
                  <textarea
                    rows={2}
                    value={hiveRejectionReason}
                    onChange={(e) => setHiveRejectionReason(e.target.value)}
                    placeholder="e.g. Flora radius does not meet organic honey thresholds or hive box specifications are incomplete..."
                    className="w-full p-2.5 rounded-xl border border-red-300 dark:border-red-900 bg-white dark:bg-slate-900 text-xs"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowHiveRejectModal(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleHiveReject(
                          selectedHive.approvalStage === 'STAGE_3_ADMIN_FINAL'
                            ? 'STAGE_2_ADMIN_FINAL'
                            : 'STAGE_1_ADMIN'
                        )
                      }
                      disabled={isHiveProcessing || !hiveRejectionReason.trim()}
                      className="px-4 py-1.5 rounded-lg bg-red-600 text-white font-bold disabled:opacity-50 cursor-pointer"
                    >
                      Confirm Hive Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowHiveRejectModal(true)}
                disabled={isHiveProcessing}
                className="px-4 py-2 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-700 dark:text-red-300 font-semibold text-xs transition cursor-pointer"
              >
                Reject Hive
              </button>

              {/* Stage 1 action: Accept & Forward to Lab */}
              {(selectedHive.approvalStage === 'STAGE_1_ADMIN_REVIEW' ||
                (!selectedHive.approvalStage && selectedHive.approvalStatus === 'pending')) && (
                <button
                  type="button"
                  onClick={handleHiveStage1Accept}
                  disabled={isHiveProcessing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-40 cursor-pointer"
                >
                  {isHiveProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Forwarding...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Accept & Forward to Accredited Lab (Stage 1)
                    </>
                  )}
                </button>
              )}

              {/* Stage 2 Final action: Final Live Activation */}
              {selectedHive.approvalStage === 'STAGE_3_ADMIN_FINAL' && (
                <button
                  type="button"
                  onClick={handleHiveFinalApprove}
                  disabled={isHiveProcessing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition disabled:opacity-40 cursor-pointer"
                >
                  {isHiveProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Activating Hive...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Final Approve & Activate Hive (Live)
                    </>
                  )}
                </button>
              )}

              {(selectedHive.status === 'active' || selectedHive.approvalStatus === 'rejected') && (
                <button
                  type="button"
                  onClick={() => setSelectedHive(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
