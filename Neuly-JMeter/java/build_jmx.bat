@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "JMETER_HOME=C:\Users\PUJABANSODE\apache-jmeter-5.6.3 (1)\apache-jmeter-5.6.3"
set "JMETER_LIB=%JMETER_HOME%\lib"
set "OUT_DIR=%~dp0..\"
set "SRC=%~dp0neuly\NeulyScreenersJmxBuilder.java"
set "BUILD=%~dp0build\classes"

if not exist "%JMETER_HOME%\bin\ApacheJMeter.jar" (
  echo ERROR: Set JMETER_HOME in this script to your JMeter 5.6.3 folder.
  exit /b 1
)

if not exist "%BUILD%" mkdir "%BUILD%"

set "CP="
for %%J in ("%JMETER_LIB%\*.jar") do (
  if defined CP (set "CP=!CP!;%%~fJ") else set "CP=%%~fJ"
)

pushd "%~dp0"
javac -encoding UTF-8 -cp "%CP%" -d build\classes neuly\NeulyScreenersJmxBuilder.java
if errorlevel 1 exit /b 1

java -cp "%BUILD%;%CP%" neuly.NeulyScreenersJmxBuilder "%JMETER_HOME%" "%OUT_DIR%neuly_screeners.jmx"
set "ERR=%ERRORLEVEL%"
popd
exit /b %ERR%
