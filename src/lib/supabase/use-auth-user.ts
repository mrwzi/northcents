"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./client";
import { hasSupabaseConfig } from "./config";

export type AuthUserState =
  | Readonly<{ status: "loading"; user: null }>
  | Readonly<{ status: "signed-out"; user: null }>
  | Readonly<{ status: "signed-in"; user: User }>
  | Readonly<{ status: "local-only"; user: null }>;

export function useAuthUser(): AuthUserState {
  const configured = hasSupabaseConfig();
  const [state, setState] = useState<AuthUserState>(
    configured
      ? { status: "loading", user: null }
      : { status: "local-only", user: null },
  );
  useEffect(() => {
    if (!configured) return;
    const client = createClient();
    void client.auth.getUser().then(({ data }) => {
      setState(
        data.user
          ? { status: "signed-in", user: data.user }
          : { status: "signed-out", user: null },
      );
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setState(
        session?.user
          ? { status: "signed-in", user: session.user }
          : { status: "signed-out", user: null },
      );
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, [configured]);
  return state;
}
