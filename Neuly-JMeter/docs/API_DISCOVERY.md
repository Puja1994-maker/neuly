# Neuly demo API discovery (observed)

Base host: `https://demo.neuly.ai` (configurable via `host` in `config/neuly.properties`).

## Public catalogue

| Step | Method | Path | Notes |
|------|--------|------|--------|
| SPA shell | GET | `/screeners` | HTML shell |
| Screener list meta | GET | `/api/screeners/meta` | JSON array; requires `Referer` + `Accept: application/json` |
| Questionnaire definition | GET | `/api/screeners/{form_key}` | e.g. `swan_adhd_parent` |

## SWAN (`swan_adhd_parent`) — observed after form completion

| Step | Method | Path | Content-Type |
|------|--------|------|----------------|
| Load definition | GET | `/api/screeners/swan_adhd_parent` | — |
| Submit report / email flow | POST | `/api/screener-report` | `application/json` |

### POST `/api/screener-report` body (observed shape)

Top-level fields (sanitized; no tokens logged):

- `email` — recipient for report (use **synthetic** addresses in automation)
- `screenerTitle` — display title
- `screenerId` — `swan_adhd_parent`
- `completedAt` — ISO-8601 UTC timestamp
- `questions` — array of answered items (`questionId`, `optionId`, `points`, `scored`, …)
- `submittedAnswers` — map of `question_key` → `optionId`
- `scoreResult` — client-computed scoring object (`totalScore`, `subscales`, `report`, …)
- `marketingOptIn` — boolean
- `childAgeYears`, `childAgeMonths` — when parent route

Example scoring outcome for the captured test vector (manual validation reference):

- `scoreResult.totalScore`: **-0.16**
- Attention subscale average: **-0.89**
- Activity and impulsivity subscale average: **+0.56**

### POST response (observed)

```json
{"success":true,"message":"Your report has been sent to your email."}
```

The API does **not** return `scoreResult` in the response; scores in the email match the client-built `scoreResult` in the request body.

### Scoring oracle (verified against manual scorecard + one browser capture)

- Each item: option score **-3 … +3** (from questionnaire `options[].score`).
- **Attention** (items 1–9): mean of those nine scores, rounded to 2 decimals.
- **Activity and impulsivity** (items 10–18): mean of those nine scores.
- **Overall**: mean of all 18 items.

JMeter builds `scoreResult` with these averages when `swan_verify_scoring=true` (default).

### JMeter usage

- Default: **GET page + GET API** only.
- Dynamic submit: `enable_swan_report_submit=true`, `swan_answer_mode=random` or `csv` (`data/swan_answer_vectors.csv`).
- Groovy: `groovy/swan_build_report_payload.groovy` (payload), `groovy/swan_record_report_result.groovy` (CMD meta JSON).
- Legacy static capture (reference only): `data/submission/swan_screener_report_synthetic.json`.
- **Do not** enable report submission load tests without product approval (sends email).

## Other screeners

Report POST shape is expected to be similar; per-screener payloads are **DISCOVERY_REQUIRED** until captured from the browser network tab.
