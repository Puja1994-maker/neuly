import { test, expect } from '@playwright/test';
import { isSubmissionEnabled, parseBool } from '../../helpers/report-gate';

test.describe('report gate (unit)', () => {
  test('defaults are disabled', async () => {
    const keys = ['SEND_REPORTS', 'GAD7_SEND_REPORT', 'PARENT_SEND_REPORT'] as const;
    const originalValues = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

    try {
      for (const key of keys) {
        delete process.env[key];
      }

      expect(isSubmissionEnabled()).toBe(false);
      expect(isSubmissionEnabled('GAD-7')).toBe(false);
    } finally {
      for (const key of keys) {
        const value = originalValues[key];

        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    }
  });

  test('parseBool recognizes truthy values', () => {
    expect(parseBool('true')).toBe(true);
    expect(parseBool('1')).toBe(true);
    expect(parseBool('yes')).toBe(true);
    expect(parseBool('false')).toBe(false);
    expect(parseBool(undefined)).toBe(false);
  });
});
