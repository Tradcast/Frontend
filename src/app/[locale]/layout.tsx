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
    "talentapp:project_verification": "300ae2ce72ec567639f054e3b75e35ee0efca43c7f824aac3bd49512b89598ebc38dd1600b5ac86cfa4d001549992c766138cd7b64f8042dacca51063789ee0d",
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
            {/* Web-only phone frame wrapper.
                On mobile / MiniPay / Farcaster (viewport < 640px), this renders as plain passthrough.
                On desktop web (>= 640px), content is placed inside a centered phone-shaped frame.
                The frame itself grows with content (no internal scroll container) so the browser
                window handles all scrolling naturally. `transform: translateZ(0)` on the frame
                still creates a new containing block to scope any `position: fixed` top navbar
                (ConditionalNavbar, used on /home) inside the frame. */}
            <div className="sm:h-screen sm:bg-gradient-to-br sm:from-slate-900 sm:via-slate-800 sm:to-slate-900 sm:flex sm:flex-col sm:items-center sm:justify-center">
              <div
                className="
                  sm:w-[630px] sm:max-w-[100vw]
                  sm:h-screen
                  sm:rounded-[40px]
                  sm:border-[8px] sm:border-black
                  sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.75)]
                  sm:ring-1 sm:ring-slate-700/40
                  sm:overflow-y-auto sm:overflow-x-hidden sm:overscroll-contain
                  sm:[transform:translateZ(0)]
                  sm:bg-[#ebeff2]
                  sm:scrollbar-hide
                  sm:relative
                  sm:flex sm:flex-col
                "
              >
                <ConditionalNavbar />
                <main className="flex-1 sm:h-full sm:min-h-0 sm:w-full">{children}</main>
              </div>
            </div>
          </NotificationProvider>
        </MenuProvider>
      </Providers>
    </NextIntlClientProvider>
  );
}
