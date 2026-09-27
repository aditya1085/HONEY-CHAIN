import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { UserProfile, UserRole, BeekeeperProfile } from '../types';
import { logActivity } from '../services/activityLogger';

export interface BeekeeperSignupData {
  phone?: string;
  state?: string;
  district?: string;
  address?: string;
  lat?: number;
  lng?: number;
  aadhaarLast4?: string;
  aadhaarHash?: string;
  madhukrantiId?: string;
  totalHivesPlanned?: number;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  beekeeperProfile: BeekeeperProfile | null;
  loading: boolean;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  loginAsPersona: (role: UserRole) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string, intendedRole?: UserRole) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    name: string,
    role: UserRole,
    beekeeperDetails?: BeekeeperSignupData
  ) => Promise<void>;
  signOut: () => Promise<void>;
  bootstrapAdmin: () => Promise<void>;
  refreshBeekeeperProfile: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  beekeeperProfile: null,
  loading: true,
  activeRole: 'CONSUMER',
  setActiveRole: () => {},
  loginAsPersona: async () => {},
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOut: async () => {},
  bootstrapAdmin: async () => {},
  refreshBeekeeperProfile: async () => {},
  refreshUserProfile: async () => {},
});

export const SUPER_ADMIN_EMAILS = [
  'gargashu138@gmail.com',
  'commercial1085@gmail.com',
  'adityatripathi8989@gmail.com',
  'adityatripathi1085@gmail.com',
  'adityatripathi240815@acropolis.in',
  'admin.honeychain@gmail.com',
  'admin.demo@honeychain.in',
  'admin@honeychain.in',
];

export const PRE_PROVISIONED_LAB_EMAILS = [
  'lab.demo@honeychain.in',
  'lab@honeychain.in',
  'nabl.apex@honeychain.in',
];

