import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

import en from "@/messages/en.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import ha from "@/messages/ha.json";
import ig from "@/messages/ig.json";
import pt from "@/messages/pt.json";
import sw from "@/messages/sw.json";
import tn from "@/messages/tn.json";
import xh from "@/messages/xh.json";
import yo from "@/messages/yo.json";
import zu from "@/messages/zu.json";

const messagesByLocale = {
  en,
  sw,
  yo,
  pt,
  es,
  ha,
  ig,
  tn,
  zu,
  xh,
  fr,
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  const messages =
    messagesByLocale[locale as keyof typeof messagesByLocale] ?? messagesByLocale.en;

  return {
    locale,
    messages,
  };
});
