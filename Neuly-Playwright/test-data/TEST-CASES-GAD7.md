# GAD-7 test cases (Playwright)

Source: `test-data/gad7-test-cases.json`

| ID | Title | Expected total (Q1–7) | Classification | Sends email |
|----|--------|----------------------|----------------|-------------|
| GAD7-BASE-001 | Baseline mild | 8 | Mild | No (default) |
| GAD7-MIN-001 | All not at all | 0 | Minimal | No |
| GAD7-MAX-001 | All nearly every day | 21 | Severe | No |

## Assertions

- UI: reaches **All Questions Answered** and **Send My Report** (score is in the PDF email, not on this screen).
- Scoring: expected total and severity band are checked with the answer oracle in `helpers/gad7-scoring.ts`.

## Evidence per run

`evidence/GAD-7/<testCaseId>/<run-id>/`

- `01-started.png`
- `02-results.png`
- `03-email-sent.png` (only if `GAD7_SEND_REPORT=true`)
- `outcome.json`

## Send one report email (manual opt-in)

In `.env`:

```
REPORT_EMAIL=pihusuryavanshi502@gmail.com
GAD7_SEND_REPORT=true
```

Then run only baseline:

```powershell
$env:GAD7_SEND_REPORT='true'
npm run test:gad7:baseline
```

PDF validation remains **manual** until Microsoft Graph is configured.
