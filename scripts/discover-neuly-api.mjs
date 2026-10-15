/**
 * Probe demo.neuly.ai for public routes and common API paths.
 * Does not send assessment submissions.
 */
const host = 'demo.neuly.ai';
const base = `https://${host}`;

const pagePaths = [
  '/',
  '/screeners',
  '/screeners/vanderbilt',
  '/screeners/swan',
  '/screeners/scared',
  '/screeners/gad-7',
  '/screeners/gad7',
  '/screeners/cast',
  '/screeners/aq-child',
  '/screeners/aq_child',
  '/screeners/q-chat',
  '/screeners/qchat',
  '/screeners/q-chat-25',
];

const apiGuess = []; // intentionally empty — no invented APIs

async function headOrGet(path) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const ct = res.headers.get('content-type') || '';
    const len = res.headers.get('content-length') || (await res.text()).length;
    return { path, status: res.status, ct, len };
  } catch (e) {
    return { path, error: e.message };
  }
}

console.log('=== Page routes ===');
for (const p of pagePaths) {
  console.log(JSON.stringify(await headOrGet(p)));
}

// Fetch main JS bundle references from /screeners
const screenersHtml = await (await fetch(`${base}/screeners`)).text();
const scripts = [...screenersHtml.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1]);
console.log('=== Script tags (first 5) ===');
console.log(scripts.slice(0, 5));

const apiPatterns = new Set();
for (const src of scripts.slice(0, 8)) {
  const jsUrl = src.startsWith('http') ? src : `${base}${src.startsWith('/') ? '' : '/'}${src}`;
  try {
    const js = await (await fetch(jsUrl)).text();
    for (const m of js.matchAll(/["'](\/api\/[^"']+)["']/g)) apiPatterns.add(m[1]);
    for (const m of js.matchAll(/["'](\/screeners\/[a-z0-9_-]+)["']/gi)) apiPatterns.add(m[1]);
  } catch {
    /* skip */
  }
}
console.log('=== Paths extracted from JS (observed) ===');
console.log([...apiPatterns].sort().join('\n') || '(none)');
