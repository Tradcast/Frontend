import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

/**
 * Bare "/" has no [locale] segment; send users to the default locale.
 * (Middleware should also redirect, but this guarantees no 404 if Edge middleware
 * does not run — e.g. some hosts or tracing misconfig.)
 */
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
