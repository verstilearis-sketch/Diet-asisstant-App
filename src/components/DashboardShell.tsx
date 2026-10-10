"use client";

import { useEffect, useState } from 'react';
import { ZaiqIcon } from '@/components/icons';

export interface DashNavItem {
  id: string;
  label: string;
  icon: (props: { size?: number }) => React.ReactNode;
  badge?: string | number;
}

export interface DashAction {
  label: string;
  icon: (props: { size?: number }) => React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface DashboardShellProps {
  workspaceTitle: string;
  workspaceSubtitle: string;
  nav: DashNavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  planActions: DashAction[];
  bottomActions: DashAction[];
  breadcrumb: string;
  children: React.ReactNode;
}

/**
 * Dashboard shell — fixed left sidebar (workspace header, nav, grouped
 * actions, bottom actions) + top breadcrumb bar + content area.
 * On phones the sidebar becomes a slide-in drawer.
 */
export function DashboardShell({
  workspaceTitle,
  workspaceSubtitle,
  nav,
  activeId,
  onNavigate,
  planActions,
  bottomActions,
  breadcrumb,
  children,
}: DashboardShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [drawerOpen]);

  const go = (id: string) => {
    onNavigate(id);
    setDrawerOpen(false);
  };

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="dash-shell">
      <div
        className={`dash-scrim ${drawerOpen ? 'dash-scrim-open' : ''}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside className={`dash-sidebar ${drawerOpen ? 'dash-sidebar-open' : ''}`} aria-label="Dashboard navigation">
        <button
          type="button"
          className="dash-ws"
          onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setDrawerOpen(false); }}
          aria-label="Back to top"
          title="Back to top"
        >
          <span className="brand-mark" style={{ width: 40, height: 40, borderRadius: 12 }}>
            <ZaiqIcon size={22} />
          </span>
          <span className="dash-ws-text">
            <strong>{workspaceTitle}</strong>
            <small>{workspaceSubtitle}</small>
          </span>
        </button>

        <nav className="dash-nav">
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`dash-nav-item ${activeId === item.id ? 'dash-nav-item-active' : ''}`}
              onClick={() => go(item.id)}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
              {item.badge != null && <span className="dash-nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        {planActions.length > 0 && (
          <>
            <p className="dash-group-label">Plan</p>
            <nav className="dash-nav">
              {planActions.map((a) => (
                <button key={a.label} type="button" className="dash-nav-item" onClick={() => { a.onClick(); setDrawerOpen(false); }}>
                  <a.icon size={17} />
                  <span>{a.label}</span>
                </button>
              ))}
            </nav>
          </>
        )}

        <div className="dash-sidebar-foot">
          {bottomActions.map((a) => (
            <button
              key={a.label}
              type="button"
              className={`dash-nav-item ${a.danger ? 'dash-nav-item-danger' : ''}`}
              onClick={() => { a.onClick(); setDrawerOpen(false); }}
            >
              <a.icon size={17} />
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <button
            type="button"
            className="dash-hamburger"
            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <line x1="3" y1="6" x2="17" y2="6" />
              <line x1="3" y1="10" x2="17" y2="10" />
              <line x1="3" y1="14" x2="17" y2="14" />
            </svg>
          </button>
          <span className="dash-crumb">
            <strong>Zaiq</strong>
            <span className="dash-crumb-sep">/</span>
            <span>{breadcrumb}</span>
          </span>
          <span className="dash-date">{today}</span>
        </header>
        <main className="dash-content">{children}</main>
      </div>
    </div>
  );
}
