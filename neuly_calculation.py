import json
from pathlib import Path


def load_mapping(mapping_path: str | Path) -> dict:
    with open(mapping_path, "r", encoding="utf-8") as file:
        return json.load(file)


def validate_inputs(payload: dict, mapping: dict) -> None:
    required = mapping.get("required_inputs", [])
    missing = [name for name in required if name not in payload or payload[name] is None]
    if missing:
        raise ValueError(f"Missing required values: {', '.join(missing)}")

    risk_factor = payload.get("risk_factor")
    if risk_factor is not None and risk_factor <= 0:
        raise ValueError("risk_factor must be greater than 0")

    efficiency = payload.get("efficiency")
    if efficiency is not None and not (0 <= efficiency <= 1):
        raise ValueError("efficiency must be between 0 and 1")


def calculate_neuly(payload: dict, mapping: dict | None = None) -> float:
    if mapping is None:
        mapping = load_mapping(Path(__file__).with_name("mapping.json"))

    validate_inputs(payload, mapping)

    base_value = float(payload["base_value"])
    growth_rate = float(payload["growth_rate"])
    volume = float(payload["volume"])
    efficiency = float(payload["efficiency"])
    risk_factor = float(payload["risk_factor"])

    result = ((base_value * (1 + growth_rate)) * volume * efficiency) / risk_factor
    precision = int(mapping.get("calculation", {}).get("round_to", 4))
    return round(result, precision)


if __name__ == "__main__":
    sample_payload = {
        "base_value": 1000,
        "growth_rate": 0.12,
        "volume": 5,
        "efficiency": 0.9,
        "risk_factor": 2
    }

    mapping = load_mapping(Path(__file__).with_name("mapping.json"))
    print(json.dumps({
        "mapping": mapping["mapping"],
        "formula": mapping["calculation"]["formula"],
        "result": calculate_neuly(sample_payload, mapping)
    }, indent=2))
