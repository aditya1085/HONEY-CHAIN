/**
 * Honey Chain — Main Application
 * Phase 1 Architecture
 */

import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { HomeView } from './components/public/HomeView';
import { BeekeeperRegistration } from './components/beekeeper/BeekeeperRegistration';
import { PendingApprovalView } from './components/beekeeper/PendingApprovalView';
import { MyHivesView } from './components/hives/MyHivesView';
import { SpeciesThresholdsEditor } from './components/admin/SpeciesThresholdsEditor';
import { AdminHivesManagement } from './components/admin/AdminHivesManagement';
import { ApiDocsView } from './components/iot/ApiDocsView';
import { AdminApprovalQueue } from './components/admin/AdminApprovalQueue';
import { ActivityLogViewer } from './components/admin/ActivityLogViewer';
import { IdGeneratorsTest } from './components/admin/IdGeneratorsTest';
import { HarvestListView } from './components/harvest/HarvestListView';
import { AdminHarvestPool } from './components/batch/AdminHarvestPool';
import { BatchListView } from './components/batch/BatchListView';
import { LabPortal } from './components/lab/LabPortal';
import { LedgerExplorer } from './components/admin/LedgerExplorer';
import { QRVerifyPage } from './components/public/QRVerifyPage';
import { MarketplaceView } from './components/marketplace/MarketplaceView';
import { ProductDetailModal } from './components/marketplace/ProductDetailModal';
import { CartDrawerModal } from './components/cart/CartDrawerModal';
import { BeekeeperListingsManager } from './components/beekeeper/BeekeeperListingsManager';
import { OrderTrackingView } from './components/orders/OrderTrackingView';
import { PayoutAndTrustLedger } from './components/admin/PayoutAndTrustLedger';
import { AdminAnalyticsView } from './components/admin/AdminAnalyticsView';
import { MarketplaceModeration } from './components/admin/MarketplaceModeration';
import { UserManagementView } from './components/admin/UserManagementView';
import { PlatformSettingsView } from './components/admin/PlatformSettingsView';
import { AdminDataManager } from './components/admin/AdminDataManager';
import { BeeAssistantWidget } from './components/common/BeeAssistantWidget';
import { seedPhase3Data } from './services/seedPhase3';
import { seedPhase4Data } from './services/seedPhase4';
import { CameraCapture, CapturedPhoto } from './components/camera/CameraCapture';
import { QRScanner } from './components/camera/QRScanner';
import { AuthModal } from './components/public/AuthModal';
import { Sparkles, CheckCircle, QrCode, AlertCircle, X, ShieldAlert, Cpu } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase/config';
import { HiveRecord, CartItem, HoneyListing } from './types';

