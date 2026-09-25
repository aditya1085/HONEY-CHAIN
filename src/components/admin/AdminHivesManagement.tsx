import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import {
  Hexagon,
  Cpu,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  MapPin,
  Battery,
  Clock,
  Printer,
} from 'lucide-react';
import { db } from '../../firebase/config';
import { handleFirestoreError, OperationType } from '../../firebase/errors';
import { HiveRecord, IoTDevice } from '../../types';
import { logActivity } from '../../services/activityLogger';
import { PrintableHiveSticker } from '../hives/PrintableHiveSticker';
import { IndiaHivesMap } from '../common/IndiaHivesMap';
import { useLanguage } from '../../context/LanguageContext';
import { SAMPLE_DATA_MASTER } from '../../services/sampleDataMaster';

export const AdminHivesManagement: React.FC = () => {
  const { t } = useLanguage();
  const [hives, setHives] = useState<HiveRecord[]>(SAMPLE_DATA_MASTER.hives);
  const [devices, setDevices] = useState<IoTDevice[]>(SAMPLE_DATA_MASTER.iotDevices);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'hives' | 'devices'>('hives');

  const [isSweeping, setIsSweeping] = useState(false);
  const [sweepResult, setSweepResult] = useState<string | null>(null);
  const [stickerHive, setStickerHive] = useState<HiveRecord | null>(null);

  // Real-time Hives Listener
  useEffect(() => {
    const unsubHives = onSnapshot(
      collection(db, 'hives'),
      (snapshot) => {
        const list: HiveRecord[] = [];
        snapshot.forEach((d) => list.push(d.data() as HiveRecord));
        if (list.length > 0) setHives(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Hives listener notice (using master dataset):', err);
        setLoading(false);
      }
    );

    const unsubDevices = onSnapshot(
      collection(db, 'iotDevices'),
      (snapshot) => {
        const list: IoTDevice[] = [];
        snapshot.forEach((d) => list.push(d.data() as IoTDevice));
        if (list.length > 0) setDevices(list);
      },
      (err) => {
        console.warn('IoT devices listener notice:', err);
      }
    );

    return () => {
      unsubHives();
      unsubDevices();
    };
  }, []);

  const handleSweepOffline = async () => {
    setIsSweeping(true);
    setSweepResult(null);
    try {
      const res = await fetch('/api/iot/offline-check', { method: 'POST' });
      const data = await res.json();
      if (data.devicesMarkedOffline?.length > 0) {
        setSweepResult(`Sweep complete: ${data.devicesMarkedOffline.length} device(s) marked offline and health alerts generated.`);
      } else {
        setSweepResult('Sweep complete: All active IoT nodes are communicating normally.');
      }
      setTimeout(() => setSweepResult(null), 5000);
    } catch (err: unknown) {
      console.error('Sweep failed:', err);
      setSweepResult('Offline sweep failed to complete.');
    } finally {
      setIsSweeping(false);
    }
  };

  const handleToggleHiveStatus = async (hive: HiveRecord) => {
    const nextStatus = hive.status === 'active' ? 'inactive' : 'active';
    try {
      await updateDoc(doc(db, 'hives', hive.id), {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });

      await logActivity({
        action: 'HIVE_STATUS_CHANGED',
        entityType: 'HIVE',
        entityId: hive.hiveId,
        details: `Hive status updated to ${nextStatus}`,
        actorRole: 'ADMIN',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `hives/${hive.id}`);
    }
  };

  const filteredHives = hives.filter(
    (h) =>
      h.hiveId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.beekeeperId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.colonyType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDevices = devices.filter(
    (d) =>
      d.deviceSerial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.hiveId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.beekeeperId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Hexagon className="w-5 h-5 text-amber-500 fill-amber-500/20" />
            {t('hives & iot matrix')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('real-time telemetry monitoring across all registered hives in india.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSweepOffline}
            disabled={isSweeping}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSweeping ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </button>
        </div>
      </div>

      {/* Interactive India Leaflet Geo-Telemetry Map */}
      <IndiaHivesMap hives={hives} beekeepers={SAMPLE_DATA_MASTER.beekeepers} />

      {sweepResult && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold animate-in fade-in">
          {sweepResult}
        </div>
      )}

      {/* Sub tabs: Hives vs IoT Devices */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('hives')}
          className={`pb-3 px-3 transition border-b-2 ${
            activeSubTab === 'hives'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {t('all registered hives')} ({hives.length})
        </button>

        <button
          onClick={() => setActiveSubTab('devices')}
          className={`pb-3 px-3 transition border-b-2 flex items-center gap-1.5 ${
            activeSubTab === 'devices'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          {t('paired iot hardware')} ({devices.length})
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by Hive ID, Beekeeper ID, Device Serial, or Flora Area..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
        />
      </div>

      {/* Table: Hives */}
      {activeSubTab === 'hives' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Hive ID</th>
                  <th className="px-4 py-3 font-semibold">Beekeeper</th>
                  <th className="px-4 py-3 font-semibold">Species & Architecture</th>
                  <th className="px-4 py-3 font-semibold">Flora / GPS</th>
                  <th className="px-4 py-3 font-semibold">IoT Device</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredHives.map((hive) => (
                  <tr key={hive.id} className="hover:bg-amber-500/5 transition">
                    <td className="px-4 py-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {hive.hiveId}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-200">
                      {hive.beekeeperId}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{hive.colonyType}</div>
                      <div className="text-[10px] text-slate-400">{hive.hiveType}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      <div>{hive.area}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {hive.lat != null && hive.lng != null ? `${Number(hive.lat).toFixed(4)}, ${Number(hive.lng).toFixed(4)}` : 'Coordinates N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {hive.iotDeviceId ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {hive.iotDeviceId}
                        </span>
                      ) : (
                        <span className="text-slate-400">Unpaired</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          hive.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {hive.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => setStickerHive(hive)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold"
                      >
                        <Printer className="w-3 h-3" /> QR
                      </button>

                      <button
                        onClick={() => handleToggleHiveStatus(hive)}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-semibold"
                      >
                        {hive.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table: IoT Hardware Devices */}
      {activeSubTab === 'devices' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Device Serial / Node</th>
                  <th className="px-4 py-3 font-semibold">Paired Hive</th>
                  <th className="px-4 py-3 font-semibold">Beekeeper</th>
                  <th className="px-4 py-3 font-semibold">Hardware Model</th>
                  <th className="px-4 py-3 font-semibold">Battery</th>
                  <th className="px-4 py-3 font-semibold">Last Telemetry Ping</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredDevices.map((dev) => (
                  <tr key={dev.id} className="hover:bg-amber-500/5 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {dev.deviceSerial}
                    </td>
                    <td className="px-4 py-3 font-mono text-amber-600 dark:text-amber-400 font-bold">
                      {dev.hiveId}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                      {dev.beekeeperId}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {dev.model}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className="flex items-center gap-1">
                        <Battery className="w-3.5 h-3.5 text-slate-400" />
                        {dev.batteryPercent}%
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {dev.lastReadingAt ? new Date(dev.lastReadingAt).toLocaleTimeString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          dev.status === 'online'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            dev.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                          }`}
                        />
                        {dev.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
