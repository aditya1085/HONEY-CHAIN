import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { Activity, Download, Search, RefreshCw, Filter, Calendar } from 'lucide-react';
import { db } from '../../firebase/config';
import { handleFirestoreError, OperationType } from '../../firebase/errors';
import { ActivityLog } from '../../types';

export const ActivityLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: ActivityLog[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as ActivityLog);
        });
        setLogs(items);
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'activityLogs');
        setLoading(false);
      }
    );

    return () => unsubscribe();
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
