/** GAD-7 scored item values (Q1–Q7). Q8 difficulty is excluded from total. */

export type Gad7ScoredValue =
  | 'not_at_all'
  | 'several_days'
  | 'more_than_half_the_days'
  | 'nearly_every_day';

export type Gad7DifficultyValue =
  | 'not_difficult_at_all'
  | 'somewhat_difficult'
  | 'very_difficult'
  | 'extremely_difficult';

const SCORE_MAP: Record<Gad7ScoredValue, number> = {
  not_at_all: 0,
  several_days: 1,
  more_than_half_the_days: 2,
  nearly_every_day: 3,
};

/** Standard GAD-7 severity bands (verified literature; confirm on Neuly UI). */
export function classifyGad7Total(total: number): string {
  if (total <= 4) return 'Minimal';
  if (total <= 9) return 'Mild';
  if (total <= 14) return 'Moderate';
  return 'Severe';
}

export function totalGad7Score(scoredAnswers: Gad7ScoredValue[]): number {
  if (scoredAnswers.length !== 7) {
    throw new Error(`Expected 7 scored answers, got ${scoredAnswers.length}`);
  }
  return scoredAnswers.reduce((sum, v) => sum + SCORE_MAP[v], 0);
}

export const GAD7_SCORED_LABEL: Record<Gad7ScoredValue, string> = {
  not_at_all: 'Not at all',
  several_days: 'Several days',
  more_than_half_the_days: 'More than half the days',
  nearly_every_day: 'Nearly every day',
};

export const GAD7_DIFFICULTY_LABEL: Record<Gad7DifficultyValue, string> = {
  not_difficult_at_all: 'Not difficult at all',
  somewhat_difficult: 'Somewhat difficult',
  very_difficult: 'Very difficult',
  extremely_difficult: 'Extremely difficult',
};
