import React, { useState } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { MapPin, ShieldCheck, CheckCircle, AlertCircle, Sparkles, Navigation, Lock } from 'lucide-react';
import { db } from '../../firebase/config';
import { handleFirestoreError, OperationType } from '../../firebase/errors';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { logActivity } from '../../services/activityLogger';
import { BeekeeperProfile } from '../../types';

interface BeekeeperRegistrationProps {
  onSuccess?: () => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export const BeekeeperRegistration: React.FC<BeekeeperRegistrationProps> = ({ onSuccess }) => {
  const { currentUser, userProfile, refreshBeekeeperProfile, setActiveRole } = useAuth();
  const { t } = useLanguage();

  const [name, setName] = useState(userProfile?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('');
  const [stateName, setStateName] = useState('Uttar Pradesh');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number>(26.8467);
  const [lng, setLng] = useState<number>(80.9462);
  const [aadhaarLast4, setAadhaarLast4] = useState('');
  const [madhukrantiId, setMadhukrantiId] = useState('');
  const [totalHivesPlanned, setTotalHivesPlanned] = useState<number>(10);
  const [isAgreeTerms, setIsAgreeTerms] = useState(false);

  const [detectingGps, setDetectingGps] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Compute SHA-256 for Aadhaar compliance
  const computeAadhaarHash = async (last4: string, phoneNum: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(`HC_SALT_${last4}_${phoneNum}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const handleAutoDetectGps = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (pos?.coords?.latitude != null && !isNaN(pos.coords.latitude)) {
          setLat(Number(pos.coords.latitude.toFixed(6)));
        }
        if (pos?.coords?.longitude != null && !isNaN(pos.coords.longitude)) {
          setLng(Number(pos.coords.longitude.toFixed(6)));
        }
        setDetectingGps(false);
      },
      (err) => {
        console.warn('GPS detection failed:', err);
        setErrorMsg('Unable to retrieve location automatically. Please enter coordinates or ensure location permission is granted.');
        setDetectingGps(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentUser) {
      setErrorMsg('You must be logged in to register an apiary.');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (!/^\d{4}$/.test(aadhaarLast4)) {
      setErrorMsg('Aadhaar last 4 must be exactly 4 numeric digits.');
      return;
    }
    if (!madhukrantiId.trim()) {
      setErrorMsg('Madhukranti Portal Registration ID is required for verification.');
      return;
    }
    if (!isAgreeTerms) {
      setErrorMsg('Please review and accept the declaration to proceed.');
      return;
    }

    setSubmitting(true);
    try {
      const aadhaarHash = await computeAadhaarHash(aadhaarLast4, phone);
      const beekeeperDocId = currentUser.uid;

      const profileData: BeekeeperProfile = {
        id: beekeeperDocId,
        userId: currentUser.uid,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        state: stateName,
        district: district.trim(),
        address: address.trim(),
        lat,
        lng,
        aadhaarLast4: aadhaarLast4.trim(),
        aadhaarHash,
        madhukrantiId: madhukrantiId.trim(),
        totalHivesPlanned: Number(totalHivesPlanned) || 10,
        status: 'pending', // Awaiting Admin verification
        isSample: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save beekeeper profile to Firestore
      await setDoc(doc(db, 'beekeepers', beekeeperDocId), profileData);

      // Update user document role to BEEKEEPER
      await updateDoc(doc(db, 'users', currentUser.uid), {
        role: 'BEEKEEPER',
        updatedAt: new Date().toISOString(),
      });

      await logActivity({
        action: 'BEEKEEPER_REGISTRATION_SUBMITTED',
        entityType: 'BEEKEEPER',
        entityId: beekeeperDocId,
        details: `Beekeeper registration submitted by ${name} (${stateName}, ${district}) with Madhukranti ID ${madhukrantiId}`,
        actorRole: 'BEEKEEPER',
      });

      await refreshBeekeeperProfile();
      setActiveRole('BEEKEEPER');
      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Registration failed:', err);
      handleFirestoreError(err, OperationType.CREATE, `beekeepers/${currentUser?.uid}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-2xl border border-amber-500/30 shadow-xl text-center">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-9 h-9" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {t('reg.success')}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Your credentials and apiary location have been recorded and sent to the administrator queue. You will be assigned a unique Beekeeper ID (e.g. <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">B045</span>) upon review.
        </p>
        <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-xl text-left border border-amber-500/20 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Applicant:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Madhukranti Portal ID:</span>
            <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">{madhukrantiId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Aadhaar (Last 4):</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">XXXX-XXXX-{aadhaarLast4}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Current Status:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
              Pending Government Verification
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/20 shadow-xl">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          National Beekeeping & Honey Mission Traceability
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t('reg.title')}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {t('reg.subtitle')}
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-300">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('reg.fullName')} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar Verma"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('reg.phone')} *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Location & GPS */}
        <div className="space-y-3 p-4 rounded-2xl bg-amber-50/50 dark:bg-slate-800/40 border border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Apiary Geographical Location
              </span>
            </div>
            <button
              type="button"
              onClick={handleAutoDetectGps}
              disabled={detectingGps}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 ${detectingGps ? 'animate-spin' : ''}`} />
              {detectingGps ? 'Locating...' : t('reg.detectGps')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {t('reg.state')} *
              </label>
              <select
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {t('reg.district')} *
              </label>
              <input
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Lucknow / Muzaffarnagar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t('reg.address')} *
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Village, Post Office, Tehsil, Pin code"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <span className="text-[11px] text-slate-500">Latitude</span>
              <input
                type="number"
                step="0.000001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-500">Longitude</span>
              <input
                type="number"
                step="0.000001"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Identity & Government Portal Validation */}
        <div className="space-y-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Government Identity Verification
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('reg.aadhaarLast4')} *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={4}
                value={aadhaarLast4}
                onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, ''))}
                placeholder="4812"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {t('reg.aadhaarHint')}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('reg.madhukrantiId')} *
            </label>
            <input
              type="text"
              required
              value={madhukrantiId}
              onChange={(e) => setMadhukrantiId(e.target.value.toUpperCase())}
              placeholder="MK-UP-2026-9921"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {t('reg.madhukrantiHint')}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Total Hives Planned *
            </label>
            <input
              type="number"
              min={1}
              max={5000}
              required
              value={totalHivesPlanned}
              onChange={(e) => setTotalHivesPlanned(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Anticipated number of honey bee colonies/boxes to be managed
            </p>
          </div>
        </div>

        {/* Declaration */}
        <label className="flex items-start gap-2.5 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={isAgreeTerms}
            onChange={(e) => setIsAgreeTerms(e.target.checked)}
            className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
          />
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {t('reg.disclaimer')}
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              {t('reg.submitting')}
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              {t('reg.submit')}
            </>
          )}
        </button>
      </form>
    </div>
  );
};
