@echo off
setlocal EnableExtensions
set "ROOT=%~dp0"
set "JMX=%ROOT%gad7_report.jmx"
set "PROPS=%ROOT%config\gad7.properties"
if not exist "%PROPS%" set "PROPS=%ROOT%config\gad7.properties.sample"
set "JMETER_JAR=C:\Users\PUJABANSODE\apache-jmeter-5.6.3 (1)\apache-jmeter-5.6.3\bin\ApacheJMeter.jar"
if not exist "%JMETER_JAR%" (
  echo ERROR: JMeter not found: %JMETER_JAR%
  exit /b 1
)
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "STAMP=%%i"
set "JTL=%ROOT%results\gad7_%STAMP%.jtl"
set "HTML=%ROOT%reports\html_%STAMP%"
set "ROOT_FWD=%ROOT:\=/%"
if not exist "%ROOT%results" mkdir "%ROOT%results"
if not exist "%ROOT%reports" mkdir "%ROOT%reports"
echo Running GAD-7 baseline plan...
echo JMX: %JMX%
echo JTL: %JTL%
java -jar "%JMETER_JAR%" -n -t "%JMX%" -q "%PROPS%" -l "%JTL%" -e -o "%HTML%" -Jgad7_project_root="%ROOT_FWD%"
set "EC=%ERRORLEVEL%"
echo.
echo JTL: %JTL%
echo HTML report: %HTML%
echo Exit code: %EC%
exit /b %EC%
