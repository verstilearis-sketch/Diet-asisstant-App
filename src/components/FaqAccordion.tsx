'use client';

import { ChevronDownIcon } from '@/components/icons';

export function FaqAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      {faqs.map((f, i) => (
        <details key={f.q} className="faq-item math-fade" style={{ animationDelay: `${i * 60}ms` }}>
          <summary>
            {f.q}
            <ChevronDownIcon size={17} className="faq-chevron" />
          </summary>
          <div className="faq-body">{f.a}</div>
        </details>
      ))}
    </div>
  );
}
