export type FailureCatalogPayload = {
  title?: string;
  intro?: string;
  items: {
    scenario: string;
    consequence: string;
    swe_equivalent?: string | null;
    de_catches_it?: string | null;
  }[];
};

export type ComparisonPayload = {
  title?: string;
  left_label: string;
  right_label: string;
  pairs: { left: string; right: string }[];
};

export type DimensionsPayload = {
  title?: string;
  intro?: string;
  items: {
    name: string;
    description: string;
    swe_parallel?: string | null;
  }[];
};

export type InlineQuizPayload = {
  prompt: string;
  options: { id: string; text: string; correct: boolean }[];
  explanation: string;
};

export type SectionType =
  | "failure_catalog"
  | "comparison"
  | "dimensions"
  | "inline_quiz";

export type ConceptSection =
  | { id: string; type: "failure_catalog"; sort_order: number; payload: FailureCatalogPayload }
  | { id: string; type: "comparison"; sort_order: number; payload: ComparisonPayload }
  | { id: string; type: "dimensions"; sort_order: number; payload: DimensionsPayload }
  | { id: string; type: "inline_quiz"; sort_order: number; payload: InlineQuizPayload };
