"use client";

import { useEffect, useRef, useState } from "react";
import { formatCad } from "../../domain/money";
import {
  ACCOUNT_GROUP_TYPES,
  type AccountGroup,
  type AccountGroupType,
} from "../../v2/domain/account-groups";
import {
  ASSET_ACCOUNT_TYPES,
  LIABILITY_ACCOUNT_TYPES,
  applyAssetAccountActivity,
  deriveNetWorthCents,
  deriveSpendableCashCents,
  deriveTotalAssetsCents,
  deriveTotalLiabilitiesCents,
  type AssetAccount,
  type AssetAccountType,
  type DebtPaymentRequirement,
  type LiabilityAccount,
  type LiabilityAccountType,
  type Spendability,
} from "../../v2/domain/accounts";
import { BUDGET_CATEGORIES } from "../../v2/domain/budget-categories";
import { parseCalendarDate } from "../../v2/domain/calendar";
import { MAX_V2_CENTS, asV2Cents } from "../../v2/domain/money";
import type {
  AccountGroupId,
  AssetAccountId,
  ExpenseEventId,
  HistoricalIncomeRecordId,
  LiabilityAccountId,
} from "../../v2/domain/types";
import { useFinancialWorkspace } from "../../v2/react/useFinancialWorkspace";
import { LoadingState } from "../shared/LoadingState";
import { AccountRows } from "./AccountRows";
import { accountLabels, groupLabels } from "./account-options";
import {
  QuickActivityDialog,
  type QuickActivityInput,
  type QuickActivityKind,
} from "./QuickActivityDialog";

function parseMoney(value: string, allowNegative: boolean): number | null {
  const normalized = value.trim().replace(/^\$/, "").replaceAll(",", "");
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const negative = normalized.startsWith("-");
  if (negative && !allowNegative) return null;
  const [whole = "0", fraction = ""] = normalized.replace("-", "").split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  const signed = negative ? -cents : cents;
  return Number.isSafeInteger(signed) && Math.abs(signed) <= MAX_V2_CENTS
    ? signed
    : null;
}

function localToday() {
  const date = new Date();
  return parseCalendarDate(
    `${date.getFullYear().toString().padStart(4, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`,
  );
}

