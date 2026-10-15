function parseBool(value?: string | null): boolean {
  if (!value) return false;
  return /^(?:1|true|yes)$/i.test(value.trim());
}

export function isSubmissionEnabled(screener?: string): boolean {
  // Master switch: if SEND_REPORTS=true, enable submission for all screeners
  if (parseBool(process.env.SEND_REPORTS ?? null)) return true;

  // Screener-specific overrides
  if (screener && /gad/i.test(screener)) {
    return parseBool(process.env.GAD7_SEND_REPORT ?? null);
  }

  // Parent/other screener flows: controlled by PARENT_SEND_REPORT
  return parseBool(process.env.PARENT_SEND_REPORT ?? null);
}

export { parseBool };
