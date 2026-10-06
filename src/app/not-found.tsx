import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section className="section shell form-shell">
      <div className="empty-state">
        <p className="eyebrow">404 · Page not found</p>
        <h1>This page is not available.</h1>
        <p>
          The address may be incorrect or the page may have moved. Your locally
          saved baseline has not been changed.
        </p>
        <div className="action-row">
          <Link className="button button-primary" href="/">
            Return home
          </Link>
          <Link className="button button-secondary" href="/explore">
            Explore a Demo
          </Link>
        </div>
      </div>
    </section>
  );
}
