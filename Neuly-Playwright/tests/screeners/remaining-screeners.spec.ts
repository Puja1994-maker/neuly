import { test, expect } from '@playwright/test';
import path from 'path';
import { ParentScreenerPage } from '../../pages/ParentScreenerPage';
import {
  appendCsvSummary,
  ensureEvidenceDir,
  evidenceDirFor,
  writeEvidenceJson,
} from '../../helpers/evidence';
import { REPORT_EMAIL } from '../../helpers/report-email';
import { isSubmissionEnabled } from '../../helpers/report-gate';
import { createRunId } from '../../helpers/run-id';

const reportEmail = REPORT_EMAIL;

const screenerSpecs = [
  {
    id: 'SWAN-BASE-001',
    label: 'SWAN',
    route: 'swan_adhd_parent',
    answerPattern: ['Slightly below', 'Average', 'Slightly above'],
    completionCheck: 'All Questions Answered',
    reportRecipient: reportEmail,
  },
  {
    id: 'VANDERBILT-BASE-001',
    label: 'Vanderbilt',
    route: 'vanderbilt_assessment',
    answerPattern: ['Not on medication', 'Never', 'Occasionally', 'Often', 'Very Often'],
    completionCheck: 'All Questions Answered',
    reportRecipient: reportEmail,
  },
  {
    id: 'SCARED-BASE-001',
    label: 'SCARED',
    route: 'screen_for_child_anxiety_related_disorders_parent',
    answerPattern: ['Not True or Hardly Ever True', 'Somewhat True or Sometimes True', 'Very True or Often True'],
    completionCheck: 'All Questions Answered',
    reportRecipient: reportEmail,
  },
  {
    id: 'CAST-BASE-001',
    label: 'CAST',
    route: 'the_childhood_autism_spectrum_test',
    answerPattern: ['Yes', 'No'],
    completionCheck: 'All Questions Answered',
    reportRecipient: reportEmail,
  },
  {
    id: 'AQ-CHILD-BASE-001',
    label: 'AQ-Child',
    route: 'aq_child_parent',
    answerPattern: ['Slightly agree', 'Definitely disagree', 'Slightly disagree', 'Definitely agree'],
    completionCheck: 'All Questions Answered',
    reportRecipient: reportEmail,
  },
  {
    id: 'QCHAT-BASE-001',
    label: 'Q-CHAT',
    route: 'q_chat_parent',
    answerPattern: ['Always', 'Usually', 'Sometimes', 'Rarely', 'Never'],
    completionCheck: 'All Questions Answered',
    reportRecipient: reportEmail,
  },
] as const;

for (const spec of screenerSpecs) {
  test(`${spec.id} — ${spec.label} completes once @screeners`, async ({ page }, testInfo) => {
    test.setTimeout(240_000);

    const runId = process.env.NEULY_RUN_ID ?? createRunId();
    const evDir = evidenceDirFor(spec.label.toUpperCase(), spec.id, runId);
    await ensureEvidenceDir(evDir);
    const screener = new ParentScreenerPage(page);

    try {
      await screener.goto(spec.route);
      await page.screenshot({ path: path.join(evDir, '01-started.png'), fullPage: true });

      await screener.completeWithPattern(spec.answerPattern, 220);
      await screener.waitForCompletionScreen();
      await page.screenshot({ path: path.join(evDir, '02-completed.png'), fullPage: true });

      const summary = await screener.getCompletionSummary();
      const reportAttempted = await screener
        .submitReportEmail(spec.reportRecipient, evDir)
        .catch(async () => {
          await page.screenshot({ path: path.join(evDir, '03-report-failed.png'), fullPage: true });
          return false;
        });

      const outcome = {
        testCaseId: spec.id,
        screener: spec.label,
        route: spec.route,
        runId,
        allQuestionsCompleted: /all questions answered|you’ve completed all/i.test(summary.bodyText),
        resultScreenVisible: /all questions answered|send my report|send report/i.test(summary.bodyText),
        reportAttempted,
        reportConfirmed: reportAttempted,
        scoreText: summary.scoreText,
        classificationText: summary.classificationText,
        evidenceDir: evDir,
        notes: 'Live completion screen reached and report form attempted once. Email delivery is not verified in this phase.',
      };

      await writeEvidenceJson(evDir, outcome as any);
      await appendCsvSummary({
        testCaseId: spec.id,
        screener: spec.label,
        route: spec.route,
        runId,
        allQuestionsCompleted: outcome.allQuestionsCompleted,
        resultScreenVisible: outcome.resultScreenVisible,
        reportAttempted,
        reportConfirmed: reportAttempted,
        evidenceDir: evDir,
      });

      testInfo.attachments.push({
        name: 'outcome-json',
        path: path.join(evDir, 'outcome.json'),
        contentType: 'application/json',
      });

      expect(outcome.allQuestionsCompleted).toBeTruthy();
      expect(outcome.resultScreenVisible).toBeTruthy();
      // Respect environment gating: parent screener report attempts are only expected when enabled
      const expectParentReport = isSubmissionEnabled();
      expect(outcome.reportAttempted).toBe(expectParentReport);
    } catch (error) {
      await page.screenshot({ path: path.join(evDir, 'error.png'), fullPage: true });
      const failure = error instanceof Error ? error.message : String(error);
      await writeEvidenceJson(evDir, {
        testCaseId: spec.id,
        screener: spec.label,
        route: spec.route,
        runId,
        allQuestionsCompleted: false,
        resultScreenVisible: false,
        reportAttempted: false,
        reportConfirmed: false,
        evidenceDir: evDir,
        notes: `BLOCKED: ${failure}`,
      } as any);
      throw error;
    }
  });
}
