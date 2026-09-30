/**
 * Client-side output check: Vega must never state a building-code value or
 * measurement it wasn't explicitly given. The system prompt already forbids
 * this (see buildPrompt.ts's ASSISTANT_RULES), but a prompt instruction can
 * be talked around — this is the actual gate. It scans the model's own
 * response text after the call returns, and discards the response if it
 * contains a construction measurement or a code-citation pattern that
 * wasn't present in the context we supplied for that message.
 *
 * Deliberately narrow: matches specific construction units and citation
 * shapes, never a bare number. File sizes ("550 KB"), counts ("2
 * blueprints"), and durations ("about 60 seconds") use none of these units
 * and are never touched.
 */

// Construction/engineering units. Case-insensitive; none of these collide
// with ordinary English words (unlike "in", handled separately below).
const MEASUREMENT_RE =
  /\b\d+(?:\.\d+)?\s?(?:ft|feet|foot|inch(?:es)?|yd|yards?|mm|cm|psf|psi|plf|klf|ksi|lbs?|kips?|mph|kn|kpa|mpa)\b/gi;

// "in" as a unit collides with the common preposition ("check in the
// morning"). Only counted as a measurement when not immediately followed by
// a word that makes it obviously the preposition.
const INCHES_RE =
  /\b\d+(?:\.\d+)?\s?in\.?\b(?!\s+(?:the|a|an|your|this|that|progress|order|use|place|which|it))/gi;

// R-values (insulation), e.g. "R-30", "R30".
const R_VALUE_RE = /\bR-?\d+\b/g;

// Building/fire/energy/accessibility code citations: an acronym followed by
// a numeric section reference, optionally with a title number in front
// (e.g. "29 CFR 1910.36"). Requiring the trailing number is what keeps this
// from false-positiving on ordinary mentions like "upload an IFC file".
const CODE_CITATION_RE =
  /\b(?:\d{1,3}\s+)?(?:IBC|IRC|IFC|IPC|IMC|IECC|NEC|NFPA|ADA|OSHA|CFR|ASCE|OBC|FBC|CBC|RCO|ORC|ZR)\s?\d+(?:[.:]\d+)*\b/gi;

export function findOutOfScopePatterns(text: string): string[] {
  const found = new Set<string>();
  for (const re of [MEASUREMENT_RE, INCHES_RE, R_VALUE_RE, CODE_CITATION_RE]) {
    for (const match of text.matchAll(re)) {
      found.add(match[0].trim());
    }
  }
  return [...found];
}

export interface OutputGuardResult {
  blocked: boolean;
  flagged: string[];
}

/**
 * A flagged pattern is only a violation if it wasn't actually present in
 * the context we supplied for this message — so a citation or measurement
 * a future knowledge entry legitimately quotes verbatim is never blocked,
 * only content the model introduced on its own.
 */
export function checkResponseForLeaks(responseText: string, suppliedContextText: string): OutputGuardResult {
  const found = findOutOfScopePatterns(responseText);
  if (found.length === 0) return { blocked: false, flagged: [] };

  const contextLower = suppliedContextText.toLowerCase();
  const flagged = found.filter((match) => !contextLower.includes(match.toLowerCase()));

  return { blocked: flagged.length > 0, flagged };
}
