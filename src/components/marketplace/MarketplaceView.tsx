import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { HoneyListing, CartItem, StockAlert } from '../../types';
import {
  Search,
  Filter,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Star,
  MapPin,
  HeartHandshake,
  Sparkles,
  Bell,
  Scale,
  ArrowRight,
  Eye,
} from 'lucide-react';

interface MarketplaceViewProps {
  onAddToCart: (item: CartItem) => void;
  onVerifyPack: (batchId: string) => void;
  onOpenProductDetail?: (listing: HoneyListing) => void;
  onSelectListing?: (listing: HoneyListing) => void;
  currentUser?: { uid: string; email?: string | null };
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  onAddToCart,
  onVerifyPack,
  onOpenProductDetail,
  onSelectListing,
  currentUser,
}) => {
  const handleOpenDetail = (listing: HoneyListing) => {
    if (onSelectListing) onSelectListing(listing);
    else if (onOpenProductDetail) onOpenProductDetail(listing);
  };
  const [listings, setListings] = useState<HoneyListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFlora, setSelectedFlora] = useState<string>('ALL');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedSize, setSelectedSize] = useState<number | 'ALL'>('ALL');
  const [minTrustScore, setMinTrustScore] = useState<number>(0);
  const [rawOnly, setRawOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'trust' | 'price_asc' | 'price_desc' | 'newest'>('trust');

  // Notify Me Alert modal
  const [showNotifyModal, setShowNotifyModal] = useState<boolean>(false);
  const [notifyEmail, setNotifyEmail] = useState<string>(currentUser?.email || '');
  const [notifySuccess, setNotifySuccess] = useState<string>('');

  useEffect(() => {
    const q = query(collection(db, 'listings'), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as HoneyListing);
        setListings(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Marketplace listings listener:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter and Sort
  const filteredListings = listings
    .filter((l) => {
      const matchesSearch =
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.floralSource.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.beekeeperName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFlora = selectedFlora === 'ALL' || l.floralSource === selectedFlora;
      const matchesState = selectedState === 'ALL' || l.state === selectedState;
      const matchesSize = selectedSize === 'ALL' || l.jarSizeGrams === selectedSize;
      const matchesTrust = (l.trustScore || 90) >= minTrustScore;
      const matchesRaw = !rawOnly || l.rawUnfiltered;

      return matchesSearch && matchesFlora && matchesState && matchesSize && matchesTrust && matchesRaw;
    })
    .sort((a, b) => {
      if (sortBy === 'trust') return (b.trustScore || 0) - (a.trustScore || 0);
      if (sortBy === 'price_asc') return a.priceInr - b.priceInr;
      if (sortBy === 'price_desc') return b.priceInr - a.priceInr;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const availableFloras = Array.from(new Set(listings.map((l) => l.floralSource))).filter(Boolean);
  const availableStates = Array.from(new Set(listings.map((l) => l.state))).filter(Boolean);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail) return;

    try {
      const alertId = `ALERT_${Date.now()}`;
      const alertData: StockAlert = {
        id: alertId,
        userId: currentUser?.uid || 'guest_user',
        userEmail: notifyEmail,
        floralSource: selectedFlora !== 'ALL' ? selectedFlora : undefined,
        searchTerm: searchQuery || undefined,
        createdAt: new Date().toISOString(),
        active: true,
      };

      await setDoc(doc(db, 'stock_alerts', alertId), alertData);
      setNotifySuccess('Alert created! You will receive a notification when new matching batches arrive.');
      setTimeout(() => {
        setShowNotifyModal(false);
        setNotifySuccess('');
      }, 2500);
    } catch (err) {
      console.error('Alert error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="rounded-3xl bg-linear-to-r from-amber-500 via-amber-600 to-amber-700 p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="max-w-xl space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <ShieldCheck className="h-4 w-4" />
            <span>100% Purity Certified • Direct From Beekeepers</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Honey Chain Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
            Purchase verified single-origin raw honey with continuous IoT apiary telemetry and laboratory purity seals anchored to the blockchain.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => setShowNotifyModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-bold text-amber-900 shadow-md hover:bg-amber-50 transition"
          >
            <Bell className="h-4 w-4 text-amber-600" />
            <span>Notify Me on Rare Harvests</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        {/* Search Bar & Sorter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by variety (Mustard, Acacia), state, or beekeeper..."
              className="w-full rounded-xl border border-zinc-300 bg-white pl-9 pr-4 py-2.5 text-xs text-zinc-900 shadow-xs focus:border-amber-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400 font-semibold">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <option value="trust">Highest Trust Score</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest Batches</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          {/* Floral source */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-medium">Flora:</span>
            <select
              value={selectedFlora}
              onChange={(e) => setSelectedFlora(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="ALL">All Varieties</option>
              {availableFloras.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* State */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-medium">State:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="ALL">All States</option>
              {availableStates.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Jar Size */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-medium">Size:</span>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="ALL">All Sizes</option>
              <option value={250}>250g Jar</option>
              <option value={500}>500g Jar</option>
              <option value={1000}>1 kg Jar</option>
            </select>
          </div>

          {/* Trust Score filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-medium">Trust Score:</span>
            <select
              value={minTrustScore}
              onChange={(e) => setMinTrustScore(parseInt(e.target.value))}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value={0}>Any Score</option>
              <option value={80}>≥ 80 (High Trust)</option>
              <option value={90}>≥ 90 (Master Apiary)</option>
            </select>
          </div>

          {/* Raw / Unfiltered Toggle */}
          <button
            onClick={() => setRawOnly(!rawOnly)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              rawOnly
                ? 'bg-amber-500 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
            }`}
          >
            {rawOnly ? '✔ Raw & Unfiltered Only' : 'Raw & Unfiltered'}
          </button>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="p-16 text-center text-sm text-zinc-400">Loading marketplace...</div>
      ) : filteredListings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
          <ShoppingBag className="mx-auto h-12 w-12 text-zinc-300" />
          <h3 className="mt-2 text-base font-bold text-zinc-800 dark:text-zinc-200">
            No honey listings match your filters
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Try adjusting your search criteria or subscribe for a stock alert when new batches arrive.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((item) => {
            const discount = item.mrpInr > item.priceInr
              ? Math.round(((item.mrpInr - item.priceInr) / item.mrpInr) * 100)
              : 0;

            return (
              <div
                key={item.id}
                className="group rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-amber-300 dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      100% PURE
                    </span>

                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900 flex items-center gap-1">
                      <HeartHandshake className="h-3 w-3 text-amber-500" />
                      Trust {item.trustScore || 94}
                    </span>
                  </div>

                  {/* Honey Title & Variety */}
                  <div>
                    <h3
                      onClick={() => handleOpenDetail(item)}
                      className="font-bold text-base text-zinc-900 dark:text-zinc-100 cursor-pointer group-hover:text-amber-600 transition"
                    >
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {item.floralSource}
                      </span>
                      <span>•</span>
                      <span>{item.jarSizeGrams}g Jar</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />
                        {item.state}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Provenance Snippet */}
                  <div className="rounded-xl bg-zinc-50 p-2.5 dark:bg-zinc-800/40 text-[11px] text-zinc-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Batch Provenance:</span>
                      <strong className="font-mono text-zinc-800 dark:text-zinc-200">
                        {item.batchId}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Beekeeper:</span>
                      <strong className="text-zinc-800 dark:text-zinc-200">{item.beekeeperName}</strong>
                    </div>
                  </div>
                </div>

                {/* Pricing & CTA */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                        ₹{item.priceInr}
                      </span>
                      {item.mrpInr > item.priceInr && (
                        <span className="text-xs text-zinc-400 line-through">₹{item.mrpInr}</span>
                      )}
                    </div>

                    {discount > 0 && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md dark:bg-emerald-950">
                        {discount}% OFF
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleOpenDetail(item)}
                      className="w-full inline-flex items-center justify-center gap-1 rounded-xl border border-zinc-200 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Details</span>
                    </button>

                    <button
                      onClick={() =>
                        onAddToCart({
                          listingId: item.id,
                          batchId: item.batchId,
                          title: item.title,
                          floralSource: item.floralSource,
                          jarSizeGrams: item.jarSizeGrams,
                          priceInr: item.priceInr,
                          quantity: 1,
                          maxStock: item.stockCount,
                          beekeeperName: item.beekeeperName,
                        })
                      }
                      className="w-full inline-flex items-center justify-center gap-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 transition"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notify Me Modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                  Notify Me on Fresh Harvests
                </h3>
              </div>
              <button
                onClick={() => setShowNotifyModal(false)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>

            {notifySuccess ? (
              <div className="rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{notifySuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleCreateAlert} className="space-y-4">
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Subscribe for real-time in-app alerts and notifications when rare varieties (like Kashmir White or Lychee honey) are extracted and verified.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Your Notification Email
                  </label>
                  <input
                    type="email"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNotifyModal(false)}
                    className="rounded-xl border px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-white hover:bg-amber-600 shadow-md shadow-amber-500/20"
                  >
                    Subscribe Alert
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
