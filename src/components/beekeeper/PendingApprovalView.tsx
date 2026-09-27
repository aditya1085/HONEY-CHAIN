import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, CheckCircle2, QrCode, MapPin, Award, ArrowRight, RefreshCw } from 'lucide-react';
import { BeekeeperProfile } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface PendingApprovalViewProps {
  beekeeper: BeekeeperProfile;
  onNavigateToHives?: () => void;
}

export const PendingApprovalView: React.FC<PendingApprovalViewProps> = ({
  beekeeper,
  onNavigateToHives,
}) => {
  const { t } = useLanguage();
  const { refreshBeekeeperProfile } = useAuth();
  const [checking, setChecking] = useState(false);

  // Poll for approval status updates every 3 seconds while pending
  useEffect(() => {
    if (beekeeper.status !== 'approved' || !beekeeper.beekeeperId) {
      const interval = setInterval(async () => {
        try {
          await refreshBeekeeperProfile();
        } catch {}
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [beekeeper.status, beekeeper.beekeeperId, refreshBeekeeperProfile]);

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      await refreshBeekeeperProfile();
    } finally {
      setTimeout(() => setChecking(false), 600);
    }
  };

  // Only display Approved screen if status is explicitly 'approved' AND has an assigned Beekeeper ID
  if (beekeeper.status === 'approved' && beekeeper.beekeeperId) {
    return (
      <div className="max-w-2xl mx-auto p-6 md:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-emerald-500/30 shadow-xl text-center">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-2">
          <Award className="w-3.5 h-3.5" /> Approved Beekeeper
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Welcome, {beekeeper.name}!
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Your credentials have been verified against National Bee Board & Madhukranti records.
        </p>

        {/* Assigned ID Badge */}
        <div className="my-6 p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/30">
          <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Official Beekeeper ID
          </span>
          <div className="text-3xl font-mono font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {beekeeper.beekeeperId}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            State: {beekeeper.state} | District: {beekeeper.district} | Madhukranti ID: {beekeeper.madhukrantiId}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onNavigateToHives}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition cursor-pointer"
          >
            Go to My Hives & Sensors <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (beekeeper.status === 'rejected' || beekeeper.status === 'suspended') {
    return (
      <div className="max-w-2xl mx-auto p-6 md:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-red-500/30 shadow-xl text-center">
        <div className="w-16 h-16 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Application {beekeeper.status === 'rejected' ? 'Rejected' : 'Suspended'}
        </h2>
        <div className="my-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-500/20 text-xs text-red-700 dark:text-red-300 text-left">
          <span className="font-bold block mb-1">Reason provided by Administrator:</span>
          <p>{beekeeper.rejectionReason || 'Documentation mismatch with government portal registry. Please contact admin.'}</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Need assistance? Please contact support or update your Madhukranti Portal registration.
        </p>
      </div>
    );
  }

  // Pending Status View
  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/30 shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <Clock className="w-8 h-8 animate-pulse text-amber-500" />
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
            Pending Admin Approval
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            Your registration is pending Admin approval
          </h2>
        </div>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
        Your apiary registration details have been submitted and are currently in the Admin verification queue. Once an administrator validates your Madhukranti portal credentials, you will be assigned an official Beekeeper ID (e.g. <span className="font-mono font-bold text-amber-600 dark:text-amber-400">B045</span>) and gain access to hive registration and IoT sensors.
      </p>

      {/* Verification Steps Indicator */}
      <div className="space-y-3 mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">✓</div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200">Application Submitted</div>
            <div className="text-[11px] text-slate-500">Apiary coordinates & Aadhaar last 4 recorded</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold animate-pulse">2</div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200">Madhukranti Portal Cross-Check</div>
            <div className="text-[11px] text-slate-500">Awaiting administrator verification in queue</div>
          </div>
        </div>

        <div className="flex items-center gap-3 opacity-60">
          <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold">3</div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200">ID Assignment & Hive Activation</div>
            <div className="text-[11px] text-slate-500">Unique ID (B0xx) generated atomically in Firestore transaction</div>
          </div>
        </div>
      </div>

      {/* Details summary */}
      <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-amber-50/60 dark:bg-slate-800/60 text-xs border border-amber-500/20">
        <div>
          <span className="text-slate-500 dark:text-slate-400">Applicant:</span>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{beekeeper.name}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Contact Number:</span>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{beekeeper.phone || 'N/A'}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Madhukranti Portal ID:</span>
          <p className="font-mono font-bold text-amber-600 dark:text-amber-400">{beekeeper.madhukrantiId}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Aadhaar (Last 4):</span>
          <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">•••• •••• {beekeeper.aadhaarLast4}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Location:</span>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{beekeeper.district}, {beekeeper.state}</p>
          <p className="font-mono text-[10px] text-slate-400">GPS: {beekeeper.lat != null ? Number(beekeeper.lat).toFixed(4) : '26.8467'}, {beekeeper.lng != null ? Number(beekeeper.lng).toFixed(4) : '80.9462'}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Total Hives Planned:</span>
          <p className="font-bold text-slate-900 dark:text-white">{beekeeper.totalHivesPlanned || beekeeper.totalHivesCount || 10} boxes</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500">
        <span>Status updates automatically in real-time when approved by Admin.</span>
        <button
          type="button"
          onClick={handleManualCheck}
          disabled={checking}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
          <span>Check Approval Status</span>
        </button>
      </div>
    </div>
  );
};
