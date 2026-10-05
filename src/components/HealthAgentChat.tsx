'use client';
import { useState, useRef, useEffect, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { SavedPlan } from '@/lib/storage';
import { computeAll } from '@/lib/calculations';
import { ChatIcon, LeafIcon, XIcon, SendIcon } from './icons';

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
  return (goal || 'health').replace(/_/g, ' ');
}

// Memoized: the parent dashboard re-renders on every keystroke, but the chat
// (and its react-markdown parsing) only needs to update when the plan changes.
export const HealthAgentChat = memo(function HealthAgentChat({ plan }: { plan: SavedPlan }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'agent',
      content: `Hi ${firstName(plan.profile.name)} — I'm your health coach. Ask me anything about your **${prettyGoal(plan.profile.goal)}** plan, nutrition, or training.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const fetchReply = async (history: Message[]): Promise<string> => {
    try {
      const calcs = computeAll(plan.profile);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const data = await res.json();
      if (data.error) return `Something went wrong: ${data.error}`;
      return data.reply || "I couldn't generate a response — please try again.";
    } catch {
      return "I couldn't reach the server. Check your connection and try again.";
    }
  };

  const sendText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: trimmed };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setIsTyping(true);
    const reply = await fetchReply(history);
    setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'agent', content: reply }]);
    setIsTyping(false);
  };

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
