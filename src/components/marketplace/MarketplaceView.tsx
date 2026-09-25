import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { HoneyListing, CartItem, StockAlert } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { SAMPLE_DATA_MASTER } from '../../services/sampleDataMaster';
import { StateDistrictSearch } from '../common/StateDistrictSearch';
import {
  Search,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  HeartHandshake,
  Bell,
  Eye,
} from 'lucide-react';

interface MarketplaceViewProps {
  onAddToCart: (item: CartItem) => void;
  onVerifyPack: (batchId: string) => void;
  onOpenProductDetail?: (listing: HoneyListing) => void;
  onSelectListing?: (listing: HoneyListing) => void;
  currentUser?: { uid: string; email?: string | null };
}

const INDIAN_STATES_MASTER = [
  'Uttar Pradesh',
  'Punjab',
  'Jammu & Kashmir',
  'West Bengal',
  'Madhya Pradesh',
  'Maharashtra',
  'Himachal Pradesh',
  'Uttarakhand',
  'Rajasthan',
  'Bihar',
  'Haryana',
  'Gujarat',
  'Karnataka',
  'Kerala',
  'Tamil Nadu',
  'Andhra Pradesh',
  'Odisha',
  'Assam',
];

const HONEY_VARIETIES_MASTER = [
  'Mustard',
  'Acacia',
  'Litchi',
  'Eucalyptus',
  'Multiflora',
  'Jamun',
  'Neem',
  'Sunflower',
  'Kashmir White Acacia',
  'Wild Forest Jamun',
  'Sidr / Ber',
  'Tulsi',
  'Coriander',
];

