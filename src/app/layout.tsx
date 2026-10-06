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
  title: {
    default: "Monevero",
    template: "%s · Monevero",
  },
  description:
    "Build a private, manually maintained picture of your assets, liabilities, and financial plans.",
  applicationName: "Monevero",
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "Monevero",
    title: "Monevero personal money planner",
    description:
      "Track manually entered accounts and understand your financial position without connecting a bank.",
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
            __html: `(function(){try{var k='monevero:theme';var t=localStorage.getItem(k)||localStorage.getItem('finscope:theme');var v=t==='dark'||t==='light'?t:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');localStorage.setItem(k,v);document.documentElement.dataset.theme=v;document.documentElement.style.colorScheme=v}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <header className="site-header">
          <div className="shell header-inner">
            <Link className="wordmark" href="/" aria-label="Monevero home">
              <span className="wordmark-mark" aria-hidden="true">
                M
              </span>
              <span>Monevero</span>
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
              Estimates are based on the assumptions entered. Monevero provides
              financial and economic analysis, not financial advice.
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
