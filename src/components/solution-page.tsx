import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Building2, CheckCircle2, ChevronDown, ClipboardCheck, FlaskConical, Recycle, Truck, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReworldHeader } from '@/components/reworld-header';
import { IndustryFooter } from '@/components/industry-footer';
import { AiHighlight } from '@/components/ai-highlight';
import { ConstructionVideo } from '@/components/construction-video';
import { type SolutionCapability, type SolutionPageData, type SolutionStep } from '@/lib/solution-pages-data';
import './industry-page.css';
import './solution-page.css';

const cardIcons = [FlaskConical, Recycle, ClipboardCheck];
// Repeating icon pattern for the wide impact tiles (first and last), as in the reference grid.
const tilePatterns: (LucideIcon | undefined)[] = [Truck, undefined, undefined, Building2];

// Text rows scroll past a sticky image column; the row crossing the viewport's centre line picks the visible image.
function SolutionSteps({ steps }: { steps: SolutionStep[] }) {
  const [active, setActive] = useState(0);
  const rows = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset['index'])); });
    }, { rootMargin: '-50% 0px -50% 0px' });
    rows.current.forEach(row => { if (row) observer.observe(row); });
    return () => observer.disconnect();
  }, [steps]);
  return <section className="solution-sticky"><div className="site-container solution-sticky-grid">
    <div>{steps.map((step, index) => <div className="solution-sticky-row" key={step.title} data-index={index} ref={element => { rows.current[index] = element; }}>
      <img className="solution-sticky-row-image" src={step.image} alt={step.title} loading="lazy"/>
      <div className="solution-step">
        <p className="eyebrow">{step.eyebrow}</p><h2>{step.title}</h2><p>{step.text}</p>
        <ul>{step.bullets.map(bullet => <li key={bullet}><CheckCircle2 size={22}/>{bullet}</li>)}</ul>
        <Button variant="brandOutline" asChild><Link to="/" hash="contact">{step.cta}<ArrowRight/></Link></Button>
      </div>
    </div>)}</div>
    <div className="solution-sticky-media" aria-hidden="true">{steps.map((step, index) => <div key={step.title} className={index === active ? 'solution-sticky-image is-active' : 'solution-sticky-image'}><img src={step.image} alt="" loading="lazy"/></div>)}</div>
  </div></section>;
}

// The other platform capabilities, one compact section each, alternating sides.
function SolutionCapabilities({ items }: { items: SolutionCapability[] }) {
  return <div className="solution-capabilities">
    <section className="solution-capabilities-head"><div className="site-container">
      <div className="solution-centered"><h2>One Platform, Every Stage of Development</h2><p>From the first mix to the final trade-off, the same intelligence follows your feedstocks through formulation, processing, validation and optimization.</p></div>
      <nav className="solution-capabilities-nav" aria-label="Platform capabilities">{items.map(item => <a key={item.id} href={`#${item.id}`}>{item.eyebrow.charAt(0) + item.eyebrow.slice(1).toLowerCase()}</a>)}</nav>
    </div></section>
    {items.map((item, index) => <section key={item.id} id={item.id} className={`solution-capability${index % 2 ? ' is-reversed' : ''}`}><div className="site-container solution-capability-grid">
      <img src={item.image} alt={item.title} loading="lazy"/>
      <div className="solution-step">
        <p className="eyebrow">{item.eyebrow}</p><h2>{item.title}</h2><p>{item.text}</p>
        <ul>{item.bullets.map(bullet => <li key={bullet}><CheckCircle2 size={22}/>{bullet}</li>)}</ul>
      </div>
    </div></section>)}
  </div>;
}

