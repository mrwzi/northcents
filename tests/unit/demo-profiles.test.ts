import { describe, expect, it } from "vitest";

import { DEMO_PROFILES } from "../../src/data/demo-profiles.js";
import { calculatePosition } from "../../src/domain/finance.js";
import { baselineSchema } from "../../src/domain/schemas.js";

const expected = {
  "student-family": { core: 35_000, flexible: 15_000 },
  "student-renter": { core: 22_000, flexible: 7_000 },
  "student-part-time": { core: 35_000, flexible: 15_000 },
  "recent-graduate": { core: 80_000, flexible: 30_000 },
} as const;

describe("synthetic demo fixtures", () => {
  it("contains four valid, uniquely identified, clearly synthetic profiles", () => {
    expect(DEMO_PROFILES).toHaveLength(4);
    expect(new Set(DEMO_PROFILES.map(({ id }) => id)).size).toBe(4);

    for (const profile of DEMO_PROFILES) {
      expect(profile.source).toBe("synthetic-demo");
      expect(profile.provenance).toContain("not a statistical average");
      expect(baselineSchema.safeParse(profile.baseline).success).toBe(true);
    }
  });

  it("matches every audited blueprint total", () => {
    for (const profile of DEMO_PROFILES) {
      const position = calculatePosition(profile.baseline);
      expect(position.coreSurplusCents).toBe(expected[profile.id].core);
      expect(position.remainingFlexibleCashCents).toBe(
        expected[profile.id].flexible,
      );
    }
  });
});
