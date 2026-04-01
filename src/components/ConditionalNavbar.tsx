"use client";

import { usePathname } from "@/i18n/navigation";
import { Navbar } from "./navbar";

export function ConditionalNavbar() {
  const pathname = usePathname();
  // Only show navbar on home page
  const showNavbar = pathname === '/home';

  if (!showNavbar) return null;
  return <Navbar />;
}