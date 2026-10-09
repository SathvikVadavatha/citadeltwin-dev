import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { useAssistantDataContext } from '@/hooks/assistant/useAssistantDataContext';
import { buildAssistantContext } from '@/lib/assistant/buildPrompt';
import { APP_KNOWLEDGE, type KnowledgeEntry } from '@/lib/assistant/appKnowledge';
import { validateResponseLinks } from '@/lib/assistant/linkValidation';
import { checkResponseForLeaks } from '@/lib/assistant/outputGuard';
import { supabase } from '@/integrations/supabase/client';

const OUT_OF_SCOPE_DECLINE_TEXT =
  "I can't give building code values. For requirements that apply to an address, try Site & Federal Requirements.";

const HIDDEN_ROUTES = new Set(['/', '/home', '/auth/login', '/.lovable/oauth/consent']);
const OPEN_STATE_KEY = 'citadeltwin-nav-assistant-open';
const AI_TIMEOUT_MS = 20000;

type VegaStatus = 'unknown' | 'ready' | 'thinking' | 'unavailable';

const STATUS_META: Record<VegaStatus, { dotClass: string; label: string; pulse: boolean }> = {
  unknown: { dotClass: 'bg-muted-foreground/40', label: 'Vega status unknown', pulse: false },
  ready: { dotClass: 'bg-green-500', label: 'Vega is ready', pulse: false },
  thinking: { dotClass: 'bg-amber-500', label: 'Vega is thinking', pulse: true },
  unavailable: { dotClass: 'bg-red-500', label: 'Vega is unavailable', pulse: false },
};

const StatusDot: React.FC<{ status: VegaStatus; className?: string }> = ({ status, className }) => {
  const meta = STATUS_META[status];
  return (
    <span
      role="status"
      aria-label={meta.label}
      title={meta.label}
      className={cn(
        'inline-block h-2.5 w-2.5 shrink-0 rounded-full',
        meta.dotClass,
        meta.pulse && 'motion-safe:animate-pulse',
        className
      )}
    />
  );
};

const STARTER_SUGGESTIONS = [
  'How do I turn a floor plan into a 3D model?',
  'How many blueprints do I have?',
  'Where do I check building code compliance?',
  'How do I find site requirements for an address?',
];

type MessageRole = 'user' | 'assistant' | 'error';

interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  links?: KnowledgeEntry[];
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

