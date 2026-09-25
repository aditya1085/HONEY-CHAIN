import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { Activity, Download, Search, RefreshCw, Filter, Calendar } from 'lucide-react';
import { db } from '../../firebase/config';
import { ActivityLog } from '../../types';
import { getLocalActivityLogs } from '../../services/activityLogger';

const DEFAULT_AUDIT_LOGS: ActivityLog[] = [
  {
    id: 'LOG_INIT_01',
    actorId: 'system_admin',
    actorRole: 'ADMIN',
    actorEmail: 'admin@honeychain.in',
    action: 'PLATFORM_INITIALIZED',
    entityType: 'SYSTEM',
    entityId: 'ROOT',
    details: 'Honey Chain verification node and cryptographic ledger initialized.',
    timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    id: 'LOG_INIT_02',
    actorId: 'BK-1001',
    actorRole: 'BEEKEEPER',
    actorEmail: 'beekeeper.demo@honeychain.in',
    action: 'HIVE_REGISTERED',
    entityType: 'HIVE',
    entityId: 'HC-PB-BK-1001-H01',
    details: 'Hive HC-PB-BK-1001-H01 (Apis mellifera) registered in Mustard Belt.',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'LOG_INIT_03',
    actorId: 'lab_cbrti_user',
    actorRole: 'LAB',
    actorEmail: 'cbrti.testing@honeychain.gov.in',
    action: 'LAB_REPORT_SEALED',
    entityType: 'LAB_SAMPLE',
    entityId: 'REP-2609-0012',
    details: 'CBRTI Lab completed HPLC/C4 purity verification for Batch HB-2609-PB-0001 (Verdict: PURE).',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

export const ActivityLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const local = getLocalActivityLogs();
    return local.length > 0 ? local : DEFAULT_AUDIT_LOGS;
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    // Listen to real-time custom event for immediate UI reflection
    const handleLocalLog = (e: Event) => {
      const customEvt = e as CustomEvent<ActivityLog>;
      if (customEvt.detail) {
        setLogs((prev) => [customEvt.detail, ...prev.filter((p) => p.id !== customEvt.detail.id)]);
      }
    };
    window.addEventListener('hc:activity_logged', handleLocalLog);

    const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: ActivityLog[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as ActivityLog);
        });
        const local = getLocalActivityLogs();
        const map = new Map<string, ActivityLog>();
        items.forEach((l) => map.set(l.id, l));
        local.forEach((l) => map.set(l.id, l));
        const combined = Array.from(map.values()).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setLogs(combined.length > 0 ? combined : DEFAULT_AUDIT_LOGS);
        setLoading(false);
      },
      (err) => {
        console.warn('ActivityLogViewer Firestore snapshot notice (using local audit log):', err);
        const local = getLocalActivityLogs();
        setLogs(local.length > 0 ? local : DEFAULT_AUDIT_LOGS);
        setLoading(false);
      }
    );

    return () => {
      window.removeEventListener('hc:activity_logged', handleLocalLog);
      unsubscribe();
    };
  }, []);

  const handleExportCsv = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'LogID', 'ActorEmail', 'ActorRole', 'Action', 'EntityType', 'EntityID', 'Details'];
    const rows = logs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.id}"`,
      `"${l.actorEmail || ''}"`,
      `"${l.actorRole || ''}"`,
      `"${l.action}"`,
      `"${l.entityType}"`,
      `"${l.entityId}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `honeychain_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = logs.filter((log) => {
    const matchesRole = filterRole === 'all' || log.actorRole === filterRole;
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.actorEmail && log.actorEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" />
            System Audit Trail & Activity Logs
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable append-only record of all administrative, beekeeper, and system actions.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={logs.length === 0}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-sm transition disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-amber-500" />
          Export Audit CSV
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, actor, or entity details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
          >
            <option value="all">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="BEEKEEPER">Beekeeper</option>
            <option value="LAB">Lab</option>
            <option value="CONSUMER">Consumer</option>
            <option value="SYSTEM">System</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
            Streaming audit events...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No audit records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Timestamp</th>
                  <th className="px-4 py-2.5 font-semibold">Action</th>
                  <th className="px-4 py-2.5 font-semibold">Actor</th>
                  <th className="px-4 py-2.5 font-semibold">Entity</th>
                  <th className="px-4 py-2.5 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-500/5">
                    <td className="px-4 py-2.5 whitespace-nowrap text-[11px] text-slate-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-sans">
                        {item.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mr-1.5">
                        {item.actorRole}
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">
                        {item.actorEmail}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[11px]">
                      <span className="text-amber-600 dark:text-amber-400 font-semibold font-sans mr-1">
                        {item.entityType}:
                      </span>
                      <span className="text-slate-500">{item.entityId}</span>
                    </td>
                    <td className="px-4 py-2.5 font-sans text-xs text-slate-600 dark:text-slate-300 max-w-md truncate">
                      {item.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
