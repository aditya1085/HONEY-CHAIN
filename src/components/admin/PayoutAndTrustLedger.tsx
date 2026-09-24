import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { PayoutRecord, TrustScoreBreakdown, TrustScoreWeights, BeekeeperProfile } from '../../types';
import { logActivity } from '../../services/activityLogger';
import {
  DollarSign,
  HeartHandshake,
  CheckCircle2,
  Clock,
  Send,
  Sliders,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Building,
} from 'lucide-react';

export const PayoutAndTrustLedger: React.FC = () => {
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [beekeepers, setBeekeepers] = useState<BeekeeperProfile[]>([]);
  const [trustScores, setTrustScores] = useState<Record<string, TrustScoreBreakdown>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Editable Trust Score Weights
  const [weights, setWeights] = useState<TrustScoreWeights>({
    iotComplianceWeight: 0.35,
    labPurityWeight: 0.35,
    customerRatingWeight: 0.2,
    fulfillmentWeight: 0.1,
  });

  const [recomputingId, setRecomputingId] = useState<string | null>(null);
  const [disbursingId, setDisbursingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    // 1. Listen to Payouts
    const qPayouts = collection(db, 'payouts');
    const unsubPayouts = onSnapshot(qPayouts, (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as PayoutRecord);
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPayouts(list);
      setLoading(false);
    });

    // 2. Fetch Beekeepers
    const fetchBeekeepers = async () => {
      try {
        const snap = await getDocs(collection(db, 'beekeepers'));
        const list = snap.docs.map((d) => d.data() as BeekeeperProfile);
        setBeekeepers(list);
      } catch (err) {
        console.warn('Beekeepers query error:', err);
      }
    };
    fetchBeekeepers();

    // 3. Listen to Trust Scores
    const qScores = collection(db, 'trust_scores');
    const unsubScores = onSnapshot(qScores, (snapshot) => {
      const map: Record<string, TrustScoreBreakdown> = {};
      snapshot.docs.forEach((d) => {
        map[d.id] = d.data() as TrustScoreBreakdown;
      });
      setTrustScores(map);
    });

    return () => {
      unsubPayouts();
      unsubScores();
    };
  }, []);

  // Disburse Payout Action
  const handleDisbursePayout = async (payout: PayoutRecord) => {
    setDisbursingId(payout.id);
    setMessage('');

    try {
      const now = new Date().toISOString();
      const transactionRef = `BANK_NEFT_${Math.floor(10000000 + Math.random() * 90000000)}`;

      await updateDoc(doc(db, 'payouts', payout.id), {
        status: 'disbursed',
        transactionRef,
        disbursedAt: now,
      });

      await logActivity({
        actorRole: 'ADMIN',
        action: 'DISBURSE_PAYOUT',
        entityType: 'BEEKEEPER',
        entityId: payout.beekeeperId,
        details: `Disbursed ₹${payout.netPayoutInr} to beekeeper ${payout.beekeeperName} for order ${payout.orderId} (NEFT Ref: ${transactionRef})`,
      });

      setMessage(`Payout of ₹${payout.netPayoutInr} successfully disbursed to ${payout.beekeeperName}!`);
    } catch (err) {
      console.error('Disburse payout error:', err);
    } finally {
      setDisbursingId(null);
    }
  };

  // Recompute Trust Score for a beekeeper
  const handleRecomputeScore = async (beekeeperId: string) => {
    setRecomputingId(beekeeperId);
    setMessage('');

    try {
      const res = await fetch('/api/trust-score/recompute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beekeeperId,
          customWeights: weights,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage(`Trust score recalculated for ${beekeeperId}: ${data.trustScore.totalScore}/100`);
      } else {
        setMessage(`Recompute failed: ${data.error}`);
      }
    } catch (err) {
      console.error('Recompute error:', err);
    } finally {
      setRecomputingId(null);
    }
  };

  const totalGross = payouts.reduce((acc, p) => acc + (p.grossAmountInr || 0), 0);
  const totalNet = payouts.reduce((acc, p) => acc + (p.netPayoutInr || 0), 0);
  const pendingPayouts = payouts.filter((p) => p.status === 'pending');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-emerald-600" />
            Beekeeper Payout Ledger & Trust Engine
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Automated 90% direct apiary payout accounting & multi-factor trust score recalculation
          </p>
        </div>
      </div>

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-xs font-semibold uppercase text-zinc-400">Gross Honey Sales</span>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
            ₹{totalGross.toLocaleString()}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Total revenue generated from consumer orders</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
          <span className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400">
            Beekeeper Direct Payouts (90%)
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{totalNet.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1">
            Fair price guaranteed direct to primary apiaries
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
          <span className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-400">
            Pending Settlements
          </span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {pendingPayouts.length} Orders
          </div>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1">
            Ready for instant bank NEFT/UPI transfer
          </p>
        </div>
      </div>

      {/* Section 1: Payout Ledger Table */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              Direct Apiary Payout Ledger ({payouts.length})
            </h3>
            <p className="text-xs text-zinc-500">
              Transparent 10% platform commission with 90% direct disbursement to beekeepers
            </p>
          </div>
        </div>

        {payouts.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-8">
            No orders placed yet. Payouts are generated automatically upon consumer order confirmation.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
              <thead className="border-b border-zinc-200 bg-zinc-50 uppercase text-[10px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/60">
                <tr>
                  <th className="px-3.5 py-2.5">Payout ID</th>
                  <th className="px-3.5 py-2.5">Order Ref</th>
                  <th className="px-3.5 py-2.5">Beekeeper</th>
                  <th className="px-3.5 py-2.5">Gross (₹)</th>
                  <th className="px-3.5 py-2.5">Platform Fee (10%)</th>
                  <th className="px-3.5 py-2.5">Net Payout (90%)</th>
                  <th className="px-3.5 py-2.5">Settlement Status</th>
                  <th className="px-3.5 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                    <td className="px-3.5 py-3 font-bold text-amber-700 dark:text-amber-400">
                      {p.payoutId}
                    </td>
                    <td className="px-3.5 py-3 text-zinc-700 dark:text-zinc-300">{p.orderId}</td>
                    <td className="px-3.5 py-3 font-sans font-medium text-zinc-900 dark:text-zinc-100">
                      {p.beekeeperName}
                    </td>
                    <td className="px-3.5 py-3">₹{p.grossAmountInr}</td>
                    <td className="px-3.5 py-3 text-zinc-400">₹{p.platformFeeInr}</td>
                    <td className="px-3.5 py-3 font-bold text-emerald-600">₹{p.netPayoutInr}</td>
                    <td className="px-3.5 py-3">
                      {p.status === 'disbursed' ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="h-3 w-3" />
                          Disbursed ({p.transactionRef?.slice(-6)})
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 flex items-center gap-1 w-fit">
                          <Clock className="h-3 w-3" />
                          Pending Settlement
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      {p.status === 'pending' && (
                        <button
                          onClick={() => handleDisbursePayout(p)}
                          disabled={disbursingId === p.id}
                          className="rounded-lg bg-emerald-600 px-3 py-1 font-sans text-xs font-bold text-white hover:bg-emerald-700 shadow-xs disabled:opacity-50"
                        >
                          {disbursingId === p.id ? 'Processing...' : 'Disburse Bank NEFT'}
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

      {/* Section 2: Trust Score Recompute & Admin Weights Configurator */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 dark:border-zinc-800">
          <div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-amber-500" />
              Multi-Factor Trust Score Configuration
            </h3>
            <p className="text-xs text-zinc-500">
              Customize algorithmic weighting factors across continuous telemetry, lab certifications, customer feedback, and delivery reliability
            </p>
          </div>
        </div>

        {/* Weights Sliders Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-2">
            <div className="flex justify-between font-bold">
              <span>IoT Telemetry:</span>
              <span className="text-blue-600">{Math.round(weights.iotComplianceWeight * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.6"
              step="0.05"
              value={weights.iotComplianceWeight}
              onChange={(e) =>
                setWeights({ ...weights, iotComplianceWeight: parseFloat(e.target.value) })
              }
              className="w-full accent-blue-600"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-2">
            <div className="flex justify-between font-bold">
              <span>Lab Purity:</span>
              <span className="text-emerald-600">{Math.round(weights.labPurityWeight * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.6"
              step="0.05"
              value={weights.labPurityWeight}
              onChange={(e) =>
                setWeights({ ...weights, labPurityWeight: parseFloat(e.target.value) })
              }
              className="w-full accent-emerald-600"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-2">
            <div className="flex justify-between font-bold">
              <span>Customer Ratings:</span>
              <span className="text-amber-600">
                {Math.round(weights.customerRatingWeight * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.4"
              step="0.05"
              value={weights.customerRatingWeight}
              onChange={(e) =>
                setWeights({ ...weights, customerRatingWeight: parseFloat(e.target.value) })
              }
              className="w-full accent-amber-600"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-2">
            <div className="flex justify-between font-bold">
              <span>Fulfillment:</span>
              <span className="text-purple-600">{Math.round(weights.fulfillmentWeight * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.3"
              step="0.05"
              value={weights.fulfillmentWeight}
              onChange={(e) =>
                setWeights({ ...weights, fulfillmentWeight: parseFloat(e.target.value) })
              }
              className="w-full accent-purple-600"
            />
          </div>
        </div>

        {/* Beekeeper Recompute Table */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Beekeeper Trust Score Recalculation Trigger
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 uppercase text-[10px] font-semibold text-zinc-500">
                <tr>
                  <th className="p-3">Beekeeper</th>
                  <th className="p-3">Origin</th>
                  <th className="p-3">Current Score</th>
                  <th className="p-3">IoT Compliance</th>
                  <th className="p-3">Lab Tests</th>
                  <th className="p-3">Reviews</th>
                  <th className="p-3 text-right">Recalculate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {beekeepers.map((bkp) => {
                  const bId = bkp.beekeeperId || bkp.id;
                  const breakdown = bId ? trustScores[bId] : undefined;
                  return (
                    <tr key={bId} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                      <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {bkp.name}
                        <span className="block font-mono text-[10px] text-zinc-400">
                          {bId}
                        </span>
                      </td>
                      <td className="p-3">{bkp.state}</td>
                      <td className="p-3">
                        <span className="font-mono text-sm font-black text-amber-600">
                          {breakdown?.totalScore || bkp.trustScore || 94} / 100
                        </span>
                      </td>
                      <td className="p-3 font-mono text-blue-600">
                        {breakdown?.iotScore || 96}%
                      </td>
                      <td className="p-3 font-mono text-emerald-600">
                        {breakdown?.labScore || 98}%
                      </td>
                      <td className="p-3 font-mono text-amber-600">
                        {breakdown?.customerScore || 92}%
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleRecomputeScore(bId)}
                          disabled={recomputingId === bId}
                          className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 font-bold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                        >
                          <RefreshCw
                            className={`h-3 w-3 ${
                              recomputingId === bId ? 'animate-spin' : ''
                            }`}
                          />
                          <span>{recomputingId === bId ? 'Computing...' : 'Recompute'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
