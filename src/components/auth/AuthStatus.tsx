"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { useAuthUser } from "../../lib/supabase/use-auth-user";

export function AuthStatus() {
  const router = useRouter();
  const auth = useAuthUser();
  const [signingOut, setSigningOut] = useState(false);

  if (auth.status === "loading")
    return (
      <span
        className="auth-loading"
        role="status"
        aria-label="Checking account"
      >
        <span className="loading-spinner" aria-hidden="true" />
      </span>
    );

  if (auth.status !== "signed-in")
    return (
      <Link className="auth-link" href="/auth">
        Sign in
      </Link>
    );

  return (
    <button
      className="auth-link auth-signout"
      type="button"
      disabled={signingOut}
      aria-busy={signingOut}
      onClick={() => {
        setSigningOut(true);
        void createClient()
          .auth.signOut()
          .then(() => {
            router.push("/");
            router.refresh();
          })
          .finally(() => {
            setSigningOut(false);
          });
      }}
    >
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