const NavigationAssistantPanel: React.FC<{ currentRoute: string }> = ({ currentRoute }) => {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(OPEN_STATE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<VegaStatus>('unknown');
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasProbedRef = useRef(false);
  // Bumped by every call that sets 'thinking'; a resolving call only applies
  // its result if it's still the most recent one, so a slow probe can't
  // clobber the outcome of a real message sent after it (or vice versa).
  const statusOpRef = useRef(0);

  const dataContext = useAssistantDataContext();
  const { generateResponse } = useGeminiAI();

  useEffect(() => {
    try {
      sessionStorage.setItem(OPEN_STATE_KEY, String(open));
    } catch {
      // sessionStorage unavailable — open state just won't persist this session
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  // Cheap, silent reachability check the first time the panel opens — bypasses
  // useGeminiAI directly so a failed probe doesn't pop an error toast meant
  // for real user messages. Never overrides a status a real message already set.
  useEffect(() => {
    if (!open || hasProbedRef.current) return;
    hasProbedRef.current = true;
    const opId = ++statusOpRef.current;
    setStatus('thinking');

    (async () => {
      let result: VegaStatus;
      try {
        const { data, error } = await withTimeout(
          supabase.functions.invoke('gemini-ai', {
            body: {
              prompt: 'ping',
              type: 'app-navigation',
              context: 'This is a silent availability check, not a user message. Reply with just: OK',
              maxTokens: 5,
            },
          }),
          AI_TIMEOUT_MS
        );
        result = !error && data && !data.error ? 'ready' : 'unavailable';
      } catch {
        result = 'unavailable';
      }
      if (statusOpRef.current === opId) setStatus(result);
    })();
  }, [open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', text: trimmed }]);
    setInput('');
    setSending(true);
    const opId = ++statusOpRef.current;
    setStatus('thinking');

    try {
      const { contextText } = buildAssistantContext(trimmed, currentRoute, dataContext);

      const response = await withTimeout(
        generateResponse({
          prompt: trimmed,
          type: 'app-navigation',
          context: contextText,
          maxTokens: 500,
        }),
        AI_TIMEOUT_MS
      );

      if (!response) {
        if (statusOpRef.current === opId) setStatus('unavailable');
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'error', text: 'Something went wrong reaching the assistant. Please try again.' },
        ]);
        return;
      }

      if (statusOpRef.current === opId) setStatus('ready');

      const { blocked, flagged } = checkResponseForLeaks(response.result, contextText);
      if (blocked) {
        console.warn(
          '[Vega output-guard] blocked a response containing out-of-scope content:',
          flagged,
          { question: trimmed, response: response.result }
        );
        const siteRequirements = APP_KNOWLEDGE.find((e) => e.id === 'site-requirements');
        const declineLinks = siteRequirements && siteRequirements.route !== currentRoute ? [siteRequirements] : undefined;
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', text: OUT_OF_SCOPE_DECLINE_TEXT, links: declineLinks },
        ]);
        return;
      }

      const { validLinks, unmatchedMentions } = validateResponseLinks(response.result);
      if (unmatchedMentions.length > 0) {
        console.warn(
          '[Vega link-check] response mentioned unrecognized destination(s), not linked:',
          unmatchedMentions,
          { question: trimmed, response: response.result }
        );
      }
      const links = validLinks.filter((e) => e.route !== currentRoute);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', text: response.result, links },
      ]);
    } catch (err) {
      if (statusOpRef.current === opId) setStatus('unavailable');
      const message = err instanceof Error && err.message === 'timeout'
        ? 'That took too long to respond. Please try again.'
        : err instanceof Error
          ? err.message
          : 'Something went wrong reaching the assistant.';
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'error', text: message }]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const widget = (
    <div
      className={cn(
        'fixed z-40 flex flex-col items-end gap-3',
        'bottom-24 right-4 md:bottom-6 md:right-6'
      )}
    >
      {open && (
        <div className="flex h-[80vh] max-h-[720px] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold">
              Vega
              <StatusDot status={status} />
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setOpen(false)}
              aria-label="Close Vega"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Hi, I'm Vega. Ask me where something is or how to do a task in this app.
                </p>
                <div className="flex flex-col gap-2">
                  {STARTER_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      className="rounded-md border border-border bg-muted/40 px-3 py-2 text-left text-xs text-foreground hover:bg-muted"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                    m.role === 'user' && 'bg-primary text-primary-foreground',
                    m.role === 'assistant' && 'bg-muted text-foreground',
                    m.role === 'error' && 'flex items-start gap-2 bg-destructive/10 text-destructive'
                  )}
                >
                  {m.role === 'error' && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                  <div className="space-y-2">
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    {m.links && m.links.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {m.links.map((entry) => (
                          <Link
                            key={entry.id}
                            to={entry.route as string}
                            className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                          >
                            {entry.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Thinking…
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Vega about this app…"
              disabled={sending}
              className="h-9 text-sm"
            />
            <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={sending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      <div className="relative">
        <Button
          onClick={() => setOpen((v) => !v)}
          size="icon"
          title="Vega — app navigation guide"
          className="h-12 w-12 rounded-full shadow-lg"
          aria-label={open ? 'Close Vega, the app navigation guide' : 'Open Vega, the app navigation guide'}
        >
          {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        </Button>
        <StatusDot
          status={status}
          className="pointer-events-none absolute -right-0.5 -top-0.5 ring-2 ring-background"
        />
      </div>
    </div>
  );

  return createPortal(widget, document.body);
};

export const NavigationAssistant: React.FC = () => {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading || !user || HIDDEN_ROUTES.has(location.pathname)) {
    return null;
  }

  return <NavigationAssistantPanel currentRoute={location.pathname} />;
};
