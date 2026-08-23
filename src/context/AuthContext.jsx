import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  sendEmailVerification,
  linkWithCredential,
  PhoneAuthProvider
} from "firebase/auth";
import { getUserMe } from "../services/apiService";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(true);
  const [authTimeout, setAuthTimeout] = useState(false);

  async function fetchDbProfile(firebaseUser) {
    if (firebaseUser) {
      try {
        const token = await firebaseUser.getIdToken();
        const res = await getUserMe(token);
        if (res.success && res.user) {
          setDbUser(res.user);
          setRole(res.user.role);
          return res.user;
        }
      } catch (err) {
        console.warn("Failed to fetch MongoDB user profile inside AuthContext:", err.message);
      }
    } else {
      setDbUser(null);
      setRole("user");
    }
    return null;
  }

  // Email & Password Registration with Display Name mapping
  async function register(email, password, fullName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: fullName });
    await sendEmailVerification(userCredential.user);
    // Update local state copy to immediately reflect the displayName in the UI
    setCurrentUser(userCredential.user);
    return userCredential.user;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Google Sign-In helper
  function googleLogin() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  // Phone Sign-In helper
  function signInWithPhone(phoneNumber, recaptchaVerifier) {
    return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  }

  // Password reset helper (Forgot Password)
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  function logout() {
    return signOut(auth);
  }

  // Refresh user state from Firebase to sync verified changes
  async function reloadUser() {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setCurrentUser(auth.currentUser);
    }
  }

  // Link Phone credential to active user account
  async function linkPhone(verificationId, code) {
    if (!auth.currentUser) throw new Error("No authenticated user session.");
    const credential = PhoneAuthProvider.credential(verificationId, code);
    const userCredential = await linkWithCredential(auth.currentUser, credential);
    setCurrentUser(userCredential.user);
    return userCredential.user;
  }

  useEffect(() => {
    // Setup a 4-second timeout to capture slow or blocked Firebase initialization
    const timer = setTimeout(() => {
      setAuthTimeout(true);
    }, 4000);

    // Setup listener for firebase auth state change
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchDbProfile(user);
      } else {
        setDbUser(null);
        setRole("user");
      }
      setLoading(false);
      setAuthTimeout(false);
      clearTimeout(timer);
    }, (error) => {
      console.warn("Firebase Auth error: ", error.message);
      setLoading(false);
      setAuthTimeout(false);
      clearTimeout(timer);
    });

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const value = {
    currentUser,
    dbUser,
    role,
    loading,
    authTimeout,
    register,
    login,
    logout,
    resetPassword,
    googleLogin,
    signInWithPhone,
    reloadUser,
    linkPhone,
    fetchDbProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
