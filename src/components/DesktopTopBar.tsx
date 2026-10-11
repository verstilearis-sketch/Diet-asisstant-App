'use client';

/* ── Desktop top bar ─────────────────────────────────────────────────────
   Apple-glass top navigation for computers/laptops only. Replaces the
   sidebar on desktop: logo, all nav pills, plan actions, date and
   account actions — everything, one bar, no hunting through a sidebar.
------------------------------------------------------------------------ */

import { ZaiqIcon } from '@/components/icons';
import type { DashNavItem, DashAction } from './DashboardShell';

export function DesktopTopBar({
  workspaceTitle,
  workspaceSubtitle,
  nav,
  activeId,
  onNavigate,
  planActions,
  bottomActions,
}: {
  workspaceTitle: string;
  workspaceSubtitle: string;
  nav: DashNavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  planActions: DashAction[];
  bottomActions: DashAction[];
}) {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <header className="desk-topbar" role="banner">
      <button
        type="button"
        className="desk-brand"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        title="Back to top"
      >
        <span className="brand-mark" style={{ width: 36, height: 36, borderRadius: 11 }}>
          <ZaiqIcon size={20} />
        </span>
        <span className="desk-brand-text">
          <strong>{workspaceTitle}</strong>
          <small>{workspaceSubtitle}</small>
        </span>
      </button>

      <nav className="desk-nav" aria-label="Dashboard navigation">
        {nav.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`desk-nav-pill ${activeId === item.id ? 'desk-nav-pill-active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <item.icon size={15} />
            <span>{item.label}</span>
            {item.badge != null && <span className="desk-nav-badge">{item.badge}</span>}
          </button>
        ))}
        {planActions.map((a) => (
          <button key={a.label} type="button" className="desk-nav-pill desk-nav-pill-action" onClick={a.onClick}>
            <a.icon size={15} />
            <span>{a.label}</span>
          </button>
        ))}
      </nav>

      <div className="desk-right">
        <span className="desk-date">{today}</span>
        {bottomActions.map((a) => (
          <button
            key={a.label}
            type="button"
            className={`desk-icon-btn ${a.danger ? 'desk-icon-btn-danger' : ''}`}
            onClick={a.onClick}
            title={a.label}
            aria-label={a.label}
          >
            <a.icon size={16} />
          </button>
        ))}
      </div>
    </header>
  );
}
