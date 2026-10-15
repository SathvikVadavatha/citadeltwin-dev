import type { KnowledgeEntry } from './appKnowledge';
import { APP_KNOWLEDGE } from './appKnowledge';
import { retrieveEntries } from './retrieval';
import type { AssistantDataContext } from '@/hooks/assistant/useAssistantDataContext';

/**
 * The substantive behavior of the navigation assistant lives entirely here,
 * not in the edge function. supabase/functions/gemini-ai/index.ts's
 * "app-navigation" type only supplies a minimal neutral framing and defers
 * to whatever this file sends as the request's `context` field.
 */
const ASSISTANT_RULES = `You are Vega, the in-app navigation guide for CitadelTwin, embedded as a chat widget. If asked your name, say Vega. Describe yourself as a guide to using this application, not as a general AI assistant, and don't claim capabilities beyond navigation and app guidance. Follow these rules exactly:

1. Answer only questions about using this application: where a feature lives, how to complete a task in it, what a status or error means, or questions about the user's own data listed below. If asked anything else (engineering questions, building code values, structural calculations, design advice, or anything unrelated to this app), decline in one sentence and suggest what this app can do instead.
2. State only what appears in the "Knowledge" and "User data" sections below. Never describe a feature, route, button, or capability that is not listed there, even if it plausibly exists — if it's not below, say you don't have information on that.
3. When recommending a page, name its exact title from the Knowledge section in your answer (e.g. "View Blueprints") so the user can find it.
4. Never recommend a feature whose status is "broken" — in a direct recommendation, in a list, or in any other context. If you mention a broken feature at all (e.g. because the user asked for a full list of pages), say plainly that it is not currently working, and if an "alternative" is listed for it, recommend that instead and explain why.
5. If a Knowledge entry has a caveat, repeat it — especially that Site & Federal Requirements is a reference tool only and does not determine compliance.
6. Never give engineering advice, a building-code number, a calculation, or a design recommendation, even a rough or "typical" one — not a single number from your own general knowledge. Redirect to a licensed professional or the Site & Federal Requirements page instead.
7. Be brief: 2-4 sentences, or a short numbered list for a multi-step task.
8. If the Knowledge and User data sections below don't cover the question, say so plainly rather than guessing.
9. Never claim to take an action, start a process, or change any data — you can only inform and point to pages.
10. If the Knowledge section is marked COMPLETE below and the user asked for a full list of pages or features, enumerate every entry listed that has a page — do not stop partway or shorten the list. If it is NOT marked COMPLETE, never present what you list as the whole app — say there may be more and point to the sidebar navigation for the full menu. A partial list must never be presented as if it were complete.`;

function formatEntry(entry: KnowledgeEntry): string {
  const lines = [
    `- [${entry.id}] ${entry.title} (status: ${entry.status}${entry.route ? `, page: ${entry.route}` : ', no dedicated page'})`,
    `  Summary: ${entry.summary}`,
  ];
  if (entry.details) lines.push(`  Details: ${entry.details}`);
  if (entry.caveats) lines.push(`  Caveat: ${entry.caveats}`);
  if (entry.alternative) {
    const alt = APP_KNOWLEDGE.find((e) => e.id === entry.alternative);
    if (alt) lines.push(`  Instead of this, recommend: ${alt.title}`);
  }
  return lines.join('\n');
}

function formatDataContext(data: AssistantDataContext | undefined): string {
  if (!data) return 'User data: not available for this request.';
  if (data.loadError) return 'User data: failed to load — tell the user you could not retrieve their blueprint data right now.';
  if (!data.available) return 'User data: still loading — tell the user to wait a moment and try again.';

  const statusLines = Object.entries(data.countsByStatus)
    .map(([status, count]) => `${count} ${status}`)
    .join(', ') || 'none';

  return [
    'User data (their own blueprints only, real counts from the database):',
    `- Total blueprints: ${data.totalBlueprints}`,
    `- By status: ${statusLines}`,
    `- Blueprints with no 3D model yet: ${data.noModelYet.length === 0 ? 'none' : data.noModelYet.join(', ')}`,
    `- Blueprints needing regeneration (legacy expired model): ${data.needsRegenerating.length === 0 ? 'none' : data.needsRegenerating.join(', ')}`,
  ].join('\n');
}

export interface BuiltAssistantContext {
  contextText: string;
  retrievedEntries: KnowledgeEntry[];
}

export function buildAssistantContext(
  query: string,
  currentRoute: string | null,
  dataContext: AssistantDataContext | undefined
): BuiltAssistantContext {
  const { entries: retrieved, isFullDump } = retrieveEntries(query, currentRoute);

  // A broken entry's alternative must ride along so the model can name it
  // and the UI can render it as an actual link, not just prose.
  const entries = [...retrieved];
  for (const entry of retrieved) {
    if (entry.alternative && !entries.some((e) => e.id === entry.alternative)) {
      const alt = APP_KNOWLEDGE.find((e) => e.id === entry.alternative);
      if (alt) entries.push(alt);
    }
  }

  const knowledgeBlock = entries.length > 0
    ? entries.map(formatEntry).join('\n\n')
    : 'No knowledge entries matched this question.';

  const knowledgeHeader = isFullDump
    ? 'Knowledge (COMPLETE — this is every page/feature in the app knowledge base; when asked for a full list, include every entry below that has a page, none omitted):'
    : 'Knowledge (only the entries that matched this question — may not cover everything the app offers):';

  const contextText = [
    ASSISTANT_RULES,
    '',
    `Current page: ${currentRoute ?? 'unknown'}`,
    '',
    knowledgeHeader,
    knowledgeBlock,
    '',
    formatDataContext(dataContext),
  ].join('\n');

  return { contextText, retrievedEntries: entries };
}
