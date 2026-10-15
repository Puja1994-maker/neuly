# Neuly Project

This project contains the Neuly calculation logic, sample mapping, JMeter coverage, and a simple Node-based project scaffold.

## Structure
- `mapping.json` – field mapping and formula metadata
- `neuly_calculation.py` – Python implementation of the scoring formula
- `neuly_jmeter.jmx` – basic JMeter script for Neuly requests
- `neuly_screeners_jmeter.jmx` – extended screener suite for SWAN, SCARED, GAD-7, CAST, AQ-Child, Q-CHAT, and Vanderbilt
- `neuly_screeners_test_data.csv` – sample screener datasets
- `src/neuly.js` – JavaScript calculator used by the project
- `tests/neuly.test.js` – validation tests
- `package.json` – Node project setup

## Formula
`((base_value * (1 + growth_rate)) * volume * efficiency) / risk_factor`

## Run JavaScript example
```bash
node src/index.js
```

## Run tests
```bash
npm test
```

## Run Python example
```bash
python neuly_calculation.py
```

## JMeter run
Use the JMX file in the folder, or run:
```powershell
"C:\Users\PUJABANSODE\apache-jmeter-5.6.3 (1)\bin\jmeter.bat" -n -t "C:\Users\PUJABANSODE\Neuly\neuly_screeners_jmeter.jmx" -l "C:\Users\PUJABANSODE\Neuly\neuly_screeners_results.jtl"
```

## Example payload
```json
{
  "base_value": 1000,
  "growth_rate": 0.12,
  "volume": 5,
  "efficiency": 0.9,
  "risk_factor": 2
}
```
