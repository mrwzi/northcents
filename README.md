# NorthCents

**Your money, with direction.**

NorthCents is a browser-based personal-money workspace and financial scenario
explorer. Users can manually record where their money is held, what they owe,
and examine how one explicit monthly assumption could change their position.

## Preview

![NorthCents synthetic demo profiles](docs/screenshots/northcents-desktop.png)

<p align="center">
  <img src="docs/screenshots/northcents-mobile.png" alt="NorthCents mobile sign-in experience" width="390" />
</p>

It is an educational analysis tool, not financial advice. It does not predict
economic conditions or judge whether a decision is good or bad.

## What exists today

- Four audited, fully synthetic demo profiles.
- Manually entered banks, platforms, assets, and liabilities grouped by place.
- Derived spendable cash, total assets, liabilities, and net worth.
- A five-field custom baseline using monthly take-home income, housing, other
  monthly expenses, debt payments, and planned savings.
- Housing, income, cost-of-living, and planned-savings scenarios.
- Current-versus-scenario comparisons, monthly and annual impacts, ratios, and
  percentage-point changes.
- Transparent formulas, substituted calculations, limitations, and fixture
  provenance.
- Responsive, keyboard-accessible UI with automated WCAG A/AA checks.
- Optional email authentication and user-controlled cloud workspace backup
  through Supabase.
- Versioned browser-local persistence using local storage and IndexedDB, with
  validation, migration, recovery, export/import foundations, and deletion.

NorthCents requires no bank connection. It can run without signing in, in which
case manually entered accounts and custom baselines remain in the browser.
Signed-in users can explicitly save or restore a private cloud workspace.
Scenario experiments are transient. Demo profiles are constructed examples,
not real people or statistical averages.

## Brand migration compatibility

NorthCents was previously named Monevero and, before that, FinScope. Existing browser data remains valid:
the original `finscope:baseline:v1` local-storage key and `finscope` IndexedDB
database name are deliberately retained as stable persistence identifiers.
New local backup files use `northcents-local-export`; imports continue to accept
the previous `monevero-local-export` and `finscope-local-export` envelopes.
These legacy strings are data compatibility contracts, not visible product
branding.

See [the implementation blueprint](docs/implementation-blueprint.md) for the
product contract and [the methodology page](src/app/methodology/page.tsx) for
the implemented formulas and limitations.

For code ownership and dependency boundaries, see
[the architecture guide](docs/architecture.md).

## Technology

- Next.js App Router, React, and strict TypeScript
- Pure TypeScript financial domain engine using integer cents
- Zod boundary and storage validation
- Vitest and React Testing Library
- Playwright and `@axe-core/playwright`
- ESLint and Prettier

Supabase Auth and PostgreSQL provide optional accounts and cloud workspace
backup. IndexedDB remains the on-device source used by the app. No analytics,
banking connection, or external financial-data service is included.

## Local development

Requirements: a current Node.js release compatible with the pinned Next.js
version and npm.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

The app works locally without environment variables. To enable sign-up, sign-in,
and cloud backup, follow [the Supabase setup guide](docs/supabase-setup.md).

For production setup and post-deployment checks, see
[the deployment guide](docs/deployment.md).

## Verification commands

```bash
# Unit and component tests
npm test
npm run test:unit
npm run test:components

# Browser, keyboard, viewport, privacy, and axe accessibility tests
npm run test:e2e
npm run test:a11y

# Static and production checks
npm run typecheck
npm run lint
npm run format:check
npm run build

# Combined non-browser quality command
npm run check

# Dependency advisory review
npm audit --audit-level=low
```

Playwright starts the application automatically. Browser binaries can be
installed with `npx playwright install` when needed.

## Repository guide

- `src/domain/`: deterministic financial calculations and validation contracts
- `src/data/`: audited fixtures and methodology metadata
- `src/components/`: baseline, scenario, result, and shared UI
- `src/storage/`: versioned browser-storage contract
- `src/v2/domain/`: V2 account, workspace, date, money, and event contracts
- `src/v2/storage/`: validated browser-local IndexedDB repositories
- `tests/unit/`: financial, validation, storage, and boundary tests
- `tests/components/`: React interaction and explanation tests
- `tests/e2e/`: browser flows, accessibility, privacy, and responsive checks
- `docs/release-checklist.md`: automated and manual release checks
- `docs/release-readiness.md`: evidence-based readiness assessment

## Future work

Potential later phases may add carefully sourced Canadian economic context.
That work is not part of the current product and must not send personal
financial inputs to an external service.

## Disclaimer

NorthCents provides deterministic financial scenario analysis based on entered
assumptions. It does not provide financial advice.
