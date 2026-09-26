import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { ShieldCheck, Check, X, AlertTriangle, Search, Filter, ExternalLink, MapPin, Eye, CheckSquare, RefreshCw, Layers } from 'lucide-react';
import { db } from '../../firebase/config';
import { handleFirestoreError, OperationType } from '../../firebase/errors';
import { BeekeeperProfile, BeekeeperStatus } from '../../types';
import { generateBeekeeperId } from '../../services/idGenerators';
import { logActivity } from '../../services/activityLogger';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { SAMPLE_DATA_MASTER } from '../../services/sampleDataMaster';

export const AdminApprovalQueue: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const [beekeepers, setBeekeepers] = useState<BeekeeperProfile[]>(SAMPLE_DATA_MASTER.beekeepers);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Inspection modal / drawer state
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

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'beekeepers'),
      (snapshot) => {
        const liveList: BeekeeperProfile[] = [];
        snapshot.forEach((d) => {
          liveList.push(d.data() as BeekeeperProfile);
        });

        // Merge with master dataset: live Firestore docs take precedence
        const liveIds = new Set(liveList.map((b) => b.id));
        const combined = [
          ...liveList,
          ...SAMPLE_DATA_MASTER.beekeepers.filter((b) => !liveIds.has(b.id)),
        ];

        // Sort: pending first, then by date desc
        combined.sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (b.status === 'pending' && a.status !== 'pending') return 1;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

        setBeekeepers(combined);
        setLoading(false);
      },
      (err) => {
        console.warn('AdminApprovalQueue notice (using master dataset):', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

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
      // 1. Transaction-safe atomic Beekeeper ID generation (e.g. B001, B045)
      const { beekeeperId, seq } = await generateBeekeeperId();
      const nowIso = new Date().toISOString();

      // 2. Update beekeeper profile
      const bkRef = doc(db, 'beekeepers', selectedBeekeeper.id);
      await updateDoc(bkRef, {
        status: 'approved',
        beekeeperId,
        beekeeperSeq: seq,
        approvedBy: currentUser.uid,
        approvedAt: nowIso,
        updatedAt: nowIso,
      });

      // 3. Link beekeeperId to the user record
      if (selectedBeekeeper.userId) {
        try {
          const userRef = doc(db, 'users', selectedBeekeeper.userId);
          await updateDoc(userRef, {
            beekeeperId,
            updatedAt: nowIso,
          });
        } catch (uErr) {
          console.warn('User doc update notice:', uErr);
        }

        // 4. Create in-app notification for Beekeeper
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

      // 5. Record audit activity
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
            title: 'Apiary Registration Rejected',
            message: `Your registration was rejected. Reason: ${rejectionReason.trim()}`,
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

  const handleToggleSuspend = async (bk: BeekeeperProfile) => {
    if (!currentUser) return;
    const nextStatus: BeekeeperStatus = bk.status === 'suspended' ? 'approved' : 'suspended';

    try {
      const bkRef = doc(db, 'beekeepers', bk.id);
      await updateDoc(bkRef, {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });

      await logActivity({
        action: nextStatus === 'suspended' ? 'BEEKEEPER_SUSPENDED' : 'BEEKEEPER_REINSTATED',
        entityType: 'BEEKEEPER',
        entityId: bk.id,
        details: `Beekeeper ${bk.name} (${bk.beekeeperId || bk.id}) marked as ${nextStatus}`,
        actorRole: 'ADMIN',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `beekeepers/${bk.id}`);
    }
  };

  const filtered = beekeepers.filter((b) => {
    const matchesFilter = filterStatus === 'all' || b.status === filterStatus;
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.madhukrantiId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.beekeeperId && b.beekeeperId.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const allChecklistPassed =
    checklist.aadhaarMatched && checklist.madhukrantiValid && checklist.locationVerified;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            {t('admin.queueTitle')}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {t('admin.queueSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold">
            {beekeepers.filter((b) => b.status === 'pending').length} Pending Review
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
            {beekeepers.length} Total
          </span>
        </div>
      </div>

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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
            Loading beekeeper verification records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No beekeeper registrations match your current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Beekeeper / ID</th>
                  <th className="px-4 py-3 font-semibold">Madhukranti Portal ID</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Aadhaar (Last 4)</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filtered.map((bk) => (
                  <tr key={bk.id} className="hover:bg-amber-500/5 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{bk.name}</div>
                      <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
                        {bk.beekeeperId || 'Pending ID generation'}
                      </div>
                      <div className="text-[10px] text-slate-400">{bk.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300 font-medium">
                        {bk.madhukrantiId}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                      <div>{bk.district}, {bk.state}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {bk.lat != null && bk.lng != null ? `${Number(bk.lat).toFixed(4)}, ${Number(bk.lng).toFixed(4)}` : 'Coordinates N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                      •••• •••• {bk.aadhaarLast4}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          bk.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : bk.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : bk.status === 'suspended'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        }`}
                      >
                        {bk.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => openInspection(bk)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect & Verify
                      </button>
                      {bk.status === 'approved' && (
                        <button
                          onClick={() => handleToggleSuspend(bk)}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-yellow-100 text-slate-600 dark:bg-slate-800 dark:hover:bg-yellow-950/60 dark:text-slate-300 text-[11px] transition"
                        >
                          Suspend
                        </button>
                      )}
                      {bk.status === 'suspended' && (
                        <button
                          onClick={() => handleToggleSuspend(bk)}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] transition"
                        >
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verification / Inspection Modal */}
      {selectedBeekeeper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-amber-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-amber-400">
                  Beekeeper Verification Checklist
                </h3>
                <p className="text-xs text-slate-400">{selectedBeekeeper.name} — {selectedBeekeeper.state}</p>
              </div>
              <button
                onClick={() => setSelectedBeekeeper(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {actionError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-xl">
                  {actionError}
                </div>
              )}

              {/* Data Card */}
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-slate-800/40 border border-amber-500/20 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500">Applicant:</span>
                    <div className="font-bold text-slate-900 dark:text-white">{selectedBeekeeper.name}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Contact:</span>
                    <div className="text-slate-900 dark:text-white">{selectedBeekeeper.phone}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Madhukranti Portal ID:</span>
                    <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {selectedBeekeeper.madhukrantiId}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Aadhaar (Last 4):</span>
                    <div className="font-mono text-slate-900 dark:text-white">
                      •••• •••• {selectedBeekeeper.aadhaarLast4}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Hives Planned:</span>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-amber-500" />
                      <span>{selectedBeekeeper.totalHivesPlanned || selectedBeekeeper.totalHivesCount || 10} hives</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Current Status:</span>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                        {selectedBeekeeper.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-500/10">
                  <span className="text-slate-500">Apiary Address & GPS:</span>
                  <p className="text-slate-800 dark:text-slate-200">{selectedBeekeeper.address}</p>
                  <p className="font-mono text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                    Lat: {selectedBeekeeper.lat}, Lng: {selectedBeekeeper.lng}
                  </p>
                </div>
              </div>

              {/* Government Verification Checklist (Required for Approval) */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                  Mandatory Verification Checks
                </span>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.madhukrantiValid}
                    onChange={(e) => setChecklist({ ...checklist, madhukrantiValid: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    1. Verified on Madhukranti Portal database (Govt Beekeeping Registry)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.aadhaarMatched}
                    onChange={(e) => setChecklist({ ...checklist, aadhaarMatched: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    2. Aadhaar last 4 matches identity documents & cryptographic hash verified
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.locationVerified}
                    onChange={(e) => setChecklist({ ...checklist, locationVerified: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    3. Apiary coordinates confirmed within designated flora/agricultural belt
                  </span>
                </label>
              </div>

              {/* Rejection reason input (if rejecting) */}
              {showRejectModal && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-500/20 space-y-2">
                  <label className="block font-semibold text-red-700 dark:text-red-300">
                    Reason for Rejection:
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Madhukranti registration number could not be found in the state apiary database."
                    className="w-full p-2 rounded-xl border border-red-300 dark:border-red-900 bg-white dark:bg-slate-900 text-xs"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowRejectModal(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={isProcessing || !rejectionReason.trim()}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold disabled:opacity-50"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-700 dark:text-red-300 font-semibold text-xs transition"
              >
                Reject Application
              </button>

              <button
                onClick={handleApprove}
                disabled={isProcessing || !allChecklistPassed || selectedBeekeeper.status === 'approved'}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition disabled:opacity-40"
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
    </div>
  );
};
