import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  DesktopNavigation,
  MobileNavigation,
} from "../components/shell/AppNavigation";
import { ThemeToggle } from "../components/shell/ThemeToggle";
import { AuthStatus } from "../components/auth/AuthStatus";
import { hasSupabaseConfig } from "../lib/supabase/config";
import "../styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://northcents.vercel.app"),
  title: {
    default: "NorthCents",
    template: "%s · NorthCents",
  },
  description:
    "NorthCents gives your money direction with private account tracking, planning, and transparent what-if analysis.",
  applicationName: "NorthCents",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "NorthCents",
    title: "NorthCents — Your money, with direction.",
    description:
      "See your accounts, plan your money, and explore financial decisions without connecting a bank.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en-CA" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='northcents:theme';var t=localStorage.getItem(k)||localStorage.getItem('monevero:theme')||localStorage.getItem('finscope:theme');var v=t==='dark'||t==='light'?t:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');localStorage.setItem(k,v);document.documentElement.dataset.theme=v;document.documentElement.style.colorScheme=v}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <header className="site-header">
          <div className="shell header-inner">
            <Link className="wordmark" href="/" aria-label="NorthCents home">
              <span className="wordmark-mark" aria-hidden="true">
                N
              </span>
              <span>NorthCents</span>
            </Link>
            <div className="header-actions">
              <DesktopNavigation />
              {hasSupabaseConfig() ? (
                <AuthStatus />
              ) : (
                <Link className="auth-link" href="/auth">
                  Sign in
                </Link>
              )}
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main id="main-content">{children}</main>
        <footer className="site-footer">
          <div className="shell footer-inner">
            <p>
              Estimates are based on the assumptions entered. NorthCents
              provides financial and economic analysis, not financial advice.
            </p>
            <nav aria-label="Information">
              <Link href="/methodology">Methodology</Link>
              <Link href="/privacy">Privacy</Link>
            </nav>
          </div>
        </footer>
        <div className="mobile-navigation-spacer" aria-hidden="true" />
        <MobileNavigation />
      </body>
    </html>
  );
}
