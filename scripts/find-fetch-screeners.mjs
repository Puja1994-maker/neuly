import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const js = fs.readFileSync(path.join(os.tmpdir(), 'neuly-index.js'), 'utf8');
const re = /fetch\(([^)]*screeners[^)]*)\)/g;
let m; let n=0;
while ((m=re.exec(js)) && n<25) { console.log(m[1].slice(0,200)); n++; }
