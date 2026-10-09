import { stockPhoto } from '@/lib/stock-photos';
import { withBase } from '@/lib/base-path';

export type AboutLink = { label: string; href: string };
export type AboutRow = { title: string; text: string; image: string; bullets?: string[]; cta?: AboutLink };
export type AboutStat = { icon: 'recycle' | 'layers' | 'factory' | 'target' | 'globe' | 'building'; value: string; label: string };
export type AboutCard = { title: string; text: string; image: string; cta: AboutLink };
export type AboutPageData = {
  slug: string;
  name: string;
  eyebrow: string;
  title: string;
  description: string;
  heroImage: string;
  intro: { text: string; cta: AboutLink };
  rows: AboutRow[];
  stats?: AboutStat[];
  cards?: AboutCard[];
  moreRows?: AboutRow[];
  banner: { title: string; text: string; cta: AboutLink };
};

const partnerLink: AboutLink = { label: 'Become a Design Partner', href: withBase('/about-us/become-a-design-partner') };

export const aboutOverview: AboutPageData = {
  slug: '',
  name: 'About Us',
  eyebrow: 'About Better Materials',
  title: 'Others see waste. We see better materials.',
  description: 'Better Materials helps manufacturers turn waste streams into high-performance construction materials with AI-guided development and targeted testing.',
  heroImage: stockPhoto('labScientist', 1200),
  intro: { text: 'We help manufacturers turn waste streams into promising, high-performance construction materials. By combining computational intelligence with targeted physical testing, we aim to make material development faster, more affordable and lower in carbon.', cta: partnerLink },
  rows: [
    { title: 'Working together to find value in every waste stream', text: 'We are materials scientists, engineers and AI specialists. We work alongside manufacturers who know their equipment, feedstocks and markets, and we bring the models that help them explore new materials with less trial and error.', image: stockPhoto('plansReview') },
  ],
  stats: [
    { icon: 'recycle', value: '3.5B Tons', label: 'construction and industrial waste generated annually' },
    { icon: 'layers', value: '5', label: 'platform capabilities, from feedstocks to optimization' },
    { icon: 'factory', value: '6', label: 'manufacturer segments we serve' },
    { icon: 'target', value: '4', label: 'development targets: performance, manufacturing, cost and carbon' },
  ],
  cards: [
    { title: 'Our Mission', text: 'Why we believe waste-derived materials, guided by AI and proven by testing, can change how construction materials are made.', image: stockPhoto('testingLab'), cta: { label: 'Read Our Mission', href: withBase('/about-us/our-mission') } },
    { title: 'Industry Opportunity', text: 'A $1.48 trillion construction materials market and 3.5 billion tons of waste every year. See where the opportunity lies.', image: stockPhoto('cementPlant'), cta: { label: 'See the Opportunity', href: withBase('/about-us/industry-opportunity') } },
  ],
  moreRows: [
    { title: 'Dedicated to redefining what is possible with waste', text: 'Ash, slag, demolition rubble and industrial byproducts are often treated as costs. We see feedstocks with measurable value, and we are building the tools to prove it.', image: stockPhoto('demolitionSite'), cta: { label: 'Our Approach', href: withBase('/#approach') } },
    { title: 'AI built around manufacturing reality', text: 'Our platform pairs machine learning with the realities of your plant: equipment limits, feedstock variability and the targets your products must meet. Every recommendation is designed to be tested, not just modeled.', image: stockPhoto('aiNetwork'), cta: { label: 'Explore the Platform', href: withBase('/what-we-do/feedstocks') } },
  ],
  banner: { title: 'Want to shape the future of waste-derived materials?', text: 'We are working with a small group of manufacturers as design partners. Help shape the platform, test new formulations early and build materials that perform.', cta: partnerLink },
};

