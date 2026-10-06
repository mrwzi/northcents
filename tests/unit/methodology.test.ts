import { describe, expect, it } from "vitest";

import {
  DEMO_PROFILES,
  DEMO_PROFILE_CONTEXT,
} from "../../src/data/demo-profiles";
import {
  METRIC_METHODOLOGY,
  METRIC_METHODOLOGY_LIST,
} from "../../src/data/metric-methodology";

describe("methodology registry", () => {
  it("documents every displayed financial metric with the full contract", () => {
    expect(METRIC_METHODOLOGY_LIST).toHaveLength(15);
    for (const metric of METRIC_METHODOLOGY_LIST) {
      expect(metric.name).not.toBe("");
      expect(metric.definition).not.toBe("");
      expect(metric.formula).not.toBe("");
      expect(metric.unit).not.toBe("");
      expect(metric.display).not.toBe("");
      expect(metric.limitation).not.toBe("");
    }
  });

  it("documents the model distinctions and percentage terminology", () => {
    expect(METRIC_METHODOLOGY["core-surplus"].formula).toBe(
      "income − housing − other monthly expenses − debt payments",
    );
    expect(METRIC_METHODOLOGY["core-surplus"].limitation).toMatch(
      /planned savings are intentionally excluded/i,
    );
    expect(METRIC_METHODOLOGY["remaining-flexible-cash"].formula).toBe(
      "core surplus − planned savings",
    );
    expect(METRIC_METHODOLOGY["percentage-point-change"].unit).toBe(
      "Percentage points",
    );
    expect(METRIC_METHODOLOGY["relative-percentage-change"].name).toMatch(
      /relative percentage change/i,
    );
  });

  it("documents N/A behavior for every income-based ratio", () => {
    for (const id of [
      "housing-to-income",
      "savings-rate",
      "expense-to-income",
      "percentage-point-change",
    ] as const) {
      expect(METRIC_METHODOLOGY[id].zeroIncome).toMatch(/N\/A/i);
    }
  });
});

describe("fixture provenance", () => {
  it("gives every synthetic fixture a purpose without statistical claims", () => {
    for (const profile of DEMO_PROFILES) {
      const context = DEMO_PROFILE_CONTEXT[profile.id];
      expect(profile.source).toBe("synthetic-demo");
      expect(profile.provenance).toMatch(/synthetic/i);
      expect(profile.provenance).toMatch(/not a statistical average/i);
      expect(context.purpose).not.toBe("");
      expect(context.construction).not.toBe("");
      expect(`${context.purpose} ${context.construction}`).not.toMatch(
        /typical|average Canadian|average student/i,
      );
    }
  });
});
