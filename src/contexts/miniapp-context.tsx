// src/contexts/miniapp-context.tsx
"use client";
// Use any types for Farcaster SDK compatibility
type FrameContext = any;
type AddFrameResult = any;
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import FrameWalletProvider from "./frame-wallet-context";

// Helper to detect MiniPay environment
const isMiniPayEnvironment = () => {
  if (typeof window === 'undefined') return false;
  return (window as any).ethereum?.isMiniPay === true;
};

// Helper to detect Farcaster Frame environment
const isFarcasterEnvironment = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.location !== window.parent.location || // In an iframe
    (window as any).farcaster || // Farcaster SDK present
    window.location.href.includes('warpcast.com') ||
    document.referrer.includes('warpcast.com') ||
    document.referrer.includes('farcaster')
  );
};

// Get environment type
export type EnvironmentType = 'minipay' | 'farcaster' | 'web';

const getEnvironmentType = (): EnvironmentType => {
  if (isMiniPayEnvironment()) return 'minipay';
  if (isFarcasterEnvironment()) return 'farcaster';
  return 'web';
};

interface MiniAppContextType {
  isMiniAppReady: boolean;
  context: FrameContext | null;
  isMiniPay: boolean;
  isWeb: boolean;
  isFarcaster: boolean;
  environment: EnvironmentType;
  setMiniAppReady: () => void;
  addMiniApp: () => Promise<AddFrameResult | null>;
}

const MiniAppContext = createContext<MiniAppContextType | undefined>(undefined);

interface MiniAppProviderProps {
  addMiniAppOnLoad?: boolean;
  children: ReactNode;
}

export function MiniAppProvider({ children, addMiniAppOnLoad }: MiniAppProviderProps): JSX.Element {
  const [context, setContext] = useState<FrameContext | null>(null);
  const [isMiniAppReady, setIsMiniAppReady] = useState(false);
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [isWeb, setIsWeb] = useState(false);
  const [isFarcaster, setIsFarcaster] = useState(false);
  const [environment, setEnvironment] = useState<EnvironmentType>('web');

  const setMiniAppReadyFn = useCallback(async () => {
    const envType = getEnvironmentType();
    setEnvironment(envType);
    
    // Check if we're in MiniPay environment
    if (envType === 'minipay') {
      console.log("🟡 MiniPay detected - skipping Farcaster SDK initialization");
      setIsMiniPay(true);
      setIsWeb(false);
      setIsFarcaster(false);
      setIsMiniAppReady(true);
      return;
    }

    // Check if we're in regular web browser
    if (envType === 'web') {
      console.log("🌐 Web browser detected - skipping Farcaster SDK initialization");
      setIsWeb(true);
      setIsMiniPay(false);
      setIsFarcaster(false);
      setIsMiniAppReady(true);
      return;
    }

    // Farcaster environment - initialize SDK
    setIsFarcaster(true);
    setIsWeb(false);
    setIsMiniPay(false);
    
    try {
      const { sdk } = await import("@farcaster/miniapp-sdk");
      const ctx = await sdk.context;
      if (ctx) {
        setContext(ctx);
      }
      await sdk.actions.ready();
      console.log("✅ Farcaster SDK initialized");
    } catch (err) {
      console.warn("SDK initialization error (might be in browser):", err);
      // If Farcaster SDK fails, fall back to web mode
      setIsFarcaster(false);
      setIsWeb(true);
      setEnvironment('web');
    } finally {
      setIsMiniAppReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isMiniAppReady) {
      setMiniAppReadyFn().then(() => {
        console.log("MiniApp loaded");
      });
    }
  }, [isMiniAppReady, setMiniAppReadyFn]);

  const handleAddMiniApp = useCallback(async () => {
    // Skip for MiniPay
    if (isMiniPay || isMiniPayEnvironment()) {
      console.log("🟡 MiniPay - skipping addFrame");
      return null;
    }

    try {
      const { sdk } = await import("@farcaster/miniapp-sdk");
      const result = await sdk.actions.addFrame();
      if (result) {
        return result;
      }
      return null;
    } catch (error) {
      console.error("[error] adding frame", error);
      return null;
    }
  }, [isMiniPay]);

  useEffect(() => {
    // on load, set the frame as ready (only for Farcaster)
    if (isMiniAppReady && !isMiniPay && !context?.client?.added && addMiniAppOnLoad) {
      handleAddMiniApp();
    }
  }, [
    isMiniAppReady,
    isMiniPay,
    context?.client?.added,
    handleAddMiniApp,
    addMiniAppOnLoad,
  ]);

  return (
    <MiniAppContext.Provider
      value={{
        isMiniAppReady,
        isMiniPay,
        isWeb,
        isFarcaster,
        environment,
        setMiniAppReady: setMiniAppReadyFn,
        addMiniApp: handleAddMiniApp,
        context,
      }}
    >
      <FrameWalletProvider>{children}</FrameWalletProvider>
    </MiniAppContext.Provider>
  );
}

export function useMiniApp(): MiniAppContextType {
  const context = useContext(MiniAppContext);
  if (context === undefined) {
    throw new Error("useMiniApp must be used within a MiniAppProvider");
  }
  return context;
}
