import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  UserCheck,
  UserX,
  Sparkles,
  ChevronDown,
  Building,
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { UserProfile, UserRole } from '../../types';

export const UserManagementView: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [changingRole, setChangingRole] = useState<UserRole>('CONSUMER');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const list: UserProfile[] = snap.docs.map((d) => ({
        id: d.id,
        uid: d.id,
        ...(d.data() as Omit<UserProfile, 'id'>),
      }));
      setUsers(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleUpdateRole = async (uid: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        role: newRole,
        updatedAt: new Date().toISOString(),
      });
      setSuccessMessage(`User role updated to ${newRole}`);
      setSelectedUser(null);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (e) {
      console.error('Update role error:', e);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.beekeeperId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.uid || u.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-amber-500/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30">
              Role-Based Access Control
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-amber-500" />
            Platform User & Role Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audit user accounts, link beekeeper credentials, verify credentials without storing full Aadhaar, and assign system permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-xs">
            {users.length} Registered Accounts
          </span>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search email, name, or Beekeeper ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-medium"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="BEEKEEPER">BEEKEEPER</option>
            <option value="LAB">LAB</option>
            <option value="CONSUMER">CONSUMER</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-bold text-[10px]">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Beekeeper ID</th>
                <th className="p-4">Aadhaar Last-4</th>
                <th className="p-4">Trust Score</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No users matching search filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {u.displayName || 'Anonymous User'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300'
                            : u.role === 'BEEKEEPER'
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            : u.role === 'LAB'
                            ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-amber-600">
                      {u.beekeeperId || '—'}
                    </td>
                    <td className="p-4 font-mono text-slate-500">
                      {u.aadhaarLast4 ? `•••• •••• ${u.aadhaarLast4}` : '—'}
                    </td>
                    <td className="p-4">
                      {u.trustScore !== undefined ? (
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="text-emerald-600">{u.trustScore}</span>
                          <span className="text-[10px] text-slate-400">/100</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setChangingRole(u.role);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition"
                      >
                        Edit Role
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Edit Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Change Role for {selectedUser.displayName || selectedUser.email}
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Select System Role:
              </label>
              {(['CONSUMER', 'BEEKEEPER', 'LAB', 'ADMIN'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setChangingRole(r)}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                    changingRole === r
                      ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{r}</span>
                  {changingRole === r && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateRole(selectedUser.uid || selectedUser.id, changingRole)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow transition"
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
