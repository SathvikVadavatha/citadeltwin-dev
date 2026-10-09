import { APP_KNOWLEDGE, type KnowledgeEntry } from './appKnowledge';

// Phrases that look like a page/feature name: 2-5 consecutive Title-Case
// "words", allowing '&' or '→' as a joiner (matches the shape of every
// title in appKnowledge.ts, e.g. "Site & Federal Requirements",
// "Blueprint → 3D"). Used only to spot candidates worth checking against
// the knowledge base — not a general-purpose NLP parse.
const TITLE_CASE_PHRASE_RE = /\b[A-Z][a-zA-Z0-9]*(?:[ \t]*[&→][ \t]*|[ \t]+)[A-Z][a-zA-Z0-9]*(?:[ \t]+[A-Z][a-zA-Z0-9]*){0,3}\b/g;

export interface LinkValidationResult {
  /** Entries safe to render as real links — title was found verbatim in the response. */
  validLinks: KnowledgeEntry[];
  /** Capitalized phrases that look like a page/feature name but match no known title. */
  unmatchedMentions: string[];
}

/**
 * Validates page references in a model response against the live
 * appKnowledge.ts array (not a hardcoded list, so a new entry is picked up
 * automatically). Only entries whose exact title appears in the response
 * text are rendered as links — everything else stays plain text.
 */
export function validateResponseLinks(responseText: string): LinkValidationResult {
  const lowerText = responseText.toLowerCase();

  // A broken feature is never linked, in any context — list, recommendation,
  // or otherwise. The prompt rule against recommending broken features only
  // governs direct recommendations; this is the deterministic backstop for
  // every other context (e.g. an inventory list) the prompt doesn't cover.
  const validLinks = APP_KNOWLEDGE.filter(
    (entry) => entry.route && entry.status !== 'broken' && lowerText.includes(entry.title.toLowerCase())
  );
  const matchedTitles = new Set(validLinks.map((e) => e.title.toLowerCase()));

  const candidates = new Set(
    (responseText.match(TITLE_CASE_PHRASE_RE) ?? []).map((m) => m.trim())
  );

  const knownTitles = APP_KNOWLEDGE.map((e) => e.title.toLowerCase());
  const unmatchedMentions = [...candidates].filter((candidate) => {
    const lower = candidate.toLowerCase();
    if (matchedTitles.has(lower)) return false;
    // Loose match (substring either direction) so minor paraphrasing of a
    // real title ("View Blueprints page") doesn't get flagged as unknown.
    return !knownTitles.some((title) => title.includes(lower) || lower.includes(title));
  });

  return { validLinks, unmatchedMentions };
}
