import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  Scale,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { handleFirestoreError, OperationType } from '../../firebase/errors';
import { ReviewRecord, DisputeRecord } from '../../types';

interface EnrichedReview extends ReviewRecord {
  fraudAnalysis?: {
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    flags: string[];
    recommendation: 'APPROVE' | 'FLAG_FOR_REVIEW';
  };
}

export const MarketplaceModeration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reviews' | 'disputes'>('reviews');
  const [reviews, setReviews] = useState<EnrichedReview[]>([]);
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');

  // Dispute resolution modal
  const [selectedDispute, setSelectedDispute] = useState<DisputeRecord | null>(null);
  const [resolutionAction, setResolutionAction] = useState<'REFUNDED' | 'REJECTED' | 'RESOLVED'>('REFUNDED');
  const [adminNotes, setAdminNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [processingAction, setProcessingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Fetch reviews with server-side fraud heuristics
  const fetchModerationReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/moderation/reviews');
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      }
    } catch (e) {
      console.error('Failed to fetch reviews:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerationReviews();

    // Real-time listener for disputes
    const unsub = onSnapshot(collection(db, 'disputes'), (snap) => {
      const list: DisputeRecord[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<DisputeRecord, 'id'>),
      }));
      setDisputes(list);
    });

    return () => unsub();
  }, []);

  // Delete / dismiss fraudulent review
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to remove this review from the marketplace?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setActionSuccessMsg('Review removed successfully.');
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (e) {
      console.error('Delete review error:', e);
    }
  };

  // Resolve customer dispute
  const handleResolveDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;
    setProcessingAction(true);

    try {
      const res = await fetch('/api/admin/moderation/resolve-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeId: selectedDispute.id,
          orderId: selectedDispute.orderId,
          resolution: resolutionAction,
          adminNotes,
          refundAmount: resolutionAction === 'REFUNDED' ? refundAmount : 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(`Dispute marked as ${resolutionAction}.`);
        setSelectedDispute(null);
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
    } catch (e) {
      console.error('Dispute resolution error:', e);
    } finally {
      setProcessingAction(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      (r.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.comment || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.batchId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk =
      filterRisk === 'ALL' ||
      (filterRisk === 'FLAGGED' && (r.fraudAnalysis?.riskScore || 0) >= 30) ||
      (filterRisk === 'SAFE' && (r.fraudAnalysis?.riskScore || 0) < 30);
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-amber-500/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30">
              Heuristic Trust Guard
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-amber-500" />
            Marketplace Moderation & Dispute Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Autonomous review-fraud detection heuristics, buyer purchase verification, and dispute refund handling.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'reviews'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Review Heuristics ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'disputes'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>Buyer Disputes</span>
            {disputes.filter((d) => d.status === 'OPEN').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-black">
                {disputes.filter((d) => d.status === 'OPEN').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* TAB 1: REVIEWS MODERATION */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user, comment, or batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-medium"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="FLAGGED">Flagged / Suspicious Only</option>
                <option value="SAFE">Verified / Low Risk</option>
              </select>

              <button
                onClick={fetchModerationReviews}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                title="Refresh reviews"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredReviews.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                No reviews found matching the active filters.
              </div>
            ) : (
              filteredReviews.map((rev) => {
                const isFlagged = (rev.fraudAnalysis?.riskScore || 0) >= 30;
                return (
                  <div
                    key={rev.id}
                    className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isFlagged
                        ? 'border-red-300 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/10'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {rev.userName || 'Anonymous Buyer'}
                        </span>
                        <span className="text-amber-500 font-bold text-xs">
                          {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                        </span>
                        {rev.verifiedPurchase ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] font-bold border border-emerald-500/20">
                            Verified Purchase
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 text-[10px] font-bold border border-red-500/20">
                            Unverified Order
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400">Batch: {rev.batchId}</span>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                        "{rev.comment || 'No comment provided'}"
                      </p>

                      {/* Fraud Heuristics Breakdown */}
                      {rev.fraudAnalysis && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              rev.fraudAnalysis.riskScore >= 50
                                ? 'bg-red-500/20 text-red-600'
                                : rev.fraudAnalysis.riskScore >= 25
                                ? 'bg-amber-500/20 text-amber-600'
                                : 'bg-emerald-500/20 text-emerald-600'
                            }`}
                          >
                            Risk: {rev.fraudAnalysis.riskScore}/100 ({rev.fraudAnalysis.riskLevel})
                          </span>

                          {rev.fraudAnalysis.flags.map((flag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                            >
                              ⚠️ {flag.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Review</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BUYER DISPUTES & REFUNDS */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {disputes.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                No active buyer disputes registered. All shipments compliant.
              </div>
            ) : (
              disputes.map((disp) => (
                <div
                  key={disp.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-400">
                        Dispute #{disp.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          disp.status === 'OPEN'
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            : disp.status === 'REFUNDED'
                            ? 'bg-red-500/20 text-red-600'
                            : 'bg-emerald-500/20 text-emerald-600'
                        }`}
                      >
                        {disp.status}
                      </span>
                      <span className="text-xs font-mono text-slate-400">Order: {disp.orderId}</span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Reason: {disp.reason || 'Jar Damaged / Crystallization Query'}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {disp.description || 'Customer requested inspection on batch verification hash divergence.'}
                    </p>
                    {disp.refundAmount ? (
                      <p className="text-xs font-semibold text-red-600">Refunded: ₹{disp.refundAmount}</p>
                    ) : null}
                  </div>

                  {disp.status === 'OPEN' && (
                    <button
                      onClick={() => {
                        setSelectedDispute(disp);
                        setRefundAmount(disp.claimAmount || disp.amount || 499);
                        setAdminNotes('');
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition flex items-center gap-1.5 shrink-0"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Resolve Dispute</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* DISPUTE RESOLUTION MODAL */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-500" />
              Resolve Dispute #{selectedDispute.id}
            </h3>

            <p className="text-xs text-slate-500">
              Order Reference: <strong className="font-mono">{selectedDispute.orderId}</strong>
            </p>

            <form onSubmit={handleResolveDispute} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Resolution Decision
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['REFUNDED', 'RESOLVED', 'REJECTED'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setResolutionAction(mode)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition border ${
                        resolutionAction === mode
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {resolutionAction === 'REFUNDED' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Refund Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Administrative Resolution Notes
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Reason for decision, courier claim details..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow transition disabled:opacity-50"
                >
                  {processingAction ? 'Processing...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
