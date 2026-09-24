import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { HarvestRecord, BatchRecord } from '../../types';
import { generateBatchId } from '../../services/idGenerators';
import { recordLedgerBlock } from '../../services/blockchainService';
import { logActivity } from '../../services/activityLogger';
import {
  Sparkles,
  Droplets,
  Layers,
  CheckSquare,
  Square,
  ArrowRight,
  RefreshCw,
  Scale,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

interface AdminHarvestPoolProps {
  onBatchCreated?: (batchId: string) => void;
}

interface GeminiGroupSuggestion {
  groupName: string;
  state: string;
  floralSource: string;
  harvestIds: string[];
  estimatedTotalKg: number;
  avgMoisture: number;
  reasoning: string;
  confidence: number;
}

export const AdminHarvestPool: React.FC<AdminHarvestPoolProps> = ({ onBatchCreated }) => {
  const [unbatchedHarvests, setUnbatchedHarvests] = useState<HarvestRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedHarvestIds, setSelectedHarvestIds] = useState<string[]>([]);
  const [creatingBatch, setCreatingBatch] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // AI Suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<GeminiGroupSuggestion[]>([]);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  useEffect(() => {
    const q = query(collection(db, 'harvests'), where('status', '==', 'unbatched'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as HarvestRecord);
        setUnbatchedHarvests(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching unbatched harvests:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Toggle single harvest selection
  const toggleSelect = (id: string) => {
    setSelectedHarvestIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Select all matching a criteria
  const selectAll = () => {
    if (selectedHarvestIds.length === unbatchedHarvests.length) {
      setSelectedHarvestIds([]);
    } else {
      setSelectedHarvestIds(unbatchedHarvests.map((h) => h.id));
    }
  };

  // Call Gemini API for smart groupings
  const fetchGeminiSuggestions = async () => {
    if (unbatchedHarvests.length === 0) return;
    setLoadingAi(true);
    setError('');

    try {
      const response = await fetch('/api/harvests/suggest-groupings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ harvests: unbatchedHarvests }),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.groups)) {
        setAiSuggestions(data.groups);
      } else {
        setError(data.error || 'Gemini could not generate groupings.');
      }
    } catch (err) {
      console.error('Gemini grouping error:', err);
      setError('Failed to reach AI service for grouping suggestions.');
    } finally {
      setLoadingAi(false);
    }
  };

  // Create Batch action (manual or from suggestion)
  const handleCreateBatch = async (harvestIdsToBatch: string[]) => {
    if (harvestIdsToBatch.length === 0) {
      setError('Please select at least one harvest to create a batch.');
      return;
    }

    setCreatingBatch(true);
    setError('');
    setSuccessMessage('');

    try {
      const selected = unbatchedHarvests.filter((h) => harvestIdsToBatch.includes(h.id));
      if (selected.length === 0) {
        throw new Error('Selected harvests are no longer available in the pool.');
      }

      const state = selected[0].state || 'UP';
      const totalKg = selected.reduce((acc, h) => acc + (h.quantityKg || 0), 0);
      const avgMoist =
        Math.round((selected.reduce((acc, h) => acc + (h.moisture || 18), 0) / selected.length) * 10) / 10;
      const floral = selected[0].floralSource || 'Multiflora';

      const beekeeperIds = Array.from(new Set(selected.map((h) => h.beekeeperId)));
      const hiveIds = Array.from(new Set(selected.map((h) => h.hiveId)));

      // 1. Generate Atomic Batch ID e.g. HB-2609-UP-0001
      const { batchId } = await generateBatchId(state);

      const now = new Date().toISOString();
      const newBatch: BatchRecord = {
        id: batchId,
        batchId,
        state,
        beekeeperIds,
        hiveIds,
        harvestIds: harvestIdsToBatch,
        floralSource: floral,
        totalQuantityKg: Math.round(totalKg * 10) / 10,
        avgMoisture: avgMoist,
        status: 'created',
        createdAt: now,
        updatedAt: now,
      };

      // 2. Write Batch Document
      await setDoc(doc(db, 'batches', batchId), newBatch);

      // 3. Mark Harvests as Batched
      for (const hId of harvestIdsToBatch) {
        await updateDoc(doc(db, 'harvests', hId), {
          status: 'batched',
          batchId,
          updatedAt: now,
        });
      }

      // 4. Record Immutable Ledger Block
      await recordLedgerBlock('BATCH_CREATED', batchId, {
        batchId,
        state,
        floralSource: floral,
        totalQuantityKg: totalKg,
        avgMoisture: avgMoist,
        hiveCount: hiveIds.length,
        harvestCount: harvestIdsToBatch.length,
      });

      // 5. Activity Log
      await logActivity({
        actorRole: 'ADMIN',
        action: 'CREATE_BATCH',
        entityType: 'BATCH',
        entityId: batchId,
        details: `Created batch ${batchId} combining ${harvestIdsToBatch.length} harvests (${totalKg.toFixed(1)}kg ${floral} honey from ${hiveIds.length} hives)`,
      });

      setSuccessMessage(`Successfully created Batch ${batchId}! Now ready for IoT verification gate.`);
      setSelectedHarvestIds([]);
      setCreatingBatch(false);

      if (onBatchCreated) {
        onBatchCreated(batchId);
      }
    } catch (err) {
      console.error('Batch creation error:', err);
      setError(`Failed to create batch: ${err instanceof Error ? err.message : String(err)}`);
      setCreatingBatch(false);
    }
  };

  // Selected stats
  const selectedRecords = unbatchedHarvests.filter((h) => selectedHarvestIds.includes(h.id));
  const selectedTotalKg = selectedRecords.reduce((acc, h) => acc + (h.quantityKg || 0), 0);
  const selectedAvgMoisture = selectedRecords.length
    ? Math.round((selectedRecords.reduce((acc, h) => acc + (h.moisture || 18), 0) / selectedRecords.length) * 10) / 10
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Droplets className="h-6 w-6 text-amber-500" />
            Admin Harvest Aggregation Pool
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Pool unbatched honey from verified beekeepers into commercial, testable batches
          </p>
        </div>

        <button
          onClick={fetchGeminiSuggestions}
          disabled={loadingAi || unbatchedHarvests.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          <Sparkles className={`h-4 w-4 ${loadingAi ? 'animate-spin' : ''}`} />
          <span>{loadingAi ? 'Analyzing Harvests...' : 'Gemini Smart Groupings'}</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Gemini AI Suggestions Showcase */}
      {aiSuggestions.length > 0 && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5 shadow-xs dark:border-purple-900/40 dark:bg-purple-950/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                Gemini AI Recommended Batch Groupings
              </h3>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 px-2.5 py-1 rounded-full">
              Optimized for Monofloral Purity & FSSAI Standards
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiSuggestions.map((group, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-purple-200 bg-white p-4 shadow-xs dark:border-purple-900/30 dark:bg-zinc-900 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{group.groupName}</h4>
                    <span className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                      {group.confidence}% Match
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      {group.floralSource}
                    </span>
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      State: {group.state}
                    </span>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-semibold">
                      Total: {group.estimatedTotalKg} kg
                    </span>
                    <span className="rounded-md bg-blue-100 px-2 py-0.5 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 font-mono">
                      Moisture: {group.avgMoisture}%
                    </span>
                  </div>

                  <p className="mt-2.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                    "{group.reasoning}"
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{group.harvestIds.length} harvests linked</span>
                  <button
                    onClick={() => handleCreateBatch(group.harvestIds)}
                    disabled={creatingBatch}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-purple-700 disabled:opacity-50"
                  >
                    <span>Create This Batch</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Selection Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <button
            onClick={selectAll}
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            {selectedHarvestIds.length === unbatchedHarvests.length && unbatchedHarvests.length > 0 ? (
              <CheckSquare className="h-4 w-4 text-amber-500" />
            ) : (
              <Square className="h-4 w-4 text-zinc-400" />
            )}
            Select All ({unbatchedHarvests.length})
          </button>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            Selected:{' '}
            <strong className="text-zinc-900 dark:text-zinc-100">
              {selectedHarvestIds.length} harvests ({selectedTotalKg.toFixed(1)} kg)
            </strong>
            {selectedAvgMoisture > 0 && (
              <span className="ml-2 text-zinc-400">| Avg Moisture: {selectedAvgMoisture}%</span>
            )}
          </div>
        </div>

        <button
          onClick={() => handleCreateBatch(selectedHarvestIds)}
          disabled={creatingBatch || selectedHarvestIds.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {creatingBatch ? (
            <span>Generating Batch ID & Anchoring Ledger...</span>
          ) : (
            <>
              <Layers className="h-4 w-4" />
              <span>Create Batch ({selectedHarvestIds.length} Selected)</span>
            </>
          )}
        </button>
      </div>

      {/* Unbatched Harvest Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-sm text-zinc-400">
          Loading unbatched harvests...
        </div>
      ) : unbatchedHarvests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
          <Droplets className="mx-auto h-12 w-12 text-amber-300" />
          <h3 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Harvest Pool is Empty
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            All registered harvests have been aggregated into batches. New beekeeper extractions will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/60">
              <tr>
                <th className="w-10 px-4 py-3.5"></th>
                <th className="px-4 py-3.5">Beekeeper / Origin</th>
                <th className="px-4 py-3.5">Hive ID</th>
                <th className="px-4 py-3.5">Floral Source</th>
                <th className="px-4 py-3.5">Quantity (kg)</th>
                <th className="px-4 py-3.5">Moisture</th>
                <th className="px-4 py-3.5">Extraction Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {unbatchedHarvests.map((h) => {
                const isSelected = selectedHarvestIds.includes(h.id);
                return (
                  <tr
                    key={h.id}
                    onClick={() => toggleSelect(h.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-amber-50/70 dark:bg-amber-950/30'
                        : 'hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleSelect(h.id)}
                        className="text-zinc-400 hover:text-amber-500"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {h.beekeeperName || h.beekeeperId}
                      </div>
                      <div className="text-xs text-zinc-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        State: {h.state}
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
                        className={`font-mono text-xs font-semibold ${
                          h.moisture <= 20 ? 'text-emerald-600' : 'text-red-500'
                        }`}
                      >
                        {h.moisture}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                        {new Date(h.extractionDate).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
