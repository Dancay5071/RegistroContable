// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  sendPasswordResetEmail, 
  signOut 
} from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";

const AuthContext = createContext(null);

const DEMO_USER = {
  uid: "demo-user-id",
  email: "demo@registrocontable.com",
  displayName: "Usuario Demo",
  isDemo: true
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    // Comprobar si estaba en modo demo
    const storedDemo = localStorage.getItem("registro_contable_demo_active");
    if (storedDemo === "true") {
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (localStorage.getItem("registro_contable_demo_active") !== "true") {
        setUser(currentUser ? { ...currentUser, isDemo: false } : null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    localStorage.removeItem("registro_contable_demo_active");
    const cred = await signInWithEmailAndPassword(auth, email, password);
    setUser({ ...cred.user, isDemo: false });
    return cred;
  };

  const register = async (email, password) => {
    localStorage.removeItem("registro_contable_demo_active");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    setUser({ ...cred.user, isDemo: false });
    return cred;
  };

  const loginWithGoogle = async () => {
    localStorage.removeItem("registro_contable_demo_active");
    const cred = await signInWithPopup(auth, googleProvider);
    setUser({ ...cred.user, isDemo: false });
    return cred;
  };

  const resetPassword = async (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const loginAsDemo = () => {
    localStorage.setItem("registro_contable_demo_active", "true");
    setUser(DEMO_USER);
    setIsLoginModalOpen(false);
  };

  const logout = async () => {
    if (user?.isDemo || localStorage.getItem("registro_contable_demo_active") === "true") {
      localStorage.removeItem("registro_contable_demo_active");
      setUser(null);
      return;
    }
    await signOut(auth);
    setUser(null);
  };

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const value = {
    user,
    isDemo: Boolean(user?.isDemo),
    loading,
    login,
    register,
    loginWithGoogle,
    resetPassword,
    loginAsDemo,
    logout,
    isLoginModalOpen,
    openLoginModal,
    closeLoginModal
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}
