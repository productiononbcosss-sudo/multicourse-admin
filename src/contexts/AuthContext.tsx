import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../services/firebase';
import { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  userRole: UserRole | null;  // ADD THIS
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;  // ADD THIS (alias for signOut)
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async (uid: string) => {
    try {
      console.log('Looking for user document:', uid);
      const userDoc = await getDoc(doc(db, 'users', uid));
      console.log('User doc exists:', userDoc.exists());
      
      if (userDoc.exists()) {
        const data = userDoc.data() as User;
        console.log('User data loaded:', data);
        
        // Check if user is active
        if (!data.active) {
          setError('Your account is inactive. Please contact administrator.');
          await firebaseSignOut(auth);
          return;
        }
        
        setUserData(data);
      } else {
        // Auto-create user document for new users
        console.log('Creating new user document for:', uid);
        const currentUser = auth.currentUser;
        
        if (currentUser) {
          const newUserData: User = {
            uid: uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            photoURL: currentUser.photoURL || undefined,
            role: 'instructor', // Default role - can be changed by admin
            assignedCourses: [], // No courses assigned initially
            active: false, // Inactive until admin approves
            createdAt: new Date(),
            lastLoginAt: new Date()
          };
          
          // Create the user document
          await setDoc(doc(db, 'users', uid), newUserData);
          console.log('New user document created');
          
          setError('Account created! Waiting for administrator approval. Please contact your administrator to activate your account.');
          await firebaseSignOut(auth);
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user.uid);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserData(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || 'Failed to sign out');
    }
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
  currentUser,
  userData,
  userRole: userData?.role || null,  // ADD THIS
  loading,
  error,
  signInWithGoogle,
  signOut,
  logout: signOut,  // ADD THIS (alias)
  clearError
};

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};