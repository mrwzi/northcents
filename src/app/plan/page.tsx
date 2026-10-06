import type { Metadata } from "next";
import { MoneyPlan } from "../../components/plan/MoneyPlan";

export const metadata: Metadata = { title: "Plan your money" };

export default function PlanPage() {
  return <MoneyPlan />;
}
