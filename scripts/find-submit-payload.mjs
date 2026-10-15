import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const jsPath = path.join(os.tmpdir(), 'neuly-index.js');
const js = fs.readFileSync(jsPath, 'utf8');

const needles = [
  'screener-report',
  '/api/screener-report',
  'form_key',
  'formKey',
  'answers',
  'questionnaire',
  'submitScreener',
  'saveScreener',
];

for (const n of needles) {
  let idx = 0;
  let count = 0;
  while ((idx = js.indexOf(n, idx)) !== -1 && count < 3) {
    console.log('\n---', n, 'at', idx, '---');
    console.log(js.slice(Math.max(0, idx - 120), idx + 220).replace(/\s+/g, ' '));
    idx += n.length;
    count++;
  }
}
