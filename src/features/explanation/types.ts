// Shared types for the explanation evaluator.

export type ExplanationFeedback = {
  summary: string;
  strengths: string[];
  gaps: string[];
  next_step?: string;
};

export type ExplanationRecord = {
  explanation: string;
  score: number;
  feedback: ExplanationFeedback;
  attempt_count: number;
  updated_at: string;
};

export type EvaluationResult = {
  ok: true;
  record: ExplanationRecord;
  completed: boolean; // true iff score >= COMPLETION_THRESHOLD
} | {
  ok: false;
  error: string;
};

export const COMPLETION_THRESHOLD = 3.5;
