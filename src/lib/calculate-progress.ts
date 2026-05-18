/**
 * Calculates a normalized progress score (0–100) for a goal.
 *
 * formulaType values (set in seed / UomType):
 *   "min" → Higher is better  → score = (achievement / target) * 100
 *   "max" → Lower is better   → score = (target / achievement) * 100
 *   "percent" → Value is already a percentage → score = achievement directly
 *   "binary"  → 0 or 1 → score = achievement === 1 ? 100 : 0
 */
export function calculateProgressScore(
  formulaType: string,
  target: number,
  achievement: number,
  targetDate: Date | null,
  actualDate: Date | null
): number {
  if (target === 0 || achievement == null) return 0;

  let raw: number;

  switch (formulaType) {
    case "min":
      // Higher achievement is better (e.g. revenue, units sold)
      raw = (achievement / target) * 100;
      break;
    case "max":
      // Lower achievement is better (e.g. defect rate, cost)
      raw = achievement === 0 ? 100 : (target / achievement) * 100;
      break;
    case "percent":
      // Achievement is already a percentage value
      raw = achievement;
      break;
    case "binary":
      // 1 = completed, 0 = not completed
      raw = achievement >= 1 ? 100 : 0;
      break;
    default:
      raw = (achievement / target) * 100;
  }

  // Clamp between 0 and 100
  return Math.min(100, Math.max(0, Math.round(raw * 100) / 100));
}
