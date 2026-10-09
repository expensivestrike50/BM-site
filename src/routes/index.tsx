import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Check, Handshake, Play, Recycle, HardHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReworldHeader } from '@/components/reworld-header';
import { solutions, industries, navigation, originalUrl } from '@/lib/reworld-data';
import { mediaPosts } from '@/lib/media-data';
import { CaseStudyViewer } from '@/components/case-study-viewer';
import introductionPoster from '@/assets/better-materials-introduction.jpg.asset.json';
import impact from '@/assets/modern-construction-hq.jpg.asset.json';
import intelligencePoster from '@/assets/intelligent-construction-hq.jpg.asset.json';
import footerLogo from '@/assets/better-materials-logo-white.png';
import introductionVideo from '@/assets/better-materials-introduction.mp4.asset.json';
import modernVideo from '@/assets/modern-construction-hq.mp4.asset.json';
import introductionWebm from '@/assets/better-materials-introduction.webm.asset.json';
import modernWebm from '@/assets/modern-construction-hq.webm.asset.json';
import intelligenceVideo from '@/assets/intelligent-construction-hq.mp4.asset.json';
import intelligenceWebm from '@/assets/intelligent-construction-hq.webm.asset.json';
import { ConstructionVideo } from '@/components/construction-video';
import { heroConstructionScenes } from '@/lib/construction-scenes';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Computational R&D for Construction Materials | Better Materials' },
    { name: 'description', content: 'Better Materials helps manufacturers turn waste streams into high-performance construction materials through computational formulation, process recommendations, and targeted experiments.' },
    { property: 'og:title', content: 'Computational R&D for Construction Materials | Better Materials' },
    { property: 'og:description', content: 'Turn waste into better materials with computational R&D intelligence for formulations, manufacturing conditions, cost, carbon, and performance.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});

function QuoteLink({label = 'Explore Our Platform', inverse = false}: {label?: string; inverse?: boolean}) {
  return <Button variant={inverse ? 'inverseOutline' : 'brandOutline'} asChild><a href={originalUrl('#platform')}>{label}</a></Button>;
}

function Index() {
  const [tab, setTab] = useState(0);
  useEffect(() => {
    const syncTab = () => {
      const index = solutions.findIndex(solution => window.location.hash === '#platform-' + solution.name.toLowerCase());
      if (index >= 0) setTab(index);
    };
    syncTab();
    window.addEventListener('hashchange', syncTab);
    return () => window.removeEventListener('hashchange', syncTab);
  }, []);
  const selected = solutions[tab] ?? solutions[0];
  if (!selected) return null;
  return <><ReworldHeader/><main>
    <section className="homepage-intro"><div className="site-container hero-grid">
      <div className="hero-copy"><p className="eyebrow">Computational Materials Intelligence</p><h1><span>Better materials.</span><span>Smarter material</span><span>development.</span></h1><p className="hero-description">From waste streams to high-performance products, we guide manufacturers through formulation, processing, and validation intelligence designed to reduce expensive trial and error.</p>
        <div className="quote-form"><Button variant="brand" asChild><a href="#platform">Explore Our Platform</a></Button><Button variant="brandOutline" asChild><a href="#approach">Our Approach</a></Button></div>
        <div className="hero-stats"><div><strong>3.5B</strong><p>Tons generated</p></div><div><strong>R&D</strong><p>Material<br/>intelligence</p></div><div><strong>4</strong><p>Development<br/>targets considered</p></div></div>
      </div>
      <div className="hero-media"><ConstructionVideo src={introductionVideo.url} webm={introductionWebm.url} poster={introductionPoster.url} label="Cement emissions and smarter material development" scenes={heroConstructionScenes}/></div>
    </div></section>
    <section className="steps-section" id="approach"><div className="site-container"><div className="section-heading heading-with-action"><div><h2>Materials are Complicated. We Make Development Smarter</h2><p>Better inputs. Smarter experiments. Better materials ahead.</p></div><QuoteLink inverse/></div><div className="steps-grid">
      {[['Tell Us What You Have','Share your feedstocks, equipment and goals. We identify promising material pathways across formulation, manufacturing, and validation.'],['We Identify the Best Path','From feedstock to potential formulation, we consider your equipment constraints alongside performance requirements, cost and carbon targets.'],['You Test the Potential','Targeted experiments, practical formulation recommendations, and intelligence that guides your development.']].map(([title,text],i) => <article className="step-item" key={title}><span>0{i+1}</span><h3>{title}</h3><p>{text}</p></article>)}
    </div></div></section>
    <section className="solutions-section" id="platform"><div className="site-container"><h2 className="section-title centered">Explore Our Computational Platform</h2><div className="solution-tabs" role="tablist" aria-label="Platform capabilities">{solutions.map((s,i) => <Button key={s.name} variant="solution" role="tab" aria-selected={tab===i} aria-controls="solution-content" id={`platform-${s.name.toLowerCase()}`} onClick={() => setTab(i)}>{s.name}</Button>)}</div><div className="solution-content" role="tabpanel" id="solution-content" aria-labelledby={`platform-${selected.name.toLowerCase()}`}><div className="solution-copy"><h3>{selected.name} | {selected.subtitle}</h3><p>{selected.description}</p><ul>{selected.bullets.map(b => <li key={b}><span className="check-circle"><Check size={13}/></span>{b}</li>)}</ul><Button variant="brandOutline" asChild><a href={originalUrl(selected.path)}>{selected.cta}</a></Button>{selected.stat && <div className="solution-stat"><strong>{selected.stat}</strong><p>{selected.statLabel}</p></div>}</div><div className="solution-image"><ConstructionVideo src={intelligenceVideo.url} webm={intelligenceWebm.url} poster={intelligencePoster.url} label="intelligent construction concept video"/></div></div></div></section>
    <section className="audience-section" id="about"><div className="site-container"><div className="section-heading centered"><h2>We Understand the Challenges You Face</h2><p>From formulation and performance requirements to manufacturing constraints, discover intelligence designed around the realities of material development.</p></div><div className="audience-grid">{[{icon:Handshake,title:'Manufacturers & Industry Partners',text:'Promising formulations, targeted experiments, and computational intelligence to help you develop materials from variable waste streams.',cta:'Explore Manufacturing Intelligence',path:'#industries'},{icon:Recycle,title:'Sustainability & Innovation',text:'Explore lower-carbon material pathways with computational intelligence, feedstock insights, and targeted experiments.',cta:'Explore Sustainability Intelligence',path:'#impact'},{icon:HardHat,title:'Engineering & R&D Teams',text:'Focus material experimentation, consider constraints, and develop promising formulations for practical manufacturing applications.',cta:'Explore R&D Intelligence',path:'#platform'}].map(a => <article className="audience-item" key={a.title}><a.icon size={52} strokeWidth={1.25}/><h3>{a.title}</h3><p>{a.text}</p><Button variant="inverseOutline" asChild><a href={originalUrl(a.path)}>{a.cta}</a></Button></article>)}</div></div></section>
    <section className="impact-section" id="impact"><div className="site-container"><div className="section-heading"><h2>Your Waste. Our Intelligence. Better Materials.</h2><p>Every feedstock you explore and every formulation we recommend starts with your manufacturing.</p></div><div className="impact-grid"><div className="impact-cover"><ConstructionVideo src={modernVideo.url} webm={modernWebm.url} poster={impact.url} label="modern construction video"/><div><h3>Building a Better Future From Waste</h3><Button variant="inverseOutline" asChild><a href={originalUrl('#about')}>Our Mission</a></Button></div></div><div className="impact-metrics">{[['3.5B Tons','Waste generated annually.','Construction and industrial waste represents a major material development opportunity.'],['$1.48 Trillion','Global construction materials market.','Estimated opportunity across construction materials.'],['$382 Billion','U.S. materials opportunity.','Estimated construction material market size.'],['$44 Billion','Initial market.','Estimated urban construction materials opportunity for manufacturers.']].map(([number,label,description],i) => <article key={number} className={`impact-metric impact-metric--${i}`}><h3>{number}</h3><h4>{label}</h4><p>{description}</p></article>)}</div></div></div></section>
    <section className="industries-section" id="industries"><div className="site-container"><div className="section-heading centered"><h2>Different Feedstocks. One Intelligent Platform.</h2><p>Practical constraints. Promising formulations.</p></div><div className="industries-grid">{industries.map(i => <article key={i.slug} className="industry-item" id={`industry-${i.slug}`}><div><h3>{i.name}</h3><p>{i.description}</p><a className="text-link" href={originalUrl('#platform')}>Learn More</a></div><img src={i.image} alt={i.name} width={1024} height={1024} loading="lazy"/></article>)}</div><div className="centered industries-action"><Button variant="brandOutline" asChild><a href={originalUrl('#industries')}>Explore Our Industries</a></Button></div></div></section>
    <section className="media-section" id="case-studies"><div className="site-container">
      <div className="media-header"><h2 className="section-title">Case Studies</h2><a className="text-link" href="#case-studies">View All</a></div>
      <div className="media-grid">
        {mediaPosts[0] && <CaseStudyViewer post={mediaPosts[0]}>{open => <a className="media-feature" href={mediaPosts[0]?.href ?? '#case-studies'} onClick={open}><img src={mediaPosts[0]?.image} alt={mediaPosts[0]?.title} loading="lazy"/>{!mediaPosts[0]?.href && <span className="media-play" aria-hidden="true"><Play size={20} fill="currentColor"/></span>}<span className="media-feature-copy"><span className="media-feature-title">{mediaPosts[0]?.title}</span><span className="media-meta">{mediaPosts[0]?.category} — {mediaPosts[0]?.date}</span></span></a>}</CaseStudyViewer>}
        <div className="media-list">{mediaPosts.slice(1).map(post => <CaseStudyViewer key={post.slug} post={post}>{open => <a className="media-item" href={post.href ?? '#case-studies'} onClick={open}><div><h3>{post.title}</h3><p className="media-meta">{post.category} — {post.date}</p></div><img src={post.image} alt={post.title} loading="lazy"/></a>}</CaseStudyViewer>)}</div>
      </div>
    </div></section>
    <section className="final-cta" id="contact"><div className="site-container"><h2>Ready to Develop Better Materials?</h2><p>Help shape computational intelligence turning waste into promising, high-performance materials for manufacturing.</p><p>Better feedstocks. Smarter formulations. Targeted experiments. Computational intelligence focused on your manufacturing goals.</p><QuoteLink label="Explore Our Material Intelligence" inverse/></div></section>
  </main><footer className="site-footer"><div className="site-container"><div className="footer-top"><a href="/" aria-label="Better Materials home"><img src={footerLogo} alt="Better Materials"/></a></div><div className="footer-navigation">{navigation.map(n => <div key={n.name}><a className="footer-title" href={originalUrl(n.path)}>{n.name}</a>{n.links.slice(0,5).map(l => <a key={l.path} href={originalUrl(l.path)}>{l.name}</a>)}</div>)}</div><div className="footer-bottom"><span>© {new Date().getFullYear()} Better Materials. All rights reserved.</span><a href="#about">Our Mission</a><a href="#approach">Our Approach</a><a href="#platform">Platform Overview</a></div></div></footer></>;
}
