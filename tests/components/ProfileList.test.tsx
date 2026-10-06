// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DEMO_PROFILES } from "../../src/data/demo-profiles";
import { ProfileList } from "../../src/components/baseline/ProfileList";

describe("ProfileList", () => {
  it("renders all four audited fixtures and labels them as synthetic", () => {
    render(<ProfileList />);

    for (const profile of DEMO_PROFILES) {
      expect(
        screen.getByRole("heading", { name: profile.name }),
      ).toBeInTheDocument();
      expect(screen.getByText(profile.description)).toBeInTheDocument();
    }
    expect(screen.getAllByText("Synthetic demo")).toHaveLength(4);
  });

  it("provides a keyboard-focusable selection link for each profile", async () => {
    const user = userEvent.setup();
    render(<ProfileList />);

    const links = screen.getAllByRole("link", { name: "Use this profile" });
    expect(links).toHaveLength(4);
    expect(links[1]).toHaveAttribute(
      "href",
      "/scenario?profile=student-renter",
    );

    await user.tab();
    await user.tab();
    expect(links[0]).toHaveFocus();
  });
});
