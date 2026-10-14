import { ArrowRight, Building2, Factory, Globe2, Recycle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConstructionVideo } from '@/components/construction-video';
import { ReworldHeader } from '@/components/reworld-header';
import { IndustryFooter } from '@/components/industry-footer';
import type { AboutCard, AboutPageData } from '@/lib/about-data';
import './about-page.css';

const statIcons = { recycle: Recycle, globe: Globe2, building: Building2, factory: Factory };

function Card({ card }: { card: AboutCard }) {
  const Icon = card.icon && statIcons[card.icon];
  return <article className="about-card">
    {card.image ? <img src={card.image} alt={card.title} loading="lazy"/> : Icon && <div className="about-card-icon"><Icon size={72} strokeWidth={1.25}/></div>}
    <h3>{card.title}</h3><p className="about-card-subtitle">{card.subtitle}</p><p>{card.text}</p>
  </article>;
}

export function AboutPage({ page }: { page: AboutPageData }) {
  return <><ReworldHeader/><main className="about-page">
    <section className="about-hero">
      <img src={page.hero.image} alt=""/>
      <div className="site-container about-hero-grid">
        <div>
          <h1>{page.hero.title} <span>{page.hero.titleHighlight}</span>?</h1>
          <p>{page.hero.text} <span>{page.hero.highlight}</span></p>
        </div>
        <div className="about-hero-video"><ConstructionVideo {...page.hero.video}/></div>
      </div>
      <div className="about-label"><div className="site-container">{page.label}</div></div>
    </section>

    <section className="about-mission" id={page.mission.id}>
      <div className="about-mission-title"><h2>{page.mission.title}</h2></div>
      <div className="about-mission-body">
        <p>{page.mission.text}</p>
        <p className="about-mission-how"><span>How?</span> {page.mission.how}</p>
      </div>
    </section>

    {page.sections.map(section => <section key={section.id} id={section.id} className="about-cards-section"><div className="site-container">
      <h2>{section.title}</h2>
      <div className="about-cards" data-count={section.cards.length}>{section.cards.map(card => <Card key={card.title} card={card}/>)}</div>
    </div></section>)}

    <section className="about-closing"><div className="site-container about-closing-grid">
      <div><h2>{page.closing.title}</h2><p>{page.closing.text}</p></div>
      <Button variant="brand" asChild><a href={page.closing.cta.href}>{page.closing.cta.label}<ArrowRight/></a></Button>
    </div></section>
  </main><IndustryFooter/></>;
}
