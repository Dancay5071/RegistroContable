import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { listenSubscriptionStatusUser, calculateSubscription } from "../services/dbService";
import { getDemoSubscription, setDemoSubscription } from "../services/demoData";

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { user, isDemo } = useAuth();
  const [subscription, setSubscription] = useState(() => {
    if (isDemo) return getDemoSubscription();
    return calculateSubscription({}, null);
  });
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription(calculateSubscription({}, null));
      setLoadingSubscription(false);
      return;
    }

    if (isDemo) {
      setSubscription(getDemoSubscription());
      setLoadingSubscription(false);
      return;
    }

    const creationTime = user.metadata?.creationTime || null;
    const unsubscribe = listenSubscriptionStatusUser(user.uid, creationTime, (subData) => {
      setSubscription(subData);
      setLoadingSubscription(false);
    });

    return () => unsubscribe();
  }, [user, isDemo]);

  const openSubscriptionModal = useCallback(() => {
    setIsSubscriptionModalOpen(true);
  }, []);

  const closeSubscriptionModal = useCallback(() => {
    setIsSubscriptionModalOpen(false);
  }, []);

  const changeDemoSubscriptionMode = useCallback((mode) => {
    if (isDemo) {
      const updated = setDemoSubscription(mode);
      setSubscription({ ...updated });
    }
  }, [isDemo]);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loadingSubscription,
        isSubscriptionModalOpen,
        openSubscriptionModal,
        closeSubscriptionModal,
        changeDemoSubscriptionMode
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription debe ser usado dentro de un SubscriptionProvider");
  }
  return context;
}
