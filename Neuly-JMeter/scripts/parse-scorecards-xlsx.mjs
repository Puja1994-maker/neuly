/**
 * Parse Neuly_All_Age_Screener_Manual_Scorecards.xlsx (OOXML) without external deps.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const xlsxPath =
  process.argv[2] ||
  path.resolve(__dirname, '../data/Neuly_All_Age_Screener_Manual_Scorecards.xlsx');
const fallback = 'c:\\Users\\PUJABANSODE\\Downloads\\Neuly_All_Age_Screener_Manual_Scorecards.xlsx';
const src = fs.existsSync(xlsxPath) ? xlsxPath : fallback;

const outDir = path.resolve(__dirname, '../data/extracted-xlsx');
fs.mkdirSync(outDir, { recursive: true });
const zipCopy = path.join(outDir, 'book.zip');
fs.copyFileSync(src, zipCopy);
try {
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -Path '${zipCopy.replace(/'/g, "''")}' -DestinationPath '${outDir.replace(/'/g, "''")}' -Force"`,
    { stdio: 'pipe' }
  );
} catch (e) {
  console.error('Expand failed', e.message);
  process.exit(1);
}

function colLettersToIndex(col) {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

function parseSharedStrings(xml) {
  const strings = [];
  const parts = xml.split(/<si>/).slice(1);
  for (const part of parts) {
    const tMatches = [...part.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((m) => m[1]);
    strings.push(tMatches.join(''));
  }
  return strings;
}

function cellValue(c, shared) {
  const t = (c.match(/t="([^"]+)"/) || [])[1];
  const v = (c.match(/<v>([^<]*)<\/v>/) || [])[1] ?? '';
  if (t === 's') return shared[Number(v)] ?? '';
  return v;
}

function parseSheet(sheetXml, shared) {
  const rows = [];
  const rowBlocks = sheetXml.split(/<row[^>]*>/).slice(1);
  for (const block of rowBlocks) {
    const rowXml = block.split('</row>')[0];
    const r = (rowXml.match(/r="(\d+)"/) || [])[1];
    const cells = {};
    const cellParts = rowXml.split(/<c /).slice(1);
    for (const cp of cellParts) {
      const ref = (cp.match(/r="([A-Z]+)(\d+)"/) || []);
      if (!ref[1]) continue;
      const col = ref[1];
      const cellEnd = cp.indexOf('</c>');
      const cTag = cp.slice(0, cellEnd > 0 ? cellEnd : cp.length);
      cells[col] = cellValue(cTag, shared);
    }
    if (Object.keys(cells).length) rows.push({ row: Number(r), cells });
  }
  return rows;
}

const sharedXml = fs.readFileSync(path.join(outDir, 'xl/sharedStrings.xml'), 'utf8');
const shared = parseSharedStrings(sharedXml);
const workbookXml = fs.readFileSync(path.join(outDir, 'xl/workbook.xml'), 'utf8');
const relsXml = fs.readFileSync(path.join(outDir, 'xl/_rels/workbook.xml.rels'), 'utf8');

const sheets = [...workbookXml.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)].map((m) => ({
  name: m[1],
  rid: m[2],
}));
const relMap = {};
for (const m of relsXml.matchAll(/Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
  relMap[m[1]] = m[2].replace(/^\//, '');
}

const summary = { source: src, sheets: [] };
for (const sh of sheets) {
  const target = relMap[sh.rid];
  const sheetPath = path.join(outDir, 'xl', target.replace(/^\//, ''));
  if (!fs.existsSync(sheetPath)) continue;
  const rows = parseSheet(fs.readFileSync(sheetPath, 'utf8'), shared);
  const headerRow = rows.find((r) => r.row === 1) || rows[0];
  const headers = headerRow ? Object.entries(headerRow.cells).sort((a, b) => colLettersToIndex(a[0]) - colLettersToIndex(b[0])).map(([, v]) => v) : [];
  summary.sheets.push({
    name: sh.name,
    rowCount: rows.length,
    headers,
    preview: rows.slice(0, 5).map((r) =>
      Object.entries(r.cells)
        .sort((a, b) => colLettersToIndex(a[0]) - colLettersToIndex(b[0]))
        .map(([, v]) => v)
    ),
  });
}

const outJson = path.resolve(__dirname, '../data/scorecards-summary.json');
fs.writeFileSync(outJson, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
