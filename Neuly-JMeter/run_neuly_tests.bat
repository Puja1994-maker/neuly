@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM Neuly screener JMeter runner (non-GUI) + Python CMD summary
set "ROOT=%~dp0"
set "JMX=%ROOT%neuly_screeners.jmx"
set "PROPS=%ROOT%config\neuly.properties"
if not exist "%PROPS%" set "PROPS=%ROOT%config\neuly.properties.sample"

set "JMETER_HOME=C:\Users\PUJABANSODE\apache-jmeter-5.6.3 (1)\apache-jmeter-5.6.3"
set "JMETER_JAR=%JMETER_HOME%\bin\ApacheJMeter.jar"

if not exist "%JMETER_JAR%" (
  echo ERROR: JMeter not found at "%JMETER_JAR%"
  exit /b 1
)

if not exist "%JMX%" (
  echo ERROR: Test plan not found at "%JMX%"
  exit /b 1
)

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "STAMP=%%i"
set "RESULTS=%ROOT%results\neuly_screeners_%STAMP%.jtl"
set "REPORT=%ROOT%reports\html_%STAMP%"
set "SWAN_META=%ROOT%results\swan_report_run_%STAMP%.json"
set "ROOT_FWD=%ROOT:\=/%"

if not exist "%ROOT%results" mkdir "%ROOT%results"
if not exist "%ROOT%reports" mkdir "%ROOT%reports"

echo Running Neuly JMeter plan...
echo JMX: %JMX%
echo Properties: %PROPS%
echo JTL: %RESULTS%
echo HTML report dir: %REPORT%

java -jar "%JMETER_JAR%" -n -t "%JMX%" -q "%PROPS%" -l "%RESULTS%" -e -o "%REPORT%" -Jneuly_jmeter_root="%ROOT_FWD%" -Jswan_run_meta_path="%SWAN_META%"
set "JM_EXIT=%ERRORLEVEL%"

set "SUM_EXIT=0"
set "BLOCKED_REASON="

if not "%JM_EXIT%"=="0" (
  set "BLOCKED_REASON=JMeter exited with code %JM_EXIT%"
)

where py >nul 2>&1
if errorlevel 1 (
  where python >nul 2>&1
  if errorlevel 1 (
    echo ERROR: Python not found. Install Python 3 to print the CMD summary.
    set "SUM_EXIT=1"
    set "BLOCKED_REASON=Python interpreter not found"
    goto :done_summary
  )
  set "PY=python"
) else (
  set "PY=py -3"
)

if defined BLOCKED_REASON (
  %PY% "%ROOT%summarize_neuly_results.py" "%RESULTS%" --html-report "%REPORT%" --swan-meta "%SWAN_META%" --blocked-reason "%BLOCKED_REASON%"
) else (
  %PY% "%ROOT%summarize_neuly_results.py" "%RESULTS%" --html-report "%REPORT%" --swan-meta "%SWAN_META%"
)
set "SUM_EXIT=%ERRORLEVEL%"

echo.
echo -------- SWAN report submit (from last run meta) --------
if exist "%SWAN_META%" (
  powershell -NoProfile -Command "$j = Get-Content -Raw '%SWAN_META%' | ConvertFrom-Json; $s = if ($j.overallPass) { 'PASS' } else { 'FAIL' }; Write-Host ('SWAN SUBMIT RESULT: ' + $s); Write-Host ('  run_id=' + $j.runId + '  mode=' + $j.answerMode + '  post_ms=' + $j.postElapsedMs); Write-Host ('  scores: total=' + $j.expectedScores.totalScore + ' attention=' + $j.expectedScores.attention + ' activity=' + $j.expectedScores.activity); Write-Host ('  api: ' + $j.reportMessage)"
) else (
  echo SWAN SUBMIT RESULT: NOT RUN
  echo   Enable in config: enable_swan_report_submit=true
  echo   Meta file expected: %SWAN_META%
)
echo --------------------------------------------------------

:done_summary
if not "%JM_EXIT%"=="0" exit /b %JM_EXIT%
exit /b %SUM_EXIT%
