import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const js = fs.readFileSync(path.join(os.tmpdir(), 'neuly-index.js'), 'utf8');
console.log(js.slice(964400, 965200));
