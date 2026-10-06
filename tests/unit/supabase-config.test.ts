import { afterEach, describe, expect, it } from "vitest";
import {
  getSupabaseConfig,
  hasSupabaseConfig,
} from "../../src/lib/supabase/config";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

afterEach(() => {
  if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  if (originalKey === undefined)
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
});

describe("Supabase configuration", () => {
  it("keeps local/demo mode available without cloud configuration", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    expect(hasSupabaseConfig()).toBe(false);
    expect(() => getSupabaseConfig()).toThrow(/not configured/i);
  });

  it("accepts the public project URL and publishable key together", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    expect(hasSupabaseConfig()).toBe(true);
    expect(getSupabaseConfig()).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "publishable-key",
    });
  });
});
