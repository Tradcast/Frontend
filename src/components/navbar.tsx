"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useAccount } from "wagmi";
import { useMenu } from "@/contexts/menu-context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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

export function Navbar() {
  const t = useTranslations("nav");
  const { isMenuOpen, setIsMenuOpen } = useMenu();
  const router = useRouter();
  const pathname = usePathname();
  const { address, isConnected } = useAccount();

  const handleMenuToggle = (open: boolean) => {
    setIsMenuOpen(open);
  };

  const navItems = [
    { name: t("home"), path: "/home", icon: <HomeIcon /> },
    { name: t("leaderboard"), path: "/leaderboard", icon: <TrophyIcon /> },
    { name: t("profile"), path: "/profile", icon: <UserIcon /> },
  ];

  const handleNavigate = (path: string) => {
    router.push(path);
    handleMenuToggle(false);
  };

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <>
      {/* Navbar Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div
              className="flex items-center cursor-pointer"
              onClick={() => handleNavigate('/home')}
            >
              <h1 className="text-2xl font-bold text-gray-800">
                Trad<span className="text-[#d76afd]">cast</span>
              </h1>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              {/* Airdrop button */}
              <button
                onClick={() => handleNavigate('/airdrop')}
                className="relative z-50 p-2.5 rounded-xl bg-[#bdecf6]/30 hover:bg-[#bdecf6]/50 border border-[#bdecf6] transition-all duration-300 group"
                title={t("airdrop")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 group-hover:scale-110 transition-transform">
                  <rect x="3" y="8" width="18" height="4" rx="1"/>
                  <path d="M12 8v13"/>
                  <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/>
                  <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>
                </svg>
              </button>

              {/* Help/About button */}
              <button
                onClick={() => handleNavigate('/about')}
                className="relative z-50 p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all duration-300 group"
                title={t("about")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 group-hover:scale-110 transition-transform">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <path d="M12 17h.01"/>
                </svg>
              </button>

              {/* Burger Menu Button */}
              <button
                onClick={() => handleMenuToggle(!isMenuOpen)}
                className="relative z-50 p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all duration-300"
              >
                <div className="text-gray-700">
                  {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => handleMenuToggle(false)}
        />
      )}

      {/* Sidebar Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white border-l border-gray-200 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Menu Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              {t("menu")}
            </h2>
            <button
              onClick={() => handleMenuToggle(false)}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all duration-300 text-gray-700"
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
                    ? "bg-[#d76afd]/10 border-2 border-[#d76afd]/30"
                    : "bg-gray-50 border-2 border-transparent hover:border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div className={isActive ? "text-[#d76afd]" : "text-gray-500"}>
                  {item.icon}
                </div>
                <span
                  className={`text-base font-semibold ${
                    isActive ? "text-[#d76afd]" : "text-gray-700"
                  }`}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Wallet Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          {/* Wallet Status */}
          {isConnected && address && (
            <div className="mb-3 p-3 bg-white rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-gray-500 font-semibold">{t("connected")}</span>
              </div>
              <p className="text-sm text-gray-700 font-mono">
                {formatAddress(address)}
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
