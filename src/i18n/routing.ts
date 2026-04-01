import { defineRouting } from "next-intl/routing";

/**
 * Locales aligned with MiniPay / Tradcast user regions:
 * English (primary), Swahili, Yoruba, Portuguese, Spanish,
 * Hausa, Igbo, Setswana, Zulu, Xhosa, French.
 */
export const routing = defineRouting({
  locales: [
    "en", // English — primary / international
    "sw", // Swahili (Kiswahili) — East Africa (Kenya, Tanzania, etc.)
    "yo", // Yoruba — Nigeria
    "pt", // Portuguese — Brazil & Lusophone LATAM
    "es", // Spanish — LATAM (e.g. Mercado Pago markets)
    "ha", // Hausa — Nigeria & wider region
    "ig", // Igbo — Nigeria
    "tn", // Setswana — Southern Africa
    "zu", // Zulu — South Africa
    "xh", // Xhosa — South Africa
    "fr", // French — West/Central Africa (e.g. Cameroon)
  ],
  defaultLocale: "en",
  localePrefix: "always",
});
