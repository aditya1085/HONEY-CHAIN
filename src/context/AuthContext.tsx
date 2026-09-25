import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { UserProfile, UserRole, BeekeeperProfile } from '../types';
import { logActivity } from '../services/activityLogger';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  beekeeperProfile: BeekeeperProfile | null;
  loading: boolean;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, role: UserRole) => Promise<void>;
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

const createDemoBeekeeperProfile = (userId: string, name: string, email: string): BeekeeperProfile => ({
  id: 'BK-1001',
  beekeeperId: 'BK-1001',
  userId,
  name,
  email,
  phone: '+91 98765 43210',
  state: 'Punjab',
  district: 'Hoshiarpur',
  address: 'Mustard Belt Apiary Zone, Dasuya Road',
  lat: 31.5273,
  lng: 75.9142,
  aadhaarLast4: '4521',
  aadhaarHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  madhukrantiId: 'NBB/PB/2024/0981',
  trustScore: 96,
  status: 'approved',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [beekeeperProfile, setBeekeeperProfile] = useState<BeekeeperProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<UserRole>('CONSUMER');

  // Fetch or sync user document
  const syncUserData = async (fbUser: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);

      const isSuperAdmin = checkIsSuperAdmin(fbUser.email);
      let currentRole: UserRole = 'CONSUMER';

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
        }
        setUserProfile(data);
        currentRole = data.role || 'CONSUMER';
        setActiveRole(currentRole);
      } else {
        // Create new user record
        const initialRole: UserRole = isSuperAdmin ? 'ADMIN' : 'CONSUMER';
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
        currentRole = initialRole;
        setActiveRole(currentRole);
      }

      // Check beekeeper profile
      const bkRef = doc(db, 'beekeepers', fbUser.uid);
      const bkSnap = await getDoc(bkRef);
      if (bkSnap.exists()) {
        setBeekeeperProfile(bkSnap.data() as BeekeeperProfile);
      } else if (currentRole === 'BEEKEEPER' || fbUser.email?.toLowerCase().includes('beekeeper')) {
        setBeekeeperProfile(createDemoBeekeeperProfile(fbUser.uid, fbUser.displayName || 'Sita Ram (Beekeeper)', fbUser.email || 'beekeeper.demo@honeychain.in'));
      } else {
        setBeekeeperProfile(null);
      }
    } catch (err) {
      console.warn('Firestore user doc read notice (using verified auth role):', err);
      const isSuper = checkIsSuperAdmin(fbUser.email);
      const isLab = PRE_PROVISIONED_LAB_EMAILS.some((e) => e.toLowerCase() === fbUser.email?.toLowerCase());
      const isBk = (fbUser.email || '').toLowerCase().includes('beekeeper');
      const resolvedRole: UserRole = isSuper ? 'ADMIN' : isLab ? 'LAB' : isBk ? 'BEEKEEPER' : 'CONSUMER';

      const fallbackProfile: UserProfile = {
        id: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Honey User',
        role: resolvedRole,
        beekeeperId: isBk ? 'BK-1001' : undefined,
        labId: isLab ? 'LAB_CBRTI_PUNE' : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUserProfile(fallbackProfile);
      setActiveRole(resolvedRole);

      if (isBk) {
        setBeekeeperProfile(createDemoBeekeeperProfile(fbUser.uid, fbUser.displayName || 'Sita Ram (Beekeeper)', fbUser.email || 'beekeeper.demo@honeychain.in'));
      } else {
        setBeekeeperProfile(null);
      }
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
        setUserProfile(null);
        setBeekeeperProfile(null);
        setActiveRole('CONSUMER');
        try {
          localStorage.removeItem('hc_cached_user');
        } catch {}
      }
      setLoading(false);
    });

    return () => unsubscribe();
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

  const signInWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const res = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    try {
      await logActivity({
        action: 'USER_LOGIN_EMAIL',
        entityType: 'SYSTEM',
        entityId: res.user.uid,
        details: `User signed in with Email (${res.user.email})`,
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

  const signUpWithEmail = async (email: string, pass: string, name: string, role: UserRole) => {
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
    } else if (role === 'BEEKEEPER' || cleanEmail.includes('beekeeper')) {
      assignedRole = 'BEEKEEPER';
    } else {
      assignedRole = 'CONSUMER';
    }

    const res = await createUserWithEmailAndPassword(auth, cleanEmail, pass);

    const profile: UserProfile = {
      id: res.user.uid,
      email: cleanEmail,
      displayName: name || cleanEmail.split('@')[0],
      role: assignedRole,
      beekeeperId: assignedRole === 'BEEKEEPER' ? 'BK-1001' : undefined,
      labId: assignedRole === 'LAB' ? 'LAB_CBRTI_PUNE' : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', res.user.uid), profile);
      if (assignedRole === 'ADMIN') {
        await setDoc(doc(db, 'admins', res.user.uid), {
          uid: res.user.uid,
          email: cleanEmail,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (dbErr) {
      console.warn('Initial profile sync warning:', dbErr);
    }

    setUserProfile(profile);
    setActiveRole(assignedRole);

    if (assignedRole === 'BEEKEEPER') {
      const demoBk = createDemoBeekeeperProfile(res.user.uid, name || cleanEmail.split('@')[0], cleanEmail);
      setBeekeeperProfile(demoBk);
      try {
        await setDoc(doc(db, 'beekeepers', res.user.uid), demoBk);
      } catch {}
    }

    try {
      await logActivity({
        action: 'USER_SIGNUP',
        entityType: 'SYSTEM',
        entityId: res.user.uid,
        details: `New account registered as ${assignedRole} (${cleanEmail})`,
        actorRole: assignedRole,
      });
    } catch {}
  };

  const signOut = async () => {
    // 1. Immediately wipe any cached user items from localStorage
    try {
      localStorage.removeItem('hc_cached_user');
      localStorage.removeItem('hc_role');
      localStorage.removeItem('hc_session');
    } catch {}

    // 2. Immediately reset local context state to logged out / consumer
    setCurrentUser(null);
    setUserProfile(null);
    setBeekeeperProfile(null);
    setActiveRole('CONSUMER');

    // 3. Log audit event non-blockingly
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

    // 4. Complete Firebase sign-out
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
