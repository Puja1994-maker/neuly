const configuredAddress = process.env.REPORT_EMAIL?.trim();

export const REPORT_EMAIL = configuredAddress || 'pihusuryavanshi502@gmail.com';

// Backwards-compatible single export file; use `helpers/report-gate.ts` for gating logic.