export const checkIsSuperAdmin = (email?: string | null) => {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.some((e) => e.toLowerCase() === email.toLowerCase());
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [beekeeperProfile, setBeekeeperProfile] = useState<BeekeeperProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<UserRole>('CONSUMER');
  const bkUnsubRef = useRef<(() => void) | null>(null);

  // Clean up any beekeeper listener
  const cleanupBkListener = () => {
    if (bkUnsubRef.current) {
      bkUnsubRef.current();
      bkUnsubRef.current = null;
    }
  };

  // Fetch or sync user document
  const syncUserData = async (fbUser: FirebaseUser) => {
    try {
      const cleanEmail = (fbUser.email || '').toLowerCase().trim();
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);

      const isSuperAdmin = checkIsSuperAdmin(cleanEmail);
      const isLabEmail = PRE_PROVISIONED_LAB_EMAILS.some((e) => e.toLowerCase() === cleanEmail);

      const pendingSignupRole = (typeof window !== 'undefined' ? (window as any).__hc_pending_role : null) ||
        sessionStorage.getItem('hc_pending_signup_role') as UserRole | null;
      const pendingSigninRole = sessionStorage.getItem('hc_pending_signin_role') as UserRole | null;
      const savedUserRole = (
        localStorage.getItem(`hc_user_role_${fbUser.uid}`) ||
        localStorage.getItem(`hc_user_role_${cleanEmail}`) ||
        localStorage.getItem('hc_last_signup_role')
      ) as UserRole | null;

      // Check beekeeper record existence first
      let hasBeekeeperDoc = false;
      const bkRef = doc(db, 'beekeepers', fbUser.uid);
      try {
        const bkSnap = await getDoc(bkRef);
        if (bkSnap.exists()) {
          hasBeekeeperDoc = true;
          setBeekeeperProfile(bkSnap.data() as BeekeeperProfile);
        } else {
          // Also check by userId query in beekeepers collection
          const qBk = query(collection(db, 'beekeepers'), where('userId', '==', fbUser.uid), limit(1));
          const qSnap = await getDocs(qBk);
          if (!qSnap.empty) {
            hasBeekeeperDoc = true;
            setBeekeeperProfile(qSnap.docs[0].data() as BeekeeperProfile);
          }
        }
      } catch (bkErr) {
        console.warn('Initial beekeeper doc check notice:', bkErr);
      }

      let currentRole: UserRole = 'CONSUMER';
      if (cleanEmail === 'admin.honeychain@gmail.com' || isSuperAdmin) {
        currentRole = 'ADMIN';
      } else if (cleanEmail === 'lab.demo@honeychain.in' || isLabEmail) {
        currentRole = 'LAB';
      } else if (cleanEmail === 'beekeeper.demo@honeychain.in' || hasBeekeeperDoc) {
        currentRole = 'BEEKEEPER';
      } else if (userSnap.exists() && userSnap.data().role) {
        currentRole = userSnap.data().role;
      } else if (pendingSignupRole) {
        currentRole = pendingSignupRole;
      } else if (pendingSigninRole) {
        currentRole = pendingSigninRole;
      } else if (savedUserRole) {
        currentRole = savedUserRole;
      }

      // For Beekeeper persona: ensure approved profile exists with ID B001
      if (cleanEmail === 'beekeeper.demo@honeychain.in' && (!hasBeekeeperDoc || beekeeperProfile?.status !== 'approved')) {
        const approvedBk: BeekeeperProfile = {
          id: fbUser.uid,
          userId: fbUser.uid,
          beekeeperId: 'B001',
          name: 'Sita Ram (Beekeeper)',
          email: cleanEmail,
          phone: '+91 98765 43210',
          state: 'Uttar Pradesh',
          district: 'Lucknow',
          address: 'Plot 42, Bee Corridor, Mohanlalganj, Lucknow',
          lat: 26.8467,
          lng: 80.9462,
          aadhaarLast4: '1234',
          aadhaarHash: 'c7be8f5619b02a2498dbca204f14e59178ad54911d7fc49116e036df52b0c169',
          madhukrantiId: 'NBB/UP/2026/0123',
          totalHivesPlanned: 20,
          status: 'approved',
          trustScore: 98,
          isSample: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setBeekeeperProfile(approvedBk);
        try {
          await setDoc(doc(db, 'beekeepers', fbUser.uid), approvedBk, { merge: true });
        } catch {}
      }

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        // Auto promote super admin if needed
        if (isSuperAdmin && data.role !== 'ADMIN') {
          await updateDoc(userRef, { role: 'ADMIN', updatedAt: new Date().toISOString() });
          await setDoc(doc(db, 'admins', fbUser.uid), {
            uid: fbUser.uid,
            email: fbUser.email,
            createdAt: new Date().toISOString(),
          }, { merge: true });
          data.role = 'ADMIN';
        } else if (currentRole === 'BEEKEEPER' && data.role !== 'BEEKEEPER' && data.role !== 'ADMIN') {
          // Keep Firestore user doc in sync with Beekeeper role (do NOT overwrite beekeeperId unless assigned)
          try {
            await updateDoc(userRef, { role: 'BEEKEEPER', updatedAt: new Date().toISOString() });
          } catch {}
          data.role = 'BEEKEEPER';
        } else if (currentRole === 'LAB' && data.role !== 'LAB') {
          try {
            await updateDoc(userRef, { role: 'LAB', labId: 'LAB_CBRTI_PUNE', updatedAt: new Date().toISOString() });
          } catch {}
          data.role = 'LAB';
          data.labId = 'LAB_CBRTI_PUNE';
        } else if (!isSuperAdmin && !isLabEmail && !hasBeekeeperDoc && data.role) {
          currentRole = data.role;
        }

        setUserProfile(data);
        setActiveRole(currentRole);
        try {
          localStorage.setItem(`hc_user_role_${fbUser.uid}`, currentRole);
          localStorage.setItem(`hc_user_role_${cleanEmail}`, currentRole);
          localStorage.setItem('hc_role', currentRole);
        } catch {}
      } else {
        // Create new user record
        const initialRole: UserRole = currentRole;
        const newProfile: UserProfile = {
          id: fbUser.uid,
          email: fbUser.email || '',
          displayName:
            initialRole === 'ADMIN'
              ? 'Aditya Tripathi (Admin)'
              : cleanEmail === 'beekeeper.demo@honeychain.in'
              ? 'Sita Ram (Beekeeper)'
              : initialRole === 'LAB'
              ? 'NABL Central Quality Laboratory'
              : fbUser.displayName || fbUser.email?.split('@')[0] || 'Honey User',
          role: initialRole,
          beekeeperId: cleanEmail === 'beekeeper.demo@honeychain.in' ? 'B001' : undefined,
          labId: initialRole === 'LAB' ? 'LAB_CBRTI_PUNE' : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        try {
          await setDoc(userRef, newProfile);
        } catch {}
        if (isSuperAdmin || initialRole === 'ADMIN') {
          try {
            await setDoc(doc(db, 'admins', fbUser.uid), {
              uid: fbUser.uid,
              email: fbUser.email,
              createdAt: new Date().toISOString(),
            });
          } catch {}
        }
        setUserProfile(newProfile);
        setActiveRole(initialRole);
        try {
          localStorage.setItem(`hc_user_role_${fbUser.uid}`, initialRole);
          localStorage.setItem(`hc_user_role_${cleanEmail}`, initialRole);
          localStorage.setItem('hc_role', initialRole);
        } catch {}
      }

      // Real-time listener for beekeeper profile
      cleanupBkListener();
      bkUnsubRef.current = onSnapshot(bkRef, (bkSnap) => {
        if (bkSnap.exists()) {
          const bkData = bkSnap.data() as BeekeeperProfile;
          setBeekeeperProfile(bkData);
          // When a beekeeper profile is found, automatically lock to BEEKEEPER role if not ADMIN/LAB
          setActiveRole((prev) => {
            if (prev === 'ADMIN' || prev === 'LAB') return prev;
            return 'BEEKEEPER';
          });
          setUserProfile((prev) => {
            if (!prev) return prev;
            if (prev.role === 'ADMIN' || prev.role === 'LAB') return prev;
            return {
              ...prev,
              role: 'BEEKEEPER',
              beekeeperId: bkData.beekeeperId || prev.beekeeperId,
            };
          });
          try {
            localStorage.setItem(`hc_user_role_${fbUser.uid}`, 'BEEKEEPER');
            localStorage.setItem(`hc_user_role_${cleanEmail}`, 'BEEKEEPER');
            localStorage.setItem('hc_role', 'BEEKEEPER');
          } catch {}
        } else {
          // If not in Firestore directly, check localStorage or backend API
          try {
            const localBks: BeekeeperProfile[] = JSON.parse(localStorage.getItem('hc_local_beekeepers') || '[]');
            const localMatch = localBks.find((b) => b.id === fbUser.uid || b.userId === fbUser.uid);
            if (localMatch) {
              setBeekeeperProfile(localMatch);
            }
          } catch {}
        }
      }, (err) => {
        console.warn('Beekeeper profile snapshot notice:', err);
      });
    } catch (err) {
      console.warn('Firestore user doc read notice (using verified auth role):', err);
      const fallbackEmail = (fbUser.email || '').toLowerCase();
      const isSuper = checkIsSuperAdmin(fallbackEmail);
      const isLab = PRE_PROVISIONED_LAB_EMAILS.some((e) => e.toLowerCase() === fallbackEmail);
      const savedUserRole = (
        localStorage.getItem(`hc_user_role_${fbUser.uid}`) ||
        localStorage.getItem(`hc_user_role_${fallbackEmail}`) ||
        localStorage.getItem('hc_last_signup_role')
      ) as UserRole | null;
      const isBk = fallbackEmail.includes('beekeeper') || savedUserRole === 'BEEKEEPER';
      const resolvedRole: UserRole = isSuper ? 'ADMIN' : isLab ? 'LAB' : isBk ? 'BEEKEEPER' : 'CONSUMER';

      const fallbackProfile: UserProfile = {
        id: fbUser.uid,
        email: fbUser.email || '',
        displayName:
          resolvedRole === 'ADMIN'
            ? 'Aditya Tripathi (Admin)'
            : fallbackEmail === 'beekeeper.demo@honeychain.in'
            ? 'Sita Ram (Beekeeper)'
            : resolvedRole === 'LAB'
            ? 'NABL Central Quality Laboratory'
            : fbUser.displayName || fbUser.email?.split('@')[0] || 'Honey User',
        role: resolvedRole,
        beekeeperId: fallbackEmail === 'beekeeper.demo@honeychain.in' ? 'B001' : undefined,
        labId: resolvedRole === 'LAB' ? 'LAB_CBRTI_PUNE' : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (fallbackEmail === 'beekeeper.demo@honeychain.in') {
        const bkData: BeekeeperProfile = {
          id: fbUser.uid,
          userId: fbUser.uid,
          beekeeperId: 'B001',
          name: 'Sita Ram (Beekeeper)',
          email: fbUser.email || 'beekeeper.demo@honeychain.in',
          phone: '+91 98765 43210',
          state: 'Uttar Pradesh',
          district: 'Lucknow',
          address: 'Plot 42, Bee Corridor, Mohanlalganj, Lucknow',
          lat: 26.8467,
          lng: 80.9462,
          aadhaarLast4: '1234',
          aadhaarHash: 'c7be8f5619b02a2498dbca204f14e59178ad54911d7fc49116e036df52b0c169',
          madhukrantiId: 'NBB/UP/2026/0123',
          totalHivesPlanned: 20,
          status: 'approved',
          trustScore: 98,
          isSample: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setBeekeeperProfile(bkData);
      } else if (resolvedRole === 'BEEKEEPER') {
        // For new non-demo beekeeper, check local storage or API for their real pending profile
        let matched: BeekeeperProfile | null = null;
        try {
          const localBks: BeekeeperProfile[] = JSON.parse(localStorage.getItem('hc_local_beekeepers') || '[]');
          matched = localBks.find((b) => b.id === fbUser.uid || b.userId === fbUser.uid || (fallbackEmail && b.email?.toLowerCase() === fallbackEmail)) || null;
        } catch {}

        if (matched) {
          setBeekeeperProfile(matched);
          if (matched.beekeeperId) fallbackProfile.beekeeperId = matched.beekeeperId;
        } else {
          const initialPending: BeekeeperProfile = {
            id: fbUser.uid,
            userId: fbUser.uid,
            name: fbUser.displayName || fallbackEmail.split('@')[0],
            email: fallbackEmail,
            phone: '',
            state: 'Uttar Pradesh',
            district: '',
            address: '',
            lat: 26.8467,
            lng: 80.9462,
            aadhaarLast4: '',
            aadhaarHash: '',
            madhukrantiId: '',
            totalHivesPlanned: 10,
            status: 'pending',
            isSample: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setBeekeeperProfile(initialPending);
        }
      }

      setUserProfile(fallbackProfile);
      setActiveRole(resolvedRole);
    }
  };

  const refreshUserProfile = async () => {
    if (currentUser) {
      await syncUserData(currentUser);
    }
  };

  const refreshBeekeeperProfile = async () => {
    if (!currentUser) return;
    try {
      const bkRef = doc(db, 'beekeepers', currentUser.uid);
      const bkSnap = await getDoc(bkRef);
      if (bkSnap.exists()) {
        const data = bkSnap.data() as BeekeeperProfile;
        setBeekeeperProfile(data);
        if (data.beekeeperId) {
          setUserProfile((prev) => (prev ? { ...prev, beekeeperId: data.beekeeperId } : prev));
        }
        return;
      }
    } catch (err) {}

    // Fallback to backend API
    try {
      const res = await fetch('/api/beekeepers');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.beekeepers)) {
          const match = data.beekeepers.find(
            (b: any) =>
              b.id === currentUser.uid ||
              b.userId === currentUser.uid ||
              (currentUser.email && b.email?.toLowerCase() === currentUser.email.toLowerCase())
          );
          if (match) {
            setBeekeeperProfile(match);
            if (match.beekeeperId) {
              setUserProfile((prev) => (prev ? { ...prev, beekeeperId: match.beekeeperId } : prev));
            }
            return;
          }
        }
      }
    } catch {}

    // Fallback to localStorage
    try {
      const local: BeekeeperProfile[] = JSON.parse(localStorage.getItem('hc_local_beekeepers') || '[]');
      const match = local.find(
        (b) =>
          b.id === currentUser.uid ||
          b.userId === currentUser.uid ||
          (currentUser.email && b.email?.toLowerCase() === currentUser.email.toLowerCase())
      );
      if (match) {
        setBeekeeperProfile(match);
        if (match.beekeeperId) {
          setUserProfile((prev) => (prev ? { ...prev, beekeeperId: match.beekeeperId } : prev));
        }
      }
    } catch {}
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncUserData(user);
      } else {
        // True unauthenticated state: wipe any leftover cached profiles and reset role
        cleanupBkListener();
        setUserProfile(null);
        setBeekeeperProfile(null);
        setActiveRole('CONSUMER');
        try {
          localStorage.removeItem('hc_cached_user');
          localStorage.removeItem('hc_role');
          localStorage.removeItem('hc_session');
        } catch {}
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      cleanupBkListener();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      await logActivity({
        action: 'USER_LOGIN_GOOGLE',
        entityType: 'SYSTEM',
        entityId: res.user.uid,
        details: `User signed in with Google (${res.user.email})`,
      });
    } catch (error: unknown) {
      console.error('Google Sign-In failed:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string, intendedRole?: UserRole) => {
    const cleanEmail = email.trim().toLowerCase();
    if (intendedRole) {
      try {
        sessionStorage.setItem('hc_pending_signin_role', intendedRole);
        localStorage.setItem(`hc_user_role_${cleanEmail}`, intendedRole);
        localStorage.setItem('hc_last_signup_role', intendedRole);
      } catch {}
    }
    const res = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    try {
      await logActivity({
        action: 'USER_LOGIN_EMAIL',
        entityType: 'SYSTEM',
        entityId: res.user.uid,
        details: `User signed in with Email (${res.user.email}) as ${intendedRole || 'user'}`,
      });
    } catch {}
  };

  // Role lock setter: When user is authenticated, role is strictly bound to Firestore profile!
  const handleSetActiveRole = (newRole: UserRole) => {
    if (currentUser && userProfile) {
      console.warn(`[Security] Role switching blocked. User account is permanently locked to server-side role (${userProfile.role}).`);
      return;
    }
    setActiveRole(newRole);
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    name: string,
    role: UserRole,
    beekeeperDetails?: BeekeeperSignupData
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    const isSuperAdmin = checkIsSuperAdmin(cleanEmail);
    
    // CRITICAL SECURITY ENFORCEMENT:
    // Normal self-signup can ONLY create CONSUMER or BEEKEEPER accounts.
    // ADMIN and LAB accounts can NEVER be self-selected during public registration.
    let assignedRole: UserRole = 'CONSUMER';
    if (isSuperAdmin) {
      assignedRole = 'ADMIN';
    } else if (PRE_PROVISIONED_LAB_EMAILS.some((e) => e.toLowerCase() === cleanEmail)) {
      assignedRole = 'LAB';
    } else if (role === 'BEEKEEPER') {
      assignedRole = 'BEEKEEPER';
    } else {
      assignedRole = 'CONSUMER';
    }

    // Set pending role before createUserWithEmailAndPassword so onAuthStateChanged knows the assigned role immediately
    try {
      if (typeof window !== 'undefined') {
        (window as any).__hc_pending_role = assignedRole;
      }
      sessionStorage.setItem('hc_pending_signup_role', assignedRole);
      localStorage.setItem(`hc_user_role_${cleanEmail}`, assignedRole);
      localStorage.setItem('hc_last_signup_role', assignedRole);
      localStorage.setItem('hc_role', assignedRole);
    } catch {}

    const res = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    const nowIso = new Date().toISOString();

    const profile: UserProfile = {
      id: res.user.uid,
      email: cleanEmail,
      displayName: name || cleanEmail.split('@')[0],
      role: assignedRole,
      // NO beekeeperId or labId assigned yet at self-registration
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    try {
      await setDoc(doc(db, 'users', res.user.uid), profile);
      if (assignedRole === 'ADMIN') {
        await setDoc(doc(db, 'admins', res.user.uid), {
          uid: res.user.uid,
          email: cleanEmail,
          createdAt: nowIso,
        });
      }
    } catch (dbErr) {
      console.warn('Initial profile sync warning:', dbErr);
    }

    setUserProfile(profile);
    setActiveRole(assignedRole);
    try {
      localStorage.setItem(`hc_user_role_${res.user.uid}`, assignedRole);
      localStorage.setItem('hc_role', assignedRole);
    } catch {}

    // If registering as a Beekeeper: create initial registration with status: 'pending' (NO auto-approval, NO Beekeeper ID)
    if (assignedRole === 'BEEKEEPER') {
      const pendingProfile: BeekeeperProfile = {
        id: res.user.uid,
        userId: res.user.uid,
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: beekeeperDetails?.phone || '',
        state: beekeeperDetails?.state || 'Uttar Pradesh',
        district: beekeeperDetails?.district || '',
        address: beekeeperDetails?.address || '',
        lat: beekeeperDetails?.lat ?? 26.8467,
        lng: beekeeperDetails?.lng ?? 80.9462,
        aadhaarLast4: beekeeperDetails?.aadhaarLast4 || '',
        aadhaarHash: beekeeperDetails?.aadhaarHash || '',
        madhukrantiId: beekeeperDetails?.madhukrantiId || '',
        totalHivesPlanned: beekeeperDetails?.totalHivesPlanned || 10,
        status: 'pending', // Defaults to Pending, awaiting Admin review
        isSample: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      setBeekeeperProfile(pendingProfile);

      // 1. Post to Backend API
      try {
        await fetch('/api/beekeepers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pendingProfile),
        });
      } catch (apiErr) {
        console.warn('Backend API beekeepers sync warning:', apiErr);
      }

      // 2. Save to Local Storage cache
      try {
        const localBks: BeekeeperProfile[] = JSON.parse(localStorage.getItem('hc_local_beekeepers') || '[]');
        const filtered = localBks.filter((b) => b.id !== res.user.uid && b.userId !== res.user.uid);
        filtered.unshift(pendingProfile);
        localStorage.setItem('hc_local_beekeepers', JSON.stringify(filtered));
      } catch (lsErr) {
        console.warn('LocalStorage save error:', lsErr);
      }

      // 3. Save to Firestore (with resilient fallback)
      try {
        await setDoc(doc(db, 'beekeepers', res.user.uid), pendingProfile);
      } catch (bkErr) {
        console.warn('Initial pending beekeeper doc notice:', bkErr);
      }
    }

    try {
      await logActivity({
        action: assignedRole === 'BEEKEEPER' ? 'BEEKEEPER_REGISTRATION_SUBMITTED' : 'USER_SIGNUP',
        entityType: 'SYSTEM',
        entityId: res.user.uid,
        details: `New account registered as ${assignedRole} (${cleanEmail})`,
        actorRole: assignedRole,
      });
    } catch {}
  };

  const signOut = async () => {
    // 1. Clean up any active profile listeners
    cleanupBkListener();

    // 2. Immediately wipe any cached user items from localStorage
    try {
      localStorage.removeItem('hc_cached_user');
      localStorage.removeItem('hc_role');
      localStorage.removeItem('hc_session');
      localStorage.removeItem('honeychain_cart');
    } catch {}

    // 3. Immediately reset local context state to logged out / consumer
    setCurrentUser(null);
    setUserProfile(null);
    setBeekeeperProfile(null);
    setActiveRole('CONSUMER');

    // 4. Log audit event non-blockingly
    if (currentUser) {
      try {
        await logActivity({
          action: 'USER_LOGOUT',
          entityType: 'SYSTEM',
          entityId: currentUser.uid,
          details: `User signed out (${currentUser.email})`,
        });
      } catch {}
    }

    // 5. Complete Firebase sign-out
    try {
      await fbSignOut(auth);
    } catch (error: unknown) {
      console.warn('Sign Out note:', error);
    }
  };

  const bootstrapAdmin = async () => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, 'admins', currentUser.uid), {
        uid: currentUser.uid,
        email: currentUser.email,
        createdAt: new Date().toISOString(),
      }, { merge: true });

      await updateDoc(doc(db, 'users', currentUser.uid), {
        role: 'ADMIN',
        updatedAt: new Date().toISOString(),
      });

      if (userProfile) {
        setUserProfile({ ...userProfile, role: 'ADMIN' });
      }
      setActiveRole('ADMIN');

      await logActivity({
        action: 'ADMIN_BOOTSTRAPPED',
        entityType: 'SYSTEM',
        entityId: currentUser.uid,
        details: `User promoted to ADMIN role (${currentUser.email})`,
        actorRole: 'ADMIN',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `admins/${currentUser.uid}`);
    }
  };

  const loginAsPersona = async (personaRole: UserRole) => {
    setLoading(true);
    cleanupBkListener();

    // 1. Wipe caches to ensure clean distinct sessions
    try {
      localStorage.removeItem('hc_cached_user');
      localStorage.removeItem('hc_role');
      localStorage.removeItem('hc_session');
    } catch {}

    // 2. Clear Firebase Auth session first
    try {
      await fbSignOut(auth);
    } catch {}

    // 3. Credentials for the 4 real persona accounts
    const creds: Record<UserRole, { email: string; pass: string; name: string }> = {
      ADMIN: {
        email: 'admin.honeychain@gmail.com',
        pass: 'AdminPass123!',
        name: 'Aditya Tripathi (Admin)',
      },
      BEEKEEPER: {
        email: 'beekeeper.demo@honeychain.in',
        pass: 'Demo1234!',
        name: 'Sita Ram (Beekeeper)',
      },
      LAB: {
        email: 'lab.demo@honeychain.in',
        pass: 'Demo1234!',
        name: 'NABL Central Quality Laboratory',
      },
      CONSUMER: {
        email: 'consumer.demo@honeychain.in',
        pass: 'Demo1234!',
        name: 'Arjun Sharma',
      },
    };

    const target = creds[personaRole];
    let userCred: any = null;

    try {
      userCred = await signInWithEmailAndPassword(auth, target.email, target.pass);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        userCred = await createUserWithEmailAndPassword(auth, target.email, target.pass);
      } else {
        throw err;
      }
    }

    if (userCred?.user) {
      const fbUser = userCred.user;
      setCurrentUser(fbUser);

      // Call server persona profile sync
      try {
        const resp = await fetch('/api/auth/persona-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: personaRole,
            uid: fbUser.uid,
            email: target.email,
          }),
        });
        const profileData = await resp.json();
        if (profileData?.userProfile) {
          setUserProfile(profileData.userProfile);
          setActiveRole(profileData.userProfile.role || personaRole);
        }
        if (profileData?.beekeeperProfile) {
          setBeekeeperProfile(profileData.beekeeperProfile);
        }
      } catch {}

      await syncUserData(fbUser);

      try {
        await logActivity({
          action: 'PERSONA_LOGIN',
          entityType: 'SYSTEM',
          entityId: fbUser.uid,
          details: `Switched session to verified ${personaRole} persona (${target.email})`,
          actorRole: personaRole,
        });
      } catch {}
    }
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        beekeeperProfile,
        loading,
        activeRole,
        setActiveRole: handleSetActiveRole,
        loginAsPersona,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        bootstrapAdmin,
        refreshBeekeeperProfile,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

