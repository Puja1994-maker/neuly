# GAD-7 baseline UI test + evidence (no email unless you opt in)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
  Write-Host "Created .env from .env.example — set REPORT_EMAIL before sending report."
}

npm run test:gad7:baseline
Write-Host "Evidence: evidence\GAD-7\GAD7-BASE-001\<run-id>\"
Write-Host "Summary CSV: evidence\execution-summary.csv"
Write-Host "HTML report: npm run report"
