"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo
} from 'firebase/auth';
import { auth } from '../lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  
  // Helper to persist first-time user state to localStorage
  const saveFirstTimeState = (isFirst) => {
    try {
      if (typeof window !== 'undefined') {
        const userId = auth.currentUser?.uid;
        if (userId) {
          localStorage.setItem(`onboarding_completed_${userId}`, isFirst ? 'false' : 'true');
        }
      }
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };
  
  // Helper to read first-time user state from localStorage
  const getFirstTimeState = (userId) => {
    try {
      if (typeof window !== 'undefined' && userId) {
        const completed = localStorage.getItem(`onboarding_completed_${userId}`);
        return completed !== 'true';
      }
      return false;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return false;
    }
  };

  // Sign up function
  const signup = async (email, password, displayName) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = result;
    
    await updateProfile(user, {
      displayName: displayName,
    });
    
    // Always mark new sign-ups as first-time users
    setIsFirstTimeUser(true);
    saveFirstTimeState(true);
    
    return user;
  };

  // Sign in function
  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  };

  // Google sign in function
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Use getAdditionalUserInfo to reliably check if this is a new user
    const additionalInfo = getAdditionalUserInfo(result);
    const isNewUser = additionalInfo?.isNewUser;
    
    if (isNewUser) {
      setIsFirstTimeUser(true);
      saveFirstTimeState(true);
    }
    
    return result;
  };

  // Logout function
  const logout = () => {
    return signOut(auth);
  };

  // Complete onboarding
  const completeOnboarding = () => {
    setIsFirstTimeUser(false);
    saveFirstTimeState(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      // If user exists, check if they're a first-time user from localStorage
      if (user) {
        const isFirst = getFirstTimeState(user.uid);
        setIsFirstTimeUser(isFirst);
        
        // For brand new sign-ups, the metadata might have isNewUser=true
        if (user.metadata && (user.metadata.creationTime === user.metadata.lastSignInTime)) {
          // Additional check for new users - creation time equals sign in time
          const creationDate = new Date(user.metadata.creationTime);
          const currentDate = new Date();
          const diffInMinutes = (currentDate - creationDate) / (1000 * 60);
          
          // If account was created less than 5 minutes ago and no localStorage record exists
          if (diffInMinutes < 5 && localStorage.getItem(`onboarding_completed_${user.uid}`) === null) {
            setIsFirstTimeUser(true);
            saveFirstTimeState(true);
          }
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    signup,
    logout,
    signInWithGoogle,
    isFirstTimeUser,
    completeOnboarding,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
