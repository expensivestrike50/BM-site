import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import './ai-highlight.css';
import { withBase } from '@/lib/base-path';

const capabilities = [
  { title: 'Machine learning models', text: 'Learn how feedstock chemistry, mix design and processing shape performance.' },
  { title: 'Predictive performance', text: 'Estimate strength, durability, cost and carbon before a batch is made.' },
  { title: 'AI-guided experiments', text: 'Suggest the next tests that teach the models the most, so fewer trials are wasted.' },
  { title: 'Continuous learning', text: 'Every physical result feeds back to sharpen the next recommendation.' },
];

export function AiHighlight({ title, text }: { title: string; text: string }) {
  return <section className="ai-highlight"><div className="site-container ai-highlight-grid">
    <div>
      <h2>{title}</h2>
      <p className="ai-highlight-text">{text}</p>
      <ul className="ai-highlight-capabilities">{capabilities.map(({ title: name, text: detail }) => <li key={name}>
        <h3>{name}</h3><p>{detail}</p>
      </li>)}</ul>
      <Button variant="inverseOutline" asChild><Link to="/what-we-do/$solution" params={{ solution: 'feedstocks' }}>Explore the Platform</Link></Button>
    </div>
    <div className="ai-highlight-collage">
      <img className="ai-collage-cubes" src={withBase("/media/ai-cubes.webp")} alt="Data points assembling into a structured block" loading="lazy"/>
      <img className="ai-collage-ml" src={withBase("/media/ai-machine-learning.webp")} alt="Typewriter page reading Machine Learning" loading="lazy"/>
      <img className="ai-collage-head" src={withBase("/media/ai-head.webp")} alt="" aria-hidden="true" loading="lazy"/>
    </div>
  </div></section>;
}
