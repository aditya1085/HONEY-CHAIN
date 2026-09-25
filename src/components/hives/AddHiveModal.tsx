import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { X, Camera, MapPin, Upload, Navigation, ShieldCheck, Sparkles, Check, AlertCircle } from 'lucide-react';
import { db } from '../../firebase/config';
import { handleFirestoreError, OperationType } from '../../firebase/errors';
import { useAuth } from '../../context/AuthContext';
import { generateHiveId } from '../../services/idGenerators';
import { logActivity } from '../../services/activityLogger';
import { recordLedgerBlock } from '../../services/blockchainService';
import { HiveRecord, HiveType, ColonyType, LandType } from '../../types';
import { CameraCapture, CapturedPhoto } from '../camera/CameraCapture';
import { PrintableHiveSticker } from './PrintableHiveSticker';

interface AddHiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (hive: HiveRecord) => void;
}

export const AddHiveModal: React.FC<AddHiveModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { beekeeperProfile, currentUser } = useAuth();

  const [colonyType, setColonyType] = useState<ColonyType>('Apis cerana indica');
  const [hiveType, setHiveType] = useState<HiveType>('Langstroth');
  const [landType, setLandType] = useState<LandType>('Farmland');
  const [area, setArea] = useState('Mustard & Eucalyptus Belt');
  const [address, setAddress] = useState(beekeeperProfile?.address || '');
  const [lat, setLat] = useState<number>(beekeeperProfile?.lat || 26.8467);
  const [lng, setLng] = useState<number>(beekeeperProfile?.lng || 80.9462);
  const [setupDate, setSetupDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [expectedProduction, setExpectedProduction] = useState<number>(18);
  const [imageUrl, setImageUrl] = useState<string>('');

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sticker preview modal state upon successful creation
  const [createdHive, setCreatedHive] = useState<HiveRecord | null>(null);

  if (!isOpen) return null;

  const handleAutoDetectGps = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
        setDetectingGps(false);
      },
      (err) => {
        console.warn('GPS detection failed:', err);
        setErrorMsg('Could not detect GPS coordinates. Please input them manually.');
        setDetectingGps(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleCapturePhoto = (photos: CapturedPhoto[]) => {
    if (photos.length > 0) {
      setImageUrl(photos[0].dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setImageUrl(loadEvt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const bkId = beekeeperProfile?.beekeeperId || 'B001';
    const state = beekeeperProfile?.state || 'Uttar Pradesh';

    setIsSubmitting(true);

    try {
      // 1. Transaction-safe atomic Hive ID generator: HC-[State]-[BeekeeperID]-H[Seq]
      const { hiveId, seq } = await generateHiveId(state, bkId);

      const docId = `HIVE_${hiveId.replace(/[^a-zA-Z0-9]/g, '_')}`;

      const hiveData: HiveRecord = {
        id: docId,
        hiveId,
        beekeeperId: bkId,
        hiveType,
        colonyType,
        area: area.trim(),
        landType,
        lat,
        lng,
        address: address.trim(),
        imageUrl: imageUrl || undefined,
        setupDate,
        registrationDate: new Date().toISOString(),
        expectedProduction: Number(expectedProduction) || 15,
        status: 'active',
        approvalStatus: 'approved',
        isSample: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 2. Persist to Firestore
      await setDoc(doc(db, 'hives', docId), hiveData);

      // 3. Anchor Hive registration onto Cryptographic / Polygon Amoy Ledger
      try {
        await recordLedgerBlock('HIVE_REGISTERED', hiveId, {
          beekeeperId: bkId,
          colonyType,
          hiveType,
          area: area.trim(),
          lat,
          lng,
          registrationDate: hiveData.registrationDate,
        });
      } catch (ledgerErr) {
        console.warn('Ledger block anchoring warning (continuing):', ledgerErr);
      }

      // 4. Log Activity
      await logActivity({
        action: 'HIVE_REGISTERED',
        entityType: 'HIVE',
        entityId: hiveId,
        details: `Hive ${hiveId} (${colonyType}) registered in ${area} by beekeeper ${bkId}`,
        actorRole: 'BEEKEEPER',
      });

      setCreatedHive(hiveData);
      onSuccess(hiveData);
    } catch (err) {
      console.error('Failed to create hive:', err);
      handleFirestoreError(err, OperationType.CREATE, 'hives');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdHive) {
    return (
      <PrintableHiveSticker
        hive={createdHive}
        onClose={() => {
          setCreatedHive(null);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative flex flex-col w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/30 shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-base font-bold text-amber-400">
              Register New Hive to Apiary
            </h3>
            <p className="text-xs text-slate-400">
              Hive ID will be generated atomically with an immutable QR sticker.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Colony Type & Architecture */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Colony Species *
                </label>
                <select
                  value={colonyType}
                  onChange={(e) => setColonyType(e.target.value as ColonyType)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
                >
                  <option value="Apis cerana indica">Apis cerana indica (Indian Hive Bee)</option>
                  <option value="Apis mellifera">Apis mellifera (European Honey Bee)</option>
                  <option value="Apis dorsata">Apis dorsata (Giant Rock Bee)</option>
                  <option value="Apis florea">Apis florea (Little Dwarf Bee)</option>
                  <option value="Stingless">Stingless (Tetragonula iridipennis / Dammer)</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Determines temperature & humidity safe thresholds.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hive Architecture Type *
                </label>
                <select
                  value={hiveType}
                  onChange={(e) => setHiveType(e.target.value as HiveType)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
                >
                  <option value="Langstroth">Langstroth (Standard 10-Frame)</option>
                  <option value="KTB">KTB (Kenya Top Bar)</option>
                  <option value="Traditional">Traditional Log / Clay Pot</option>
                  <option value="Other">Other Custom Hive</option>
                </select>
              </div>
            </div>

            {/* Flora / Land Type & Expected Production */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Surrounding Flora Belt
                </label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Acacia & Litchi Orchard"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Land Ecosystem
                </label>
                <select
                  value={landType}
                  onChange={(e) => setLandType(e.target.value as LandType)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  <option value="Farmland">Farmland / Agriculture</option>
                  <option value="Forest">Forest / Natural Wilderness</option>
                  <option value="Orchard">Horticulture Orchard</option>
                  <option value="Mangrove">Coastal Mangrove</option>
                  <option value="Urban">Urban / Rooftop</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expected Yield (kg/season)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={expectedProduction}
                  onChange={(e) => setExpectedProduction(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* GPS & Location */}
            <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-slate-800/40 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Hive GPS Pin & Farm Address
                </div>
                <button
                  type="button"
                  onClick={handleAutoDetectGps}
                  disabled={detectingGps}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-semibold transition"
                >
                  <Navigation className={`w-3 h-3 ${detectingGps ? 'animate-spin' : ''}`} />
                  {detectingGps ? 'Locating...' : 'Auto GPS'}
                </button>
              </div>

              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Field / Orchard Plot description, Village, District"
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500">Latitude</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Longitude</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Hive Photo Capture / Upload */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Hive Photo / Frame Inspection Image
              </label>

              <div className="flex items-center gap-3">
                {imageUrl ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-amber-500 shrink-0">
                    <img src={imageUrl} alt="Hive" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-[10px] font-bold"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold"
                    >
                      <Camera className="w-4 h-4 text-amber-500" /> Use Camera
                    </button>

                    <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer">
                      <Upload className="w-4 h-4 text-amber-500" /> Upload File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                <span className="text-[10px] text-slate-400">
                  Compressed and stored securely with hive record.
                </span>
              </div>
            </div>

            {/* Setup Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Colony Setup Date
              </label>
              <input
                type="date"
                value={setupDate}
                onChange={(e) => setSetupDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Generating Atomic Hive ID & QR...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Save Hive & Generate Printable QR Sticker
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapturePhoto}
        multiPhoto={false}
        title="Capture Hive Photo"
        description="Frame the hive entrance or comb in bright natural lighting"
      />
    </div>
  );
};
