"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export function AuthStatus() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setUser(data.session?.user ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (!user)
    return (
      <Link className="auth-link" href="/auth">
        Sign in
      </Link>
    );

  return (
    <button
      className="auth-link auth-signout"
      type="button"
      onClick={() => {
        void createClient()
          .auth.signOut()
          .then(() => {
            router.push("/");
            router.refresh();
          });
      }}
    >
      Sign out
    </button>
  );
}
