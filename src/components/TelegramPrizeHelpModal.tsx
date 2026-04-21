"use client";

import { useTranslations } from "next-intl";

const TELEGRAM_CHANNEL_URL = "https://t.me/simmerliq";

type TelegramPrizeHelpModalProps = {
  open: boolean;
  onClose: () => void;
};

export function TelegramPrizeHelpModal({ open, onClose }: TelegramPrizeHelpModalProps) {
  const t = useTranslations("airdrop");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="round-code-help-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label={t("telegramPrizeHelpCloseAria")}
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35)] p-4 text-left">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h2 id="round-code-help-title" className="text-sm font-bold text-gray-900 pr-6">
            {t("telegramPrizeHelpTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 -mt-1 -mr-1 w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 text-lg leading-none"
            aria-label={t("telegramPrizeHelpCloseAria")}
          >
            ×
          </button>
        </div>

        <ul className="text-[11px] text-gray-600 space-y-2 list-disc pl-4 leading-relaxed">
          <li>{t("telegramPrizeHelpItem1")}</li>
          <li>{t("telegramPrizeHelpItem2")}</li>
          <li>{t("telegramPrizeHelpItem3")}</li>
          <li>{t("telegramPrizeHelpItem4")}</li>
        </ul>

        <a
          href={TELEGRAM_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 w-full inline-flex items-center justify-center py-2.5 rounded-xl text-[12px] font-bold border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
        >
          {t("telegramPrizeHelpJoinChannel")}
        </a>

        <button
          type="button"
          onClick={onClose}
          className="mt-2.5 w-full py-2.5 rounded-xl text-[12px] font-bold bg-[#d76afd] text-white hover:opacity-95 active:scale-[0.99] transition-transform"
        >
          {t("telegramPrizeHelpGotIt")}
        </button>
      </div>
    </div>
  );
}
