import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { BatchRecord } from '../../types';
import { Layers, Search, Filter, Cpu, CheckCircle2, FlaskConical, Package, Eye, MapPin } from 'lucide-react';
import { BatchDetailModal } from './BatchDetailModal';

interface BatchListViewProps {
  onSelectBatch?: (batchId: string) => void;
  initialSelectedBatchId?: string | null;
}

export const BatchListView: React.FC<BatchListViewProps> = ({
  onSelectBatch,
  initialSelectedBatchId,
}) => {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedBatch, setSelectedBatch] = useState<BatchRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const q = query(collection(db, 'batches'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as BatchRecord);
        setBatches(list);
        setLoading(false);

        if (initialSelectedBatchId) {
          const match = list.find((b) => b.batchId === initialSelectedBatchId);
          if (match) {
            setSelectedBatch(match);
            setIsModalOpen(true);
          }
        }
      },
      (err) => {
        console.warn('Batches fallback query:', err);
        const fallbackQ = collection(db, 'batches');
        onSnapshot(fallbackQ, (snap) => {
          const list = snap.docs.map((d) => d.data() as BatchRecord);
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setBatches(list);
          setLoading(false);
        });
      }
    );

    return () => unsubscribe();
  }, [initialSelectedBatchId]);

  const filtered = batches.filter((b) => {
    const matchesSearch =
      b.batchId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.floralSource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.state.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDetail = (b: BatchRecord) => {
    setSelectedBatch(b);
    setIsModalOpen(true);
    if (onSelectBatch) onSelectBatch(b.batchId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'created':
        return (
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            Batch Created
          </span>
        );
      case 'verified':
        return (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            IoT Verified
          </span>
        );
      case 'verification_failed':
        return (
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-300">
            Verification Blocked
          </span>
        );
      case 'sample_sent':
        return (
          <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
            Sample Sent
          </span>
        );
      case 'lab_tested':
        return (
          <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">
            Lab Certified
          </span>
        );
      case 'packaged':
        return (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            Packaged
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Layers className="h-6 w-6 text-amber-500" />
            Batch Lifecycle & Traceability Registry
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Monitor batches through IoT verification, laboratory certification, and retail packaging
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Batch ID (HB-...), Floral source, or State..."
            className="w-full rounded-xl border border-zinc-300 bg-white pl-9 pr-4 py-2 text-sm text-zinc-900 shadow-xs focus:border-amber-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'created', 'verified', 'sample_sent', 'lab_tested', 'packaged'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === s
                  ? 'bg-amber-500 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              {s === 'ALL'
                ? 'All Batches'
                : s === 'created'
                ? 'Created'
                : s === 'verified'
                ? 'Verified'
                : s === 'sample_sent'
                ? 'Lab Sample'
                : s === 'lab_tested'
                ? 'Certified'
                : 'Packaged'}
            </button>
          ))}
        </div>
      </div>

      {/* Batches Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-sm text-zinc-400">
          Loading batches...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
          <Layers className="mx-auto h-12 w-12 text-amber-300" />
          <h3 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">No batches found</h3>
          <p className="mt-1 text-xs text-zinc-500">
            {searchQuery ? 'Try adjusting your search query' : 'Create a batch from the Harvest Pool'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/60">
              <tr>
                <th className="px-4 py-3.5">Batch ID</th>
                <th className="px-4 py-3.5">Floral Variety</th>
                <th className="px-4 py-3.5">Origin / State</th>
                <th className="px-4 py-3.5">Total Quantity</th>
                <th className="px-4 py-3.5">Avg Moisture</th>
                <th className="px-4 py-3.5">Source Hives</th>
                <th className="px-4 py-3.5">Current Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filtered.map((b) => (
                <tr
                  key={b.batchId}
                  onClick={() => handleOpenDetail(b)}
                  className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-amber-700 dark:text-amber-400">
                    {b.batchId}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      {b.floralSource}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 text-xs text-zinc-800 dark:text-zinc-200">
                      <MapPin className="h-3 w-3 text-zinc-400" />
                      State: {b.state}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-zinc-900 dark:text-zinc-100">
                    {b.totalQuantityKg} kg
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs">
                    <span className={b.avgMoisture <= 20 ? 'text-emerald-600' : 'text-red-500'}>
                      {b.avgMoisture}%
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-zinc-500">
                    {b.hiveIds.length} hives ({b.harvestIds.length} extractions)
                  </td>
                  <td className="px-4 py-3.5">{getStatusBadge(b.status)}</td>
                  <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenDetail(b)}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Manage</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      <BatchDetailModal
        batch={selectedBatch}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBatchUpdated={(updated) => {
          setSelectedBatch(updated);
          setBatches((prev) => prev.map((b) => (b.batchId === updated.batchId ? updated : b)));
        }}
      />
    </div>
  );
};
