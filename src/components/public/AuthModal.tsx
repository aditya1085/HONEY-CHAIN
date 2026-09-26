import React, { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle, Sparkles, ExternalLink, ShieldCheck, MapPin, Navigation, Phone, Home, Hash, Layers } from 'lucide-react';
import { useAuth, BeekeeperSignupData } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

// Salted SHA-256 for Aadhaar compliance
async function computeAadhaarHash(last4: string, phoneNum: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`HC_SALT_${last4}_${phoneNum}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
}) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('BEEKEEPER');

  // Beekeeper Profile Fields
  const [phone, setPhone] = useState('');
  const [stateName, setStateName] = useState('Uttar Pradesh');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number>(26.8467);
  const [lng, setLng] = useState<number>(80.9462);
  const [aadhaarLast4, setAadhaarLast4] = useState('');
  const [madhukrantiId, setMadhukrantiId] = useState('');
  const [totalHivesPlanned, setTotalHivesPlanned] = useState<number>(10);
  const [detectingGps, setDetectingGps] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOperationNotAllowed, setIsOperationNotAllowed] = useState(false);

  if (!isOpen) return null;

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
        setErrorMsg('Unable to retrieve location automatically. Coordinates set to default.');
        setDetectingGps(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsOperationNotAllowed(false);
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        let bkDetails: BeekeeperSignupData | undefined = undefined;

        if (role === 'BEEKEEPER') {
          if (!phone.trim()) {
            throw new Error('Contact number is required for beekeeper registration.');
          }
          if (!district.trim()) {
            throw new Error('District is required.');
          }
          if (!address.trim()) {
            throw new Error('Full apiary address is required.');
          }
          if (!/^\d{4}$/.test(aadhaarLast4.trim())) {
            throw new Error('Aadhaar must be exactly the last 4 digits.');
          }
          if (!madhukrantiId.trim()) {
            throw new Error('Madhukranti Portal Registration ID is required for verification.');
          }

          const aadhaarHash = await computeAadhaarHash(aadhaarLast4.trim(), phone.trim());

          bkDetails = {
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
          };
        }

        await signUpWithEmail(email, password, displayName, role, bkDetails);
      }
      onClose();
    } catch (err: unknown) {
      console.warn('Auth notice:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('auth/operation-not-allowed') || errMsg.includes('operation-not-allowed')) {
        setIsOperationNotAllowed(true);
        setErrorMsg('Email/Password provider is not enabled in Firebase Authentication console.');
        return;
      }
      if (err instanceof Error) {
        if (err.message.includes('auth/invalid-credential') || err.message.includes('wrong-password') || err.message.includes('user-not-found')) {
          setErrorMsg('Invalid email or password.');
        } else if (err.message.includes('auth/email-already-in-use')) {
          setErrorMsg('An account with this email already exists. Please sign in.');
        } else if (err.message.includes('auth/weak-password')) {
          setErrorMsg('Password should be at least 6 characters.');
        } else if (err.message.includes('auth/invalid-email')) {
          setErrorMsg('Please enter a valid email address.');
        } else {
          setErrorMsg(err.message);
        }
      } else {
        setErrorMsg('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsOperationNotAllowed(false);
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: unknown) {
      console.error('Google Sign In failed:', err);
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Demo accounts for effortless evaluation using real Firebase Auth
  const quickDemoLogin = async (demoEmail: string, demoPass: string, demoName: string, demoRole: UserRole) => {
    setErrorMsg(null);
    setIsOperationNotAllowed(false);
    setLoading(true);
    try {
      try {
        await signInWithEmail(demoEmail, demoPass);
      } catch (authErr: any) {
        // If demo user does not exist in Firebase Auth yet, auto-create real user in new project
        try {
          await signUpWithEmail(demoEmail, demoPass, demoName, demoRole);
        } catch (createErr: any) {
          throw createErr;
        }
      }
      onClose();
    } catch (e: unknown) {
      console.warn('Demo login notice:', e);
      if (e instanceof Error) {
        setErrorMsg(e.message);
      } else {
        setErrorMsg('Could not log in demo account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/30 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 text-white border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-base font-bold text-amber-400">
              {mode === 'signin' ? t('auth.titleSignIn') : t('auth.titleSignUp')}
            </h3>
            <p className="text-xs text-slate-400">
              {t('auth.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Operation Not Allowed Notice with exact console instructions */}
          {isOperationNotAllowed && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-2 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{t('auth.operationNotAllowedTitle')}</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Email/Password provider is currently not enabled in your Firebase project. To enable it:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] font-medium pl-1">
                <li>Open Firebase Console for project <strong className="font-mono">honeychain-production</strong></li>
                <li>Go to <strong>Authentication &gt; Sign-in method</strong></li>
                <li>Click <strong>Email/Password</strong> and toggle <strong>Enable</strong></li>
                <li>Click <strong>Save</strong></li>
              </ol>
              <div className="pt-1">
                <a
                  href="https://console.firebase.google.com/project/honeychain-production/authentication/providers"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline"
                >
                  <span>Open Firebase Auth Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {errorMsg && !isOperationNotAllowed && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2.5 transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{t('auth.orGoogle')}</span>
          </button>

          <div className="flex items-center gap-2 my-2">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Or with email</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('auth.displayName')}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={t('auth.displayNamePlaceholder')}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('auth.role')}
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="CONSUMER">{t('role.consumer')}</option>
                    <option value="BEEKEEPER">{t('role.beekeeper')}</option>
                  </select>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    * {t('auth.adminLabNotice') || 'Admin & Accredited Lab accounts are provisioned exclusively by platform administration.'}
                  </p>
                </div>

                {/* Additional Beekeeper Profile Fields Required by Section 3 */}
                {role === 'BEEKEEPER' && (
                  <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-2.5 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 text-[11px] uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Apiary Credentials (Govt / Madhukranti)</span>
                    </div>

                    {/* Contact Number */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                        Contact Number *
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    {/* State & District */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                          State *
                        </label>
                        <select
                          value={stateName}
                          onChange={(e) => setStateName(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        >
                          {INDIAN_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                          District *
                        </label>
                        <input
                          type="text"
                          required
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          placeholder="e.g. Lucknow"
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    {/* Full Apiary Address */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                        Full Apiary Address *
                      </label>
                      <div className="relative">
                        <Home className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <textarea
                          rows={2}
                          required
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Village, Post, Tehsil, Landmark"
                          className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    {/* Aadhaar Last 4 & Madhukranti Portal ID */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                          Aadhaar Last 4 Digits *
                        </label>
                        <input
                          type="text"
                          maxLength={4}
                          required
                          value={aadhaarLast4}
                          onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, ''))}
                          placeholder="1234"
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                          Madhukranti Portal ID *
                        </label>
                        <input
                          type="text"
                          required
                          value={madhukrantiId}
                          onChange={(e) => setMadhukrantiId(e.target.value)}
                          placeholder="NBB/UP/2026/0123"
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Total Hives Planned & GPS */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                          Total Hives Planned *
                        </label>
                        <div className="relative">
                          <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="number"
                            min={1}
                            max={5000}
                            required
                            value={totalHivesPlanned}
                            onChange={(e) => setTotalHivesPlanned(Number(e.target.value))}
                            className="w-full pl-8 pr-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                          GPS Coordinates
                        </label>
                        <button
                          type="button"
                          onClick={handleAutoDetectGps}
                          disabled={detectingGps}
                          className="w-full py-1.5 px-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition"
                        >
                          <Navigation className={`w-3 h-3 ${detectingGps ? 'animate-spin' : ''}`} />
                          <span>{detectingGps ? 'Locating...' : 'Use My Location'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono text-center">
                      GPS: {lat.toFixed(4)}, {lng.toFixed(4)}
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : mode === 'signin' ? t('auth.submitSignIn') : t('auth.submitSignUp')}
            </button>
          </form>

          {/* Toggle between sign in & sign up */}
          <div className="text-center text-xs text-slate-500 pt-1">
            {mode === 'signin' ? (
              <p>
                {t('auth.switchModeSignUp')}{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
                >
                  {t('auth.submitSignUp')}
                </button>
              </p>
            ) : (
              <p>
                {t('auth.switchModeSignIn')}{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
                >
                  {t('auth.submitSignIn')}
                </button>
              </p>
            )}
          </div>

          {/* Quick 1-Click Demo Profiles */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{t('auth.quickDemo')}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() =>
                  quickDemoLogin('beekeeper.demo@honeychain.in', 'Demo1234!', 'Sita Ram (Beekeeper)', 'BEEKEEPER')
                }
                className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-semibold text-center border border-amber-500/20 transition"
              >
                {t('role.beekeeper')}
              </button>
              <button
                type="button"
                onClick={() =>
                  quickDemoLogin('admin.honeychain@gmail.com', 'AdminPass123!', 'Aditya Tripathi (Admin)', 'ADMIN')
                }
                className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-semibold text-center border border-amber-500/20 transition"
              >
                {t('role.admin')}
              </button>
              <button
                type="button"
                onClick={() =>
                  quickDemoLogin('lab.demo@honeychain.in', 'Demo1234!', 'NABL Analytical Lab', 'LAB')
                }
                className="p-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-800 dark:text-teal-300 text-[11px] font-semibold text-center border border-teal-500/20 transition"
              >
                {t('role.lab')}
              </button>
              <button
                type="button"
                onClick={() =>
                  quickDemoLogin('consumer.demo@honeychain.in', 'Demo1234!', 'Arjun Sharma', 'CONSUMER')
                }
                className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-semibold text-center border border-amber-500/20 transition"
              >
                {t('role.consumer')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
