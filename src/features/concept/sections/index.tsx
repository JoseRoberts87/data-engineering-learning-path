import { FailureCatalog } from "./FailureCatalog";
import { ComparisonTable } from "./ComparisonTable";
import { Dimensions } from "./Dimensions";
import { InlineQuiz } from "./InlineQuiz";
import type { ConceptSection } from "./types";

export function renderSection(section: ConceptSection) {
  switch (section.type) {
    case "failure_catalog":
      return <FailureCatalog key={section.id} payload={section.payload} />;
    case "comparison":
      return <ComparisonTable key={section.id} payload={section.payload} />;
    case "dimensions":
      return <Dimensions key={section.id} payload={section.payload} />;
    case "inline_quiz":
      return <InlineQuiz key={section.id} payload={section.payload} />;
  }
}
