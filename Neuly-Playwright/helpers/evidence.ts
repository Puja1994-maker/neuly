import fs from 'fs/promises';
import path from 'path';

export type EvidenceOutcome = {
  testCaseId: string;
  screener: string;
  runId: string;
  startedAt: string;
  finishedAt: string;
  uiPass: boolean;
  scoreCalculationPass: boolean;
  reportEmailPass: boolean | 'skipped' | 'manual';
  pdfPass: boolean | 'skipped' | 'manual';
  expectedTotal: number;
  actualTotalText?: string;
  expectedClassification: string;
  actualClassificationText?: string;
  answers: Record<string, string>;
  notes?: string;
  evidenceDir: string;
};

export function evidenceDirFor(
  screener: string,
  testCaseId: string,
  runId: string,
): string {
  return path.join('evidence', screener, testCaseId, runId);
}

export async function ensureEvidenceDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function writeEvidenceJson(
  dir: string,
  outcome: EvidenceOutcome,
): Promise<void> {
  await ensureEvidenceDir(dir);
  await fs.writeFile(
    path.join(dir, 'outcome.json'),
    JSON.stringify(outcome, null, 2),
    'utf-8',
  );
}

export async function appendCsvSummary(
  row: Record<string, string | number | boolean>,
): Promise<void> {
  const csvPath = path.join('evidence', 'execution-summary.csv');
  const header = Object.keys(row).join(',');
  const line = Object.values(row)
    .map((v) => `"${String(v).replace(/"/g, '""')}"`)
    .join(',');
  try {
    await fs.access(csvPath);
    await fs.appendFile(csvPath, line + '\n', 'utf-8');
  } catch {
    await fs.writeFile(csvPath, header + '\n' + line + '\n', 'utf-8');
  }
}
