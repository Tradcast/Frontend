"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { TelegramPrizeCodeCard } from "@/components/TelegramPrizeCodeCard";

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export default function TelegramRewardsPage() {
  const router = useRouter();
  const t = useTranslations("airdrop");
  const tc = useTranslations("common");

  return (
    <main className="flex flex-col min-h-screen bg-[#ebeff2] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute top-28 left-6 opacity-30" width="50" height="100" viewBox="0 0 50 100">
          <line x1="15" y1="10" x2="15" y2="25" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round" />
          <rect x="9" y="25" width="12" height="35" rx="2" fill="#bdecf6" />
          <line x1="15" y1="60" x2="15" y2="80" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg className="absolute bottom-32 right-8 opacity-25" width="40" height="85" viewBox="0 0 40 85">
          <line x1="20" y1="5" x2="20" y2="18" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round" />
          <rect x="14" y="18" width="12" height="40" rx="2" fill="#bdecf6" />
          <line x1="20" y1="58" x2="20" y2="75" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <header className="w-full p-6 z-20">
        <button
          type="button"
          onClick={() => router.push("/home")}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-gray-600 hover:text-gray-800 transition-all duration-300 shadow-card"
        >
          <BackIcon />
          <span className="text-sm font-medium">{tc("back")}</span>
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mt-6 text-center">{t("tabTelegramRewards")}</h1>
      </header>

      <div className="flex-1 flex flex-col items-center z-10 p-6 pb-12 w-full max-w-md mx-auto">
        <p className="text-gray-600 text-sm text-center leading-relaxed mb-4 px-1 w-full">{t("telegramRewardsIntro")}</p>
        <TelegramPrizeCodeCard />
      </div>
    </main>
  );
}
