'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { ArrowRightIcon } from '@/components/icons';

/**
 * Sticky bottom CTA — phones only, landing page only.
 * Appears after scrolling past the hero, so Get Started is always
 * one tap away. Hides again near the page's final CTA to avoid doubling.
 */
export function StickyMobileCTA() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const nearBottom =
        window.innerHeight + y > document.documentElement.scrollHeight - 600;
      setVisible(y > 650 && !nearBottom);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!isMobile) return null;

  return (
    <div
      aria-hidden={!visible}
      style={{
        position: 'fixed',
        left: 0, right: 0, bottom: 0,
        zIndex: 60,
        padding: '0.7rem 1rem calc(0.7rem + env(safe-area-inset-bottom))',
        background: 'color-mix(in srgb, var(--color-bg) 82%, transparent)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderTop: '1px solid var(--color-border)',
        transform: visible ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <Link
        href="/auth?mode=signup"
        prefetch={true}
        onPointerDown={() => router.prefetch('/auth?mode=signup')}
        className="btn-primary"
        tabIndex={visible ? 0 : -1}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          width: '100%', padding: '0.85rem', fontSize: '0.95rem', textDecoration: 'none',
        }}
      >
        Get started — it&apos;s free <ArrowRightIcon size={16} />
      </Link>
    </div>
  );
}
