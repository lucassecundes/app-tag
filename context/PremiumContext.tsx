import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { checkPremiumStatus } from '../lib/premium';

type PremiumContextType = {
  isPremium: boolean;
  isLoading: boolean;
  refreshPremiumStatus: () => Promise<void>;
};

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  isLoading: true,
  refreshPremiumStatus: async () => {},
});

export const usePremium = () => useContext(PremiumContext);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshPremiumStatus = async () => {
    if (!session?.user?.id) {
      setIsPremium(false);
      setIsLoading(false);
      return;
    }

    try {
      const status = await checkPremiumStatus(session.user.id);
      setIsPremium(status);
    } catch (error) {
      console.error('Error refreshing premium status:', error);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshPremiumStatus();
  }, [session?.user?.id]);

  return (
    <PremiumContext.Provider value={{ isPremium, isLoading, refreshPremiumStatus }}>
      {children}
    </PremiumContext.Provider>
  );
};
