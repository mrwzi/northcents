"use client";

import Link from "next/link";
import { formatCad } from "../../domain/money";
import {
  deriveNetWorthCents,
  deriveSpendableCashCents,
  deriveTotalAssetsCents,
  deriveTotalLiabilitiesCents,
} from "../../v2/domain/accounts";
import { BUDGET_CATEGORIES } from "../../v2/domain/budget-categories";
import { useFinancialWorkspace } from "../../v2/react/useFinancialWorkspace";
import { SignedInGate } from "../auth/SignedInGate";

export function HomeDashboard() {
  return (
    <section className="section shell app-page home-page">
      <SignedInGate>
        <HomeDashboardContent />
      </SignedInGate>
    </section>
  );
}

function HomeDashboardContent() {
  const { workspace, loading, error } = useFinancialWorkspace();
  if (loading)
    return (
      <section>
        <p role="status">Loading your financial picture…</p>
      </section>
    );
  if (error)
    return (
      <section>
        <p role="alert">{error}</p>
        <Link className="button button-primary" href="/accounts">
          Review local accounts
        </Link>
      </section>
    );
  if (
    !workspace ||
    workspace.assetAccounts.length + workspace.liabilityAccounts.length === 0
  )
    return (
      <div className="home-empty-layout">
        <section className="app-home-hero app-card">
          <div className="landing-intro">
            <p className="eyebrow">Your money, with direction.</p>
            <h1>Add your money.</h1>
            <p className="hero-copy">
              Enter what you have and what you owe. You stay in control.
            </p>
            <div className="home-actions">
              <Link className="button button-primary" href="/accounts">
                Add an account
              </Link>
              <Link className="button button-secondary" href="/explore">
                Try a demo
              </Link>
            </div>
            <p className="privacy-inline">
              Manual entry only · No bank connection required
            </p>
          </div>
        </section>
        <section className="app-card home-explainer">
          <h2>Three simple steps</h2>
          <ol className="simple-steps">
            <li>
              <strong>Add money</strong>
              <span>Cash, bank accounts, savings, or investments.</span>
            </li>
            <li>
              <strong>Add debts</strong>
              <span>Credit cards, loans, or a mortgage.</span>
            </li>
            <li>
              <strong>Make a plan</strong>
              <span>Split available money into useful categories.</span>
            </li>
          </ol>
        </section>
      </div>
    );
  const assets = workspace.assetAccounts;
  const liabilities = workspace.liabilityAccounts;
  const savedPlan = workspace.allocationRules.filter(
    (rule) =>
      rule.enabled &&
      rule.category !== undefined &&
      rule.strategy.kind === "fixed-amount" &&
      rule.strategy.amountCents > 0,
  );
  const savedPlanTotal = savedPlan.reduce(
    (total, rule) =>
      total +
      (rule.strategy.kind === "fixed-amount" ? rule.strategy.amountCents : 0),
    0,
  );
  return (
    <div>
      <div className="app-page-heading">
        <p className="eyebrow">Home</p>
        <h1>Your financial picture</h1>
        <p>Based on the balances you entered manually.</p>
      </div>
      <section className="home-value-card">
        <span>Net worth</span>
        <strong>{formatCad(deriveNetWorthCents(assets, liabilities))}</strong>
        <small>Assets minus liabilities</small>
      </section>
      <section className="account-totals">
        <div>
          <span>Spendable cash</span>
          <strong>{formatCad(deriveSpendableCashCents(assets))}</strong>
        </div>
        <div>
          <span>Total assets</span>
          <strong>{formatCad(deriveTotalAssetsCents(assets))}</strong>
        </div>
        <div>
          <span>Liabilities</span>
          <strong>{formatCad(deriveTotalLiabilitiesCents(liabilities))}</strong>
        </div>
      </section>
      <section
        className="home-accounts"
        aria-labelledby="home-accounts-heading"
      >
        <div className="home-section-heading">
          <h2 id="home-accounts-heading">Accounts</h2>
          <Link href="/accounts">See all</Link>
        </div>
        <div className="home-account-list">
          {workspace.accountGroups.map((group) => {
            const count =
              assets.filter((account) => account.groupId === group.id).length +
              liabilities.filter((account) => account.groupId === group.id)
                .length;
            return (
              <Link href="/accounts" key={group.id}>
                <span className="institution-mark" aria-hidden="true">
                  {group.name.slice(0, 1).toUpperCase()}
                </span>
                <span>
                  <strong>{group.name}</strong>
                  <small>
                    {count} {count === 1 ? "account" : "accounts"}
                  </small>
                </span>
                <span aria-hidden="true">›</span>
              </Link>
            );
          })}
          {workspace.accountGroups.length === 0 && (
            <Link href="/accounts">
              <span className="institution-mark" aria-hidden="true">
                $
              </span>
              <span>
                <strong>Review your accounts</strong>
                <small>Organize them by bank or platform</small>
              </span>
              <span aria-hidden="true">›</span>
            </Link>
          )}
        </div>
      </section>
      <section className="app-card home-plan-card" aria-labelledby="home-plan">
        <div className="home-section-heading">
          <div>
            <p className="eyebrow">Your plan</p>
            <h2 id="home-plan">
              {savedPlan.length > 0
                ? "Where your money goes"
                : "Give your money a job"}
            </h2>
          </div>
          <Link href="/plan">{savedPlan.length > 0 ? "Edit" : "Start"}</Link>
        </div>
        {savedPlan.length > 0 ? (
          <>
            <div className="home-plan-total">
              <span>Monthly amount planned</span>
              <strong>{formatCad(savedPlanTotal)}</strong>
            </div>
            <ul className="home-plan-list">
              {savedPlan.slice(0, 4).map((rule) => (
                <li key={rule.id}>
                  <span>
                    {rule.category
                      ? BUDGET_CATEGORIES[rule.category]
                      : rule.name}
                  </span>
                  <strong>
                    {formatCad(
                      rule.strategy.kind === "fixed-amount"
                        ? rule.strategy.amountCents
                        : 0,
                    )}
                  </strong>
                </li>
              ))}
            </ul>
            <Link className="button button-primary" href="/plan">
              Plan my next payment
            </Link>
          </>
        ) : (
          <p>
            Add your regular costs once, then create an editable split for each
            payment—even if all the money stays in one bank account.
          </p>
        )}
      </section>
      <div className="home-actions">
        <Link className="button button-primary" href="/accounts">
          Manage accounts
        </Link>
        <Link className="button button-secondary" href="/scenario">
          What-if analysis
        </Link>
      </div>
    </div>
  );
}
