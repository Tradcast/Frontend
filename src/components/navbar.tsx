"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAccount, useDisconnect, useConnect } from "wagmi";

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const WalletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
  </svg>
);

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();

  const navItems = [
    { name: "Home", path: "/home", icon: <HomeIcon /> },
    { name: "Leaderboard", path: "/leaderboard", icon: <TrophyIcon /> },
    { name: "Profile", path: "/profile", icon: <UserIcon /> },
    { name: "Buy TCredit", path: "/buy-credit", icon: <CreditCardIcon /> },
  ];

  const handleNavigate = (path: string) => {
    router.push(path);
    setIsMenuOpen(false);
  };

  const handleWalletAction = () => {
    if (isConnected) {
      disconnect();
    } else {
      const farcasterConnector = connectors.find(c =>
        /frame|farcaster/i.test(c.id + c.name)
      );
      if (farcasterConnector) {
        connect({ connector: farcasterConnector });
      }
    }
    setIsMenuOpen(false);
  };

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <>
      {/* Navbar Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#0F172A] backdrop-blur-xl border-b-2 border-[#8B5CF6]/30 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div
              className="flex items-center cursor-pointer"
              onClick={() => handleNavigate('/home')}
            >
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#A78BFA] via-white to-[#A78BFA]">
                Tradcast
              </h1>
            </div>

            {/* Burger Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative z-50 p-2 rounded-lg bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-2 border-[#8B5CF6]/40 hover:border-[#A78BFA]/60 transition-all duration-300 hover:shadow-[0_0_16px_rgba(167,139,250,0.4)]"
            >
              <div className="text-[#A78BFA]">
                {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] border-l-2 border-[#8B5CF6]/30 shadow-[-4px_0_24px_rgba(0,0,0,0.5)] z-50 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Menu Header */}
        <div className="p-6 border-b-2 border-[#8B5CF6]/20">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#A78BFA] to-white">
              Menu
            </h2>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 rounded-lg bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-2 border-[#8B5CF6]/40 hover:border-[#A78BFA]/60 transition-all duration-300 text-[#A78BFA]"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-[#8B5CF6]/30 to-[#A78BFA]/30 border-2 border-[#A78BFA]/50 shadow-[0_0_16px_rgba(167,139,250,0.3)]"
                    : "bg-slate-800/40 border-2 border-slate-700/40 hover:border-[#8B5CF6]/50 hover:bg-slate-800/60"
                }`}
              >
                <div className={isActive ? "text-[#A78BFA]" : "text-slate-400"}>
                  {item.icon}
                </div>
                <span
                  className={`text-base font-semibold ${
                    isActive ? "text-white" : "text-slate-300"
                  }`}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Wallet Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t-2 border-[#8B5CF6]/20 bg-gradient-to-t from-[#0F172A] to-transparent">
          {/* Wallet Status */}
          {isConnected && address && (
            <div className="mb-3 p-3 bg-slate-800/60 rounded-lg border-2 border-slate-700/40">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]"></div>
                <span className="text-xs text-slate-400 font-semibold">Connected</span>
              </div>
              <p className="text-sm text-slate-300 font-mono">
                {formatAddress(address)}
              </p>
            </div>
          )}

          {/* Wallet Action Button */}
          <button
            onClick={handleWalletAction}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
              isConnected
                ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border-2 border-red-500/50 text-white shadow-[0_0_16px_rgba(239,68,68,0.3)]"
                : "bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] hover:from-[#7C3AED] hover:to-[#8B5CF6] border-2 border-[#A78BFA]/50 text-white shadow-[0_0_16px_rgba(167,139,250,0.4)]"
            }`}
          >
            <WalletIcon />
            {isConnected ? "Disconnect Wallet" : "Connect Wallet"}
          </button>
        </div>
      </div>
    </>
  );
}