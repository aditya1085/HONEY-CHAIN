import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  QrCode,
  Hexagon,
  ArrowRight,
  Sparkles,
  Award,
  Activity,
  CheckCircle2,
  Camera,
  Cpu,
  Lock,
  Layers,
  Search,
} from 'lucide-react';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface HomeViewProps {
  onNavigate: (tab: string) => void;
  onOpenQRScanner: () => void;
  onOpenCamera: () => void;
  onOpenAuth: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenQRScanner,
  onOpenCamera,
  onOpenAuth,
}) => {
  const { currentUser, beekeeperProfile, activeRole } = useAuth();
  const { t } = useLanguage();

  const [registeredBeekeepersCount, setRegisteredBeekeepersCount] = useState<number>(0);
  const [activeHivesCount, setActiveHivesCount] = useState<number>(0);
  const [verifiedBatchesCount, setVerifiedBatchesCount] = useState<number>(0);

  // Live Firestore counters listener
  useEffect(() => {
    const unsubBeekeepers = onSnapshot(
      collection(db, 'beekeepers'),
      (snap) => {
        setRegisteredBeekeepersCount(snap.size);
      },
      () => {}
    );

    const unsubHives = onSnapshot(
      collection(db, 'hives'),
      (snap) => {
        setActiveHivesCount(snap.size);
      },
      () => {}
    );

    return () => {
      unsubBeekeepers();
      unsubHives();
    };
  }, []);

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-amber-500 via-amber-600 to-yellow-600 text-slate-950 p-6 md:p-12 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/20 backdrop-blur-md text-slate-950 text-xs font-bold border border-slate-950/15">
            <Hexagon className="w-4 h-4 fill-slate-950/30" />
            Complements Government Madhukranti Beekeeping Portal
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Traceable Pure Honey from Hive to Your Home.
          </h1>

          <p className="text-sm md:text-base font-medium text-slate-900/90 leading-relaxed max-w-2xl">
            Empowering Indian beekeepers to sell pure, lab-certified honey directly to consumers. Every jar is backed by IoT hive sensors, NABL purity reports, and cryptographic tamper-evident ledger verification.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={onOpenQRScanner}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-950 hover:bg-slate-900 text-amber-400 font-bold text-xs shadow-lg transition active:scale-95"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Verify Honey Pack QR</span>
            </button>

            <button
              onClick={() => onNavigate(beekeeperProfile ? 'beekeeper-dashboard' : 'beekeeper-register')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/90 hover:bg-white text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>{beekeeperProfile ? 'View My Apiary' : 'Register as Beekeeper'}</span>
            </button>

            <button
              onClick={() => onNavigate('id-engine')}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-700/40 hover:bg-amber-700/60 text-slate-950 font-bold text-xs border border-slate-950/15 transition"
            >
              <Cpu className="w-4 h-4" />
              <span>Explore ID Engine</span>
            </button>
          </div>
        </div>

        {/* Decorative honeycomb illustration background */}
        <div className="absolute -right-12 -bottom-12 w-80 h-80 opacity-15 pointer-events-none">
          <Hexagon className="w-full h-full stroke-[1.5]" />
        </div>
      </section>

      {/* Live System Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/20 shadow-sm text-center">
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {registeredBeekeepersCount}
          </div>
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">
            Registered Beekeepers
          </div>
          <span className="text-[10px] text-slate-400">Govt ID & Madhukranti</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/20 shadow-sm text-center">
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {activeHivesCount}
          </div>
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">
            Tracked Hives
          </div>
          <span className="text-[10px] text-slate-400">IoT & Health Monitored</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/20 shadow-sm text-center">
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            100%
          </div>
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">
            Purity Guarantee
          </div>
          <span className="text-[10px] text-slate-400">NABL Accredited Labs</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/20 shadow-sm text-center">
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            0
          </div>
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">
            Middlemen
          </div>
          <span className="text-[10px] text-slate-400">Direct Farm Gate Payout</span>
        </div>
      </section>

      {/* 4 Roles Architecture Overview */}
      <section className="space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            A Complete 4-Role Traceability Ecosystem
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Engineered with strict zero-trust Firestore Security Rules, custom claims, and transaction-safe atomic IDs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Beekeeper */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/20 hover:border-amber-500/40 transition shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                🐝
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Beekeeper</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Register apiary with GPS coordinates, verify Aadhaar last 4 & Madhukranti ID, receive automated Beekeeper ID (<span className="font-mono text-amber-600">B045</span>), monitor hives.
              </p>
            </div>
            <button
              onClick={() => onNavigate('beekeeper-register')}
              className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-between group"
            >
              <span>Register / Status</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>
          </div>

          {/* Admin */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/20 hover:border-amber-500/40 transition shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                🛡️
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">System Admin</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verify Madhukranti credentials, approve beekeepers, oversee audit logs, supervise atomic sequence counters and platform settings.
              </p>
            </div>
            <button
              onClick={() => onNavigate('admin-queue')}
              className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-between group"
            >
              <span>Review Approvals</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>
          </div>

          {/* Accredited Lab */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/20 hover:border-amber-500/40 transition shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                🧪
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">NABL Lab</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receive auto-generated Lab Sample IDs (<span className="font-mono text-amber-600">LS-2609-0001</span>), record moisture, HMF, sucrose, and seal reports with cryptographic SHA-256 hashes.
              </p>
            </div>
            <button
              onClick={() => onNavigate('id-engine')}
              className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-between group"
            >
              <span>Test Sample IDs</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>
          </div>

          {/* Consumer */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/20 hover:border-amber-500/40 transition shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                🍯
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Consumer</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scan QR codes on honey jars to view full lab purity reports, origin hives map, Trust Score breakdown (50% Purity + 25% Reviews + 25% Feedback).
              </p>
            </div>
            <button
              onClick={onOpenQRScanner}
              className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-between group"
            >
              <span>Scan QR Code</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>
          </div>
        </div>
      </section>

      {/* Reusable Camera & QR Quick Bar */}
      <section className="p-6 rounded-3xl bg-slate-900 text-white border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-amber-400">
            Phase 1 Hardware Tools: Camera & QR Scanner
          </h3>
          <p className="text-xs text-slate-400 max-w-xl mt-0.5">
            Test the native `getUserMedia` camera with torch, front/back switch, compression, multi-photo, and the QR decoder directly in your browser.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onOpenCamera}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition shadow"
          >
            <Camera className="w-4 h-4" /> Launch Camera
          </button>
          <button
            onClick={onOpenQRScanner}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold transition shadow"
          >
            <QrCode className="w-4 h-4 text-amber-400" /> Launch QR Scanner
          </button>
        </div>
      </section>
    </div>
  );
};
