import { describe, expect, it } from "vitest";
import {
  deriveNetWorthCents,
  deriveSpendableCashCents,
  type AssetAccount,
  type AssetAccountType,
} from "../../../src/v2/domain/accounts";
import {
  assetAccountSchema,
  financialWorkspaceSchema,
  legacyV1SnapshotSchema,
} from "../../../src/v2/domain/schemas";

const now = "2026-09-24T12:00:00.000Z";
const account = {
  id: "asset-1",
  workspaceId: "workspace-1",
  createdAt: now,
  updatedAt: now,
  provenance: "user-entered",
  name: "Chequing",
  type: "chequing",
  currentValueCents: 142_000,
  valueAsOfDate: "2026-09-24",
  spendability: "spendable",
  includeInNetWorth: true,
  status: "active",
  institutionLabel: "My bank",
  note: "Daily spending account",
} as const;

type AssetAccountInput = Readonly<{
  id: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  provenance: "user-entered";
  name: string;
  type: AssetAccountType;
  currentValueCents: number;
  valueAsOfDate: "2026-09-24";
  spendability: "spendable" | "restricted" | "non-cash";
  includeInNetWorth: boolean;
  status: "active" | "archived";
  institutionLabel?: string;
  note?: string;
}>;

function asAssetAccount(value: AssetAccountInput): AssetAccount {
  return assetAccountSchema.parse(value) as unknown as AssetAccount;
}

describe("AssetAccount", () => {
  it("validates a manually entered liquid account", () => {
    expect(assetAccountSchema.parse(account)).toEqual(account);
  });

  it("allows a negative chequing balance", () => {
    expect(
      assetAccountSchema.parse({ ...account, currentValueCents: -12_345 })
        .currentValueCents,
    ).toBe(-12_345);
  });

  it("derives available cash from included accounts only", () => {
    const accounts = [
      asAssetAccount(account),
      asAssetAccount({
        ...account,
        id: "asset-2",
        type: "savings",
        currentValueCents: 85_025,
      }),
      asAssetAccount({
        ...account,
        id: "asset-3",
        type: "cash",
        currentValueCents: 6_000,
        spendability: "restricted",
      }),
    ];
    expect(deriveSpendableCashCents(accounts)).toBe(227_025);
  });

  it("preserves exact integer cents without floating-point arithmetic", () => {
    expect(
      deriveSpendableCashCents([
        asAssetAccount({ ...account, currentValueCents: 1 }),
        asAssetAccount({ ...account, id: "asset-2", currentValueCents: 2 }),
      ]),
    ).toBe(3);
  });

  it("rejects invalid account types, debts, and out-of-range balances", () => {
    expect(
      assetAccountSchema.safeParse({ ...account, type: "credit-card" }).success,
    ).toBe(false);
    expect(
      assetAccountSchema.safeParse({ ...account, type: "mortgage" }).success,
    ).toBe(false);
    expect(
      assetAccountSchema.safeParse({
        ...account,
        currentValueCents: 10_000_000_001,
      }).success,
    ).toBe(false);
  });

  it("does not admit sensitive credential fields", () => {
    for (const sensitiveField of [
      "accountNumber",
      "transitNumber",
      "institutionNumber",
      "cardNumber",
      "cvv",
      "username",
      "password",
      "oauthToken",
    ]) {
      expect(
        assetAccountSchema.safeParse({ ...account, [sensitiveField]: "secret" })
          .success,
      ).toBe(false);
    }
  });

  it("round-trips account cents and metadata through JSON", () => {
    const parsed = assetAccountSchema.parse(account);
    expect(
      assetAccountSchema.parse(JSON.parse(JSON.stringify(parsed))),
    ).toEqual(parsed);
  });
});

describe("account workspace invariants", () => {
  const emptyWorkspace = {
    schemaVersion: 2,
    id: "workspace-1",
    name: "My Money",
    provenance: "user-entered",
    currency: "CAD",
    asOfDate: "2026-09-24",
    timeZone: "America/Toronto",
    createdAt: now,
    updatedAt: now,
    assetAccounts: [account],
    liabilityAccounts: [],
    allocationRules: [],
    incomeSources: [],
    incomeEvents: [],
    historicalIncome: [],
    expenseDefinitions: [],
    expenseEvents: [],
    debts: [],
    goals: [],
    sinkingFunds: [],
    context: {
      country: "CA",
      preferences: {
        firstDayOfWeek: "monday",
        upcomingWindowDays: 7,
        reminders: { accountReviewCadence: "biweekly" },
      },
    },
  } as const;

  it("enforces unique account IDs and workspace ownership", () => {
    expect(financialWorkspaceSchema.safeParse(emptyWorkspace).success).toBe(
      true,
    );
    expect(
      financialWorkspaceSchema.safeParse({
        ...emptyWorkspace,
        assetAccounts: [account, account],
      }).success,
    ).toBe(false);
    expect(
      financialWorkspaceSchema.safeParse({
        ...emptyWorkspace,
        assetAccounts: [{ ...account, workspaceId: "workspace-2" }],
      }).success,
    ).toBe(false);
  });

  it("rejects an included aggregate beyond the money ceiling", () => {
    expect(
      financialWorkspaceSchema.safeParse({
        ...emptyWorkspace,
        assetAccounts: [
          { ...account, currentValueCents: 10_000_000_000 },
          { ...account, id: "asset-2", currentValueCents: 1 },
        ],
      }).success,
    ).toBe(false);
  });

  it("keeps the V1 legacy snapshot aggregate-only", () => {
    const legacy = legacyV1SnapshotSchema.parse({
      id: "legacy-1",
      workspaceId: "workspace-1",
      createdAt: now,
      updatedAt: now,
      provenance: "legacy-v1",
      originalSavedAt: now,
      migratedAt: now,
      completeness: "monthly-aggregate-only",
      baseline: {
        incomeCents: 100_000,
        housingCents: 40_000,
        otherExpensesCents: 20_000,
        debtPaymentsCents: 5_000,
        plannedSavingsCents: 10_000,
      },
    });
    expect(legacy).not.toHaveProperty("cashAccounts");
    expect(deriveNetWorthCents([], [])).toBe(0);
    expect(legacy).not.toHaveProperty("availableCashCents");
  });
});
