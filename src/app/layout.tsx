// src/app/layout.tsx
import type { Metadata } from 'next';
import { preconnect } from 'react-dom';
import './globals.css';
import { ConditionalNavbar } from '@/components/ConditionalNavbar';
import Providers from "@/components/providers";
import { MenuProvider } from "@/contexts/menu-context";


// Preconnect to Farcaster auth for faster authentication
preconnect('https://auth.farcaster.xyz');

const appUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

// Embed metadata for Farcaster sharing
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
  title: 'Tradcast',
  description: 'Farcaster&#x27;s trading simulator app',
  openGraph: {
    title: 'Tradcast',
    description: 'Farcaster&#x27;s trading simulator app',
    images: [`${appUrl}/opengraph-image.png`],
  },
  other: {
    "fc:frame": JSON.stringify(frame),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="relative flex min-h-screen flex-col">
          <Providers>
            <MenuProvider>
              <ConditionalNavbar />
              <main className="flex-1">
                {children}
              </main>
            </MenuProvider>
          </Providers>
        </div>
      </body>
    </html>
  );
}