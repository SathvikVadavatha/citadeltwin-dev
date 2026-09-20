import { APP_KNOWLEDGE, type KnowledgeEntry } from './appKnowledge';

const MIN_TOKEN_LENGTH = 3;
const MAX_RESULTS = 5;

const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'you', 'can', 'how', 'what', 'why', 'does',
  'this', 'that', 'with', 'from', 'have', 'has', 'not', 'get', 'when',
  'where', 'who', 'will', 'would', 'should', 'could', 'about', 'into',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= MIN_TOKEN_LENGTH && !STOPWORDS.has(t));
}

// Phrases that signal the user wants a complete enumeration ("all pages",
// "every feature"), not just whatever a few pages happen to match on
// keywords. Keyword-overlap retrieval structurally can't answer these well —
// no single entry scores highest for "what are all the pages" — so these
// queries get the full knowledge base instead of the usual top few.
const INVENTORY_QUERY_CUES = [
  'all page', 'every page', 'all the page', 'list all', 'full list', 'complete list',
  'what page', 'what are the page', 'all feature', 'every feature', 'all the feature',
  'what feature', 'everything this app', 'everything can', 'what can this app do',
  'all section', 'every section', 'list of page', 'list of feature', 'all the thing',
];

export function isInventoryQuery(query: string): boolean {
  const q = query.toLowerCase();
  return INVENTORY_QUERY_CUES.some((cue) => q.includes(cue));
}

function scoreEntry(tokens: string[], entry: KnowledgeEntry): number {
  const title = entry.title.toLowerCase();
  const keywords = entry.keywords.toLowerCase();
  const summary = entry.summary.toLowerCase();

  let score = 0;
  for (const token of tokens) {
    if (title.includes(token)) score += 3;
    if (keywords.includes(token)) score += 2;
    if (summary.includes(token)) score += 1;
  }
  return score;
}

export interface RetrievalResult {
  entries: KnowledgeEntry[];
  matchedByScore: boolean;
  /** True when `entries` is the entire knowledge base, not a top-few match — an inventory-style question. */
  isFullDump: boolean;
}

/**
 * Deterministic keyword-overlap retrieval — no embeddings. Scores every
 * entry against the query, takes the top few, and always includes the
 * entry for the current route (if one exists) since page context tends
 * to be relevant regardless of score. An inventory-style question ("all
 * pages", "every feature") bypasses scoring entirely and returns every
 * entry, since a partial match set would let the model present an
 * incomplete list as complete.
 */
export function retrieveEntries(
  query: string,
  currentRoute: string | null,
  knowledge: KnowledgeEntry[] = APP_KNOWLEDGE
): RetrievalResult {
  if (isInventoryQuery(query)) {
    return { entries: knowledge, matchedByScore: true, isFullDump: true };
  }

  const tokens = tokenize(query);

  const scored = knowledge
    .map((entry) => ({ entry, score: scoreEntry(tokens, entry) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, MAX_RESULTS).map((s) => s.entry);

  const routeEntry = currentRoute
    ? knowledge.find((e) => e.route === currentRoute)
    : undefined;

  const entries = routeEntry && !top.some((e) => e.id === routeEntry.id)
    ? [routeEntry, ...top]
    : top;

  return { entries, matchedByScore: scored.length > 0, isFullDump: false };
}
