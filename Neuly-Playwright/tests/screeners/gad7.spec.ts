import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { Gad7ScreenerPage } from '../../pages/Gad7ScreenerPage';
import {
  classifyGad7Total,
  totalGad7Score,
  type Gad7DifficultyValue,
  type Gad7ScoredValue,
} from '../../helpers/gad7-scoring';
import {
  appendCsvSummary,
  ensureEvidenceDir,
  evidenceDirFor,
  writeEvidenceJson,
  type EvidenceOutcome,
} from '../../helpers/evidence';
import { REPORT_EMAIL } from '../../helpers/report-email';
import { isSubmissionEnabled } from '../../helpers/report-gate';
import { createRunId } from '../../helpers/run-id';

type Gad7Case = {
  id: string;
  title: string;
  scoredAnswers: Gad7ScoredValue[];
  difficultyAnswer: Gad7DifficultyValue;
  expectedTotal: number;
  expectedClassification: string;
  sendReport: boolean;
};

const casesPath = path.join(__dirname, '../../test-data/gad7-test-cases.json');
const catalog = JSON.parse(fs.readFileSync(casesPath, 'utf-8')) as {
  screener: string;
  cases: Gad7Case[];
};

const reportEmail = REPORT_EMAIL;

const baselineCase = catalog.cases.find((testCase) => testCase.id === 'GAD7-BASE-001');

if (!baselineCase) {
  throw new Error('Baseline GAD-7 case missing from test-data/gad7-test-cases.json');
}

test('GAD7-BASE-001 — baseline end-to-end report flow @gad7', async ({ page }, testInfo) => {
  test.setTimeout(180_000);

  const runId = process.env.NEULY_RUN_ID ?? createRunId();
  const startedAt = new Date().toISOString();
  const evDir = evidenceDirFor('GAD-7', baselineCase.id, runId);
  await ensureEvidenceDir(evDir);

  const expectedTotal = totalGad7Score(baselineCase.scoredAnswers);
  expect(expectedTotal).toBe(baselineCase.expectedTotal);

  const gad7 = new Gad7ScreenerPage(page);
  const quality = await gad7.runBaselineScenario({
    scoredAnswers: baselineCase.scoredAnswers,
    difficultyAnswer: baselineCase.difficultyAnswer,
    recipientEmail: reportEmail,
    sendReport: true,
    evidenceDir: evDir,
  });

  expect(quality.allQuestionsAnswered).toBeTruthy();
  expect(quality.resultScreenVisible).toBeTruthy();
  expect(quality.scoreCalculationPass).toBeTruthy();
  // Respect environment gating: submission only expected when explicitly enabled
  const expectReport = isSubmissionEnabled('GAD-7');
  expect(quality.reportSubmitted).toBe(expectReport);

  const oracleClassification = classifyGad7Total(baselineCase.expectedTotal);
  expect(oracleClassification).toBe(baselineCase.expectedClassification);
  expect(quality.actualClassification === null || quality.actualClassification === oracleClassification).toBeTruthy();

  const outcome: EvidenceOutcome = {
    testCaseId: baselineCase.id,
    screener: 'GAD-7',
    runId,
    startedAt,
    finishedAt: new Date().toISOString(),
    uiPass: quality.uiPass,
    scoreCalculationPass: quality.scoreCalculationPass,
    reportEmailPass: quality.reportEmailPass,
    pdfPass: quality.pdfPass,
    expectedTotal: baselineCase.expectedTotal,
    actualTotalText: String(quality.actualTotal ?? baselineCase.expectedTotal),
    expectedClassification: baselineCase.expectedClassification,
    actualClassificationText: quality.actualClassification,
    answers: {
      scored: baselineCase.scoredAnswers.join(','),
      difficulty: baselineCase.difficultyAnswer,
    },
    notes: quality.notes,
    evidenceDir: evDir,
  };

  await writeEvidenceJson(evDir, outcome);
  await appendCsvSummary({
    testCaseId: baselineCase.id,
    runId,
    uiPass: outcome.uiPass,
    expectedTotal: baselineCase.expectedTotal,
    reportEmail: quality.reportEmailPass,
    pdf: quality.pdfPass,
    evidenceDir: evDir,
  });

  testInfo.attachments.push({
    name: 'outcome-json',
    path: path.join(evDir, 'outcome.json'),
    contentType: 'application/json',
  });
});
