"use client";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const TelegramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const CoinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
    <circle cx="12" cy="12" r="8"/>
    <path d="M12 2v2"/>
    <path d="M12 20v2"/>
    <path d="m4.93 4.93 1.41 1.41"/>
    <path d="m17.66 17.66 1.41 1.41"/>
    <path d="M2 12h2"/>
    <path d="M20 12h2"/>
    <path d="m6.34 17.66-1.41 1.41"/>
    <path d="m19.07 4.93-1.41 1.41"/>
  </svg>
);

const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d76afd]">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);

const LeverageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);

export default function AboutPage() {
  const router = useRouter();
  const t = useTranslations("about");
  const tc = useTranslations("common");

  return (
    <main className="flex flex-col min-h-screen bg-[#ebeff2] relative overflow-hidden">
      {/* Background Candlestick Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Candles - Top Left */}
        <svg className="absolute top-24 left-4 opacity-25" width="50" height="110" viewBox="0 0 50 110">
          <line x1="15" y1="10" x2="15" y2="25" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="9" y="25" width="12" height="40" rx="2" fill="#bdecf6"/>
          <line x1="15" y1="65" x2="15" y2="85" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <line x1="38" y1="30" x2="38" y2="45" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="32" y="45" width="12" height="25" rx="2" fill="none" stroke="#bdecf6" strokeWidth="2"/>
          <line x1="38" y1="70" x2="38" y2="90" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
        </svg>

        {/* Candles - Top Right */}
        <svg className="absolute top-32 right-6 opacity-30" width="40" height="90" viewBox="0 0 40 90">
          <line x1="20" y1="5" x2="20" y2="20" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="14" y="20" width="12" height="45" rx="2" fill="#bdecf6"/>
          <line x1="20" y1="65" x2="20" y2="80" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
        </svg>

        {/* Candles - Bottom Left */}
        <svg className="absolute bottom-20 left-8 opacity-20" width="35" height="70" viewBox="0 0 35 70">
          <line x1="17" y1="5" x2="17" y2="15" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="11" y="15" width="12" height="30" rx="2" fill="#bdecf6"/>
          <line x1="17" y1="45" x2="17" y2="60" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
        </svg>

        {/* Candles - Bottom Right */}
        <svg className="absolute bottom-28 right-4 opacity-25" width="55" height="100" viewBox="0 0 55 100">
          <line x1="15" y1="25" x2="15" y2="40" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="9" y="40" width="12" height="30" rx="2" fill="none" stroke="#bdecf6" strokeWidth="2"/>
          <line x1="15" y1="70" x2="15" y2="90" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <line x1="40" y1="10" x2="40" y2="25" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="34" y="25" width="12" height="40" rx="2" fill="#bdecf6"/>
          <line x1="40" y1="65" x2="40" y2="85" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Back button */}
      <button
        onClick={() => router.push('/home')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-gray-600 hover:text-gray-800 transition-all duration-300 shadow-card"
      >
        <BackIcon />
        <span className="text-sm font-medium">{tc("back")}</span>
      </button>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center z-10 p-6 pt-20 pb-12 overflow-y-auto">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 text-center">
          {t.rich("aboutHeadline", {
            tradcast: (chunks) => <span className="text-[#d76afd]">{chunks}</span>,
          })}
        </h1>
        
        {/* Decorative line */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-[2px] w-8 bg-gradient-to-r from-transparent to-[#bdecf6] rounded-full"></div>
          <div className="h-1.5 w-16 bg-gradient-to-r from-[#bdecf6] to-[#d76afd] rounded-full"></div>
          <div className="h-[2px] w-8 bg-gradient-to-l from-transparent to-[#bdecf6] rounded-full"></div>
        </div>

        {/* Main description card */}
        <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-card">
          <p className="text-gray-700 text-base leading-relaxed mb-4">{t("mainP1")}</p>
          <p className="text-gray-600 text-sm leading-relaxed">{t("mainP2")}</p>
        </div>

        {/* How to Play Section */}
        <div className="w-full max-w-lg mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">🎮</span> {t("howToPlay")}
          </h2>
          
          {/* Trading Buttons Explanation */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 shadow-card">
            <h3 className="text-gray-800 font-semibold mb-4 text-center">{t("tradingButtons")}</h3>
            
            {/* Button Examples */}
            <div className="flex justify-center gap-3 mb-5">
              <div className="px-4 py-2 bg-emerald-500 text-white font-bold text-sm rounded-lg shadow">
                {t("btnLong")}
              </div>
              <div className="px-4 py-2 bg-red-500 text-white font-bold text-sm rounded-lg shadow">
                {t("btnShort")}
              </div>
              <div className="px-4 py-2 bg-blue-500 text-white font-bold text-sm rounded-lg shadow">
                {t("btnClose")}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-emerald-100 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-emerald-600 text-xs font-bold">L</span>
                </div>
                <p className="text-gray-600 text-sm">{t("longExpl")}</p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-100 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-600 text-xs font-bold">S</span>
                </div>
                <p className="text-gray-600 text-sm">{t("shortExpl")}</p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">C</span>
                </div>
                <p className="text-gray-600 text-sm">{t("closeExpl")}</p>
              </div>
            </div>
          </div>
          
          {/* Important Rules */}
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 mb-4">
            <h3 className="text-amber-700 font-semibold mb-3 flex items-center gap-2">
              <span>⚠️</span> {t("importantRules")}
            </h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                <span>{t("rule1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                <span>{t("rule2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                <span>{t("rule3")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                <span>{t("rule4")}</span>
              </li>
            </ul>
          </div>
          
          {/* Game Flow */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-card">
            <h3 className="text-gray-800 font-semibold mb-3 flex items-center gap-2">
              <span>🏁</span> {t("gameFlow")}
            </h3>
            <ol className="space-y-2 text-gray-600 text-sm">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-[#d76afd]/20 rounded-full flex items-center justify-center text-[#d76afd] text-xs font-bold flex-shrink-0">1</span>
                <span>{t("flow1")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-[#d76afd]/20 rounded-full flex items-center justify-center text-[#d76afd] text-xs font-bold flex-shrink-0">2</span>
                <span>{t("flow2")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-[#d76afd]/20 rounded-full flex items-center justify-center text-[#d76afd] text-xs font-bold flex-shrink-0">3</span>
                <span>{t("flow3")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-[#d76afd]/20 rounded-full flex items-center justify-center text-[#d76afd] text-xs font-bold flex-shrink-0">4</span>
                <span>{t("flow4")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-[#d76afd]/20 rounded-full flex items-center justify-center text-[#d76afd] text-xs font-bold flex-shrink-0">5</span>
                <span>{t("flow5")}</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Features grid */}
        <div className="w-full max-w-lg grid grid-cols-1 gap-4 mb-6">
          {/* Feature 1 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4 shadow-card">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ChartIcon />
            </div>
            <div>
              <h3 className="text-gray-800 font-semibold mb-1">{t("feat1Title")}</h3>
              <p className="text-gray-500 text-sm">{t("feat1Desc")}</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4 shadow-card">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <LeverageIcon />
            </div>
            <div>
              <h3 className="text-gray-800 font-semibold mb-1">{t("feat2Title")}</h3>
              <p className="text-gray-500 text-sm">{t("feat2Desc")}</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4 shadow-card">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CoinIcon />
            </div>
            <div>
              <h3 className="text-gray-800 font-semibold mb-1">{t("feat3Title")}</h3>
              <p className="text-gray-500 text-sm">{t("feat3Desc")}</p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4 shadow-card">
            <div className="w-12 h-12 bg-[#d76afd]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrophyIcon />
            </div>
            <div>
              <h3 className="text-gray-800 font-semibold mb-1">{t("feat4Title")}</h3>
              <p className="text-gray-500 text-sm">{t("feat4Desc")}</p>
            </div>
          </div>
        </div>

        {/* Celo requirement notice */}
        <div className="w-full max-w-lg mt-6 px-4 py-3 bg-white rounded-xl border border-gray-200 shadow-card">
          <p className="text-sm text-gray-600 text-center">
            {t("celoNotice")}
          </p>
        </div>

        {/* Footer note */}
        <p className="text-gray-400 text-xs text-center mt-6 max-w-md">
          {t("footerNote")}
        </p>

        {/* Support */}
        <div className="w-full max-w-lg mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col items-center gap-4">
            <a
              href="https://t.me/TradcastBot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#229ED9]/10 border border-[#229ED9]/30 text-[#229ED9] hover:bg-[#229ED9]/20 hover:border-[#229ED9]/50 transition-all duration-200 shadow-card text-sm font-semibold"
            >
              <TelegramIcon />
              {t("supportBtn")}
            </a>
            <p className="text-gray-400 text-xs">{t("supportHint")}</p>
            <a
              href="mailto:tradcastsupport@tradcast.awsapps.com"
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200 hover:border-gray-300 transition-all duration-200 shadow-card text-sm font-semibold mt-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              {t("emailBtn")}
            </a>
            <p className="text-gray-400 text-[10px] mt-1">tradcastsupport@tradcast.awsapps.com</p>
          </div>
        </div>

        {/* Legal links */}
        <div className="w-full max-w-lg mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/terms"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-[#d76afd] hover:border-[#d76afd]/50 transition-all duration-200 shadow-card text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              {t("linkTerms")}
            </Link>
            <Link
              href="/privacy"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-[#d76afd] hover:border-[#d76afd]/50 transition-all duration-200 shadow-card text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              {t("linkPrivacy")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
