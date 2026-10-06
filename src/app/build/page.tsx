import type { Metadata } from "next";

import { BuildBaselineExperience } from "../../components/baseline/BuildBaselineExperience";

export const metadata: Metadata = { title: "Build my scenario" };

export default function BuildPage() {
  return (
    <section className="section shell form-shell">
      <div className="section-heading page-heading">
        <h1>Use your numbers</h1>
        <p>Enter five monthly amounts. You can change them anytime.</p>
      </div>
      <BuildBaselineExperience />
    </section>
  );
}
