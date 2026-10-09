import { Link } from '@tanstack/react-router';
import { ArrowRight, CheckCircle2, ChevronDown, FlaskConical, Factory, Recycle, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReworldHeader } from '@/components/reworld-header';
import { IndustryFooter } from '@/components/industry-footer';
import { AiHighlight } from '@/components/ai-highlight';
import { industryPages, type IndustryPageData } from '@/lib/industry-data';
import './industry-page.css';

const icons = [FlaskConical, Factory, Recycle, ClipboardCheck];

export function IndustryPage({ page }: { page: IndustryPageData }) {
  return <><ReworldHeader industryPage/><main className="industry-page">
    <section className="industry-hero"><div className="site-container industry-hero-grid">
      <div><p className="eyebrow">{page.name} Material Intelligence</p><h1>{page.title}</h1><p>{page.hero}</p>
        <div className="industry-hero-actions"><Button variant="brand" asChild><Link to="/" hash="contact">Explore {page.name} Material Development<ArrowRight/></Link></Button></div>
      </div><img src={page.image} alt={`${page.name}: construction materials and manufacturing`} width={800} height={800}/>
    </div></section>
    <section className="industry-band"><div className="site-container"><div className="industry-intro"><h2>Start with your material needs</h2><p>{page.intro}</p></div>
      <div className="industry-material-grid">{page.cards.map(card => <article className="industry-material-card" key={card.title}><h3>{card.title}</h3><p>{card.text}</p><Link className="text-link" to="/" hash="platform">Explore R&D<ArrowRight size={16}/></Link></article>)}</div>
    </div></section>
    <AiHighlight title={`AI-Guided ${page.name} Development`} text={`Our models are being trained to connect ${page.feedstocks} with ${page.targets}, so ${page.products} teams can test the most promising options first.`}/>
    <section className="industry-band industry-paths"><div className="site-container"><div className="industry-intro centered"><h2>Explore promising pathways before material reaches production</h2><p>{page.paths}</p></div>
      <div className="industry-path-grid">{page.pathways.map((path, index) => { const Icon = icons[index % icons.length] ?? FlaskConical; return <article className="industry-path-card" key={path.title}><Icon size={48} strokeWidth={1.25}/><h3>{path.title}</h3><p>{path.text}</p><Link className="text-link" to="/" hash={`platform-${['feedstocks','formulations','processing','validation','optimization','optimization'][index]}`}>Explore solutions<ArrowRight size={16}/></Link></article>; })}</div>
    </div></section>
    <section className="industry-band industry-requirements"><div className="site-container"><div className="industry-intro centered"><h2>Consider constraints before material trials</h2><p>{page.requirements}</p></div><div className="industry-requirements-grid">{page.requirementsCards.map((card,index) => { const Icon = icons[index] ?? ClipboardCheck; return <div key={card.title}><Icon size={50} strokeWidth={1.25}/><h3>{card.title}</h3><p>{card.text}</p></div>; })}</div></div></section>
    <section className="industry-band industry-recovery"><div className="site-container industry-recovery-grid"><div><h2>Explore value beyond conventional material inputs</h2><p>{page.recovery}</p><ul>{['Feedstock reuse','Binder design','Mix testing','Performance analysis'].map(item => <li key={item}><CheckCircle2 size={22}/>{item}</li>)}</ul><Button variant="brand" asChild><Link to="/" hash="contact">Explore R&D<ArrowRight/></Link></Button></div><img src={page.detailImage} alt={`Modern engineering and validation for ${page.name.toLowerCase()}`} width={800} height={800} loading="lazy"/></div></section>
    <section className="industry-band industry-faq"><div className="site-container"><div className="industry-faq-inner"><div className="industry-intro centered"><h2>{page.name} Development FAQs</h2><p>{page.faq}</p></div>{page.faqs.map(faq => <details key={faq.question}><summary>{faq.question}<ChevronDown size={20}/></summary><p>{faq.answer}</p></details>)}</div></div></section>
    <section className="industry-cta"><div className="site-container"><div><h2>Ready to explore better material pathways?</h2><p>{page.cta}</p></div><Button variant="brand" asChild><Link to="/" hash="contact">Explore Our Platform<ArrowRight/></Link></Button></div></section>
    <nav className="site-container industry-related" aria-label="Industry pages">{industryPages.map(industry => <Link key={industry.slug} to="/who-we-help/$industry" params={{ industry: industry.slug }} activeOptions={{ exact: true }}>{industry.name}</Link>)}</nav>
  </main><IndustryFooter/></>;
}