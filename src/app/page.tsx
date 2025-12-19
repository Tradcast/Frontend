// src/app/page.tsx
"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAccount, useConnect } from "wagmi";

export default function RootPage() {
  const { context, isMiniAppReady } = useMiniApp();
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const hasAuthenticatedRef = useRef(false);

  // Wallet connection hooks
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();

  // Auto-connect wallet when miniapp is ready
  useEffect(() => {
    if (isMiniAppReady && !isConnected && !isConnecting && connectors.length > 0) {
      const farcasterConnector = connectors.find(c => c.id === 'farcaster');
      if (farcasterConnector) {
        console.log('🔵 Connecting wallet...');
        connect({ connector: farcasterConnector });
      }
    }
  }, [isMiniAppReady, isConnected, isConnecting, connectors, connect]);

  // Auto-authenticate user and redirect to home
  useEffect(() => {
    const authenticateAndRedirect = async () => {
      // Wait for miniapp to be ready and wallet to be connected
      if (!isMiniAppReady || hasAuthenticatedRef.current || !context?.user) {
        return;
      }

      // Wait for wallet connection if still connecting
      if (isConnecting) {
        return;
      }

      // Prevent multiple authentication attempts
      hasAuthenticatedRef.current = true;

      console.log('🟢 Authenticating user...');

      try {
        const user = context.user;
        const username = user.username || user.displayName || '';
        const walletAddress = address ||
          user.verified_addresses?.eth_addresses?.[0] ||
          user.custody ||
          '';

        console.log('🟢 User data:', {
          fid: user.fid,
          username: username,
          displayName: user.displayName,
          wallet: walletAddress,
        });

        // Build query parameters
        const params = new URLSearchParams();
        if (username) params.append('username', username);
        if (walletAddress) params.append('wallet', walletAddress);

        // Use fetch with QuickAuth to GET the profile with username and wallet
        const { sdk } = await import("@farcaster/frame-sdk");
        const profileUrl = `/api/profile?${params.toString()}`;
        console.log('🟢 Calling profile API:', profileUrl);

        const res = await sdk.quickAuth.fetch(profileUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('🟢 GET response status:', res.status);

        if (res.ok) {
          const data = await res.json();
          console.log('✅ User authenticated successfully:', data);

          // Small delay to ensure everything is ready
          setTimeout(() => {
            console.log('🟢 Redirecting to /home...');
            router.push('/home');
          }, 500);
        } else {
          const errorText = await res.text();
          console.error('❌ Failed to authenticate user:', res.status, errorText);
          hasAuthenticatedRef.current = false;
          setIsAuthenticating(false);
        }
      } catch (error) {
        console.error('❌ Error authenticating user:', error);
        hasAuthenticatedRef.current = false;
        setIsAuthenticating(false);
      }
    };

    authenticateAndRedirect();
  }, [isMiniAppReady, context, router, address, isConnecting]);

  // Loading screen
  return (
    <main className="flex-1">
      <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A]">
        <div className="w-full max-w-md mx-auto p-8 text-center">
          {/* Animated spinner */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-[#8B5CF6]/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#A78BFA] animate-spin"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#A78BFA]/20 to-[#8B5CF6]/20 backdrop-blur-xl"></div>
          </div>

          {/* Loading text */}
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#A78BFA] to-white mb-2">
            {!isMiniAppReady ? 'Loading MiniApp...' : isConnecting ? 'Connecting Wallet...' : 'Authenticating...'}
          </h2>
          <p className="text-slate-400 text-sm">
            Please wait while we set things up
          </p>

          {/* Pulsing dots */}
          <div className="flex justify-center gap-2 mt-6">
            <div className="w-2 h-2 rounded-full bg-[#A78BFA] animate-pulse" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 rounded-full bg-[#A78BFA] animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 rounded-full bg-[#A78BFA] animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>

          {/* Error state */}
          {!isAuthenticating && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">
                Authentication failed. Please try again.
              </p>
              <button
                onClick={() => {
                  hasAuthenticatedRef.current = false;
                  setIsAuthenticating(true);
                }}
                className="mt-3 px-4 py-2 bg-[#A78BFA] hover:bg-[#8B5CF6] text-white rounded-lg text-sm transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}