# Neuly Playwright automation

E2E tests for [demo.neuly.ai screeners](https://demo.neuly.ai/screeners/).  
JMeter projects under `../Neuly-JMeter/` are unchanged.

## Prerequisites

- Node.js 20+ (you have v24+)
- Windows PowerShell

## Setup (first time)

```powershell
cd C:\Users\PUJABANSODE\Neuly\Neuly-Playwright
Copy-Item .env.example .env
# Edit .env — set REPORT_EMAIL=pihusuryavanshi502@gmail.com when running report tests (Phase 6+)
npm install
npm run install:browsers
```

## Report recipient configuration

- The active report workflow uses a single environment variable: `REPORT_EMAIL`.
- The stable recipient is `pihusuryavanshi502@gmail.com`.
- The example file already reflects this value in `.env.example`.
- If a local `.env` file already exists, update its `REPORT_EMAIL` line to `pihusuryavanshi502@gmail.com` and leave all other settings unchanged.
- If a local `.env` file does not exist, create it from `.env.example` with PowerShell:

```powershell
Copy-Item .env.example .env
notepad .env
```

Then edit only the `REPORT_EMAIL` entry to `pihusuryavanshi502@gmail.com` and keep all other variables as they are.
- The seven active screener flows all read the same `REPORT_EMAIL` value. The workflow does not generate or rotate temporary recipient addresses.

Report submission gating

- Master switch: `SEND_REPORTS` — when `true`, allows submission for all screeners.
- GAD-7 specific: `GAD7_SEND_REPORT` — when `true` allows GAD-7 report submission (honored when `SEND_REPORTS` is not set).
- Parent screener flows: `PARENT_SEND_REPORT` — when `true` allows submissions for SWAN, Vanderbilt, SCARED, CAST, AQ-Child, and Q-CHAT (honored when `SEND_REPORTS` is not set).
- Default behavior: all submission actions are disabled unless `SEND_REPORTS` or the screener-specific variable is explicitly set to `true`.

To enable sending reports for all screeners (development only), set in your local `.env`:

```powershell
SEND_REPORTS=true
# or per-group
GAD7_SEND_REPORT=true
PARENT_SEND_REPORT=true
```

When the gate is disabled, the test code will not click the final submit button or attempt any report-submission API calls.

Safety & quick update

- Do not run tests or trigger report emails while changing configuration.
- To update an existing `.env` in-place (PowerShell) without overwriting other variables:

```powershell
(Get-Content .env) -replace '^REPORT_EMAIL=.*','REPORT_EMAIL=pihusuryavanshi502@gmail.com' | Set-Content .env
```

- To create `.env` from the example and keep only the `REPORT_EMAIL` change:

```powershell
Copy-Item .env.example .env
# Edit only the REPORT_EMAIL line (do not change other variables)
notepad .env
```

## Run tests

```powershell
# Smoke only (catalogue loads, no screener submit)
npm run test:smoke

# GAD-7 data-driven cases + evidence (no JMeter)
npm run test:gad7
npm run test:gad7:baseline
.\run_gad7_baseline.ps1

# All tests
npm test

# Headed (see the browser)
npm run test:headed

# Open last HTML report
npm run report
```

## Test cases & evidence

- Case catalogue: `test-data/gad7-test-cases.json` and `test-data/TEST-CASES-GAD7.md`
- Per run: `evidence/GAD-7/<TestCaseId>/<run-id>/` (`01-started.png`, `02-results.png`, `outcome.json`)
- Roll-up: `evidence/execution-summary.csv`

Neuly auto-advances each question ~2s after you pick an answer (no manual **Next** clicks in the script).

## Email / PDF

Baseline: UI automated; Outlook PDF validation **manual** until Microsoft Graph is approved.

## Playwright MCP (Cursor)

See `.cursor/mcp.json` — add after reload Cursor; smoke-test MCP separately from `npm test`.
