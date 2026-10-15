# Submission payloads

- `swan_screener_report_synthetic.json` — **reference capture only** (fixed answers). JMeter does **not** use this when `enable_swan_report_submit=true`; the plan builds the POST body dynamically via `groovy/swan_build_report_payload.groovy`.
