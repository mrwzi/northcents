// @vitest-environment jsdom

import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { ActiveBaseline } from "../../src/components/baseline/ActiveBaseline";
import { PrivacyNotice } from "../../src/components/shared/PrivacyNotice";
import { getDemoProfile } from "../../src/data/demo-profiles";
import { useLocalBaseline } from "../../src/hooks/useLocalBaseline";
import { BASELINE_STORAGE_KEY } from "../../src/storage/baseline-storage";

const baseline = getDemoProfile("student-renter").baseline;

describe("browser local baseline behavior", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists, restores, source-labels, and manually clears user data", async () => {
    const { result, unmount } = renderHook(() => useLocalBaseline());
    await waitFor(() => {
      expect(result.current.status).toBe("empty");
    });

    act(() => {
      result.current.save(baseline);
    });
    expect(result.current.value?.source).toBe("user-entered");
    expect(window.localStorage.getItem(BASELINE_STORAGE_KEY)).not.toBeNull();
    unmount();

    const restored = renderHook(() => useLocalBaseline());
    await waitFor(() => {
      expect(restored.result.current.status).toBe("loaded");
    });
    expect(restored.result.current.value).toEqual({
      source: "user-entered",
      baseline,
    });

    act(() => {
      restored.result.current.clear();
    });
    expect(restored.result.current.status).toBe("empty");
    expect(window.localStorage.getItem(BASELINE_STORAGE_KEY)).toBeNull();
  });

  it("delegates malformed-data reset and exposes a notice", async () => {
    window.localStorage.setItem(BASELINE_STORAGE_KEY, "bad-json");
    const { result } = renderHook(() => useLocalBaseline());

    await waitFor(() => {
      expect(result.current.status).toBe("empty");
    });
    expect(result.current.notice?.kind).toBe("reset");
    expect(result.current.notice?.message).toContain(
      "could not be safely restored",
    );
    expect(window.localStorage.getItem(BASELINE_STORAGE_KEY)).toBeNull();
  });

  it("delegates supported migration and informs the user", async () => {
    window.localStorage.setItem(
      BASELINE_STORAGE_KEY,
      JSON.stringify({ version: 0, baseline }),
    );
    const { result } = renderHook(() => useLocalBaseline());

    await waitFor(() => {
      expect(result.current.status).toBe("loaded");
    });
    expect(result.current.notice).toEqual({
      kind: "migrated",
      message:
        "Your locally saved baseline was updated to the current storage format.",
    });
    expect(
      JSON.parse(window.localStorage.getItem(BASELINE_STORAGE_KEY) ?? "null"),
    ).toMatchObject({ version: 1, baseline });
  });

  it("keeps demo and user-entered sources visually distinct", async () => {
    const { unmount } = render(<ActiveBaseline profileId="student-renter" />);
    expect(screen.getByText("Synthetic demo")).toBeInTheDocument();
    expect(
      screen.getByText(/has not replaced any custom baseline/i),
    ).toBeInTheDocument();
    unmount();

    window.localStorage.setItem(
      BASELINE_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        baseline,
      }),
    );
    render(<ActiveBaseline profileId={null} />);
    expect(
      await screen.findByText("Your financial baseline"),
    ).toBeInTheDocument();
    expect(screen.getByText("Stored only in this browser")).toBeInTheDocument();
  });

  it("displays N/A rather than Infinity for a zero-income local baseline", async () => {
    window.localStorage.setItem(
      BASELINE_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        baseline: { ...baseline, incomeCents: 0 },
      }),
    );
    render(<ActiveBaseline profileId={null} />);
    expect((await screen.findAllByText("N/A")).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Infinity/)).not.toBeInTheDocument();
  });

  it("makes the local-only privacy model visible", () => {
    render(<PrivacyNotice />);
    expect(
      screen.getByText(/No account or bank connection is required/i),
    ).toBeVisible();
    expect(screen.getByText(/remains in your browser/i)).toBeVisible();
  });
});
