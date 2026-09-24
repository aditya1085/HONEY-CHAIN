import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { HarvestRecord, HiveRecord } from '../../types';
import { Droplets, Plus, Search, Filter, Calendar, Scale, CheckCircle2, Clock, Layers } from 'lucide-react';
import { HarvestEntryModal } from './HarvestEntryModal';

interface HarvestListViewProps {
  beekeeperId: string;
  beekeeperName?: string;
  beekeeperState: string;
  hives: HiveRecord[];
  onSelectBatch?: (batchId: string) => void;
}

export const HarvestListView: React.FC<HarvestListViewProps> = ({
  beekeeperId,
  beekeeperName,
  beekeeperState,
  hives,
  onSelectBatch,
}) => {
  const [harvests, setHarvests] = useState<HarvestRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'unbatched' | 'batched'>('ALL');

  useEffect(() => {
    if (!beekeeperId) return;

    const q = query(
      collection(db, 'harvests'),
      where('beekeeperId', '==', beekeeperId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => doc.data() as HarvestRecord);
        setHarvests(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Harvests listener fallback:', err);
        // Fallback without orderBy in case index building
        const fallbackQ = query(collection(db, 'harvests'), where('beekeeperId', '==', beekeeperId));
        onSnapshot(fallbackQ, (snap) => {
          const list = snap.docs.map((d) => d.data() as HarvestRecord);
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setHarvests(list);
          setLoading(false);
        });
      }
    );

    return () => unsubscribe();
  }, [beekeeperId]);

  const filtered = harvests.filter((h) => {
    const matchesSearch =
      h.hiveId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.floralSource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.batchId && h.batchId.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || h.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalKg = harvests.reduce((acc, h) => acc + (h.quantityKg || 0), 0);
  const unbatchedKg = harvests
    .filter((h) => h.status === 'unbatched')
    .reduce((acc, h) => acc + (h.quantityKg || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Stats Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Droplets className="h-6 w-6 text-amber-500" />
            Honey Harvest Log
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Track fresh extractions from your hives before aggregation into verified batches
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Record New Harvest
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Harvested</div>
          <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {totalKg.toFixed(1)} <span className="text-sm font-normal text-zinc-500">kg</span>
          </div>
          <div className="mt-1 text-xs text-zinc-400">{harvests.length} total extractions logged</div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs dark:border-amber-900/30 dark:bg-amber-950/20">
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
            Unbatched Honey Pool
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {unbatchedKg.toFixed(1)} <span className="text-sm font-normal">kg</span>
          </div>
          <div className="mt-1 text-xs text-amber-700/80 dark:text-amber-400/70">
            Ready for admin batching & lab purity testing
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Batched & Traceable</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {(totalKg - unbatchedKg).toFixed(1)} <span className="text-sm font-normal text-zinc-500">kg</span>
          </div>
          <div className="mt-1 text-xs text-zinc-400">Aggregated into verifiable batch lots</div>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Hive ID, Floral Source, or Batch ID..."
            className="w-full rounded-xl border border-zinc-300 bg-white pl-9 pr-4 py-2 text-sm text-zinc-900 shadow-xs focus:border-amber-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500">Status:</span>
          {(['ALL', 'unbatched', 'batched'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              {st === 'ALL' ? 'All' : st === 'unbatched' ? 'Unbatched Pool' : 'Batched'}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-sm text-zinc-400">
          Loading harvest records...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
          <Droplets className="mx-auto h-12 w-12 text-amber-300" />
          <h3 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">No harvests found</h3>
          <p className="mt-1 text-xs text-zinc-500">
            {searchQuery ? 'Try adjusting your search query' : 'Record your first honey extraction using the button above'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/60">
              <tr>
                <th className="px-4 py-3.5">Extraction Date</th>
                <th className="px-4 py-3.5">Hive ID</th>
                <th className="px-4 py-3.5">Floral Variety</th>
                <th className="px-4 py-3.5">Quantity (kg)</th>
                <th className="px-4 py-3.5">Moisture %</th>
                <th className="px-4 py-3.5">Extraction Method</th>
                <th className="px-4 py-3.5">Status / Batch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filtered.map((h) => (
                <tr key={h.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3.5 text-zinc-900 dark:text-zinc-100 font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                      {new Date(h.extractionDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-amber-700 dark:text-amber-400">
                    {h.hiveId}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      {h.floralSource}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-zinc-900 dark:text-zinc-100">
                    {h.quantityKg} kg
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-xs font-semibold ${
                        h.moisture <= 20 ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {h.moisture}%
                      {h.moisture <= 20 ? (
                        <span className="text-[10px] text-zinc-400 font-normal">(FSSAI OK)</span>
                      ) : (
                        <span className="text-[10px] text-red-500 font-normal">(High)</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-zinc-500 truncate max-w-xs">
                    {h.extractionMethod || 'Cold extraction'}
                  </td>
                  <td className="px-4 py-3.5">
                    {h.status === 'batched' && h.batchId ? (
                      <button
                        onClick={() => onSelectBatch && onSelectBatch(h.batchId!)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        {h.batchId}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900">
                        <Clock className="h-3 w-3" />
                        In Harvest Pool
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Harvest Entry Modal */}
      <HarvestEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hives={hives}
        beekeeperId={beekeeperId}
        beekeeperName={beekeeperName}
        beekeeperState={beekeeperState}
        onSuccess={() => setIsModalOpen(false)}
      />
    </div>
  );
};
