const express = require('express');
const { calculateNeuly, validateNeulyPayload, normalizeScreenerData } = require('./neuly');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get('/api/neuly/health', (req, res) => {
  res.json({ status: 'ok', service: 'neuly-api' });
});

app.post('/api/neuly/calculate', (req, res) => {
  try {
    const payload = validateNeulyPayload(req.body);
    const result = calculateNeuly(payload);
    res.json({
      status: 'success',
      result,
      formula: '((base_value * (1 + growth_rate)) * volume * efficiency) / risk_factor',
      input: payload,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
});

app.post('/api/neuly/screener/submit', (req, res) => {
  try {
    const payload = normalizeScreenerData(req.body);
    const result = calculateNeuly(payload);
    res.json({
      status: 'success',
      screener: payload.screener || 'SWAN',
      age: payload.age,
      result,
      message: 'Screener submitted successfully',
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Neuly API running on http://localhost:${PORT}`);
});

module.exports = app;
