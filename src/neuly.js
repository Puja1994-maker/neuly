function calculateNeuly(payload) {
  const {
    base_value,
    growth_rate,
    volume,
    efficiency,
    risk_factor,
  } = payload;

  if (base_value == null || growth_rate == null || volume == null || efficiency == null || risk_factor == null) {
    throw new Error('Missing required Neuly input values');
  }

  if (risk_factor <= 0) {
    throw new Error('risk_factor must be greater than 0');
  }

  if (efficiency < 0 || efficiency > 1) {
    throw new Error('efficiency must be between 0 and 1');
  }

  const result = ((base_value * (1 + growth_rate)) * volume * efficiency) / risk_factor;
  return Number(result.toFixed(4));
}

function validateNeulyPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Request body must be an object');
  }

  const normalized = {
    base_value: Number(payload.base_value),
    growth_rate: Number(payload.growth_rate),
    volume: Number(payload.volume),
    efficiency: Number(payload.efficiency),
    risk_factor: Number(payload.risk_factor),
  };

  if ([normalized.base_value, normalized.growth_rate, normalized.volume, normalized.efficiency, normalized.risk_factor].some((value) => Number.isNaN(value))) {
    throw new Error('All Neuly numeric fields must be valid numbers');
  }

  return normalized;
}

function normalizeScreenerData(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Screener payload must be an object');
  }

  const age = Number(payload.age ?? 0);
  const screener = (payload.screener || 'SWAN').toString();
  const answers = payload.answers || {};

  const totalAnswers = Object.values(answers).reduce((sum, value) => sum + Number(value || 0), 0);

  return {
    screener,
    age,
    base_value: totalAnswers || 1,
    growth_rate: 0.12,
    volume: 1,
    efficiency: 0.9,
    risk_factor: age > 0 ? age / 10 : 1,
  };
}

module.exports = { calculateNeuly, validateNeulyPayload, normalizeScreenerData };
