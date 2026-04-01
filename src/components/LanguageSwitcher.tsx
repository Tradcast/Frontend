"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter as useNextRouter } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useTransition } from "react";

/** End-user labels (native script where helpful). */
const labels: Record<string, string> = {
  en: "English",
  sw: "Kiswahili",
  yo: "Yorùbá",
  pt: "Português",
  es: "Español",
  ha: "Hausa",
  ig: "Igbo",
  tn: "Setswana",
  zu: "isiZulu",
  xh: "isiXhosa",
  fr: "Français",
};

export function LanguageSwitcher() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const nextRouter = useNextRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-1.5 text-sm text-gray-600">
      <span className="sr-only">{t("language")}</span>
      <select
        aria-label={t("language")}
        value={locale}
        disabled={isPending}
        onChange={(e) => {
          const nextLocale = e.target.value;
          startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
            // Ensure Server Components + NextIntlClientProvider receive the new locale’s messages after client navigation.
            queueMicrotask(() => nextRouter.refresh());
          });
        }}
        className="rounded-lg border border-gray-200 bg-white/90 px-2 py-1.5 text-xs font-medium text-gray-800 shadow-sm focus:border-[#d76afd] focus:outline-none focus:ring-1 focus:ring-[#d76afd]"
      >
        {routing.locales.map((loc) => (
          <option key={loc} value={loc}>
            {labels[loc] ?? loc}
          </option>
        ))}
      </select>
    </label>
  );
}
