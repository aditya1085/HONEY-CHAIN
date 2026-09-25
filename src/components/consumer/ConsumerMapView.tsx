import React, { useState } from 'react';
import { IndiaHivesMap } from '../common/IndiaHivesMap';
import { MapPin, ShieldCheck, Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';
import { CartItem } from '../../types';

interface ConsumerMapViewProps {
  onNavigateToMarketplace?: () => void;
  onAddToCart?: (item: CartItem) => void;
  onSelectBatch?: (batchId: string) => void;
}

export const ConsumerMapView: React.FC<ConsumerMapViewProps> = ({
  onNavigateToMarketplace,
  onAddToCart,
  onSelectBatch,
}) => {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-6 rounded-3xl border border-amber-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
              Consumer Honey Map
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified In-Stock Apiaries Only
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            Trace Single-Origin Honey to the Farm
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            Explore verified beekeepers with live batches available in the marketplace. Every marker represents an authentic, certified apiary with tested C4-free purity.
          </p>
        </div>

        <button
          onClick={() => onNavigateToMarketplace?.()}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-sm self-start md:self-auto"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Browse All Marketplace Honey</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Map */}
      <div className="space-y-3">
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <MapPin className="w-4 h-4 text-amber-500" />
            <span>Use the search bar above the map to search by State, District, Hive ID, Batch ID, or Beekeeper name.</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
            ✓ 100% Raw Certified
          </span>
        </div>

        <IndiaHivesMap role="CONSUMER" heightClass="h-[600px]" />
      </div>
    </div>
  );
};
