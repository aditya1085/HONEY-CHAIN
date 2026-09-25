import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  Hexagon,
  Plus,
  Printer,
  Cpu,
  Search,
  Filter,
  Thermometer,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  MapPin,
  Scale,
} from 'lucide-react';
import { db } from '../../firebase/config';
import { handleFirestoreError, OperationType } from '../../firebase/errors';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { HiveRecord } from '../../types';
import { SAMPLE_DATA_MASTER } from '../../services/sampleDataMaster';
import { AddHiveModal } from './AddHiveModal';
import { PrintableHiveSticker } from './PrintableHiveSticker';
import { PairIoTDeviceModal } from './PairIoTDeviceModal';
import { HiveDetailView } from './HiveDetailView';

export const MyHivesView: React.FC = () => {
  const { beekeeperProfile, currentUser } = useAuth();
  const { t } = useLanguage();

  const bkId = beekeeperProfile?.beekeeperId || 'BK-1001';

  const [hives, setHives] = useState<HiveRecord[]>(() => {
    let local: HiveRecord[] = [];
    try {
      local = JSON.parse(localStorage.getItem('hc_local_hives') || '[]');
    } catch {}
    const list = SAMPLE_DATA_MASTER.hives.filter((h) => h.beekeeperId === bkId);
    const combined = [...local, ...list.filter((h) => !local.some((l) => l.hiveId === h.hiveId))];
    return combined.length > 0 ? combined : SAMPLE_DATA_MASTER.hives.slice(0, 3);
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColony, setFilterColony] = useState('all');

  // Selected Hive for detail view
  const [selectedHive, setSelectedHive] = useState<HiveRecord | null>(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPairOpen, setIsPairOpen] = useState(false);
  const [stickerHive, setStickerHive] = useState<HiveRecord | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'hives'), where('beekeeperId', '==', bkId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: HiveRecord[] = [];
        snapshot.forEach((d) => list.push(d.data() as HiveRecord));
        let local: HiveRecord[] = [];
        try {
          local = JSON.parse(localStorage.getItem('hc_local_hives') || '[]');
        } catch {}
        const combined = [...local, ...list.filter((h) => !local.some((l) => l.hiveId === h.hiveId))];
        if (combined.length > 0) {
          combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setHives(combined);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('MyHivesView listener notice (using master dataset):', err);
        try {
          const local = JSON.parse(localStorage.getItem('hc_local_hives') || '[]');
          const list = SAMPLE_DATA_MASTER.hives.filter((h) => h.beekeeperId === bkId);
          const combined = [...local, ...list.filter((h) => !local.some((l: any) => l.hiveId === h.hiveId))];
          if (combined.length > 0) {
            setHives(combined);
          }
        } catch {}
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [bkId]);

  if (selectedHive) {
    return (
      <HiveDetailView
        hive={selectedHive}
        onBack={() => setSelectedHive(null)}
      />
    );
  }

  const filtered = hives.filter((h) => {
    const matchesColony = filterColony === 'all' || h.colonyType === filterColony;
    const matchesSearch =
      h.hiveId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.colonyType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesColony && matchesSearch;
  });

  const totalYield = hives.reduce((sum, h) => sum + (h.expectedProduction || 0), 0);
  const iotPairedCount = hives.filter((h) => Boolean(h.iotDeviceId)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Hexagon className="w-6 h-6 text-amber-500 fill-amber-500/20" />
            {t('hives.title')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('hives.subtitle')} (<strong className="font-mono text-amber-600 dark:text-amber-400">{bkId}</strong>).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPairOpen(true)}
            disabled={hives.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            <Cpu className="w-4 h-4 text-amber-500" />
            {t('hives.pairIot')}
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            {t('hives.addHive')}
          </button>
        </div>
      </div>

      {/* Apiary Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/20 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Hives</span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">{hives.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/20 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">IoT Paired Hives</span>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">{iotPairedCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/20 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Expected Yield</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{totalYield} kg</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/20 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Health Rating</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">Optimal</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search hive ID, flora area, or species..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterColony}
            onChange={(e) => setFilterColony(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
          >
            <option value="all">All Species</option>
            <option value="Apis cerana indica">Apis cerana indica</option>
            <option value="Apis mellifera">Apis mellifera</option>
            <option value="Apis dorsata">Apis dorsata</option>
            <option value="Apis florea">Apis florea</option>
            <option value="Stingless">Stingless</option>
          </select>
        </div>
      </div>

      {/* Hives Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          Loading apiary hives...
        </div>
      ) : hives.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-amber-500/40 space-y-3">
          <Hexagon className="w-12 h-12 text-amber-500/50 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">No Hives Registered Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click "Add New Hive" to register your first colony box. Unique Hive IDs (<span className="font-mono text-amber-600">HC-UP-{bkId}-H01</span>) will be automatically generated with printable QR stickers.
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Add First Hive
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((hive) => (
            <div
              key={hive.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition shadow-sm flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Top Badge Line */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-black text-amber-600 dark:text-amber-400">
                    {hive.hiveId}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {hive.status.toUpperCase()}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                    {hive.colonyType}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-amber-500" />
                    {hive.area} ({hive.landType})
                  </p>
                </div>

                {/* IoT status indicator */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-[11px] flex items-center justify-between border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-500" />
                    <span>
                      {hive.iotDeviceId ? (
                        <span className="font-mono text-slate-900 dark:text-white font-semibold">
                          Node: {hive.iotDeviceId}
                        </span>
                      ) : (
                        <span className="text-slate-400">No IoT Node Paired</span>
                      )}
                    </span>
                  </div>

                  {hive.iotDeviceId ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Online" />
                  ) : (
                    <button
                      onClick={() => setIsPairOpen(true)}
                      className="text-amber-600 dark:text-amber-400 font-bold hover:underline text-[10px]"
                    >
                      + Pair
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Architecture: {hive.hiveType}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Est: {hive.expectedProduction} kg
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setStickerHive(hive)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition"
                >
                  <Printer className="w-3.5 h-3.5" /> Sticker
                </button>

                <button
                  onClick={() => setSelectedHive(hive)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition"
                >
                  <span>Live Telemetry & Detail</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Hive Modal */}
      <AddHiveModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={(newHive) => {
          setIsAddOpen(false);
        }}
      />

      {/* Pair IoT Modal */}
      <PairIoTDeviceModal
        isOpen={isPairOpen}
        onClose={() => setIsPairOpen(false)}
        hives={hives}
      />

      {/* Printable Hive Sticker Modal */}
      {stickerHive && (
        <PrintableHiveSticker
          hive={stickerHive}
          onClose={() => setStickerHive(null)}
        />
      )}
    </div>
  );
};