const MainContent: React.FC = () => {
  const { currentUser, beekeeperProfile, activeRole } = useAuth();
  const { t } = useLanguage();

  const [currentTab, setCurrentTab] = useState<string>('marketplace');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [myHives, setMyHives] = useState<HiveRecord[]>([]);

  // Phase 4 Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('honeychain_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<HoneyListing | null>(null);
  const [verifyPackId, setVerifyPackId] = useState<string | null>(null);

  // Sync cart to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('honeychain_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn(e);
    }
  }, [cart]);

  // Seed Phase 3 and Phase 4 demo data on first launch
  React.useEffect(() => {
    seedPhase3Data();
    seedPhase4Data();

    // Check URL parameters for direct pack verification
    const params = new URLSearchParams(window.location.search);
    const pId = params.get('verifyPack') || params.get('packId') || params.get('verify');
    if (pId) {
      setVerifyPackId(pId);
      setCurrentTab('verify-honey');
    }
  }, []);

  // Cart operations
  const handleAddToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.listingId === item.listingId);
      if (existing) {
        return prev.map((i) =>
          i.listingId === item.listingId
            ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.maxStock) }
            : i
        );
      }
      return [...prev, item];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (listingId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(listingId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.listingId === listingId ? { ...i, quantity: Math.min(quantity, i.maxStock) } : i))
    );
  };

  const handleRemoveItem = (listingId: string) => {
    setCart((prev) => prev.filter((i) => i.listingId !== listingId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Fetch hives for beekeeper
  React.useEffect(() => {
    const fetchHives = async () => {
      if (!beekeeperProfile?.beekeeperId) return;
      try {
        const q = query(
          collection(db, 'hives'),
          where('beekeeperId', '==', beekeeperProfile.beekeeperId)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => d.data() as HiveRecord);
        setMyHives(list);
      } catch (err) {
        console.warn('Error fetching beekeeper hives:', err);
      }
    };
    fetchHives();
  }, [beekeeperProfile]);

  // Scan & Camera results notification banner
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);

  const handleScanSuccess = (decoded: string) => {
    setScanResult(decoded);
    // If scanned decoded contains a Honey Chain Pack ID, route immediately to verify-honey
    const packMatch = decoded.match(/HB-\d{4}-[A-Z]{2}-\d{4}-P\d{4}/);
    if (packMatch) {
      setVerifyPackId(packMatch[0]);
      setCurrentTab('verify-honey');
    } else if (decoded.startsWith('HB-') || decoded.includes('verifyPack=')) {
      const urlPack = new URLSearchParams(decoded.split('?')[1] || '').get('verifyPack') || decoded;
      setVerifyPackId(urlPack);
      setCurrentTab('verify-honey');
    }
  };

  const handleCapturePhotos = (photos: CapturedPhoto[]) => {
    setCapturedPhotos(photos);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/40 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header */}
      <Header
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenCamera={() => setIsCameraOpen(true)}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        cartCount={cartCount}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10">
        {/* Scanned QR Code Result Notice */}
        {scanResult && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-slate-950">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                  Decoded QR Code:
                </span>
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {scanResult}
                </span>
              </div>
            </div>
            <button
              onClick={() => setScanResult(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Captured Photos Banner */}
        {capturedPhotos.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 overflow-hidden">
                {capturedPhotos.map((p, i) => (
                  <img
                    key={i}
                    src={p.dataUrl}
                    alt="Captured"
                    className="inline-block h-10 w-10 rounded-lg object-cover ring-2 ring-white dark:ring-slate-900"
                  />
                ))}
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Camera Test Successful: {capturedPhotos.length} photo(s) captured with JPEG compression
                </span>
                <p className="text-[11px] text-slate-500">
                  Ready for AI disease scans and hive registration in Phase 2.
                </p>
              </div>
            </div>
            <button
              onClick={() => setCapturedPhotos([])}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Phase 4 Marketplace View */}
        {currentTab === 'marketplace' && (
          <MarketplaceView
            onSelectListing={(listing) => setSelectedListing(listing)}
            onAddToCart={handleAddToCart}
            onVerifyPack={(pId) => {
              setVerifyPackId(pId);
              setCurrentTab('verify-honey');
            }}
          />
        )}

        {/* Phase 4 Public QR Verification & Ledger Audit Page */}
        {currentTab === 'verify-honey' && (
          <QRVerifyPage
            initialPackId={verifyPackId || undefined}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        )}

        {/* Phase 4 Beekeeper Listings Manager */}
        {currentTab === 'my-listings' && (
          <BeekeeperListingsManager
            beekeeperId={beekeeperProfile?.beekeeperId || 'B001'}
            beekeeperName={beekeeperProfile?.name || currentUser?.displayName || 'Beekeeper'}
          />
        )}

        {/* Phase 4 Order Tracking State Machine */}
        {currentTab === 'orders' && (
          <OrderTrackingView
            userRole={activeRole}
            currentUserId={currentUser?.uid}
            onVerifyPack={(pId) => {
              setVerifyPackId(pId);
              setCurrentTab('verify-honey');
            }}
          />
        )}

        {/* Phase 4 Admin Payouts & Trust Score Engine */}
        {currentTab === 'payouts' && <PayoutAndTrustLedger />}

        {currentTab === 'home' && (
          <HomeView
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenQRScanner={() => setIsQRScannerOpen(true)}
            onOpenCamera={() => setIsCameraOpen(true)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {currentTab === 'beekeeper-register' && (
          beekeeperProfile ? (
            <PendingApprovalView
              beekeeper={beekeeperProfile}
              onNavigateToHives={() => setCurrentTab('my-hives')}
            />
          ) : (
            <BeekeeperRegistration onSuccess={() => setCurrentTab('my-hives')} />
          )
        )}

        {currentTab === 'beekeeper-dashboard' && (
          beekeeperProfile ? (
            <PendingApprovalView
              beekeeper={beekeeperProfile}
              onNavigateToHives={() => setCurrentTab('my-hives')}
            />
          ) : (
            <div className="text-center py-12 space-y-4">
              <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
              <h2 className="text-xl font-bold">No Apiary Registered Yet</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Register your apiary with your Madhukranti portal ID and Aadhaar last 4 digits to start receiving verified batch pack QR codes.
              </p>
              <button
                onClick={() => setCurrentTab('beekeeper-register')}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition"
              >
                Start Beekeeper Registration
              </button>
            </div>
          )
        )}

        {currentTab === 'my-hives' && <MyHivesView />}

        {currentTab === 'harvests' && (
          <HarvestListView
            beekeeperId={beekeeperProfile?.beekeeperId || 'B001'}
            beekeeperName={beekeeperProfile?.name || currentUser?.displayName || 'Beekeeper'}
            beekeeperState={beekeeperProfile?.state || 'UP'}
            hives={myHives}
            onSelectBatch={(bId) => {
              setSelectedBatchId(bId);
              setCurrentTab('batches');
            }}
          />
        )}

        {currentTab === 'harvest-pool' && (
          <AdminHarvestPool
            onBatchCreated={(bId) => {
              setSelectedBatchId(bId);
              setCurrentTab('batches');
            }}
          />
        )}

        {currentTab === 'batches' && (
          <BatchListView
            initialSelectedBatchId={selectedBatchId}
            onSelectBatch={(bId) => setSelectedBatchId(bId)}
          />
        )}

        {currentTab === 'lab-portal' && (
          <LabPortal
            currentUserId={currentUser?.uid}
            userRole={activeRole}
          />
        )}

        {currentTab === 'ledger-explorer' && <LedgerExplorer />}

        {currentTab === 'species-thresholds' && <SpeciesThresholdsEditor />}

        {currentTab === 'admin-hives' && <AdminHivesManagement />}

        {currentTab === 'api-docs' && <ApiDocsView />}

        {currentTab === 'admin-queue' && <AdminApprovalQueue />}

        {currentTab === 'admin-analytics' && <AdminAnalyticsView />}

        {currentTab === 'admin-moderation' && <MarketplaceModeration />}

        {currentTab === 'admin-users' && <UserManagementView />}

        {currentTab === 'admin-settings' && <PlatformSettingsView />}

        {currentTab === 'admin-data' && <AdminDataManager />}

        {currentTab === 'activity-logs' && <ActivityLogViewer />}

        {currentTab === 'id-engine' && <IdGeneratorsTest />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Honey Chain — Direct Beekeeper-to-Consumer Traceability Platform.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Madhukranti Portal Complement</span>
            <span>•</span>
            <span>Polygon Amoy / Cryptographic Hash Chained</span>
          </div>
        </div>
      </footer>

      {/* Bottom Mobile Navigation */}
      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenCamera={() => setIsCameraOpen(true)}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
      />

      {/* Phase 4 Product Detail Modal */}
      {selectedListing && (
        <ProductDetailModal
          isOpen={!!selectedListing}
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onAddToCart={handleAddToCart}
          onVerifyPack={(pId) => {
            setSelectedListing(null);
            setVerifyPackId(pId);
            setCurrentTab('verify-honey');
          }}
        />
      )}

      {/* Phase 4 Cart & Checkout Drawer Modal */}
      <CartDrawerModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOrderPlaced={(orderId) => {
          setCurrentTab('orders');
        }}
      />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapturePhotos}
        multiPhoto={true}
        maxPhotos={4}
      />

      <QRScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Phase 5 Bilingual AI Bee Assistant Chatbot (Madhubot) */}
      <BeeAssistantWidget />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
