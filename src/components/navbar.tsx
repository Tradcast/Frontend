"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useAccount } from "wagmi";
import { useNotifications } from "@/contexts/notification-context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useMiniApp } from "@/contexts/miniapp-context";
import { getAuthFetch } from "@/lib/auth-fetch";
import { useState, useRef, useEffect, useCallback } from "react";

const BellIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
);

export function Navbar() {
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { isMiniPay, isWeb } = useMiniApp();
  const { notifications, notificationsRead, markAsRead } = useNotifications();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const authFetch = useCallback(
    (url: string, options: RequestInit = {}) => {
      return getAuthFetch(address, isMiniPay, isWeb)(url, options);
    },
    [address, isMiniPay, isWeb]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    if (isNotifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotifOpen]);

  const handleBellClick = async () => {
    const opening = !isNotifOpen;
    setIsNotifOpen(opening);

    if (opening && !notificationsRead) {
      markAsRead();
      try {
        await authFetch('/api/handle-notification', { method: 'POST' });
      } catch (err) {
        console.warn('Failed to mark notifications as read:', err);
      }
    }
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => handleNavigate('/home')}
          >
            <h1 className="text-xl font-bold text-gray-800">
              Trad<span className="text-[#d76afd]">cast</span>
            </h1>
          </div>

          {/* Right side: Language, Airdrop, About, Notifications */}
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher />

            {/* Airdrop */}
            <button
              onClick={() => handleNavigate('/airdrop')}
              className="p-2 rounded-xl bg-[#bdecf6]/30 hover:bg-[#bdecf6]/50 border border-[#bdecf6] transition-all group"
              title={t("airdrop")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 group-hover:scale-110 transition-transform">
                <rect x="3" y="8" width="18" height="4" rx="1"/>
                <path d="M12 8v13"/>
                <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/>
                <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>
              </svg>
            </button>

            {/* About */}
            <button
              onClick={() => handleNavigate('/about')}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all group"
              title={t("about")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 group-hover:scale-110 transition-transform">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <path d="M12 17h.01"/>
              </svg>
            </button>

            {/* Notification Bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={handleBellClick}
                className={`relative p-2 rounded-xl border transition-all group ${
                  isNotifOpen
                    ? 'bg-[#d76afd]/10 border-[#d76afd]/30'
                    : 'bg-gray-100 hover:bg-gray-200 border-gray-200'
                }`}
                title={t("notifications")}
              >
                <BellIcon className={`${isNotifOpen ? 'text-[#d76afd]' : 'text-gray-600'} group-hover:scale-110 transition-transform`} />
                {!notificationsRead && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 max-h-[400px] bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-800">{t("notifications")}</h3>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
                      </span>
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="overflow-y-auto max-h-[320px]">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <BellIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">{t("noNotifications")}</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {notifications.map((notif, idx) => (
                          <div
                            key={idx}
                            className="px-4 py-3 hover:bg-gray-50/80 transition-colors"
                          >
                            <div className="flex gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <div className={`w-2 h-2 rounded-full mt-1.5 ${idx === 0 && !notificationsRead ? 'bg-[#d76afd]' : 'bg-gray-300'}`} />
                              </div>
                              <p className="text-[13px] text-gray-700 leading-relaxed">{notif}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