export function AccountsManager() {
  const { workspace, loading, error, save, ensureWorkspace } =
    useFinancialWorkspace();
  const [dialogGroupId, setDialogGroupId] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [kind, setKind] = useState<"asset" | "liability">("asset");
  const [newGroupType, setNewGroupType] = useState<AccountGroupType>("bank");
  const [newGroupName, setNewGroupName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [assetType, setAssetType] = useState<AssetAccountType>("chequing");
  const [liabilityType, setLiabilityType] =
    useState<LiabilityAccountType>("credit-card");
  const [valueInput, setValueInput] = useState("");
  const [monthlyPaymentInput, setMonthlyPaymentInput] = useState("");
  const [paymentRequirement, setPaymentRequirement] =
    useState<DebtPaymentRequirement>("required");
  const [editingLiabilityId, setEditingLiabilityId] = useState<string | null>(
    null,
  );
  const [spendability, setSpendability] = useState<Spendability>("spendable");
  const [message, setMessage] = useState<string | null>(null);
  const [activityKind, setActivityKind] = useState<QuickActivityKind | null>(
    null,
  );
  const handledDebtEditIntent = useRef(false);
  const assets = workspace?.assetAccounts ?? [];
  const liabilities = workspace?.liabilityAccounts ?? [];
  const groups = workspace?.accountGroups ?? [];
  const dialogOpen = dialogGroupId !== null;
  const activeAssets = assets.filter((account) => account.status === "active");

  function openActivity(kind: QuickActivityKind) {
    if (activeAssets.length === 0) {
      setMessage("Add an account before recording money in or money out.");
      return;
    }
    setActivityKind(kind);
    setMessage(null);
  }

  function openDialog(groupId = "new") {
    setDialogGroupId(groupId);
    setStep(groupId === "new" ? 1 : 2);
    setKind("asset");
    setNewGroupType("bank");
    setNewGroupName("");
    setAccountName("");
    setAssetType("chequing");
    setLiabilityType("credit-card");
    setValueInput("");
    setMonthlyPaymentInput("");
    setPaymentRequirement("required");
    setEditingLiabilityId(null);
    setSpendability("spendable");
    setMessage(null);
  }

  function editLiability(account: LiabilityAccount) {
    setDialogGroupId(account.groupId ?? "editing-ungrouped");
    setStep(3);
    setKind("liability");
    setAccountName(account.name);
    setLiabilityType(account.type);
    setValueInput((account.currentBalanceCents / 100).toFixed(2));
    setMonthlyPaymentInput(
      account.requiredMonthlyPaymentCents === undefined
        ? ""
        : (account.requiredMonthlyPaymentCents / 100).toFixed(2),
    );
    setPaymentRequirement(account.paymentRequirement ?? "required");
    setEditingLiabilityId(account.id);
    setMessage(null);
  }

  useEffect(() => {
    if (!workspace || handledDebtEditIntent.current) return;
    const debtId = sessionStorage.getItem("northcents-edit-debt");
    if (!debtId) return;
    handledDebtEditIntent.current = true;
    sessionStorage.removeItem("northcents-edit-debt");
    const account = workspace.liabilityAccounts.find(
      (liability) => liability.id === debtId,
    );
    if (account) editLiability(account);
  }, [workspace]);

  function continueFlow() {
    if (
      step === 1 &&
      dialogGroupId === "new" &&
      newGroupType !== "cash" &&
      !newGroupName.trim()
    ) {
      setMessage("Enter the bank or platform name.");
      return;
    }
    setMessage(null);
    if (step === 1 && dialogGroupId === "new" && newGroupType === "cash") {
      setKind("asset");
      setAssetType("cash");
      setAccountName("");
      setSpendability("spendable");
      setStep(3);
      return;
    }
    setStep((step + 1) as 2 | 3);
  }

  async function submit() {
    const selectedType = kind === "asset" ? assetType : liabilityType;
    const name = accountName.trim() || accountLabels[selectedType];
    const value = parseMoney(valueInput, kind === "asset");
    const monthlyPayment =
      kind === "liability" && paymentRequirement === "required"
        ? parseMoney(monthlyPaymentInput, false)
        : null;
    const selectedGroupId = dialogGroupId ?? "new";
    const placeName =
      selectedGroupId === "new" && newGroupType === "cash"
        ? "Cash"
        : newGroupName.trim();
    if (
      value === null ||
      (kind === "liability" &&
        paymentRequirement === "required" &&
        monthlyPayment === null) ||
      (selectedGroupId === "new" && !placeName)
    ) {
      setMessage(
        kind === "liability" && paymentRequirement === "required"
          ? "Enter the current balance and required monthly payment."
          : kind === "liability"
            ? "Enter the current amount owed."
            : "Complete the place and enter the CAD value.",
      );
      return;
    }

    const current = ensureWorkspace();
    const now = new Date().toISOString();
    if (editingLiabilityId) {
      const next = {
        ...current,
        updatedAt: now,
        asOfDate: localToday(),
        liabilityAccounts: current.liabilityAccounts.map((account) => {
          if (account.id !== editingLiabilityId) return account;
          const withoutPayment = { ...account };
          delete withoutPayment.requiredMonthlyPaymentCents;
          return {
            ...withoutPayment,
            name,
            type: liabilityType,
            currentBalanceCents: asV2Cents(value),
            paymentRequirement,
            ...(paymentRequirement === "required"
              ? {
                  requiredMonthlyPaymentCents: asV2Cents(monthlyPayment ?? 0),
                }
              : {}),
            balanceAsOfDate: localToday(),
            updatedAt: now,
          } satisfies LiabilityAccount;
        }),
      };
      try {
        await save(next);
        setDialogGroupId(null);
        setEditingLiabilityId(null);
        setMessage("Debt details updated locally.");
      } catch {
        setMessage(
          "The debt could not be updated. Your existing data was not changed.",
        );
      }
      return;
    }
    let groupId = selectedGroupId;
    const accountGroups = [...current.accountGroups];
    if (selectedGroupId === "new") {
      groupId = crypto.randomUUID();
      accountGroups.push({
        id: groupId as AccountGroupId,
        workspaceId: current.id,
        name: placeName,
        type: newGroupType,
        status: "active",
        provenance: "user-entered",
        createdAt: now,
        updatedAt: now,
      } satisfies AccountGroup);
    }

    const shared = {
      workspaceId: current.id,
      groupId: groupId as AccountGroupId,
      name,
      provenance: "user-entered" as const,
      status: "active" as const,
      includeInNetWorth: true,
      createdAt: now,
      updatedAt: now,
    };
    const next =
      kind === "asset"
        ? {
            ...current,
            updatedAt: now,
            asOfDate: localToday(),
            accountGroups,
            assetAccounts: [
              ...current.assetAccounts,
              {
                ...shared,
                id: crypto.randomUUID() as AssetAccountId,
                type: assetType,
                currentValueCents: asV2Cents(value),
                valueAsOfDate: localToday(),
                spendability,
              } satisfies AssetAccount,
            ],
          }
        : {
            ...current,
            updatedAt: now,
            asOfDate: localToday(),
            accountGroups,
            liabilityAccounts: [
              ...current.liabilityAccounts,
              {
                ...shared,
                id: crypto.randomUUID() as LiabilityAccountId,
                type: liabilityType,
                currentBalanceCents: asV2Cents(value),
                paymentRequirement,
                ...(paymentRequirement === "required"
                  ? {
                      requiredMonthlyPaymentCents: asV2Cents(
                        monthlyPayment ?? 0,
                      ),
                    }
                  : {}),
                balanceAsOfDate: localToday(),
              } satisfies LiabilityAccount,
            ],
          };

    try {
      await save(next);
      setDialogGroupId(null);
      setMessage("Account saved locally.");
    } catch {
      setMessage(
        "The account could not be saved. Your existing data was not changed.",
      );
    }
  }

  async function submitActivity(
    input: QuickActivityInput,
  ): Promise<string | null> {
    if (!workspace) return "Your workspace is not ready yet.";
    const amount = parseMoney(input.amount, false);
    const account = workspace.assetAccounts.find(
      (candidate) => candidate.id === input.accountId,
    );
    if (amount === null || amount <= 0)
      return "Enter an amount greater than zero.";
    if (account?.status !== "active") return "Choose an active account.";

    const now = new Date().toISOString();
    const today = localToday();
    const cents = asV2Cents(amount);
    try {
      const updatedAccount = applyAssetAccountActivity(
        account,
        input.kind === "income" ? "inflow" : "outflow",
        cents,
        today,
        now,
      );
      const next = {
        ...workspace,
        updatedAt: now,
        asOfDate: today,
        assetAccounts: workspace.assetAccounts.map((candidate) =>
          candidate.id === account.id ? updatedAccount : candidate,
        ),
        ...(input.kind === "income"
          ? {
              historicalIncome: [
                ...workspace.historicalIncome,
                {
                  id: crypto.randomUUID() as HistoricalIncomeRecordId,
                  workspaceId: workspace.id,
                  name: input.incomeLabel,
                  amountCents: cents,
                  receivedDate: today,
                  provenance: "user-entered" as const,
                  createdAt: now,
                  updatedAt: now,
                },
              ],
            }
          : {
              expenseEvents: [
                ...workspace.expenseEvents,
                {
                  id: crypto.randomUUID() as ExpenseEventId,
                  workspaceId: workspace.id,
                  name: BUDGET_CATEGORIES[input.spendingCategory],
                  amountCents: cents,
                  category: input.spendingCategory,
                  nature: "variable" as const,
                  obligation: "flexible" as const,
                  dueDate: today,
                  status: "actual" as const,
                  actualDate: today,
                  provenance: "user-entered" as const,
                  createdAt: now,
                  updatedAt: now,
                },
              ],
            }),
      };
      await save(next);
      setActivityKind(null);
      setMessage(
        input.kind === "income"
          ? `${formatCad(cents)} added to ${account.name}.`
          : `${formatCad(cents)} spending recorded from ${account.name}.`,
      );
      return null;
    } catch {
      return "This activity could not be saved. Your balance was not changed.";
    }
  }

  async function remove(id: string, accountKind: "asset" | "liability") {
    if (!workspace) return;
    const now = new Date().toISOString();
    const next =
      accountKind === "asset"
        ? {
            ...workspace,
            updatedAt: now,
            assetAccounts: workspace.assetAccounts.filter(
              (account) => account.id !== id,
            ),
          }
        : {
            ...workspace,
            updatedAt: now,
            liabilityAccounts: workspace.liabilityAccounts.filter(
              (account) => account.id !== id,
            ),
          };
    await save(next);
  }

  const ungroupedAssets = assets.filter(
    (account) => account.groupId === undefined,
  );
  const ungroupedLiabilities = liabilities.filter(
    (account) => account.groupId === undefined,
  );

  if (loading) return <LoadingState label="Loading your accounts…" />;
  return (
    <div className="accounts-layout">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {workspace && (
        <section className="account-totals" aria-label="Account totals">
          <div>
            <span>Spendable</span>
            <strong>{formatCad(deriveSpendableCashCents(assets))}</strong>
          </div>
          <div>
            <span>Net worth</span>
            <strong>
              {formatCad(deriveNetWorthCents(assets, liabilities))}
            </strong>
          </div>
          <div>
            <span>Assets</span>
            <strong>{formatCad(deriveTotalAssetsCents(assets))}</strong>
          </div>
          <div>
            <span>Owed</span>
            <strong>
              {formatCad(deriveTotalLiabilitiesCents(liabilities))}
            </strong>
          </div>
        </section>
      )}

      <section className="account-quick-actions" aria-label="Quick actions">
        <button
          className="quick-money-action quick-money-in"
          type="button"
          onClick={() => {
            openActivity("income");
          }}
        >
          <span aria-hidden="true">+</span>
          <strong>Money in</strong>
          <small>Pay, gift, benefit</small>
        </button>
        <button
          className="quick-money-action"
          type="button"
          onClick={() => {
            openActivity("spending");
          }}
        >
          <span aria-hidden="true">−</span>
          <strong>Money out</strong>
          <small>Purchase or bill</small>
        </button>
      </section>

      <div className="accounts-toolbar">
        <div>
          <h2>Your places</h2>
          <p>Banks, platforms, cash, and the accounts inside them.</p>
        </div>
        <button
          className="button button-primary"
          type="button"
          onClick={() => {
            openDialog();
          }}
        >
          + Add
        </button>
      </div>

      {groups.length === 0 &&
      ungroupedAssets.length + ungroupedLiabilities.length === 0 ? (
        <button
          className="empty-account-state"
          type="button"
          onClick={() => {
            openDialog();
          }}
        >
          <span className="empty-state-plus" aria-hidden="true">
            +
          </span>
          <strong>Add your first bank or platform</strong>
          <small>
            Then add chequing, savings, credit, investments, or other accounts.
          </small>
        </button>
      ) : null}

      <div className="account-group-list">
        {groups.map((group) => {
          const groupAssets = assets.filter(
            (account) => account.groupId === group.id,
          );
          const groupLiabilities = liabilities.filter(
            (account) => account.groupId === group.id,
          );
          return (
            <section className="account-group-card" key={group.id}>
              <header>
                <div>
                  <h3>{group.name}</h3>
                  <p>{groupLabels[group.type]} · Manually added</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    openDialog(group.id);
                  }}
                >
                  + Account
                </button>
              </header>
              <AccountRows
                assets={groupAssets}
                liabilities={groupLiabilities}
                onRemove={remove}
                onEditLiability={editLiability}
              />
            </section>
          );
        })}
        {ungroupedAssets.length + ungroupedLiabilities.length > 0 && (
          <section className="account-group-card">
            <header>
              <div>
                <h3>Other accounts</h3>
                <p>Added before account grouping</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  openDialog();
                }}
              >
                + Account
              </button>
            </header>
            <AccountRows
              assets={ungroupedAssets}
              liabilities={ungroupedLiabilities}
              onRemove={remove}
              onEditLiability={editLiability}
            />
          </section>
        )}
      </div>

      {message && !dialogOpen && activityKind === null && (
        <p className="save-message" role="status">
          {message}
        </p>
      )}

      {activityKind && (
        <QuickActivityDialog
          kind={activityKind}
          accounts={activeAssets}
          onClose={() => {
            setActivityKind(null);
          }}
          onSave={submitActivity}
        />
      )}

      {dialogOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDialogGroupId(null);
          }}
        >
          <section
            className="account-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-account-heading"
          >
            <header>
              <div>
                <p className="wizard-progress">Step {step} of 3</p>
                <h2 id="add-account-heading">
                  {editingLiabilityId
                    ? "Update debt details"
                    : step === 1
                      ? "Where do you keep it?"
                      : step === 2
                        ? "Choose the account type"
                        : "What is the balance?"}
                </h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close"
                onClick={() => {
                  setDialogGroupId(null);
                }}
              >
                ×
              </button>
            </header>
            <form
              className="account-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (step < 3) continueFlow();
                else void submit();
              }}
            >
              <div className="wizard-track" aria-hidden="true">
                {[1, 2, 3].map((item) => (
                  <span key={item} data-active={item <= step} />
                ))}
              </div>
              {step === 1 && (
                <div className="wizard-step">
                  {groups.length > 0 && (
                    <label>
                      Choose a place
                      <select
                        value={dialogGroupId}
                        onChange={(event) => {
                          setDialogGroupId(event.target.value);
                        }}
                      >
                        {groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                        <option value="new">Add a new place</option>
                      </select>
                    </label>
                  )}
                  {dialogGroupId === "new" && (
                    <>
                      <label>
                        Place type
                        <select
                          value={newGroupType}
                          onChange={(event) => {
                            const nextType = event.target
                              .value as AccountGroupType;
                            setNewGroupType(nextType);
                            if (nextType === "cash") setNewGroupName("");
                          }}
                        >
                          {ACCOUNT_GROUP_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {groupLabels[type]}
                            </option>
                          ))}
                        </select>
                      </label>
                      {newGroupType === "cash" ? (
                        <p className="cash-place-note">
                          No name needed. Cash will appear as its own place.
                        </p>
                      ) : (
                        <label>
                          Name of bank or platform
                          <input
                            value={newGroupName}
                            onChange={(event) => {
                              setNewGroupName(event.target.value);
                            }}
                            autoComplete="organization"
                            placeholder="TD, Wealthsimple, or another place"
                            autoFocus
                          />
                        </label>
                      )}
                    </>
                  )}
                </div>
              )}
              {step === 2 && (
                <div className="wizard-step">
                  <div className="segmented-control" aria-label="Account kind">
                    <button
                      type="button"
                      aria-pressed={kind === "asset"}
                      onClick={() => {
                        setKind("asset");
                      }}
                    >
                      Money I have
                    </button>
                    <button
                      type="button"
                      aria-pressed={kind === "liability"}
                      onClick={() => {
                        setKind("liability");
                      }}
                    >
                      Money I owe
                    </button>
                  </div>
                  <label>
                    Account type
                    <select
                      aria-label="Account type"
                      value={kind === "asset" ? assetType : liabilityType}
                      onChange={(event) => {
                        if (kind === "asset")
                          setAssetType(event.target.value as AssetAccountType);
                        else
                          setLiabilityType(
                            event.target.value as LiabilityAccountType,
                          );
                      }}
                    >
                      {(kind === "asset"
                        ? ASSET_ACCOUNT_TYPES
                        : LIABILITY_ACCOUNT_TYPES
                      ).map((type) => (
                        <option key={type} value={type}>
                          {accountLabels[type]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <details className="optional-account-name">
                    <summary>Add a nickname (optional)</summary>
                    <label>
                      Account nickname
                      <input
                        name="northcents-account-nickname"
                        value={accountName}
                        onChange={(event) => {
                          setAccountName(event.target.value);
                        }}
                        autoComplete="new-password"
                        placeholder="For example, Daily spending"
                      />
                    </label>
                  </details>
                </div>
              )}
              {step === 3 && (
                <div className="wizard-step">
                  <p className="wizard-summary">
                    <strong>
                      {accountName.trim() ||
                        accountLabels[
                          kind === "asset" ? assetType : liabilityType
                        ]}
                    </strong>
                    <span>
                      {accountName.trim()
                        ? accountLabels[
                            kind === "asset" ? assetType : liabilityType
                          ]
                        : "Default name based on account type"}
                    </span>
                  </p>
                  <label>
                    Current {kind === "asset" ? "value" : "amount owed"}
                    <span className="money-input">
                      <span>$</span>
                      <input
                        value={valueInput}
                        onChange={(event) => {
                          setValueInput(event.target.value);
                        }}
                        inputMode="decimal"
                        aria-describedby="value-help"
                        autoFocus
                      />
                    </span>
                    <small id="value-help">CAD · manually entered</small>
                  </label>
                  {kind === "liability" && (
                    <>
                      <label>
                        Payment schedule
                        <select
                          value={paymentRequirement}
                          onChange={(event) => {
                            setPaymentRequirement(
                              event.target.value as DebtPaymentRequirement,
                            );
                            setMonthlyPaymentInput("");
                          }}
                        >
                          <option value="required">
                            Required payment every month
                          </option>
                          <option value="flexible">
                            No fixed monthly payment
                          </option>
                        </select>
                      </label>
                      {paymentRequirement === "required" ? (
                        <label>
                          Required monthly payment
                          <span className="money-input">
                            <span>$</span>
                            <input
                              value={monthlyPaymentInput}
                              onChange={(event) => {
                                setMonthlyPaymentInput(event.target.value);
                              }}
                              inputMode="decimal"
                              aria-describedby="monthly-payment-help"
                            />
                          </span>
                          <small id="monthly-payment-help">
                            Use the required payment shown by your lender—not
                            the full balance.
                          </small>
                        </label>
                      ) : (
                        <p className="cash-place-note">
                          You choose when and how much to pay. NorthCents will
                          not add a required payment to your plan.
                        </p>
                      )}
                    </>
                  )}
                  {kind === "asset" && (
                    <label>
                      Available to spend?
                      <select
                        value={spendability}
                        onChange={(event) => {
                          setSpendability(event.target.value as Spendability);
                        }}
                      >
                        <option value="spendable">Yes, available now</option>
                        <option value="restricted">
                          No, reserved or restricted
                        </option>
                        <option value="non-cash">
                          No, investment or non-cash asset
                        </option>
                      </select>
                    </label>
                  )}
                </div>
              )}
              {message && (
                <p className="form-error" role="alert">
                  {message}
                </p>
              )}
              <div className="wizard-actions">
                {step > 1 && (
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => {
                      setMessage(null);
                      setStep(
                        step === 3 &&
                          dialogGroupId === "new" &&
                          newGroupType === "cash"
                          ? 1
                          : ((step - 1) as 1 | 2),
                      );
                    }}
                  >
                    Back
                  </button>
                )}
                <button className="button button-primary" type="submit">
                  {step === 3 ? "Save account" : "Continue"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