export function SolutionPage({ page }: { page: SolutionPageData }) {
  return <><ReworldHeader/><main className="industry-page solution-page">
    <section className="solution-hero"><div className="site-container">
      <p className="solution-hero-label">{page.subtitle}</p>
      <h1>{page.title}</h1>
      <div className="solution-hero-row"><p>{page.intro}</p><Button variant="brand" asChild><Link to="/" hash="contact">Get Started<ArrowRight/></Link></Button></div>
      <div className="solution-hero-image"><img src={page.image} alt={page.title}/></div>
    </div></section>

    <section className="solution-overview"><div className="site-container">
      <div className="solution-centered"><h2>{page.overview.title}</h2><p>{page.overview.text}</p></div>
      <div className="solution-card-grid">{page.overview.cards.map((card, index) => { const Icon = cardIcons[index] ?? FlaskConical; return <article className="solution-card" key={card.title}>
        <span className="solution-card-icon"><Icon size={40} strokeWidth={1.25}/></span>
        <h3>{card.title}</h3>
        <p className="solution-card-stat">{card.stat}</p>
        <p className="solution-card-label">{card.statLabel}</p>
        <hr/>
        <p className="solution-card-check"><CheckCircle2 size={18}/>{card.text}</p>
      </article>; })}</div>
      <div className="solution-centered-cta"><Button variant="brand" asChild><Link to="/" hash="contact">Get Started<ArrowRight/></Link></Button></div>
    </div></section>

    <section className="solution-execution"><div className="site-container">
      <div className="solution-centered solution-centered--light"><h2>{page.execution.title}</h2><p>{page.execution.text}</p></div>
      <div className="solution-execution-grid">
        <img src={page.execution.image} alt={page.execution.title} loading="lazy"/>
        <div className="solution-execution-side">
          <div className="solution-panel solution-panel--brand"><h3>{page.execution.managesTitle}</h3><ul>{page.execution.manages.map(item => <li key={item}>{item}</li>)}</ul></div>
          <div className="solution-panel solution-panel--light"><h3>{page.execution.focusTitle}</h3><ul>{page.execution.focus.map(item => <li key={item}>{item}</li>)}</ul></div>
        </div>
      </div>
    </div></section>

    <SolutionSteps steps={page.steps}/>

    {page.capabilities && <SolutionCapabilities items={page.capabilities}/>}

    <AiHighlight title={page.ai.title} text={page.ai.text}/>

    <section className="solution-band"><div className="site-container solution-band-inner">
      <p className="eyebrow solution-band-eyebrow">{page.band.eyebrow}</p>
      <div className="solution-band-card">{page.band.video
        ? <div className="solution-band-video"><ConstructionVideo {...page.band.video}/></div>
        : <img src={page.band.image} alt={page.title} loading="lazy"/>}</div>
      <p className="solution-band-line">{page.band.line}</p>
      <Button variant="brand" asChild><Link to="/" hash="contact">{page.band.cta}</Link></Button>
    </div></section>

    <section className="solution-bento"><div className="site-container">
      <h2>{page.bento.title}</h2>
      <p>{page.bento.text}</p>
      <div className="solution-bento-grid">
        <div className="solution-bento-feature">
          {page.bento.video
            ? <ConstructionVideo src={page.bento.video.src} webm={page.bento.video.webm} poster={page.bento.image} label={page.bento.feature}/>
            : <img src={page.bento.image} alt={page.bento.feature} loading="lazy"/>}
          <div className="solution-bento-feature-copy"><h3>{page.bento.feature}</h3><Button variant="inverseOutline" asChild><Link to="/" hash="about">Our Mission</Link></Button></div>
        </div>
        {page.bento.tiles.map((tile, index) => { const Pattern = tilePatterns[index]; return <article className={`solution-tile solution-tile--${index}`} key={tile.label}>
          <h3>{tile.value}</h3><h4>{tile.label}</h4><p>{tile.text}</p>
          {Pattern && <div className="solution-tile-pattern" aria-hidden="true">{Array.from({ length: 72 }, (_, i) => <Pattern key={i} size={26} strokeWidth={1.25}/>)}</div>}
        </article>; })}
      </div>
    </div></section>

    <section className="industry-band industry-faq"><div className="site-container"><div className="industry-faq-inner"><div className="industry-intro centered"><h2>{page.subtitle} FAQs</h2><p>Clear answers to the top questions customers ask before getting started.</p></div>{page.faqs.map(faq => <details key={faq.question}><summary>{faq.question}<ChevronDown size={20}/></summary><p>{faq.answer}</p></details>)}</div></div></section>
    <section className="industry-cta"><div className="site-container"><div><h2>{page.closing.title}</h2><p>{page.closing.text}</p></div><Button variant="brand" asChild><Link to="/" hash="contact">{page.closing.cta}</Link></Button></div></section>
  </main><IndustryFooter/></>;
}
