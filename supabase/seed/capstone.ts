export type CapstoneStepSeed = {
  slug: string;
  phase_slug: string | null;
  title: string;
  description: string;
  hints: string | null;
  sort_order: number;
};

export const capstoneSteps: CapstoneStepSeed[] = [
  {
    slug: "pick-source-and-define-contract",
    phase_slug: "thinking-in-data",
    title: "Pick a data source and define the contract",
    description:
      "Choose one dataset you'll work with across the whole capstone. Public options work well: a city open-data portal, GitHub Archive events, an air-quality API, or a CSV from data.gov. Document the schema you're consuming: column names, data types, nullability, update cadence, and any known quirks (missing values, inconsistent formats, unit ambiguity). This document IS your producer contract — even if the producer is the open internet.",
    hints:
      "Good starter sources: NYC TLC trip data (Parquet, partitioned by month), GitHub Archive (hourly JSON), OpenAQ air quality (REST), Open-Meteo weather (REST). Pick something with a stable, versioned schema — scraping HTML is more pain than it's worth for this project.",
    sort_order: 1,
  },
  {
    slug: "model-target-schema",
    phase_slug: "data-modeling-fundamentals",
    title: "Model a target schema",
    description:
      "Design the analytical tables a downstream consumer (a dashboard, a notebook, a model) would actually query. Identify what's a fact (measurable events, one row per event) vs. what's a dimension (slowly-changing context like users, vehicles, or sensor locations). Write the DDL. Pick a partition key that lines up with how the table will be filtered.",
    hints:
      "Use a single denormalized fact table for v1. Resist over-normalizing. Pick a partition column that matches the most common query filter (almost always a date). Defer slowly-changing-dimension complexity until you have a real use case.",
    sort_order: 2,
  },
  {
    slug: "build-idempotent-ingestion",
    phase_slug: "data-movement-and-transformation",
    title: "Build the ingestion step",
    description:
      "Write an idempotent load from your source into a 'raw' layer in the warehouse. The script must be safe to re-run on the same window without duplicating rows. Don't transform yet — just land the source data, preserving its original shape and column names. Verify idempotency by running the same window twice and checking row counts.",
    hints:
      "Idempotency tricks: write into a partition you can wholesale replace, or merge on a stable natural key. Keep the raw layer deliberately dumb — type coercion, deduplication, and joins all belong in later steps, not here.",
    sort_order: 3,
  },
];
