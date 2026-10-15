# Neuly JMeter — Manual scorecard combinations

JMeter 5.6.3 plan for the seven Neuly screeners on **https://demo.neuly.ai/screeners**, aligned with `data/Neuly_All_Age_Screener_Manual_Scorecards.xlsx`.

## What is automated

| Assessment | `form_key` (route + API) | Workbook sheet |
|------------|--------------------------|----------------|
| Vanderbilt (NICHQ) | `vanderbilt_assessment` | Vanderbilt |
| SWAN | `swan_adhd_parent` | SWAN |
| SCARED Parent | `screen_for_child_anxiety_related_disorders_parent` | SCARED Parent |
| GAD-7 Self | `gad_7_anxiety` | GAD-7 |
| CAST | `the_childhood_autism_spectrum_test` | CAST |
| AQ-Child | `aq_child_parent` | AQ-Child |
| Q-CHAT-25 | `q_chat_parent` | Q-CHAT |

Each assessment transaction runs:

1. `GET /screeners/{form_key}` — SPA shell (HTTP 200)
2. `GET /api/screeners/{form_key}` — questionnaire JSON (HTTP 200, `form_key`, `question_count`)

Setup thread: `GET /screeners`, `GET /api/screeners/meta`.

`data/screener_combinations.csv` lists **PAGE_LOAD**, **API_LOAD**, and scorecard **variant/reference** rows (CAST multi/single-user, GAD-7 workbook sample).

## SWAN report submit (optional)

After the browser form, Neuly `POST`s `/api/screener-report` with a JSON body built from all 18 answers (`submittedAnswers`, `questions`, client `scoreResult`, …). The API responds with `success` + email message only (no scores in the response).

**Off by default** (`enable_swan_report_submit=false`). When enabled, JMeter:

1. Caches the GET questionnaire JSON.
2. Picks answers per run (`swan_answer_mode=random` or `csv` from `data/swan_answer_vectors.csv`).
3. Builds the POST body in `groovy/swan_build_report_payload.groovy` (no fixed capture file).
4. Asserts HTTP 200, `$.success`, and writes `results/swan_report_run_<stamp>.json` for the CMD summary (scores + `run_id`, no email).

Set recipient in `config/neuly.properties` (`swan_report_email`); use a synthetic address for automation.

See `docs/API_DISCOVERY.md`.

## Not automated in JMeter (blocked)

- **Full questionnaire UI flow** (requires browser JavaScript).
- **Client-side scoring** from the Excel formulas (manual scorecard only).
- **Report submit for other screeners** until payloads are captured (DISCOVERY_REQUIRED).

## Prerequisites

- Apache JMeter 5.6.3 at  
  `C:\Users\PUJABANSODE\apache-jmeter-5.6.3 (1)\apache-jmeter-5.6.3\bin`
- Python 3 (for `summarize_neuly_results.py` console summary)
- Node.js (optional: regenerating CSV/JMX only)

## Configuration

Copy `config/neuly.properties.sample` to `config/neuly.properties`.

Toggle one assessment:

```properties
run.swan_adhd_parent=false
```

## Run (Command Prompt)

```bat
cd c:\Users\PUJABANSODE\Neuly\Neuly-JMeter
run_neuly_tests.bat
```

Or directly:

```bat
"C:\Users\PUJABANSODE\apache-jmeter-5.6.3 (1)\apache-jmeter-5.6.3\bin\jmeter.bat" -n -t neuly_screeners.jmx -q config\neuly.properties.sample -l results\run.jtl -e -o reports\html
python summarize_neuly_results.py results\neuly_screeners_<timestamp>.jtl --html-report reports\html_<timestamp>
```

## Regenerate from Excel

```bat
node scripts\parse-scorecards-xlsx.mjs
node scripts\build-jmeter-csv.mjs
node scripts\generate-jmx.mjs
```

## Outputs

- `results/neuly_screeners_<timestamp>.jtl`
- `reports/html_<timestamp>/index.html`
