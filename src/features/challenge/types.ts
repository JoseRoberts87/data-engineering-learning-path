export type ChallengeFeedback = {
  summary: string;
  strengths: string[];
  gaps: string[];
  next_step?: string;
};

// The shape that's sent to the client (server-only fields like
// expected_result and sample_solution are deliberately excluded).
export type ChallengeContent = {
  id: string;
  conceptId: string;
  prompt: string;
  starterSql: string;
  fixtureSql: string;
  hints: string[]; // pre-flattened from jsonb
};

export type ChallengeSubmission = {
  code: string;
  passedTests: boolean;
  aiScore: number;
  feedback: ChallengeFeedback;
  attemptCount: number;
  updatedAt: string;
};

export type SubmissionResult =
  | {
      ok: true;
      submission: ChallengeSubmission;
      completed: boolean; // true iff this submission pushed the concept to "completed"
    }
  | { ok: false; error: string };

export const CHALLENGE_PASS_THRESHOLD = 3.5;
