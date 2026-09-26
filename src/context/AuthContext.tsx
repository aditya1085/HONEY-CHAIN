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
      if (isSuperAdmin) {
        currentRole = 'ADMIN';
      } else if (isLabEmail) {
        currentRole = 'LAB';
      } else if (hasBeekeeperDoc) {
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
          // Keep Firestore user doc in sync with Beekeeper role
          try {
            await updateDoc(userRef, { role: 'BEEKEEPER', updatedAt: new Date().toISOString() });
          } catch {}
          data.role = 'BEEKEEPER';
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
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Honey User',
          role: initialRole,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userRef, newProfile);
        if (isSuperAdmin) {
          await setDoc(doc(db, 'admins', fbUser.uid), {
            uid: fbUser.uid,
            email: fbUser.email,
            createdAt: new Date().toISOString(),
          });
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
          setBeekeeperProfile((current) => current);
        }
      }, (err) => {
        console.warn('Beekeeper profile snapshot notice:', err);
      });
    } catch (err) {
      console.warn('Firestore user doc read notice (using verified auth role):', err);
      const isSuper = checkIsSuperAdmin(fbUser.email);
      const isLab = PRE_PROVISIONED_LAB_EMAILS.some((e) => e.toLowerCase() === fbUser.email?.toLowerCase());
      const savedUserRole = (
        localStorage.getItem(`hc_user_role_${fbUser.uid}`) ||
        localStorage.getItem(`hc_user_role_${(fbUser.email || '').toLowerCase()}`) ||
        localStorage.getItem('hc_last_signup_role')
      ) as UserRole | null;
      const isBk = (fbUser.email || '').toLowerCase().includes('beekeeper') || savedUserRole === 'BEEKEEPER';
      const resolvedRole: UserRole = isSuper ? 'ADMIN' : isLab ? 'LAB' : isBk ? 'BEEKEEPER' : 'CONSUMER';

      const fallbackProfile: UserProfile = {
        id: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Honey User',
        role: resolvedRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
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
        setBeekeeperProfile(bkSnap.data() as BeekeeperProfile);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `beekeepers/${currentUser.uid}`);
    }
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
      try {
        await setDoc(doc(db, 'beekeepers', res.user.uid), pendingProfile);
      } catch (bkErr) {
        console.warn('Initial pending beekeeper doc error:', bkErr);
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

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        beekeeperProfile,
        loading,
        activeRole,
        setActiveRole: handleSetActiveRole,
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

