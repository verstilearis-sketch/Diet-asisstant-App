'use client';

import { useMemo, useState } from 'react';
import {
  CartIcon, CheckIcon, SearchIcon, TrophyIcon,
  SaladIcon, DropletsIcon, WheatIcon, FlameIcon,
} from '@/components/icons';

/* ── Category heuristics for Indian grocery items ─────────────────── */

interface Category { id: string; label: string; icon: (p: { size?: number }) => React.JSX.Element; keywords: RegExp }

const CATEGORIES: Category[] = [
  {
    id: 'produce', label: 'Fresh produce', icon: SaladIcon,
    keywords: /\b(onion|tomato|potato|aloo|palak|spinach|saag|carrot|gajar|gobi|cauliflower|cabbage|peas|matar|beans|capsicum|shimla|bhindi|okra|lauki|karela|methi|fenugreek(?! powder)|dhaniya(?! powder)|coriander leaves|pudina|mint|lemon|nimbu|ginger|adrak|garlic|lehsun|green chilli|green chili|hari mirch|fruit|apple|seb|banana|kela|orange|santra|mango|aam|papaya|papita|grapes|angoor|pomegranate|anar|sabzi|vegetable|cucumber|kheera|beetroot|radish|mooli|brinjal|baingan|pumpkin|kaddu|mushroom|coriander(?! powder)|cilantro)\b/i,
  },
  {
    id: 'dairy', label: 'Dairy & eggs', icon: DropletsIcon,
    keywords: /\b(milk|doodh|curd|dahi|yogurt|yoghurt|paneer|cheese|butter|makhan|ghee|egg|anda|cream|malai|buttermilk|chaas|lassi)\b/i,
  },
  {
    id: 'grains', label: 'Grains, dals & flours', icon: WheatIcon,
    keywords: /\b(rice|chawal|atta|wheat|gehu|oats|dal\b|lentil|chana|chickpea|rajma|kidney beans|besan|gram flour|suji|semolina|rava|poha|quinoa|bread|roti|flour|maida|barley|jau|millet|bajra|jowar|ragi|moong|masoor|urad|arhar|toor)\b/i,
  },
  {
    id: 'spices', label: 'Spices & masalas', icon: FlameIcon,
    keywords: /\b(haldi|turmeric|jeera|cumin|dhania powder|coriander powder|garam masala|salt|namak|pepper|kali mirch|mustard seeds|rai\b|ajwain|carom|hing|asafoetida|elaichi|cardamom|dalchini|cinnamon|laung|clove|masala|spice|red chilli|red chili|lal mirch)\b/i,
  },
];

function categorize(item: string): string {
  for (const c of CATEGORIES) if (c.keywords.test(item)) return c.id;
  return 'other';
}

/* ── Progress ring ────────────────────────────────────────────────── */

function ProgressRing({ pct }: { pct: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: 68, height: 68, flexShrink: 0 }}>
      <svg width={68} height={68} viewBox="0 0 68 68" style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="inv-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2fa866" />
            <stop offset="55%" stopColor="#f0a63c" />
            <stop offset="100%" stopColor="#6aa8e8" />
          </linearGradient>
        </defs>
        <circle cx={34} cy={34} r={r} fill="none" stroke="var(--color-surface2)" strokeWidth={7} />
        <circle
          cx={34} cy={34} r={r} fill="none"
          stroke="url(#inv-ring-grad)" strokeWidth={7} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.6s var(--ease-out)' }}
        />
      </svg>
      <span style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.78rem', fontWeight: 750, fontVariantNumeric: 'tabular-nums',
      }}>
        {Math.round(pct * 100)}%
      </span>
    </div>
  );
}

/* ── Inventory tab ────────────────────────────────────────────────── */

