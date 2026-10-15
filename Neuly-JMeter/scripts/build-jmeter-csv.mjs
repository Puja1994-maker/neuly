import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const summary = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../data/scorecards-summary.json'), 'utf8')
);

/** Observed on demo.neuly.ai (form_key = route slug under /screeners/) */
const SCREENER_MAP = {
  'Vanderbilt (NICHQ)': {
    label: 'Vanderbilt (NICHQ)',
    form_key: 'vanderbilt_assessment',
    audience: 'parent',
    min_age_years: 6,
    max_age_years: 12,
    question_count: 55,
  },
  SWAN: {
    label: 'SWAN',
    form_key: 'swan_adhd_parent',
    audience: 'parent',
    min_age_years: 5,
    max_age_years: 18,
    question_count: 18,
  },
  'SCARED Parent': {
    label: 'SCARED Parent',
    form_key: 'screen_for_child_anxiety_related_disorders_parent',
    audience: 'parent',
    min_age_years: 8,
    max_age_years: 18,
    question_count: 41,
  },
  'GAD-7': {
    label: 'GAD-7 Self',
    form_key: 'gad_7_anxiety',
    audience: 'self',
    min_age_years: 11,
    max_age_years: 120,
    question_count: 8,
  },
  CAST: {
    label: 'CAST',
    form_key: 'the_childhood_autism_spectrum_test',
    audience: 'parent',
    min_age_years: 4,
    max_age_years: 11,
    question_count: 37,
  },
  'AQ-Child': {
    label: 'AQ-Child',
    form_key: 'aq_child_parent',
    audience: 'parent',
    min_age_years: 4,
    max_age_years: 11,
    question_count: 50,
  },
  'Q-CHAT': {
    label: 'Q-CHAT-25',
    form_key: 'q_chat_parent',
    audience: 'parent',
    min_age_years: 1,
    max_age_years: 2,
    question_count: 25,
  },
};

/** Scorecard workbook scenarios (manual oracle rows embedded in sheets). */
const SCENARIOS = [
  { scenario_id: 'API_LOAD', scenario_name: 'Load questionnaire definition (GET)', expected_http: 200 },
  { scenario_id: 'PAGE_LOAD', scenario_name: 'Load screener SPA route (GET)', expected_http: 200 },
];

// CAST sheet references multi-user vs single-user respondent combinations
const CAST_VARIANTS = [
  { variant: 'multi_user', note: 'CAST scorecard: Multi-user respondent columns' },
  { variant: 'single_user', note: 'CAST scorecard: Single-user respondent columns' },
];

// GAD-7 workbook sample: total 9, mild anxiety — used as documentation reference only in CSV
const GAD7_REFERENCE = { expected_total: 9, expected_band: 'mild anxiety' };

const rows = [];
for (const [sheetName, meta] of Object.entries(SCREENER_MAP)) {
  for (const sc of SCENARIOS) {
    rows.push({
      test_id: `${meta.form_key}__${sc.scenario_id}`,
      assessment_label: meta.label,
      sheet_name: sheetName,
      form_key: meta.form_key,
      page_path: `/screeners/${meta.form_key}`,
      api_path: `/api/screeners/${meta.form_key}`,
      audience: meta.audience,
      min_age_years: meta.min_age_years,
      max_age_years: meta.max_age_years,
      expected_question_count: meta.question_count,
      scenario_id: sc.scenario_id,
      scenario_name: sc.scenario_name,
      expected_http: sc.expected_http,
      variant: '',
      scorecard_reference: '',
      enabled: 'true',
    });
  }
  if (sheetName === 'CAST') {
    for (const v of CAST_VARIANTS) {
      rows.push({
        test_id: `${meta.form_key}__SCORECARD_${v.variant}`,
        assessment_label: meta.label,
        sheet_name: sheetName,
        form_key: meta.form_key,
        page_path: `/screeners/${meta.form_key}`,
        api_path: `/api/screeners/${meta.form_key}`,
        audience: meta.audience,
        min_age_years: meta.min_age_years,
        max_age_years: meta.max_age_years,
        expected_question_count: meta.question_count,
        scenario_id: 'SCORECARD_VARIANT',
        scenario_name: v.note,
        expected_http: 200,
        variant: v.variant,
        scorecard_reference: 'CAST sheet rows 3-4',
        enabled: 'true',
      });
    }
  }
  if (sheetName === 'GAD-7') {
    rows.push({
      test_id: `${meta.form_key}__SCORECARD_SAMPLE`,
      assessment_label: meta.label,
      sheet_name: sheetName,
      form_key: meta.form_key,
      page_path: `/screeners/${meta.form_key}`,
      api_path: `/api/screeners/${meta.form_key}`,
      audience: meta.audience,
      min_age_years: meta.min_age_years,
      max_age_years: meta.max_age_years,
      expected_question_count: meta.question_count,
      scenario_id: 'SCORECARD_REFERENCE',
      scenario_name: `Workbook sample total ${GAD7_REFERENCE.expected_total} (${GAD7_REFERENCE.expected_band})`,
      expected_http: 200,
      variant: 'workbook_sample',
      scorecard_reference: 'GAD-7 sheet row Total/Result',
      enabled: 'true',
    });
  }
}

const headers = Object.keys(rows[0]);
const csvLines = [headers.join(',')];
for (const r of rows) {
  csvLines.push(headers.map((h) => `"${String(r[h]).replace(/"/g, '""')}"`).join(','));
}
const csvPath = path.resolve(__dirname, '../data/screener_combinations.csv');
fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf8');
console.log('Wrote', csvPath, 'rows', rows.length);
console.log('Workbook sheets parsed:', summary.sheets.map((s) => s.name).join(', '));
