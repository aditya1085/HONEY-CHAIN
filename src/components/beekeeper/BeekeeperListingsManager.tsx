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
import { HoneyListing, BatchRecord, HoneyPack } from '../../types';
import { logActivity } from '../../services/activityLogger';
import {
  Store,
  Plus,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
  Tag,
  DollarSign,
  Edit3,
  Archive,
  Eye,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface BeekeeperListingsManagerProps {
  beekeeperId: string;
  beekeeperName: string;
  beekeeperState?: string;
}

export const BeekeeperListingsManager: React.FC<BeekeeperListingsManagerProps> = ({
  beekeeperId,
  beekeeperName,
  beekeeperState = 'UP',
}) => {
  const [listings, setListings] = useState<HoneyListing[]>([]);
  const [packagedBatches, setPackagedBatches] = useState<BatchRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Form State
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priceInr, setPriceInr] = useState<number>(450);
  const [mrpInr, setMrpInr] = useState<number>(550);
  const [stockCount, setStockCount] = useState<number>(20);
  const [rawUnfiltered, setRawUnfiltered] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // 1. Fetch Beekeeper Listings
  useEffect(() => {
    if (!beekeeperId) return;

    const q = query(collection(db, 'listings'), where('beekeeperId', '==', beekeeperId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as HoneyListing);
        setListings(list);
        setLoading(false);
      },
      (err) => {
        console.error('Listings error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [beekeeperId]);

  // 2. Fetch Live Packaged Batches belonging to this Beekeeper
  useEffect(() => {
    if (!beekeeperId) return;

    const fetchLiveBatches = async () => {
      try {
        const q = query(
          collection(db, 'batches'),
          where('beekeeperIds', 'array-contains', beekeeperId)
        );
        const snap = await getDocs(q);
        // Only batches that are 'packaged' or 'lab_tested' with PURE verdict are eligible for marketplace listing
        const live = snap.docs
          .map((d) => d.data() as BatchRecord)
          .filter((b) => b.status === 'packaged' || (b.status === 'lab_tested' && b.labVerdict === 'PURE'));

        setPackagedBatches(live);
        if (live.length > 0 && !selectedBatchId) {
          setSelectedBatchId(live[0].batchId);
          setTitle(`Pure Raw ${live[0].floralSource} Honey (${live[0].state})`);
          setDescription(
            `Single-origin raw honey sustainably harvested from ${live[0].state}. NABL certified 100% pure with zero corn syrup or heating.`
          );
          if (live[0].packagingDetails) {
            setStockCount(live[0].packagingDetails.packCount || 20);
          }
        }
      } catch (err) {
        console.warn('Batches query error:', err);
      }
    };

    fetchLiveBatches();
  }, [beekeeperId]);

  const handleBatchSelectChange = (bId: string) => {
    setSelectedBatchId(bId);
    const b = packagedBatches.find((x) => x.batchId === bId);
    if (b) {
      setTitle(`Pure Raw ${b.floralSource} Honey (${b.state})`);
      setDescription(
        `Single-origin raw honey sustainably harvested from ${b.state}. NABL certified 100% pure with zero corn syrup or heating.`
      );
      if (b.packagingDetails) {
        setStockCount(b.packagingDetails.packCount || 20);
      }
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    const batch = packagedBatches.find((b) => b.batchId === selectedBatchId);
    if (!batch) {
      setError('Please select an approved packaged batch to create a marketplace listing.');
      return;
    }

    if (priceInr <= 0 || mrpInr < priceInr) {
      setError('Please enter a valid selling price. MRP must be equal to or higher than selling price.');
      return;
    }

    if (stockCount <= 0) {
      setError('Available stock count must be greater than zero.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const listingId = `LIST_${batch.batchId}_${Date.now()}`;
      const now = new Date().toISOString();
      const jarSize = batch.packagingDetails?.jarSizeGrams || 500;

      const newListing: HoneyListing = {
        id: listingId,
        batchId: batch.batchId,
        beekeeperId,
        beekeeperName,
        title,
        description,
        floralSource: batch.floralSource,
        state: batch.state,
        jarSizeGrams: jarSize,
        priceInr,
        mrpInr,
        stockCount,
        initialStock: stockCount,
        rawUnfiltered,
        status: 'active',
        labVerdict: batch.labVerdict || 'PURE',
        labReportId: batch.labReportId,
        reportHash: batch.reportHash,
        trustScore: 94,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'listings', listingId), newListing);

      // Update batch status to 'listed'
      await updateDoc(doc(db, 'batches', batch.batchId), {
        status: 'listed',
        updatedAt: now,
      });

      // Log activity
      await logActivity({
        actorRole: 'BEEKEEPER',
        action: 'CREATE_LISTING',
        entityType: 'PACK',
        entityId: listingId,
        details: `Created marketplace listing for batch ${batch.batchId} (${stockCount} jars at ₹${priceInr})`,
      });

      // Notify consumers who subscribed to stock alerts
      fetch('/api/alerts/notify-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          floralSource: batch.floralSource,
          beekeeperId,
          title,
          batchId: batch.batchId,
        }),
      }).catch((e) => console.warn('Alert notification triggered:', e));

      setSuccess(`Listing successfully published! Available now on Honey Chain marketplace.`);
      setShowCreateModal(false);
      setSubmitting(false);
    } catch (err) {
      console.error('Create listing error:', err);
      setError(`Failed to publish listing: ${err instanceof Error ? err.message : String(err)}`);
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (listing: HoneyListing) => {
    try {
      const nextStatus = listing.status === 'active' ? 'archived' : 'active';
      await updateDoc(doc(db, 'listings', listing.id), {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Store className="h-6 w-6 text-amber-500" />
            My Honey Marketplace Listings
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Publish packaged honey jars directly to consumers with verified blockchain provenance
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          disabled={packagedBatches.length === 0}
          className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 disabled:opacity-50 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Product Listing</span>
        </button>
      </div>

      {packagedBatches.length === 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>Note:</strong> Honey Chain requires honey to complete the <strong>IoT Verification Gate</strong> and <strong>Lab Purity Certification</strong> before creating a marketplace listing. Once your packaged batch is certified, you can list it here.
          </span>
        </div>
      )}

      {/* Success banner */}
      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Listings Table */}
      {loading ? (
        <div className="p-12 text-center text-sm text-zinc-400">Loading listings...</div>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
          <Package className="mx-auto h-12 w-12 text-zinc-300" />
          <h3 className="mt-2 text-base font-bold text-zinc-800 dark:text-zinc-200">
            No active listings yet
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Click "New Product Listing" above to publish your certified honey jars.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/60">
              <tr>
                <th className="px-4 py-3.5">Product / Variety</th>
                <th className="px-4 py-3.5">Batch ID</th>
                <th className="px-4 py-3.5">Jar Size</th>
                <th className="px-4 py-3.5">Price</th>
                <th className="px-4 py-3.5">Stock Available</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {listings.map((l) => (
                <tr key={l.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                  <td className="px-4 py-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                    <div>{l.title}</div>
                    <span className="text-xs font-normal text-amber-700 dark:text-amber-400">
                      {l.floralSource} Honey • {l.rawUnfiltered ? 'Raw & Unfiltered' : 'Cold Extracted'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-amber-700 dark:text-amber-400">
                    {l.batchId}
                  </td>
                  <td className="px-4 py-3.5 text-xs">{l.jarSizeGrams}g</td>
                  <td className="px-4 py-3.5 font-semibold text-zinc-900 dark:text-zinc-100">
                    ₹{l.priceInr}{' '}
                    {l.mrpInr > l.priceInr && (
                      <span className="text-xs text-zinc-400 line-through">₹{l.mrpInr}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`font-bold font-mono text-xs ${
                        l.stockCount > 5 ? 'text-emerald-600' : l.stockCount > 0 ? 'text-amber-600' : 'text-red-500'
                      }`}
                    >
                      {l.stockCount} jars left
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        l.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {l.status === 'active' ? 'Live in Market' : 'Archived'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => handleToggleStatus(l)}
                      className="rounded-lg border px-2.5 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      {l.status === 'active' ? 'Archive' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative my-8 w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                  Publish Honey Jar Listing
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateListing} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Select Certified Live Batch
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => handleBatchSelectChange(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 font-mono"
                >
                  {packagedBatches.map((b) => (
                    <option key={b.batchId} value={b.batchId}>
                      {b.batchId} • {b.floralSource} Honey ({b.totalQuantityKg}kg, Status: {b.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Product Listing Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Pure Raw Mustard Blossom Honey"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Product Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    value={priceInr}
                    onChange={(e) => setPriceInr(parseInt(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    value={mrpInr}
                    onChange={(e) => setMrpInr(parseInt(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Available Jars
                  </label>
                  <input
                    type="number"
                    value={stockCount}
                    onChange={(e) => setStockCount(parseInt(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="rawCheck"
                  checked={rawUnfiltered}
                  onChange={(e) => setRawUnfiltered(e.target.checked)}
                  className="rounded text-amber-500"
                />
                <label htmlFor="rawCheck" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Raw & Cold Extracted (No industrial heating or ultra-filtration)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish to Marketplace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