export function InventoryTab({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  const toggle = (item: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.toLowerCase().includes(q));
  }, [items, query]);

  const groups = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const item of filtered) {
      const cat = categorize(item);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }
    // Known categories first (in CATEGORIES order), then "other"
    const ordered: { id: string; label: string; icon: Category['icon']; items: string[] }[] = [];
    for (const c of CATEGORIES) {
      const list = map.get(c.id);
      if (list?.length) ordered.push({ id: c.id, label: c.label, icon: c.icon, items: list });
    }
    const other = map.get('other');
    if (other?.length) ordered.push({ id: 'other', label: 'Pantry & more', icon: CartIcon, items: other });
    return ordered;
  }, [filtered]);

  const stocked = checked.size;
  const total = items.length;
  const pct = total === 0 ? 0 : stocked / total;
  const allDone = total > 0 && stocked === total;

  return (
    <div className="fade-in-up">
      {/* Header */}
      <div className="glass-card" style={{ padding: '1.25rem 1.4rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{
            width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
            background: 'var(--color-accent-soft)', color: 'var(--color-accent)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {allDone ? <TrophyIcon size={22} /> : <CartIcon size={22} />}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.15rem' }}>
              {allDone ? 'All stocked!' : 'Weekly inventory'}
            </h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.84rem', margin: 0 }}>
              {allDone
                ? 'Your kitchen is ready for the week.'
                : `${stocked} of ${total} stocked — tick off what you already have`}
            </p>
          </div>
          <ProgressRing pct={pct} />
        </div>
        {/* Search + clear */}
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-faint)', display: 'inline-flex' }}>
              <SearchIcon size={15} />
            </span>
            <input
              className="input" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items…" aria-label="Search inventory items"
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>
          {stocked > 0 && (
            <button type="button" className="btn-ghost" onClick={() => setChecked(new Set())} style={{ padding: '0.55rem 0.9rem', fontSize: '0.8rem', flexShrink: 0 }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Groups */}
      {groups.length === 0 ? (
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.88rem' }}>
          No items match “{query}”.
        </div>
      ) : (
        groups.map((g) => {
          const Icon = g.icon;
          const doneInGroup = g.items.filter((i) => checked.has(i)).length;
          return (
            <section key={g.id} style={{ marginBottom: '1.1rem' }} aria-label={g.label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.55rem', padding: '0 0.2rem' }}>
                <span style={{ color: 'var(--color-accent)', display: 'inline-flex' }}><Icon size={16} /></span>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.02em', margin: 0 }}>{g.label}</h4>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-faint)', fontVariantNumeric: 'tabular-nums' }}>
                  {doneInGroup}/{g.items.length}
                </span>
                <span style={{ flex: 1, height: 1, background: 'var(--color-border)', opacity: 0.6 }} />
              </div>
              <div className="glass-card" style={{ padding: '0.35rem', overflow: 'hidden' }}>
                {g.items.map((item) => {
                  const isChecked = checked.has(item);
                  return (
                    <button
                      key={item} type="button" onClick={() => toggle(item)}
                      aria-pressed={isChecked}
                      style={{
                        all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.85rem',
                        padding: '0.7rem 0.85rem', borderRadius: '0.6rem',
                        background: isChecked ? 'var(--color-accent-soft)' : 'transparent',
                        transition: 'background 160ms ease',
                      }}
                    >
                      <span style={{
                        width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                        border: `1.5px solid ${isChecked ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
                        background: isChecked ? 'var(--color-accent)' : 'transparent',
                        color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        transform: isChecked ? 'scale(1)' : 'scale(0.92)',
                        transition: 'transform 160ms var(--ease-out), background 160ms ease, border-color 160ms ease',
                      }}>
                        {isChecked && <CheckIcon size={13} />}
                      </span>
                      <span style={{
                        fontSize: '0.88rem', flex: 1,
                        textDecoration: isChecked ? 'line-through' : 'none',
                        color: isChecked ? 'var(--color-faint)' : 'var(--color-text)',
                        transition: 'color 160ms ease',
                      }}>
                        {item}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
