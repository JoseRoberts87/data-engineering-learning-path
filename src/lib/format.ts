// Format minutes as a short, human-readable duration.
// Examples: 12 -> "~12 min"; 95 -> "~1h 35m"; 120 -> "~2h"; 0 -> "—"
export function formatMinutes(min: number | null | undefined): string {
  if (min === null || min === undefined || min <= 0) return "—";
  if (min < 60) return `~${min} min`;
  const hours = Math.floor(min / 60);
  const remainder = min % 60;
  if (remainder === 0) return `~${hours}h`;
  return `~${hours}h ${remainder}m`;
}
