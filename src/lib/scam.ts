/**
 * Finds wording that asks workers for money. Used before a job goes live.
 * Returns the offending phrases (empty when the text looks fine).
 */
const PATTERNS: RegExp[] = [
  /\b(registration|security|joining|training|uniform|processing|medical|id card|kit)\s*(fee|fees|charge|charges|deposit|amount)\b/gi,
  /\b(deposit|advance payment|advance fee)\b/gi,
  /\bpay\s+(us|first|to join|for the job)\b/gi,
  /\bfees?\s+(required|applicable|to be paid)\b/gi,
  /(₹|rs\.?|inr)\s?\d[\d,]*\s*(for|as)\s*(registration|joining|deposit|training|uniform)/gi,
];

export function findFeeWording(...texts: (string | undefined)[]): string[] {
  const hits = new Set<string>();
  for (const text of texts) {
    if (!text) continue;
    for (const re of PATTERNS) {
      for (const m of text.matchAll(new RegExp(re.source, re.flags))) hits.add(m[0].trim().toLowerCase());
    }
  }
  return [...hits];
}
