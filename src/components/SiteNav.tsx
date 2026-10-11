"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ZaiqIcon, HomeIcon, InfoIcon, BlogIcon, ShieldIcon } from '@/components/icons';
import { useIsMobile } from '@/hooks/use-is-mobile';

export interface NavLink {
  href: string;
  label: string;
}

const DEFAULT_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/privacy', label: 'Privacy Policy' },
];

/** Icon for each nav destination — shown as small tabs on phones. */
const LINK_ICONS: Record<string, (p: { size?: number }) => React.ReactNode> = {
  '/': HomeIcon,
  '/about': InfoIcon,
  '/blog': BlogIcon,
  '/privacy': ShieldIcon,
};

/**
 * Site header — full-width bar: brand + links on the left,
 * Sign in + Get Started on the right; hamburger drawer on phones.
 */
export function SiteNav({ links = DEFAULT_LINKS }: { links?: NavLink[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  // Warm the signup chunk on finger-down so the tap feels instant on phones.
  const warmAuth = () => router.prefetch('/auth?mode=signup');

  // Tapping the logo scrolls to top (replaces the old back-to-top button)
  const onLogoClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav className="site-nav">
      <div className="site-nav-inner">
        <div className="nav-left">
          <Link href="/" className="brand" onClick={onLogoClick} aria-label="Zaiq home">
            <span className="brand-mark"><ZaiqIcon size={26} /></span>
            Zaiq
          </Link>
          {!isMobile && (
            <div className="nav-links">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="nav-link">{l.label}</Link>
              ))}
            </div>
          )}
        </div>
        {isMobile ? (
          <div className="nav-icon-tabs" role="tablist" aria-label="Site sections">
            {links.map((l) => {
              const Icon = LINK_ICONS[l.href];
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  role="tab"
                  aria-selected={active}
                  aria-label={l.label}
                  title={l.label}
                  className={`nav-icon-tab ${active ? 'nav-icon-tab-active' : ''}`}
                >
                  {Icon ? <Icon size={19} /> : null}
                </Link>
              );
            })}
            <Link href="/auth?mode=signup" prefetch={true} onPointerDown={warmAuth}
              className="nav-cta-solid nav-cta-compact" aria-label="Get started">
              Get Started
            </Link>
          </div>
        ) : (
          <div className="nav-right">
            <Link href="/auth?mode=signin" className="btn-ghost nav-signin">Sign in</Link>
            <Link href="/auth?mode=signup" prefetch={true} onPointerDown={warmAuth} className="nav-cta-solid">
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
