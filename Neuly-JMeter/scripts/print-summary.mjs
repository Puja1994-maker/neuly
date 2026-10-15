/**
 * Parse JMeter JTL (csv) and print assessment summary for CMD.
 * Uses the latest TX row per assessment (last run wins).
 */
import fs from 'node:fs';

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQ = !inQ;
      continue;
    }
    if (ch === ',' && !inQ) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

const jtlPath = process.argv[2];
const reportDir = process.argv[3] || '';
if (!jtlPath || !fs.existsSync(jtlPath)) {
  console.error('JTL not found:', jtlPath);
  process.exit(2);
}

const labels = [
  'Vanderbilt (NICHQ)',
  'SWAN',
  'SCARED Parent',
  'GAD-7 Self',
  'CAST',
  'AQ-Child',
  'Q-CHAT-25',
];

const lines = fs.readFileSync(jtlPath, 'utf8').trim().split(/\r?\n/);
const header = lines[0].split(',');
const idxLabel = header.indexOf('label');
const idxSuccess = header.indexOf('success');
const idxTime = header.indexOf('elapsed');
const idxMessage = header.indexOf('responseMessage');

const lastTx = {};
for (let i = 1; i < lines.length; i++) {
  const cols = parseCsvLine(lines[i]);
  const label = cols[idxLabel] || '';
  for (const name of labels) {
    if (label === `TX - ${name}`) lastTx[name] = cols;
  }
}

function statusFor(name) {
  const cols = lastTx[name];
  if (!cols) return 'BLOCKED';
  const success = (cols[idxSuccess] || '').toLowerCase() === 'true';
  const msg = cols[idxMessage] || '';
  const ranSamples = /transaction : ([1-9]\d*)/.exec(msg);
  const failing = /failing samples : (\d+)/.exec(msg);
  if (!ranSamples) return 'BLOCKED';
  if (!success) return 'FAIL';
  if (failing && Number(failing[1]) > 0) return 'FAIL';
  return 'PASS';
}

let passed = 0;
let failed = 0;
let blocked = 0;
for (const name of labels) {
  const st = statusFor(name);
  if (st === 'PASS') passed++;
  else if (st === 'FAIL') failed++;
  else blocked++;
}

let totalMs = 0;
for (const name of labels) {
  const cols = lastTx[name];
  if (cols) totalMs += Number(cols[idxTime] || 0);
}

console.log('========================================');
console.log('NEULY SCREENER AUTOMATION TEST SUMMARY');
console.log('========================================');
for (const name of labels) {
  const pad = name.length < 18 ? ' '.repeat(18 - name.length) : '';
  console.log(`${name}${pad} : ${statusFor(name)}`);
}
console.log('----------------------------------------');
console.log(`Total assessments  : ${labels.length}`);
console.log(`Passed             : ${passed}`);
console.log(`Failed             : ${failed}`);
console.log(`Blocked            : ${blocked}`);
console.log(`Total duration     : ${totalMs} ms (transaction samples)`);
console.log(`Results file       : ${jtlPath}`);
if (reportDir) console.log(`HTML report        : ${reportDir}`);
console.log('========================================');
