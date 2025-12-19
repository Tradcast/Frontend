import { env } from "@/lib/env";

/**
 * Get the farcaster manifest for the frame, generate yours from Warpcast Mobile
 *  On your phone to Settings > Developer > Domains > insert website hostname > Generate domain manifest
 * @returns The farcaster manifest for the frame
 */
export async function getFarcasterManifest() {
  const frameName = "Tradcast";
  const appUrl = env.NEXT_PUBLIC_URL;
  const noindex = appUrl.includes("localhost") || appUrl.includes("ngrok") || appUrl.includes("https://dev.");

  // Check if account association is properly configured
  const hasValidAccountAssociation = 
    env.NEXT_PUBLIC_FARCASTER_HEADER !== "build-time-placeholder" &&
    env.NEXT_PUBLIC_FARCASTER_PAYLOAD !== "build-time-placeholder" &&
    env.NEXT_PUBLIC_FARCASTER_SIGNATURE !== "build-time-placeholder";

  // In development mode, allow placeholder values for testing
  const isDevelopment = env.NEXT_PUBLIC_APP_ENV === "development" || appUrl.includes("localhost");
  
  if (!hasValidAccountAssociation && !isDevelopment) {
    throw new Error(
      "Account association not configured. Please generate your account association at: https://farcaster.xyz/~/developers/mini-apps/manifest?domain=" + 
      new URL(appUrl).hostname + 
      " and set the NEXT_PUBLIC_FARCASTER_HEADER, NEXT_PUBLIC_FARCASTER_PAYLOAD, and NEXT_PUBLIC_FARCASTER_SIGNATURE environment variables."
    );
  }

  // Use development fallback values if in development mode and no real values are set
  const accountAssociation = hasValidAccountAssociation ? {
    header: env.NEXT_PUBLIC_FARCASTER_HEADER,
    payload: env.NEXT_PUBLIC_FARCASTER_PAYLOAD,
    signature: env.NEXT_PUBLIC_FARCASTER_SIGNATURE,
  } : {
    // Development fallback - these are placeholder values for local testing
    header: "eyJmaWQiOjEyMzQ1LCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4ZGV2ZWxvcG1lbnRfa2V5In0",
    payload: "eyJkb21haW4iOiJsb2NhbGhvc3QifQ",
    signature: "0xdev_signature_placeholder_for_local_testing_only"
  };

 return {
  accountAssociation,
  miniapp: {
    version: "1",
    name: frameName,
    iconUrl: `${appUrl}/icon.png`,
    homeUrl: appUrl,
    imageUrl: `${appUrl}/opengraph-image.png`,
    buttonTitle: `Launch App`,
    splashImageUrl: `${appUrl}/opengraph-image.png`,
    splashBackgroundColor: "#FFFFFF",
    webhookUrl: `${appUrl}/api/webhook`,
    subtitle: "Lets cook trading",
    description: "Farcaster trading simulator app",
    primaryCategory: "social",
    tags: ["mini-app", "celo", "trading", "futures", "crypto"],
    tagline: "Built on Celo",
    ogTitle: frameName,
    ogDescription: "Farcaster trading simulator app",
    screenshotUrls: [`${appUrl}/opengraph-image.png`],
    heroImageUrl: `${appUrl}/opengraph-image.png`,

    // ⬇️ Add your chains here
    requiredChains: ['eip155:42220'],

    noindex
  },
};

}
