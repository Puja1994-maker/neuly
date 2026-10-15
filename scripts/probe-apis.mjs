import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const base = 'https://demo.neuly.ai';
const keys = [
  'vanderbilt_assessment',
  'swan_adhd_parent',
  'screen_for_child_anxiety_related_disorders_parent',
  'gad_7_anxiety',
  'the_childhood_autism_spectrum_test',
  'aq_child_parent',
  'q_chat_parent',
];

const headers = {
  Accept: 'application/json',
  'User-Agent': 'Neuly-JMeter-Discovery/1.0',
  Referer: `${base}/screeners`,
};

for (const key of keys) {
  const url = `${base}/api/screeners/${key}`;
  const res = await fetch(url, { headers });
  const text = await res.text();
  let qc = '?';
  try {
    const j = JSON.parse(text);
    qc = j.question_count ?? (j.questions_en?.length ?? '?');
  } catch {
    qc = text.slice(0, 80);
  }
  console.log(res.status, key, 'questions:', qc);
}

const jsPath = path.join(os.tmpdir(), 'neuly-index.js');
if (fs.existsSync(jsPath)) {
  const js = fs.readFileSync(jsPath, 'utf8');
  for (const pat of ['screener-report', 'screeners/', 'method:"POST"', "method:'POST'", 'submit']) {
    const idx = js.indexOf(pat);
    console.log('idx', pat, idx);
  }
  const snippets = [...js.matchAll(/screener-report[^]{0,120}/g)].slice(0, 5);
  console.log('screener-report snippets:', snippets.map((s) => s[0].replace(/\s+/g, ' ')));
}
