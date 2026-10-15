const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateNeuly } = require('../src/neuly');

test('calculates Neuly score with example input', () => {
  const result = calculateNeuly({
    base_value: 1000,
    growth_rate: 0.12,
    volume: 5,
    efficiency: 0.9,
    risk_factor: 2,
  });

  assert.equal(result, 2520);
});

test('throws for invalid risk factor', () => {
  assert.throws(() => {
    calculateNeuly({
      base_value: 1000,
      growth_rate: 0.12,
      volume: 5,
      efficiency: 0.9,
      risk_factor: 0,
    });
  }, /risk_factor must be greater than 0/);
});
