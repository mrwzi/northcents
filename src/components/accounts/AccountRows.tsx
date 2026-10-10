import { formatCad } from "../../domain/money";
import type { AssetAccount, LiabilityAccount } from "../../v2/domain/accounts";
import { accountLabels } from "./account-options";

export function AccountRows({
  assets,
  liabilities,
  onRemove,
  onUpdateAsset,
  onEditLiability,
}: Readonly<{
  assets: readonly AssetAccount[];
  liabilities: readonly LiabilityAccount[];
  onRemove: (id: string, kind: "asset" | "liability") => Promise<void>;
  onUpdateAsset: (account: AssetAccount) => void;
  onEditLiability: (account: LiabilityAccount) => void;
}>) {
  if (assets.length + liabilities.length === 0)
    return <p className="empty-group-copy">No accounts here yet.</p>;

  return (
    <ul className="account-list">
      {assets.map((account) => (
        <li key={account.id}>
          <div>
            <strong>{account.name}</strong>
            <span>{accountLabels[account.type]}</span>
          </div>
          <div>
            <strong>{formatCad(account.currentValueCents)}</strong>
            <div className="account-row-actions">
              <button
                className="account-update-button"
                type="button"
                aria-label={`Update ${account.name} balance`}
                onClick={() => {
                  onUpdateAsset(account);
                }}
              >
                Update
              </button>
              <details className="action-menu">
                <summary aria-label={`More actions for ${account.name}`}>
                  •••
                </summary>
                <div className="action-menu-popover">
                  <button
                    className="account-remove-button"
                    type="button"
                    aria-label={`Remove ${account.name}`}
                    onClick={() => void onRemove(account.id, "asset")}
                  >
                    Remove account
                  </button>
                </div>
              </details>
            </div>
          </div>
        </li>
      ))}
      {liabilities.map((account) => (
        <li key={account.id}>
          <div>
            <strong>{account.name}</strong>
            <span>{accountLabels[account.type]}</span>
          </div>
          <div>
            <strong>{formatCad(account.currentBalanceCents)}</strong>
            <span>{debtPaymentLabel(account)}</span>
            <div className="account-row-actions">
              <button
                className="account-update-button"
                type="button"
                aria-label={`Edit ${account.name}`}
                onClick={() => {
                  onEditLiability(account);
                }}
              >
                Update
              </button>
              <details className="action-menu">
                <summary aria-label={`More actions for ${account.name}`}>
                  •••
                </summary>
                <div className="action-menu-popover">
                  <button
                    className="account-remove-button"
                    type="button"
                    aria-label={`Remove ${account.name}`}
                    onClick={() => void onRemove(account.id, "liability")}
                  >
                    Remove account
                  </button>
                </div>
              </details>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function debtPaymentLabel(account: LiabilityAccount): string {
  if (account.currentBalanceCents === 0) return "No balance owed";
  if (account.requiredMonthlyPaymentCents !== undefined)
    return `${formatCad(account.requiredMonthlyPaymentCents)} / month${account.paymentDueDay ? ` · due day ${account.paymentDueDay.toString()}` : ""}`;
  return account.paymentRequirement === "flexible"
    ? "No fixed monthly payment"
    : "Monthly payment missing";
}
