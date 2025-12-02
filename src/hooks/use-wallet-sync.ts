import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useMiniApp } from '@/contexts/miniapp-context';

export function useWalletSync() {
  const { address, isConnected } = useAccount();
  const { context } = useMiniApp();

  useEffect(() => {
    if (isConnected && address) {
      // Send wallet connection to backend
      fetch('/api/wallet/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          farcasterUsername: context?.user?.username,
          farcasterFid: context?.user?.fid,
          displayName: context?.user?.displayName,
          timestamp: new Date().toISOString(),
        }),
      })
        .then(res => res.json())
        .then(data => console.log('Wallet synced:', data))
        .catch(err => console.error('Failed to sync wallet:', err));
    }
  }, [isConnected, address, context]);
}