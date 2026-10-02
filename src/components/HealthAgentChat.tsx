'use client';

import { useState, useRef, useEffect } from 'react';
import type { SavedPlan } from '@/lib/storage';
import { computeAll } from '@/lib/calculations';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
}

const MAX_MESSAGE_LENGTH = 500;
const RATE_LIMIT_MS = 2000;
const MAX_HISTORY_MESSAGES = 6; // Only send last 6 messages to API

const SUGGESTED_QUESTIONS = [
  "What should I eat for breakfast?",
  "How much water should I drink?",
  "Give me a workout tip",
  "How can I increase protein?"
];

export function HealthAgentChat({ plan }: { plan: SavedPlan }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'agent',
      content: `Hi ${plan.profile.name.split(' ')[0]}! I'm your AI Health Agent. 🤖 Ask me anything about your ${plan.profile.goal.replace('_', ' ')} plan, nutrition, or workouts!`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [responseCache, setResponseCache] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`chat_${plan.userId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (e) {
        console.error('Failed to load chat history', e);
      }
    }
  }, [plan.userId]);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem(`chat_${plan.userId}`, JSON.stringify(messages));
    }
  }, [messages, plan.userId]);

  // Check mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const logChatInteraction = (type: 'question' | 'error' | 'response', data: any) => {
    const logs = JSON.parse(localStorage.getItem('chat_logs') || '[]');
    logs.push({ type, data, timestamp: new Date().toISOString() });
    localStorage.setItem('chat_logs', JSON.stringify(logs.slice(-50)));
  };

  const fetchRealAIResponse = async (userMsg: Message) => {
    try {
      // Check cache first
      const cacheKey = userMsg.content.toLowerCase().trim();
      if (responseCache[cacheKey]) {
        return responseCache[cacheKey];
      }

      const calcs = computeAll(plan.profile);

      // Only send recent messages to reduce token usage
      const recentMessages = messages.slice(-MAX_HISTORY_MESSAGES);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...recentMessages, userMsg],
          userProfile: plan.profile,
          planContext: {
            region: plan.plan.region,
            hydrationPlan: plan.plan.hydrationPlan,
            calorieGoal: calcs.dailyCalorieGoal
          }
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Network error' }));
        logChatInteraction('error', { status: res.status, error: errorData.error });
        return `⚠️ ${errorData.error || 'Failed to get response. Please try again.'}`;
      }

      const data = await res.json();
      if (data.error) {
        logChatInteraction('error', { error: data.error });
        return `⚠️ Error: ${data.error}`;
      }

      // Cache successful response
      setResponseCache(prev => ({ ...prev, [cacheKey]: data.reply }));
      logChatInteraction('response', { question: userMsg.content, response: data.reply });

      return data.reply;
    } catch (err) {
      console.error('Chat error:', err);
      logChatInteraction('error', { error: String(err) });
      return "I couldn't reach the server. Please check your connection and try again!";
    }
  };

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!input.trim()) return;

    // Rate limiting
    const now = Date.now();
    if (now - lastRequestTime < RATE_LIMIT_MS) {
      setError('Please wait a moment before sending another message');
      return;
    }

    // Length validation
    if (input.length > MAX_MESSAGE_LENGTH) {
      setError(`Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    // Sanitize input
    const sanitizedInput = DOMPurify.sanitize(input.trim());

    setLastRequestTime(now);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: sanitizedInput,
      timestamp: now
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    logChatInteraction('question', { question: sanitizedInput });

    const reply = await fetchRealAIResponse(userMsg);

    const agentMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'agent',
      content: reply,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, agentMsg]);
    setIsTyping(false);
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  const clearChat = () => {
    const initialMessage: Message = {
      id: 'init',
      role: 'agent',
      content: `Hi ${plan.profile.name.split(' ')[0]}! I'm your AI Health Agent. 🤖 Ask me anything about your ${plan.profile.goal.replace('_', ' ')} plan, nutrition, or workouts!`,
      timestamp: Date.now(),
    };
    setMessages([initialMessage]);
    setResponseCache({});
    localStorage.removeItem(`chat_${plan.userId}`);
  };

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="glass-card glass-card-hover fade-in-up"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.75rem',
          background: 'linear-gradient(135deg, #10b981, #6366f1)',
          color: 'white',
          border: 'none',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)',
          cursor: 'pointer',
          zIndex: 100,
        }}
      >
        💬
      </button>
    );
  }

  return (
    <div
      className="glass-card fade-in-up"
      style={{
        position: 'fixed',
        bottom: isMobile ? 0 : '2rem',
        right: isMobile ? 0 : '2rem',
        width: isMobile ? '100vw' : '380px',
        height: isMobile ? '100vh' : '550px',
        maxWidth: 'calc(100vw - 2rem)',
        maxHeight: 'calc(100vh - 2rem)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        background: 'rgba(17, 24, 39, 0.95)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '1rem',
        background: 'rgba(255,255,255,0.05)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px',
            background: 'linear-gradient(135deg, #10b981, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem',
          }}>
            🤖
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>AI Health Agent</div>
            <div style={{ fontSize: '0.75rem', color: '#10b981' }}>● Online</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={clearChat}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-muted)',
              fontSize: '1rem',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
            title="Clear chat"
          >
            🗑️
          </button>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-muted)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        padding: '1rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: msg.role === 'user' ? 'var(--gradient-accent)' : 'rgba(255,255,255,0.08)',
              padding: '0.75rem 1rem',
              borderRadius: '1rem',
              borderBottomRightRadius: msg.role === 'user' ? '0.25rem' : '1rem',
              borderBottomLeftRadius: msg.role === 'agent' ? '0.25rem' : '1rem',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              color: 'var(--color-text)',
              position: 'relative',
            }}
          >
            {msg.role === 'agent' ? (
              <div style={{ position: 'relative' }}>
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p style={{ margin: 0, marginBottom: '0.5rem' }}>{children}</p>,
                    strong: ({ children }) => <strong style={{ color: '#10b981' }}>{children}</strong>,
                    ul: ({ children }) => <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>{children}</ul>,
                    ol: ({ children }) => <ol style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>{children}</ol>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
                <button
                  onClick={() => copyMessage(msg.id, msg.content)}
                  style={{
                    position: 'absolute',
                    top: '-0.5rem',
                    right: '-0.5rem',
                    background: 'rgba(0,0,0,0.5)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.25rem 0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    opacity: 0.7,
                  }}
                  title="Copy message"
                >
                  {copied === msg.id ? '✓' : '📋'}
                </button>
              </div>
            ) : (
              msg.content
            )}
          </div>
        ))}

        {/* Suggested Questions (only show on first message) */}
        {messages.length === 1 && !isTyping && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '0.25rem' }}>
              💡 Try asking:
            </div>
            {SUGGESTED_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => handleSuggestedQuestion(q)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8rem',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.borderColor = 'var(--color-accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {isTyping && (
          <div style={{
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255,255,255,0.05)',
            padding: '0.75rem 1rem',
            borderRadius: '1rem',
            borderBottomLeftRadius: '0.25rem',
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>AI is thinking</span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <span className="typing-dot" style={{ animationDelay: '0s' }}>.</span>
              <span className="typing-dot" style={{ animationDelay: '0.2s' }}>.</span>
              <span className="typing-dot" style={{ animationDelay: '0.4s' }}>.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '0.5rem 1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          borderTop: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          fontSize: '0.85rem',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSend} style={{
        padding: '1rem',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        gap: '0.5rem',
      }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a health question..."
          className="input-field"
          maxLength={MAX_MESSAGE_LENGTH}
          style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '2rem' }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="btn-primary"
          style={{
            width: '45px',
            height: '45px',
            borderRadius: '50%',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: (!input.trim() || isTyping) ? 0.5 : 1,
            cursor: (!input.trim() || isTyping) ? 'not-allowed' : 'pointer',
          }}
        >
          ↑
        </button>
      </form>

      {/* Character Counter */}
      {input.length > MAX_MESSAGE_LENGTH * 0.8 && (
        <div style={{
          position: 'absolute',
          bottom: '4.5rem',
          right: '1rem',
          fontSize: '0.7rem',
          color: input.length >= MAX_MESSAGE_LENGTH ? '#ef4444' : 'var(--color-muted)',
          background: 'rgba(0,0,0,0.7)',
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
        }}>
          {input.length}/{MAX_MESSAGE_LENGTH}
        </div>
      )}

      <style>{`
        .typing-dot {
          animation: typeBounce 1.4s infinite ease-in-out both;
          font-weight: bold;
          font-size: 1.25rem;
          color: var(--color-muted);
        }
        @keyframes typeBounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
