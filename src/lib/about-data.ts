import modernConstruction from '@/assets/modern-construction-hq.jpg.asset.json';
import modernConstructionVideo from '@/assets/modern-construction-hq.mp4.asset.json';
import modernConstructionWebm from '@/assets/modern-construction-hq.webm.asset.json';
import { stockPhoto } from '@/lib/stock-photos';
import { withBase } from '@/lib/base-path';

// Layout follows concrete.ai/about: "Did you know?" hero, mission band, then rows of
// circular cards (used there for people; here for approach, market figures and partnership).
export type AboutLink = { label: string; href: string };
export type AboutStatIcon = 'recycle' | 'globe' | 'building' | 'factory';
export type AboutCard = { title: string; subtitle: string; text: string; image?: string; icon?: AboutStatIcon };
export type AboutCardSection = { id: string; title: string; cards: AboutCard[] };
export type AboutPageData = {
  description: string;
  hero: { title: string; titleHighlight: string; text: string; highlight: string; image: string; video: { src: string; webm: string; poster: string; label: string } };
  label: string;
  mission: { id: string; title: string; text: string; how: string };
  sections: AboutCardSection[];
  closing: { title: string; text: string; cta: AboutLink };
};

export const aboutPage: AboutPageData = {
  description: 'Better Materials helps manufacturers turn waste streams into high-performance construction materials with AI-guided development and targeted testing.',
  hero: {
    title: 'Did',
    titleHighlight: 'you know',
    text: 'Construction and industrial activity generates around 3.5 billion tons of waste every year, while the world spends $1.48 trillion on construction materials.',
    highlight: 'Much of that waste could become the feedstock for better materials.',
    image: stockPhoto('concreteForms', 2400),
    video: { src: modernConstructionVideo.url, webm: modernConstructionWebm.url, poster: modernConstruction.url, label: 'Building a better future from waste' },
  },
  label: 'About Better Materials',
  mission: {
    id: 'our-mission',
    title: 'Our Mission',
    text: 'We built Better Materials so manufacturers do not have to choose between performance, cost and carbon. Our goal is to help turn waste streams into high-performance construction materials, using AI to reduce expensive trial and error and physical testing to prove what works.',
    how: 'By making waste-derived materials practical for real manufacturing.',
  },
  sections: [
    {
      id: 'our-approach',
      title: 'Our Approach',
      cards: [
        { title: 'Waste as Feedstock', subtitle: 'Why it matters', text: 'Ash, slag and demolition rubble hold real value. Reusing them cuts landfill waste and lowers the carbon of binders and aggregates.', image: stockPhoto('demolitionRubble', 800) },
        { title: 'AI With Physical Proof', subtitle: 'How we develop', text: 'Machine learning explores far more formulations than a lab could test, and targeted experiments confirm what works before production.', image: stockPhoto('microscope', 800) },
        { title: 'Built for Your Plant', subtitle: 'Who we design for', text: 'Every recommendation is designed around your equipment, feedstock variability and quality standards, together with your team.', image: stockPhoto('concreteCrew', 800) },
      ],
    },
    {
      id: 'industry-opportunity',
      title: 'Industry Opportunity',
      cards: [
        { title: '3.5B Tons', subtitle: 'Waste generated annually', text: 'Construction and industrial waste represents a major material development opportunity.', icon: 'recycle' },
        { title: '$1.48 Trillion', subtitle: 'Global materials market', text: 'Estimated opportunity across construction materials worldwide.', icon: 'globe' },
        { title: '$382 Billion', subtitle: 'U.S. materials opportunity', text: 'Estimated U.S. construction material market size.', icon: 'building' },
        { title: '$44 Billion', subtitle: 'Initial market', text: 'Estimated urban construction materials opportunity for manufacturers.', icon: 'factory' },
      ],
    },
    {
      id: 'become-a-design-partner',
      title: 'Become a Design Partner',
      cards: [
        { title: 'What You Receive', subtitle: 'Early access', text: 'Early access to the platform, formulation recommendations for your feedstocks and support planning targeted experiments.', image: stockPhoto('labTechnician', 800) },
        { title: 'What We Ask', subtitle: 'Shared learning', text: 'The feedstock and production data you are comfortable sharing, regular feedback and access to run trials where practical.', image: stockPhoto('engineerDesk', 800) },
        { title: 'How It Works', subtitle: 'Step by step', text: 'A discovery call, a feedstock review with first recommendations, then targeted experiments with results shared at every stage.', image: stockPhoto('siteTeam', 800) },
      ],
    },
  ],
  closing: { title: 'Ready to become a design partner?', text: 'Tell us about your feedstocks, equipment and goals. We will be in touch to discuss next steps.', cta: { label: 'Get in Touch', href: withBase('/#contact') } },
};

// The old About sub-pages, now sections of /about-us: their URLs redirect to the section.
export const mergedAboutSlugs = ['our-mission', 'industry-opportunity', 'become-a-design-partner'];
