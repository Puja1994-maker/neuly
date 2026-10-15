const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/server');

const request = require('supertest');

test('GET /api/neuly/health returns ok', async () => {
  const res = await request(app).get('/api/neuly/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

test('POST /api/neuly/calculate returns result', async () => {
  const res = await request(app)
    .post('/api/neuly/calculate')
    .send({
      base_value: 1000,
      growth_rate: 0.12,
      volume: 5,
      efficiency: 0.9,
      risk_factor: 2,
    });

  assert.equal(res.status, 200);
  assert.equal(res.body.result, 2520);
});
