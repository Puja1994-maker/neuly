/** Unique id per test run for evidence folders (no PII). */
export function createRunId(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${stamp}_${suffix}`;
}
