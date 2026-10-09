import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ZaiqIcon } from '@/components/icons';
import { ARTICLES, getArticle, type ArticleBlock } from '@/data/articles';

export async function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: `${article.title} — Zaiq`,
    description: article.description,
    keywords: article.keywords,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      type: 'article',
      publishedTime: article.date,
    },
  };
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case 'h2':
      return <h2 style={{ fontSize: '1.45rem', marginTop: '2.25rem', marginBottom: '0.9rem', lineHeight: 1.3 }}>{block.text}</h2>;
    case 'h3':
      return <h3 style={{ fontSize: '1.15rem', marginTop: '1.75rem', marginBottom: '0.7rem' }}>{block.text}</h3>;
    case 'formula':
      return (
        <pre style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '0.75rem', padding: '1.25rem', overflowX: 'auto',
          fontSize: '0.95rem', lineHeight: 1.7, margin: '1.25rem 0', whiteSpace: 'pre-wrap',
        }}>
          {block.text}
        </pre>
      );
    case 'ul':
      return (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingLeft: '1.25rem', margin: '1rem 0', lineHeight: 1.7 }}>
          {block.items?.map((item, i) => <li key={i} style={{ color: 'var(--color-text)' }}>{item}</li>)}
        </ul>
      );
    case 'callout':
      return (
        <div style={{
          background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
          borderRadius: '0.75rem', padding: '1.25rem', margin: '1.5rem 0',
          fontSize: '0.95rem', lineHeight: 1.7,
        }}>
          {block.text}
        </div>
      );
    default:
      return <p style={{ margin: '1rem 0', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{block.text}</p>;
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const related = ARTICLES.filter((a) => a.slug !== slug).slice(0, 2);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    author: { '@type': 'Person', name: 'Salik Lone' },
  };

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="site-nav">
        <div className="site-nav-inner">
          <Link href="/" className="brand">
            <span className="brand-mark"><ZaiqIcon size={29} /></span>
            Zaiq
          </Link>
          <div className="nav-links">
            <Link href="/blog" className="nav-link">Blog</Link>
            <Link href="/auth?mode=signup" className="btn-primary" style={{ padding: '0.55rem 1.2rem' }}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <main className="container" style={{ maxWidth: 700, paddingTop: '3rem', paddingBottom: '3rem' }}>
        <Link href="/blog" className="nav-link" style={{ fontSize: '0.88rem', display: 'inline-block', marginBottom: '1.5rem' }}>
          ← All articles
        </Link>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', lineHeight: 1.2, marginBottom: '0.75rem' }}>
          {article.title}
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.88rem', marginBottom: '2rem' }}>
          By Salik Lone · {article.readMinutes} min read
        </p>

        <article style={{ fontSize: '1.02rem', color: 'var(--color-text)' }}>
          {article.blocks.map((b, i) => <Block key={i} block={b} />)}
        </article>

        <div style={{
          marginTop: '3rem', padding: '2rem', borderRadius: '1rem',
          background: 'var(--color-surface)', border: '1px solid var(--color-border)', textAlign: 'center',
        }}>
          <p style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>
            Get a plan built on your body&apos;s math — free.
          </p>
          <Link href="/auth?mode=signup" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '0.75rem 2rem' }}>
            Get started
          </Link>
        </div>

        {related.length > 0 && (
          <div style={{ marginTop: '3rem' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1.25rem' }}>Keep reading</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {related.map((r) => (
                <Link key={r.slug} href={`/blog/${r.slug}`} style={{
                  display: 'block', padding: '1.25rem', borderRadius: '0.75rem',
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)', textDecoration: 'none',
                }}>
                  <span style={{ fontSize: '1.05rem', color: 'var(--color-text)', fontWeight: 600 }}>{r.title}</span>
                  <span style={{ display: 'block', color: 'var(--color-muted)', fontSize: '0.88rem', marginTop: '0.4rem' }}>
                    {r.readMinutes} min read
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <Link href="/" className="brand" style={{ fontSize: '1.1rem' }}>
            <span className="brand-mark" style={{ width: 36, height: 36 }}><ZaiqIcon size={20} /></span>
            Zaiq
          </Link>
          <nav style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }} aria-label="Footer">
            <Link href="/privacy" className="nav-link" style={{ fontSize: '0.85rem' }}>Privacy Policy</Link>
          </nav>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', maxWidth: 480 }}>
            For informational purposes only — not medical advice. © 2026 Zaiq.
          </p>
        </div>
      </footer>
    </div>
  );
}
