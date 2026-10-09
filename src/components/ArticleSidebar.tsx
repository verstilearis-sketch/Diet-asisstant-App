"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarNav,
  SidebarSection,
  SidebarItem,
} from "@/components/ui/sidebar";
import type { Article } from "@/data/articles";
import { slugify } from "@/lib/slugify";

interface ArticleSidebarProps {
  article: Article;
  articles: Article[];
}

/**
 * Sticky sidebar for blog article pages: full article index + "On this
 * page" table of contents generated from the article's h2 blocks.
 * The active TOC entry follows the reader via IntersectionObserver.
 * Hidden on small screens (CSS) — mobile keeps the single-column layout.
 */
export function ArticleSidebar({ article, articles }: ArticleSidebarProps) {
  const headings = article.blocks
    .filter((b) => b.type === "h2" && b.text)
    .map((b) => ({ id: slugify(b.text!), text: b.text! }));

  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-15% 0px -75% 0px", threshold: 0 },
    );
    const els: Element[] = [];
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) {
        observer.observe(el);
        els.push(el);
      }
    }
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article.slug]);

  return (
    <aside className="article-sidebar" aria-label="Article sidebar">
      <Sidebar
        variant="default"
        width={248}
        aria-label="Blog navigation"
        className="article-sidebar-inner"
      >
        <SidebarNav>
          <SidebarSection label="Articles">
            {articles.map((a) => (
              <SidebarItem
                key={a.slug}
                href={`/blog/${a.slug}`}
                active={a.slug === article.slug}
              >
                {a.title}
              </SidebarItem>
            ))}
          </SidebarSection>
          {headings.length > 0 && (
            <SidebarSection label="On this page">
              {headings.map((h) => (
                <SidebarItem
                  key={h.id}
                  href={`#${h.id}`}
                  active={activeId === h.id}
                >
                  {h.text}
                </SidebarItem>
              ))}
            </SidebarSection>
          )}
        </SidebarNav>
      </Sidebar>
    </aside>
  );
}
