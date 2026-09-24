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
});

const SUPER_ADMIN_EMAIL = 'adityatripathi1085@gmail.com';

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

      const isSuperAdmin = fbUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

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
        setActiveRole(data.role || 'CONSUMER');
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
        setActiveRole(initialRole);
      }

      // Check beekeeper profile
      const bkRef = doc(db, 'beekeepers', fbUser.uid);
      const bkSnap = await getDoc(bkRef);
      if (bkSnap.exists()) {
        setBeekeeperProfile(bkSnap.data() as BeekeeperProfile);
      } else {
        setBeekeeperProfile(null);
      }
    } catch (err) {
      console.error('Error syncing user data:', err);
      // Soft-fallback for dev so UI remains operational even if network is warm
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
        setUserProfile(null);
        setBeekeeperProfile(null);
        setActiveRole('CONSUMER');
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
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      await logActivity({
        action: 'USER_LOGIN_EMAIL',
        entityType: 'SYSTEM',
        entityId: res.user.uid,
        details: `User signed in with Email (${res.user.email})`,
      });
    } catch (error: unknown) {
      console.error('Email Sign-In failed:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, role: UserRole) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const isSuperAdmin = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
      const assignedRole = isSuperAdmin ? 'ADMIN' : role;

      const profile: UserProfile = {
        id: res.user.uid,
        email,
        displayName: name,
        role: assignedRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', res.user.uid), profile);

      if (assignedRole === 'ADMIN') {
        await setDoc(doc(db, 'admins', res.user.uid), {
          uid: res.user.uid,
          email,
          createdAt: new Date().toISOString(),
        });
      }

      setUserProfile(profile);
      setActiveRole(assignedRole);

      await logActivity({
        action: 'USER_SIGNUP',
        entityType: 'SYSTEM',
        entityId: res.user.uid,
        details: `New account registered as ${assignedRole} (${email})`,
        actorRole: assignedRole,
      });
    } catch (error: unknown) {
      console.error('Sign-Up failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (currentUser) {
        await logActivity({
          action: 'USER_LOGOUT',
          entityType: 'SYSTEM',
          entityId: currentUser.uid,
          details: `User signed out (${currentUser.email})`,
        });
      }
      await fbSignOut(auth);
      setUserProfile(null);
      setBeekeeperProfile(null);
      setActiveRole('CONSUMER');
    } catch (error: unknown) {
      console.error('Sign Out failed:', error);
      throw error;
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
        setActiveRole,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        bootstrapAdmin,
        refreshBeekeeperProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
