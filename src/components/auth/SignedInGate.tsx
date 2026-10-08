"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuthUser } from "../../lib/supabase/use-auth-user";
import { LoadingState } from "../shared/LoadingState";

export function SignedInGate({ children }: Readonly<{ children: ReactNode }>) {
  const auth = useAuthUser();
  if (auth.status === "loading")
    return <LoadingState label="Checking your account…" />;
  if (auth.status === "signed-out")
    return (
      <section className="signed-out-card">
        <p className="eyebrow">Private workspace</p>
        <h1>Sign in to see your money.</h1>
        <p>
          Your account balances and plans stay hidden until you sign in. You can
          still explore synthetic examples without an account.
        </p>
        <div className="home-actions">
          <Link className="button button-primary" href="/auth">
            Sign in or create account
          </Link>
          <Link className="button button-secondary" href="/explore">
            View a sample
          </Link>
        </div>
      </section>
    );
  return children;
}