export const aboutPages: AboutPageData[] = [
  {
    slug: 'our-mission',
    name: 'Our Mission',
    eyebrow: 'Our Mission',
    title: 'Turning waste into better materials, with intelligence.',
    description: 'Our mission is to help manufacturers develop high-performance construction materials from waste, using AI and targeted physical testing.',
    heroImage: stockPhoto('testingLab', 1200),
    intro: { text: 'Our mission is to help manufacturers develop high-performance construction materials from waste, using AI to reduce expensive trial and error and physical testing to prove what works.', cta: partnerLink },
    rows: [
      { title: 'Why waste-derived materials matter', text: 'Construction and industrial activity generates around 3.5 billion tons of waste each year, while cement and concrete remain among the most carbon-intensive materials in use. Reusing waste as feedstock can help with both problems at once.', image: stockPhoto('demolitionRubble'), bullets: ['Less waste sent to landfill', 'Lower-carbon binders and aggregates', 'New value from existing byproducts'] },
      { title: 'Computational intelligence, physical proof', text: 'AI models help us explore far more formulations than a lab could test. Models are only the start: every promising material is confirmed with targeted physical experiments before it reaches production.', image: stockPhoto('microscope'), bullets: ['Machine learning to explore formulations', 'Targeted experiments to validate results', 'Models that learn from every test'] },
      { title: 'Built with manufacturers, not around them', text: 'Recommendations only matter if a plant can run them. We design around your equipment, feedstocks and quality standards, and we work closely with your team at every step.', image: stockPhoto('concreteCrew'), bullets: ['Equipment-aware recommendations', 'Feedstock variability considered', 'Shared goals for performance, cost and carbon'] },
    ],
    banner: { title: 'Help us build better materials', text: 'Join our design partner programme and shape a platform built for the realities of manufacturing.', cta: partnerLink },
  },
  {
    slug: 'industry-opportunity',
    name: 'Industry Opportunity',
    eyebrow: 'Industry Opportunity',
    title: 'A trillion-dollar market ready for better materials.',
    description: 'Construction materials are a $1.48 trillion global market. Waste-derived materials developed with AI offer lower cost, lower carbon and new value from byproducts.',
    heroImage: stockPhoto('cementPlant', 1200),
    intro: { text: 'Construction materials are one of the largest markets in the world, and one of the hardest to change. Waste-derived materials, developed with AI, offer a path to lower cost, lower carbon and new value from byproducts.', cta: { label: 'Explore the Platform', href: withBase('/what-we-do/feedstocks') } },
    stats: [
      { icon: 'recycle', value: '3.5B Tons', label: 'waste generated annually' },
      { icon: 'globe', value: '$1.48 Trillion', label: 'global construction materials market' },
      { icon: 'building', value: '$382 Billion', label: 'U.S. materials opportunity' },
      { icon: 'factory', value: '$44 Billion', label: 'initial urban construction materials market' },
    ],
    rows: [
      { title: 'Waste is an untapped feedstock', text: 'Fly ash, slag, demolition rubble and other byproducts are produced in huge volumes. Many have chemistry that can replace virgin aggregates or binders, once their variability is understood.', image: stockPhoto('aggregateHeap'), bullets: ['Large, recurring waste volumes', 'Chemistry suited to binders and aggregates', 'Value locked in existing byproducts'] },
      { title: 'Material development is slow and costly', text: 'Traditional development relies on long cycles of trial batches and testing. Each new feedstock adds variables, and each failed batch adds cost.', image: stockPhoto('testingMachine'), bullets: ['Long trial-and-error cycles', 'Variable feedstocks add risk', 'Costly failed batches'] },
      { title: 'Where AI changes the economics', text: 'Computational models narrow thousands of possible formulations to a short list worth testing. That means fewer trial batches, faster decisions and materials ready for market sooner.', image: stockPhoto('aiBrain'), bullets: ['Fewer trial batches', 'Faster development decisions', 'Quicker path to market'] },
    ],
    banner: { title: 'Ready to capture the opportunity?', text: 'Partner with us to explore waste-derived materials for your products and markets.', cta: partnerLink },
  },
  {
    slug: 'become-a-design-partner',
    name: 'Become a Design Partner',
    eyebrow: 'Design Partner Programme',
    title: 'Build the future of materials with us.',
    description: 'Become a Better Materials design partner: get early access to the platform and help shape AI tools for waste-derived material development.',
    heroImage: stockPhoto('handshake', 1200),
    intro: { text: 'We are inviting a small group of manufacturers to work with us as design partners. Partners get early access to the platform and help shape the tools that will guide their material development.', cta: { label: 'Get in Touch', href: withBase('/#contact') } },
    rows: [
      { title: 'What design partners receive', text: 'Partners work directly with our team to explore materials from their own feedstocks, with early access to every new platform capability.', image: stockPhoto('labTechnician'), bullets: ['Early access to the computational platform', 'Formulation recommendations for your feedstocks', 'Support planning targeted physical experiments'] },
      { title: 'What we ask of partners', text: 'The platform improves with real manufacturing data and feedback. We ask partners to share what they can and to tell us what works.', image: stockPhoto('plansReview'), bullets: ['Feedstock and production data you are comfortable sharing', 'Regular feedback from your technical team', 'Access to run targeted trials where practical'] },
      { title: 'How the partnership works', text: 'We start by understanding your goals, then move quickly to recommendations and targeted testing, sharing results at every stage.', image: stockPhoto('siteTeam'), bullets: ['Discovery call to understand your goals', 'Feedstock review and first recommendations', 'Targeted experiments and shared results'] },
    ],
    banner: { title: 'Ready to become a design partner?', text: 'Tell us about your feedstocks, equipment and goals. We will be in touch to discuss next steps.', cta: { label: 'Get in Touch', href: withBase('/#contact') } },
  },
];

export const getAboutPage = (slug: string) => aboutPages.find(page => page.slug === slug);
