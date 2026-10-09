import { ArrowRight, Building2, CheckCircle2, Factory, Globe2, Layers, Recycle, Target } from 'lucide-react';
import { CaseStudyViewer } from '@/components/case-study-viewer';
import { Button } from '@/components/ui/button';
import { ReworldHeader } from '@/components/reworld-header';
import { IndustryFooter } from '@/components/industry-footer';
import { aboutPages, type AboutLink, type AboutPageData, type AboutRow } from '@/lib/about-data';
import { mediaPosts } from '@/lib/media-data';
import './about-page.css';

const statIcons = { recycle: Recycle, layers: Layers, factory: Factory, target: Target, globe: Globe2, building: Building2 };

function AboutButton({ link, variant = 'brandOutline' }: { link: AboutLink; variant?: 'brandOutline' | 'brand' }) {
  return <Button variant={variant} asChild><a href={link.href}>{link.label}<ArrowRight/></a></Button>;
}

function Row({ row, flip }: { row: AboutRow; flip: boolean }) {
  return <section className={flip ? 'about-row about-row--flip' : 'about-row'}><div className="site-container about-row-grid">
    <div className="about-row-copy">
      <h2>{row.title}</h2><p>{row.text}</p>
      {row.bullets && <ul>{row.bullets.map(bullet => <li key={bullet}><CheckCircle2 size={20}/>{bullet}</li>)}</ul>}
      {row.cta && <AboutButton link={row.cta}/>}
    </div>
    <img src={row.image} alt={row.title} loading="lazy"/>
  </div></section>;
}

export function AboutPage({ page }: { page: AboutPageData }) {
  return <><ReworldHeader/><main className="about-page">
    <section className="about-hero"><div className="site-container about-hero-grid">
      <div><p className="eyebrow">{page.eyebrow}</p><h1>{page.title}</h1></div>
      <img src={page.heroImage} alt={page.title}/>
    </div></section>

    <section className="about-intro"><div className="site-container"><div className="about-intro-box">
      <p>{page.intro.text}</p><AboutButton link={page.intro.cta}/>
    </div></div></section>

    {page.rows.slice(0, 1).map(row => <Row key={row.title} row={row} flip={false}/>)}

    {page.stats && <section className="about-stats-section"><div className="site-container"><div className="about-stats">{page.stats.map(stat => { const Icon = statIcons[stat.icon]; return <div key={stat.label}>
      <Icon size={48} strokeWidth={1.25}/><h3>{stat.value}</h3><p>{stat.label}</p>
    </div>; })}</div></div></section>}

    {page.rows.slice(1).map((row, index) => <Row key={row.title} row={row} flip={index % 2 === 0}/>)}

    {page.cards && <section className="about-cards-section"><div className="site-container"><div className="about-cards">{page.cards.map(card => <article key={card.title}>
      <img src={card.image} alt={card.title} loading="lazy"/><h2>{card.title}</h2><p>{card.text}</p><AboutButton link={card.cta}/>
    </article>)}</div></div></section>}

    {page.moreRows?.map((row, index) => <Row key={row.title} row={row} flip={index % 2 === 0}/>)}

    <section className="about-banner-section"><div className="site-container"><div className="about-banner">
      <div><h2>{page.banner.title}</h2><p>{page.banner.text}</p></div>
      <Button variant="brand" className="about-banner-button" asChild><a href={page.banner.cta.href}>{page.banner.cta.label}<ArrowRight/></a></Button>
    </div></div></section>

    <section className="about-more"><div className="site-container">
      <h2>More from Better Materials</h2>
      <div className="about-more-grid">{mediaPosts.slice(0, 3).map(post => <CaseStudyViewer key={post.slug} post={post}>{open => <a href={post.href ?? '/#case-studies'} onClick={open} className="about-more-card">
        <span className="about-more-tag">{post.category}</span><h3>{post.title}</h3><p>{post.date}</p>
      </a>}</CaseStudyViewer>)}</div>
    </div></section>

    <nav className="site-container about-related" aria-label="About pages">
      <a href="/about-us" aria-current={page.slug === '' ? 'page' : undefined}>About Us</a>
      {aboutPages.map(item => <a key={item.slug} href={`/about-us/${item.slug}`} aria-current={item.slug === page.slug ? 'page' : undefined}>{item.name}</a>)}
    </nav>
  </main><IndustryFooter/></>;
}
