'use client';
import { useState, useRef, useEffect, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { SavedPlan } from '@/lib/storage';
import { computeAll } from '@/lib/calculations';
import { ChatIcon, LeafIcon, XIcon, SendIcon } from './icons';
import { authedFetch } from '@/lib/api-client';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
}

const SUGGESTIONS = [
  'How much protein should I eat?',
  'What should I eat before a workout?',
  'Am I drinking enough water?',
];

function firstName(name: string): string {
  const n = (name || '').trim().split(/\s+/)[0];
  return n || 'there';
}

function prettyGoal(goal: string): string {
  const labels: Record<string, string> = {
    lose_weight: 'Weight Loss', gain_weight: 'Muscle Gain', maintain: 'Maintenance',
    improve_health: 'Health', athletic: 'Athletic Performance',
  };
  return labels[goal] || (goal || 'health').replace(/_/g, ' ');
}

// Memoized: the parent dashboard re-renders on every keystroke, but the chat
// (and its react-markdown parsing) only needs to update when the plan changes.
export const HealthAgentChat = memo(function HealthAgentChat({ plan, userName }: { plan: SavedPlan; userName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'agent',
      content: `Hi ${firstName(userName || plan.profile.name)} — I'm your health coach. Ask me anything about your **${prettyGoal(plan.profile.goal)}** plan, nutrition, or training.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [failedId, setFailedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Provider/model names must never reach users. The API streams raw text,
  // so this client-side pass is the backstop (the system prompt is the
  // first line of defense). Applied once the full reply has arrived.
  const sanitizeStreamed = (reply: string): string => {
    let out = reply;
    for (const token of [
      'groq', 'gemini', 'openrouter', 'open-router',
      'llama', 'qwen', 'kimi', 'gpt-oss', 'deepseek', 'mistral', 'gemma',
      'meta ai', 'created by meta', 'anthropic', 'Muse', 'openai', 'chatgpt',
    ]) {
      const pattern = token
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/-/g, '[-_]')
        .replace(/ /g, '\\s+');
      out = out.replace(new RegExp(`\\b${pattern}\\b`, 'gi'), 'Nutriq');
    }
    return out;
  };

  const fetchReply = async (
    history: Message[],
    onFirstChunk: () => void,
    onChunk: (partial: string) => void,
  ): Promise<string> => {
    const calcs = computeAll(plan.profile);
    // 55s cap: the server budget is 60s — never spin the typing dots forever
    // on a hung connection. The catch below turns this into a retryable error.
    const controller = new AbortController();
    abortRef.current = controller;
    const timer = setTimeout(() => controller.abort(), 55000);
    try {
      const res = await authedFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: history,
          userProfile: plan.profile,
          planContext: {
            region: plan.plan.region,
            hydrationPlan: plan.plan.hydrationPlan,
            calorieGoal: calcs.dailyCalorieGoal,
            festival: plan.plan.festivalMode ?? null,
          },
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      // Offline fallback arrives as JSON; live replies stream as plain text.
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        onFirstChunk();
        return data.reply || "I couldn't generate a response — please try again.";
      }
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      let first = true;
      // Throttle re-renders: re-parsing markdown on every token janks on
      // phones. Update at most ~8×/second; the final flush below is exact.
      let lastEmit = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        if (first) {
          first = false;
          onFirstChunk();
        }
        const now = Date.now();
        if (now - lastEmit >= 120) {
          lastEmit = now;
          onChunk(full);
        }
      }
      onChunk(full);
      return full;
    } finally {
      clearTimeout(timer);
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const sendText = async (text: string, retryAgentId?: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    setFailedId(null);
    let history: Message[];
    let agentId: string;
    if (retryAgentId) {
      // Retry: drop the failed placeholder, reuse the original user message.
      agentId = retryAgentId;
      history = messages.filter((m) => m.id !== retryAgentId);
      setMessages([...history, { id: agentId, role: 'agent', content: '' }]);
    } else {
      const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: trimmed };
      history = [...messages, userMsg];
      agentId = `a-${Date.now()}`;
      // Placeholder agent message — fills in live as the stream arrives.
      setMessages([...history, { id: agentId, role: 'agent', content: '' }]);
      setInput('');
    }
    setIsTyping(true);
    try {
      const reply = await fetchReply(
        history,
        () => setIsTyping(false),
        (partial) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === agentId ? { ...m, content: partial } : m)),
          );
        },
      );
      const clean = sanitizeStreamed(reply);
      setMessages((prev) =>
        prev.map((m) => (m.id === agentId ? { ...m, content: clean } : m)),
      );
    } catch {
      setFailedId(agentId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === agentId
            ? { ...m, content: "I couldn't reach the server. Check your connection and try again." }
            : m,
        ),
      );
    } finally {
      setIsTyping(false);
    }
  };

  // Abort an in-flight request when the chat unmounts or the panel closes.
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendText(input);
  };

  if (!isOpen) {
    return (
      <button className="hac-fab" onClick={() => setIsOpen(true)} aria-label="Open health coach chat">
        <ChatIcon size={22} />
      </button>
    );
  }

  const showSuggestions = messages.length <= 1 && !isTyping;

  return (
    <div className="hac-panel" role="dialog" aria-label="Health coach chat">
      <div className="hac-header">
        <div className="hac-identity">
          <div className="hac-avatar">
            <LeafIcon size={18} />
          </div>
          <div>
            <div className="hac-title">Health Coach</div>
            <div className="hac-status">
              <span className="hac-status-dot pulse-dot" />
              Online
            </div>
          </div>
        </div>
        <button className="hac-close" onClick={() => setIsOpen(false)} aria-label="Close chat">
          <XIcon size={16} />
        </button>
      </div>

      <div className="hac-messages nice-scroll">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`hac-msg ${msg.role === 'user' ? 'hac-msg-user' : 'hac-msg-agent'}`}
          >
            <ReactMarkdown>{msg.content}</ReactMarkdown>
            {failedId === msg.id && (() => {
              const idx = messages.findIndex((m) => m.id === msg.id);
              const lastUser = [...messages.slice(0, idx)].reverse().find((m) => m.role === 'user');
              return lastUser ? (
                <button
                  type="button" className="btn-secondary"
                  style={{ marginTop: '0.5rem', padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                  onClick={() => void sendText(lastUser.content, msg.id)}
                >
                  Try again
                </button>
              ) : null;
            })()}
          </div>
        ))}
        {isTyping && (
          <div className="hac-typing" aria-label="Coach is typing">
            <span className="typing-dot" style={{ animationDelay: '0s' }} />
            <span className="typing-dot" style={{ animationDelay: '0.15s' }} />
            <span className="typing-dot" style={{ animationDelay: '0.3s' }} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showSuggestions && (
        <div className="hac-suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="hac-chip" onClick={() => void sendText(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <form className="hac-input-row" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about nutrition, meals, training…"
          className="hac-input"
          aria-label="Message your health coach"
          autoComplete="off"
        />
        <button
          type="submit"
          className="hac-send"
          disabled={!input.trim() || isTyping}
          aria-label="Send message"
        >
          <SendIcon size={16} />
        </button>
      </form>
    </div>
  );
});
