import React, { useState } from 'react';
import {
  Hexagon,
  Moon,
  Sun,
  Languages,
  User,
  ShieldCheck,
  Camera,
  QrCode,
  LogIn,
  LogOut,
  Sparkles,
  ChevronDown,
  ShoppingBag,
  Store,
  FileCheck2,
  Package,
  TrendingUp,
  Database,
  ShieldAlert,
  Users,
  Settings,
  Activity,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole } from '../../types';
import { NotificationsBell } from './NotificationsBell';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenCamera: () => void;
  onOpenQRScanner: () => void;
  onOpenCart?: () => void;
  cartCount?: number;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onOpenCamera,
  onOpenQRScanner,
  onOpenCart,
  cartCount = 0,
  currentTab,
  setCurrentTab,
}) => {
  const { currentUser, userProfile, activeRole, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  const roles: Array<{ role: UserRole; label: string }> = [
    { role: 'CONSUMER', label: t('role.consumer') },
    { role: 'BEEKEEPER', label: t('role.beekeeper') },
    { role: 'ADMIN', label: t('role.admin') },
    { role: 'LAB', label: t('role.lab') },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-amber-500/20 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div
          onClick={() => setCurrentTab('marketplace')}
          className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
        >
          <div className="relative w-10 h-10 rounded-2xl bg-linear-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition">
            <Hexagon className="w-6 h-6 stroke-[2.2] fill-amber-300/30" />
            <span className="absolute text-[11px] font-black tracking-tighter">HC</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                {t('brand.title')}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block truncate max-w-[210px]">
              {t('brand.tagline')}
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold overflow-x-auto py-1">
          {/* Marketplace / Shop */}
          <button
            onClick={() => setCurrentTab('marketplace')}
            className={`px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              currentTab === 'marketplace'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('nav.marketplace')}</span>
          </button>

          {/* QR Verify Public Tool */}
          <button
            onClick={() => setCurrentTab('verify-honey')}
            className={`px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              currentTab === 'verify-honey'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('nav.verify')}</span>
          </button>

          {/* Search by State / District (Accessible to Consumer, Admin, and Lab) */}
          <button
            onClick={() => setCurrentTab('search-region')}
            className={`px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              currentTab === 'search-region'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span>Search State/District</span>
          </button>

          {/* Consumer Dedicated Scoped Map and Analytics/Insights */}
          {activeRole === 'CONSUMER' && (
            <>
              <button
                onClick={() => setCurrentTab('consumer-map')}
                className={`px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  currentTab === 'consumer-map'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>Honey Map</span>
              </button>

              <button
                onClick={() => setCurrentTab('consumer-analytics')}
                className={`px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  currentTab === 'consumer-analytics'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                <span>Purity & AI Insights</span>
              </button>
            </>
          )}

          {/* Beekeeper Links */}
          {(activeRole === 'BEEKEEPER' || activeRole === 'ADMIN') && (
            <>
              <button
                onClick={() => setCurrentTab('my-hives')}
                className={`px-2.5 py-1.5 rounded-xl transition ${
                  currentTab === 'my-hives'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t('nav.myHives')}
              </button>

              <button
                onClick={() => setCurrentTab('harvests')}
                className={`px-2.5 py-1.5 rounded-xl transition ${
                  currentTab === 'harvests'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t('nav.harvests')}
              </button>

              <button
                onClick={() => setCurrentTab('my-listings')}
                className={`px-2.5 py-1.5 rounded-xl transition ${
                  currentTab === 'my-listings'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t('nav.listings')}
              </button>
            </>
          )}

          {/* Batches & Traceability */}
          {(activeRole === 'BEEKEEPER' || activeRole === 'ADMIN' || activeRole === 'LAB') && (
            <button
              onClick={() => setCurrentTab('batches')}
              className={`px-2.5 py-1.5 rounded-xl transition ${
                currentTab === 'batches'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('nav.batches')}
            </button>
          )}

          {/* Orders Tracking */}
          <button
            onClick={() => setCurrentTab('orders')}
            className={`px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 ${
              currentTab === 'orders'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-blue-500" />
            <span>{t('nav.orders')}</span>
          </button>

          {/* Lab Portal Link */}
          {(activeRole === 'LAB' || activeRole === 'ADMIN') && (
            <button
              onClick={() => setCurrentTab('lab-portal')}
              className={`px-2.5 py-1.5 rounded-xl transition ${
                currentTab === 'lab-portal'
                  ? 'bg-teal-500/15 text-teal-700 dark:text-teal-400 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('nav.labPortal')}
            </button>
          )}

          {/* Admin Tools */}
          {activeRole === 'ADMIN' && (
            <>
              <button
                onClick={() => setCurrentTab('admin-analytics')}
                className={`px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  currentTab === 'admin-analytics'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('nav.analytics')}</span>
              </button>

              <button
                onClick={() => setCurrentTab('admin-data')}
                className={`px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  currentTab === 'admin-data'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-blue-500" />
                <span>{t('nav.dataManager')}</span>
              </button>

              {/* Admin Console Dropdown for All Phase 1-5 Modules */}
              <div className="relative">
                <button
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  className={`px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 ${
                    [
                      'admin-queue',
                      'admin-moderation',
                      'admin-users',
                      'admin-settings',
                      'activity-logs',
                      'payouts',
                      'harvest-pool',
                      'ledger-explorer',
                      'species-thresholds',
                      'admin-hives',
                    ].includes(currentTab)
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{t('nav.adminConsole')}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {adminMenuOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 text-xs animate-in fade-in space-y-0.5">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">
                      {t('nav.operations')}:
                    </div>
                    <button
                      onClick={() => {
                        setCurrentTab('search-region');
                        setAdminMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-amber-500/10 flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      <span>Search State / District</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentTab('admin-queue');
                        setAdminMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-amber-500/10 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t('nav.approvalQueue')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentTab('admin-moderation');
                        setAdminMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-amber-500/10 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                      <span>{t('nav.moderation')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentTab('admin-users');
                        setAdminMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-amber-500/10 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                    >
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      <span>{t('nav.users')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentTab('payouts');
                        setAdminMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-amber-500/10 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                    >
                      <Store className="w-3.5 h-3.5 text-purple-500" />
                      <span>{t('nav.payouts')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentTab('harvest-pool');
                        setAdminMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-amber-500/10 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                    >
                      <Package className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t('nav.harvestPool')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentTab('activity-logs');
                        setAdminMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-amber-500/10 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                    >
                      <Activity className="w-3.5 h-3.5 text-teal-500" />
                      <span>{t('nav.activityLogs')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentTab('ledger-explorer');
                        setAdminMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-amber-500/10 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{t('nav.ledgerExplorer')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentTab('admin-settings');
                        setAdminMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-amber-500/10 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t('nav.settings')}</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </nav>

        {/* Action Controls & Utilities */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Shopping Cart with count badge */}
          {onOpenCart && (
            <button
              onClick={onOpenCart}
              title="View Cart"
              className="relative p-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 transition"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-xs">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          )}

          {/* In-App Notifications Bell */}
          <NotificationsBell
            userId={currentUser?.uid || 'guest'}
            userEmail={currentUser?.email || undefined}
            onSelectNotification={(notif) => {
              if (notif.data?.orderId) {
                setCurrentTab('orders');
              } else if (notif.data?.batchId) {
                setCurrentTab('batches');
              } else if (notif.data?.packId) {
                setCurrentTab('verify-honey');
              }
            }}
          />

          {/* Reusable QR Scanner Launcher */}
          <button
            onClick={onOpenQRScanner}
            title="Scan Jar QR Code"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            <QrCode className="w-4 h-4 text-amber-500" />
          </button>

          {/* Reusable Camera Launcher */}
          <button
            onClick={onOpenCamera}
            title="Open Camera Tool"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            <Camera className="w-4 h-4 text-amber-500" />
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Switch Language (English / हिंदी)"
          >
            <Languages className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'en' ? 'EN' : 'हिंदी'}</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Verified Immutable Role Badge (Server-Enforced, Non-Switchable) */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold select-none shadow-xs"
            title={`Authenticated as ${userProfile?.email || 'User'} (${activeRole})`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{roles.find((r) => r.role === activeRole)?.label || activeRole}</span>
          </div>

          {/* User Auth Info / Login */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </div>
                <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                  {userProfile?.beekeeperId || userProfile?.role || 'User'}
                </div>
              </div>

              <button
                onClick={async () => {
                  await signOut();
                  setCurrentTab('home');
                }}
                title="Sign Out"
                className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/40 dark:text-slate-300 dark:hover:text-red-400 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t('nav.signIn')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