const STATE_CODE_MAP: Record<string, string> = {
  UP: 'Uttar Pradesh',
  PB: 'Punjab',
  JK: 'Jammu & Kashmir',
  'J&K': 'Jammu & Kashmir',
  WB: 'West Bengal',
  MP: 'Madhya Pradesh',
  MH: 'Maharashtra',
  HP: 'Himachal Pradesh',
  UK: 'Uttarakhand',
  RJ: 'Rajasthan',
  BR: 'Bihar',
  HR: 'Haryana',
  GJ: 'Gujarat',
  KA: 'Karnataka',
  KL: 'Kerala',
  TN: 'Tamil Nadu',
  AP: 'Andhra Pradesh',
};

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  onAddToCart,
  onVerifyPack,
  onOpenProductDetail,
  onSelectListing,
  currentUser,
}) => {
  const { t } = useLanguage();

  const handleOpenDetail = (listing: HoneyListing) => {
    if (onSelectListing) onSelectListing(listing);
    else if (onOpenProductDetail) onOpenProductDetail(listing);
  };

  const [listings, setListings] = useState<HoneyListing[]>(SAMPLE_DATA_MASTER.listings);
  const [loading, setLoading] = useState<boolean>(false);

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

  // Primary consumer view mode: catalog vs state/district regional search
  const [activeMarketTab, setActiveMarketTab] = useState<'catalog' | 'regional'>('catalog');

  useEffect(() => {
    // Listen to all active listings (or listings where status is undefined/sample)
    const q = collection(db, 'listings');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              priceInr: data.priceInr ?? data.price ?? 450,
              mrpInr: data.mrpInr ?? data.mrp ?? 550,
              stockCount: data.stockCount ?? data.stock ?? 20,
              jarSizeGrams: data.jarSizeGrams ?? 500,
              trustScore: data.trustScore ?? 95,
              rawUnfiltered: data.rawUnfiltered ?? true,
            } as HoneyListing;
          })
          .filter((l) => !l.status || l.status === 'active');
        if (list.length > 0) {
          setListings(list);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Marketplace listings listener notice (using master dataset):', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Compute available states and floras combining master lists + dynamically detected ones
  const availableStates = useMemo(() => {
    const set = new Set<string>(INDIAN_STATES_MASTER);
    listings.forEach((l) => {
      if (l.state) {
        const normalized = STATE_CODE_MAP[l.state.toUpperCase()] || l.state;
        set.add(normalized);
      }
    });
    return Array.from(set);
  }, [listings]);

  const availableFloras = useMemo(() => {
    const set = new Set<string>(HONEY_VARIETIES_MASTER);
    listings.forEach((l) => {
      if (l.floralSource) {
        set.add(l.floralSource);
      }
    });
    return Array.from(set);
  }, [listings]);

  // Helper to match state (handles codes like UP / PB)
  const isStateMatch = (listingState: string, filterState: string): boolean => {
    if (filterState === 'ALL') return true;
    if (!listingState) return false;
    const lNorm = (STATE_CODE_MAP[listingState.toUpperCase()] || listingState).toLowerCase();
    const fNorm = filterState.toLowerCase();
    return lNorm === fNorm || listingState.toLowerCase() === fNorm;
  };

  // Helper to match variety
  const isFloraMatch = (listingFlora: string, filterFlora: string): boolean => {
    if (filterFlora === 'ALL') return true;
    if (!listingFlora) return false;
    const lf = listingFlora.toLowerCase();
    const ff = filterFlora.toLowerCase();
    return lf.includes(ff) || ff.includes(lf);
  };

  // Filter and Sort
  const filteredListings = listings
    .filter((l) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (l.title && l.title.toLowerCase().includes(q)) ||
        (l.floralSource && l.floralSource.toLowerCase().includes(q)) ||
        (l.state && l.state.toLowerCase().includes(q)) ||
        (l.beekeeperName && l.beekeeperName.toLowerCase().includes(q));

      const matchesFlora = isFloraMatch(l.floralSource, selectedFlora);
      const matchesState = isStateMatch(l.state, selectedState);
      const matchesSize = selectedSize === 'ALL' || l.jarSizeGrams === selectedSize;
      const matchesTrust = (l.trustScore || 90) >= minTrustScore;
      const matchesRaw = !rawOnly || l.rawUnfiltered;

      return matchesSearch && matchesFlora && matchesState && matchesSize && matchesTrust && matchesRaw;
    })
    .sort((a, b) => {
      if (sortBy === 'trust') return (b.trustScore || 0) - (a.trustScore || 0);
      if (sortBy === 'price_asc') return a.priceInr - b.priceInr;
      if (sortBy === 'price_desc') return b.priceInr - a.priceInr;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

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
      setNotifySuccess(t('Alert created! You will receive a notification when new matching batches arrive.'));
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
            <span>{t('market.heroTag')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            {t('market.heroTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
            {t('market.heroDesc')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => setActiveMarketTab(activeMarketTab === 'catalog' ? 'regional' : 'catalog')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400/25 border border-white/30 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-white/30 transition"
          >
            <MapPin className="h-4 w-4 text-amber-200" />
            <span>{activeMarketTab === 'catalog' ? 'Search by State/District' : 'View Honey Catalog'}</span>
          </button>

          <button
            onClick={() => setShowNotifyModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-bold text-amber-900 shadow-md hover:bg-amber-50 transition"
          >
            <Bell className="h-4 w-4 text-amber-600" />
            <span>{t('market.notifyBtn')}</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs for Consumer Dashboard */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveMarketTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeMarketTab === 'catalog'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Honey Jars Catalog ({filteredListings.length})</span>
        </button>

        <button
          onClick={() => setActiveMarketTab('regional')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeMarketTab === 'regional'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Search by State / District (Apiaries, Hives & Lab Purity)</span>
        </button>
      </div>

      {activeMarketTab === 'regional' ? (
        <StateDistrictSearch
          role="CONSUMER"
          onSelectBatch={(batchId) => onVerifyPack(batchId)}
        />
      ) : (
        <>
          {/* Filter and Search Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        {/* Search Bar & Sorter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('market.searchPlaceholder')}
              className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-4 py-2.5 text-xs text-slate-900 shadow-xs focus:border-amber-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">{t('market.sort')}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="trust">{t('market.sortTrust')}</option>
              <option value="price_asc">{t('market.sortPriceAsc')}</option>
              <option value="price_desc">{t('market.sortPriceDesc')}</option>
              <option value="newest">{t('market.sortNewest')}</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Floral source / Variety dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 dark:text-slate-400 font-medium">{t('market.flora')}</span>
            <select
              value={selectedFlora}
              onChange={(e) => setSelectedFlora(e.target.value)}
              className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">{t('market.allVarieties')}</option>
              {availableFloras.map((f) => (
                <option key={f} value={f}>
                  {t(f)}
                </option>
              ))}
            </select>
          </div>

          {/* State dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 dark:text-slate-400 font-medium">{t('market.state')}</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">{t('market.allStates')}</option>
              {availableStates.map((s) => (
                <option key={s} value={s}>
                  {t(s)}
                </option>
              ))}
            </select>
          </div>

          {/* Jar Size */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 dark:text-slate-400 font-medium">{t('market.size')}</span>
            <select
              value={selectedSize}
              onChange={(e) =>
                setSelectedSize(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
              className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">{t('market.allSizes')}</option>
              <option value={250}>250g</option>
              <option value={500}>500g</option>
              <option value={1000}>1000g (1kg)</option>
            </select>
          </div>

          {/* Trust Score Slider Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 dark:text-slate-400 font-medium">{t('market.minTrust')}</span>
            <select
              value={minTrustScore}
              onChange={(e) => setMinTrustScore(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value={0}>{t('market.allRatings')}</option>
              <option value={90}>90+ Trust</option>
              <option value={95}>95+ Top Tier</option>
            </select>
          </div>

          {/* Raw / Unfiltered Toggle */}
          <button
            onClick={() => setRawOnly(!rawOnly)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              rawOnly
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {rawOnly ? t('market.rawOnly') : t('market.rawToggle')}
          </button>

          {/* Reset Filters button if any active */}
          {(selectedFlora !== 'ALL' || selectedState !== 'ALL' || selectedSize !== 'ALL' || minTrustScore > 0 || rawOnly || searchQuery) && (
            <button
              onClick={() => {
                setSelectedFlora('ALL');
                setSelectedState('ALL');
                setSelectedSize('ALL');
                setMinTrustScore(0);
                setRawOnly(false);
                setSearchQuery('');
              }}
              className="ml-auto text-amber-600 dark:text-amber-400 text-xs font-semibold hover:underline"
            >
              {t('action.reset')} {t('action.filter')}
            </button>
          )}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="p-16 text-center text-sm text-slate-400">{t('market.loading')}</div>
      ) : filteredListings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <ShoppingBag className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-base font-bold text-slate-800 dark:text-slate-200">
            {t('market.noResults')}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {t('market.noResultsDesc')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((item) => {
            const discount =
              item.mrpInr > item.priceInr
                ? Math.round(((item.mrpInr - item.priceInr) / item.mrpInr) * 100)
                : 0;

            const displayState = STATE_CODE_MAP[item.state?.toUpperCase()] || item.state;

            return (
              <div
                key={item.id}
                className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-amber-400 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {t('market.pure')}
                    </span>

                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900 flex items-center gap-1">
                      <HeartHandshake className="h-3 w-3 text-amber-500" />
                      {t('market.trust')} {item.trustScore || 94}
                    </span>
                  </div>

                  {/* Honey Title & Variety */}
                  <div>
                    <h3
                      onClick={() => handleOpenDetail(item)}
                      className="font-bold text-base text-slate-900 dark:text-slate-100 cursor-pointer group-hover:text-amber-600 transition"
                    >
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {t(item.floralSource)}
                      </span>
                      <span>•</span>
                      <span>{item.jarSizeGrams}g {t('market.jar')}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />
                        {t(displayState)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Provenance Snippet */}
                  <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>{t('market.batchProvenance')}</span>
                      <strong className="font-mono text-slate-800 dark:text-slate-200">
                        {item.batchId}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('market.beekeeper')}</span>
                      <strong className="text-slate-800 dark:text-slate-200">{item.beekeeperName}</strong>
                    </div>
                  </div>
                </div>

                {/* Pricing & CTA */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                        ₹{item.priceInr}
                      </span>
                      {item.mrpInr > item.priceInr && (
                        <span className="text-xs text-slate-400 line-through">₹{item.mrpInr}</span>
                      )}
                    </div>

                    {discount > 0 && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md dark:bg-emerald-950 dark:text-emerald-400">
                        {discount}% {t('market.off')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleOpenDetail(item)}
                      className="w-full inline-flex items-center justify-center gap-1 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{t('action.details')}</span>
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
                      className="w-full inline-flex items-center justify-center gap-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 transition"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>{t('action.addToCart')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* Notify Me Modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-amber-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  {t('Notify Me on Fresh Harvests')}
                </h3>
              </div>
              <button
                onClick={() => setShowNotifyModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {notifySuccess ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{notifySuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleCreateAlert} className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {t('Subscribe for real-time alerts when rare varieties are extracted and verified.')}
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Your Notification Email')}
                  </label>
                  <input
                    type="email"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNotifyModal(false)}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {t('action.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20"
                  >
                    {t('Subscribe Alert')}
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
