import React from 'react';
import { ShieldCheck, Camera, QrCode, Store, Package, TrendingUp, FlaskConical, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenCamera: () => void;
  onOpenQRScanner: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  setCurrentTab,
  onOpenCamera,
  onOpenQRScanner,
}) => {
  const { activeRole, beekeeperProfile } = useAuth();
  const { t } = useLanguage();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-amber-500/20 py-1.5 px-3 flex items-center justify-around shadow-lg">
      <button
        onClick={() => setCurrentTab('marketplace')}
        className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition ${
          currentTab === 'marketplace' || currentTab === 'home' ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Store className="w-5 h-5" />
        <span className="text-[10px]">{t('nav.marketplace')}</span>
      </button>

      {/* Role-specific Hub: Admin, Lab, Beekeeper, or Consumer */}
      {activeRole === 'ADMIN' ? (
        <button
          onClick={() => setCurrentTab('admin-analytics')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition ${
            currentTab.startsWith('admin')
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px]">{t('role.admin')}</span>
        </button>
      ) : activeRole === 'LAB' ? (
        <button
          onClick={() => setCurrentTab('lab-portal')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition ${
            currentTab === 'lab-portal'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <FlaskConical className="w-5 h-5" />
          <span className="text-[10px]">{t('nav.labPortal')}</span>
        </button>
      ) : (
        <button
          onClick={() => setCurrentTab(beekeeperProfile ? 'my-hives' : 'beekeeper-register')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition ${
            currentTab === 'my-hives' || currentTab === 'beekeeper-register' || currentTab === 'beekeeper-dashboard'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px]">{beekeeperProfile ? t('nav.myHives') : t('nav.registerBeekeeper')}</span>
        </button>
      )}

      {/* Camera Capture Action */}
      <button
        onClick={onOpenCamera}
        className="flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-full bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 active:scale-95 transition"
        title="Quick Photo Capture"
      >
        <Camera className="w-6 h-6" />
      </button>

      {/* QR Scanner */}
      <button
        onClick={onOpenQRScanner}
        className="flex flex-col items-center gap-1 p-1.5 rounded-xl text-slate-500 dark:text-slate-400 transition hover:text-amber-600"
      >
        <QrCode className="w-5 h-5" />
        <span className="text-[10px]">{t('nav.verify')}</span>
      </button>

      {/* State / District Search */}
      <button
        onClick={() => setCurrentTab('search-region')}
        className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition ${
          currentTab === 'search-region' ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'
        }`}
        title="Search by State/District"
      >
        <MapPin className="w-5 h-5" />
        <span className="text-[10px]">State/Dist</span>
      </button>

      {/* Orders */}
      <button
        onClick={() => setCurrentTab('orders')}
        className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition ${
          currentTab === 'orders' ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Package className="w-5 h-5" />
        <span className="text-[10px]">{t('nav.orders')}</span>
      </button>
    </nav>
  );
};
