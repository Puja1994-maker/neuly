const { calculateNeuly } = require('./neuly');

const sample = {
  base_value: 1000,
  growth_rate: 0.12,
  volume: 5,
  efficiency: 0.9,
  risk_factor: 2,
};

const result = calculateNeuly(sample);
console.log('Neuly result:', result);
