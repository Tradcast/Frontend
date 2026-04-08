import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { preconnect } from "react-dom";
import { ConditionalNavbar } from "@/components/ConditionalNavbar";
import { LocaleHtmlLang } from "@/components/LocaleHtmlLang";
import Providers from "@/components/providers";
import { MenuProvider } from "@/contexts/menu-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { routing } from "@/i18n/routing";

preconnect("https://auth.farcaster.xyz");

const appUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:6021";

const frame = {
  version: "1",
  imageUrl: `${appUrl}/opengraph-image.png`,
  button: {
    title: "Launch Tradcast",
    action: {
      type: "launch_frame",
      name: "Tradcast",
      url: appUrl,
      splashImageUrl: `${appUrl}/icon.png`,
      splashBackgroundColor: "#ffffff",
    },
  },
};

export const metadata: Metadata = {
  title: "Tradcast",
  description: "Farcaster's trading simulator app",
  openGraph: {
    title: "Tradcast",
    description: "Farcaster's trading simulator app",
    images: [`${appUrl}/opengraph-image.png`],
  },
  other: {
    "fc:frame": JSON.stringify(frame),
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  // Pass locale explicitly so message bundles match the URL segment (avoids stale/default locale in cached getMessages()).
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider
      key={locale}
      locale={locale}
      messages={messages}
    >
      <LocaleHtmlLang />
      <Providers>
        <MenuProvider>
          <NotificationProvider>
            <ConditionalNavbar />
            <main className="flex-1">{children}</main>
          </NotificationProvider>
        </MenuProvider>
      </Providers>
    </NextIntlClientProvider>
  );
}
