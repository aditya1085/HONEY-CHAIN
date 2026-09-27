import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Hexagon,
  Layers,
  FlaskConical,
  TrendingUp,
  Database,
  Users,
  ShieldAlert,
  DollarSign,
  Activity,
  Settings,
  Cpu,
  Sparkles,
  ChevronRight,
  Clock,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react';
import { AdminApprovalQueue } from './AdminApprovalQueue';
import { AdminAnalyticsView } from './AdminAnalyticsView';
import { AdminDataManager } from './AdminDataManager';
import { AdminHivesManagement } from './AdminHivesManagement';
import { UserManagementView } from './UserManagementView';
import { MarketplaceModeration } from './MarketplaceModeration';
import { PayoutAndTrustLedger } from './PayoutAndTrustLedger';
import { PlatformSettingsView } from './PlatformSettingsView';
import { ActivityLogViewer } from './ActivityLogViewer';
import { BatchListView } from '../batch/BatchListView';
import { AdminHarvestPool } from '../batch/AdminHarvestPool';
import { LabPortal } from '../lab/LabPortal';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export type AdminConsoleTab =
  | 'beekeepers'
  | 'hives-queue'
  | 'batches'
  | 'lab'
  | 'analytics'
  | 'data-manager'
  | 'hives-fleet'
  | 'users'
  | 'moderation'
  | 'payouts'
  | 'activity-logs'
  | 'settings';

interface AdminConsoleViewProps {
  initialSubTab?: AdminConsoleTab;
  onNavigateTab?: (tab: string) => void;
}

export const AdminConsoleView: React.FC<AdminConsoleViewProps> = ({
  initialSubTab = 'hives-queue',
  onNavigateTab,
}) => {
  const { currentUser, userProfile, activeRole } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdminConsoleTab>(initialSubTab);

  // Batch selection in batch tab
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Hive queue count badge
  const [pendingHivesCount, setPendingHivesCount] = useState<number>(0);
  const [pendingBkCount, setPendingBkCount] = useState<number>(0);

  useEffect(() => {
    setActiveTab(initialSubTab);
  }, [initialSubTab]);

  // Periodic counts poll for Hives & Beekeepers
  useEffect(() => {
    const fetchCounts = async () => {
      // Hives count
      try {
        const res = await fetch('/api/hives');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.hives)) {
            const pending = data.hives.filter(
              (h: any) =>
                h.approvalStage === 'STAGE_1_ADMIN_REVIEW' ||
                h.approvalStage === 'STAGE_3_ADMIN_FINAL' ||
                (!h.approvalStage && h.approvalStatus === 'pending')
            ).length;
            setPendingHivesCount(pending);
          }
        }
      } catch {}

      // Beekeepers count
      try {
        const res = await fetch('/api/beekeepers');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.beekeepers)) {
            const pending = data.beekeepers.filter(
              (b: any) => b.status?.toLowerCase() === 'pending'
            ).length;
            setPendingBkCount(pending);
          }
        }
      } catch {}
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 4000);
    return () => clearInterval(interval);
  }, []);

  const navItems: Array<{
    id: AdminConsoleTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }> = [
    {
      id: 'hives-queue',
      label: 'Hive Approval Queue',
      icon: Hexagon,
      badge: pendingHivesCount > 0 ? pendingHivesCount : undefined,
      badgeColor: 'bg-amber-500 text-slate-950',
    },
    {
      id: 'beekeepers',
      label: 'Beekeeper Queue',
      icon: ShieldCheck,
      badge: pendingBkCount > 0 ? pendingBkCount : undefined,
      badgeColor: 'bg-amber-500 text-slate-950',
    },
    {
      id: 'batches',
      label: 'Batch Management',
      icon: Layers,
    },
    {
      id: 'lab',
      label: 'Lab Management',
      icon: FlaskConical,
    },
    {
      id: 'analytics',
      label: 'Analytics & AI',
      icon: TrendingUp,
    },
    {
      id: 'data-manager',
      label: 'Data Manager',
      icon: Database,
    },
    {
      id: 'hives-fleet',
      label: 'Hives & IoT Fleet',
      icon: Cpu,
    },
    {
      id: 'users',
      label: 'Users & Roles',
      icon: Users,
    },
    {
      id: 'moderation',
      label: 'Moderation',
      icon: ShieldAlert,
    },
    {
      id: 'payouts',
      label: 'Payouts & Trust',
      icon: DollarSign,
    },
    {
      id: 'activity-logs',
      label: 'Audit & Ledger',
      icon: Activity,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Admin Master Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 rounded-3xl p-6 border border-amber-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Master Console</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold">
                Immutable Role Verified
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              <span>National Apiculture & Supply Chain Operations</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Stage 1 & Stage 2 Hive Biosecurity Approval Pipeline, Laboratory Telemetry Inspection, Batch Harmonization, and Economic Settlement Engine.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-left">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Admin</div>
              <div className="text-xs font-bold text-amber-300">{currentUser?.email || 'admin.honeychain@gmail.com'}</div>
            </div>
          </div>
        </div>

        {/* Console Tab Strip */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black leading-none ${
                      isActive ? 'bg-slate-950 text-amber-400' : item.badgeColor || 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab View */}
      <div className="transition-all duration-200">
        {activeTab === 'hives-queue' && (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <Hexagon className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold">Hive Biosecurity & Verification Pipeline:</span>{' '}
                  Stage 1 Admin Initial Review &rarr; Stage 2 Accredited Lab Colony Health Verification &rarr; Stage 3 Final Live Activation.
                </div>
              </div>
            </div>
            <AdminApprovalQueue defaultSubTab="hives" />
          </div>
        )}

        {activeTab === 'beekeepers' && (
          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <span className="font-bold">Beekeeper Credentials & Onboarding Queue:</span>{' '}
                  Verify Aadhaar hash, Madhukranti government ID, apiary coordinates, and generate atomic Beekeeper IDs.
                </div>
              </div>
            </div>
            <AdminApprovalQueue defaultSubTab="beekeepers" />
          </div>
        )}

        {activeTab === 'batches' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>Honey Harvest Pool & Aggregated Batches</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pool raw harvests into commercial batches and inspect lab test provenance.
                </p>
              </div>
            </div>
            <AdminHarvestPool
              onBatchCreated={(bId) => {
                setSelectedBatchId(bId);
              }}
            />
            <BatchListView
              initialSelectedBatchId={selectedBatchId}
              onSelectBatch={(bId) => setSelectedBatchId(bId)}
            />
          </div>
        )}

        {activeTab === 'lab' && (
          <div className="space-y-4">
            <div className="bg-teal-500/10 border border-teal-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-teal-900 dark:text-teal-200">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                <div>
                  <span className="font-bold">Accredited Laboratory & Biosecurity Portal:</span>{' '}
                  CBRTI / NABL accredited analysis, C4 Sugar Isotope testing, HMF, Moisture, and Colony Health certification.
                </div>
              </div>
            </div>
            <LabPortal currentUserId={currentUser?.uid} userRole="ADMIN" />
          </div>
        )}

        {activeTab === 'analytics' && <AdminAnalyticsView />}

        {activeTab === 'data-manager' && <AdminDataManager />}

        {activeTab === 'hives-fleet' && <AdminHivesManagement />}

        {activeTab === 'users' && <UserManagementView />}

        {activeTab === 'moderation' && <MarketplaceModeration />}

        {activeTab === 'payouts' && <PayoutAndTrustLedger />}

        {activeTab === 'activity-logs' && <ActivityLogViewer />}

        {activeTab === 'settings' && <PlatformSettingsView />}
      </div>
    </div>
  );
};
