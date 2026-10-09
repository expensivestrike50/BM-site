import modernConstruction from '@/assets/modern-construction-hq.jpg.asset.json';
import modernConstructionVideo from '@/assets/modern-construction-hq.mp4.asset.json';
import modernConstructionWebm from '@/assets/modern-construction-hq.webm.asset.json';
import { stockPhoto } from '@/lib/stock-photos';
import { feedstockIntelligenceScenes, type ConstructionScene } from '@/lib/construction-scenes';
import { withBase } from '@/lib/base-path';


export type SolutionCard ={ title: string; stat: string; statLabel: string; text: string };
export type SolutionStep = { eyebrow: string; title: string; text: string; bullets: string[]; cta: string; image: string };
export type SolutionTile = { value: string; label: string; text: string };
export type SolutionFaq = { question: string; answer: string };
// A capability that used to have its own page, now one section of the feedstocks page.
export type SolutionCapability = { id: string; eyebrow: string; title: string; text: string; bullets: string[]; image: string };
export type SolutionPageData = {
  slug: string;
  subtitle: string;
  title: string;
  intro: string;
  image: string;
  cta: string;
  overview: { title: string; text: string; cards: SolutionCard[] };
  ai: { title: string; text: string; image: string };
  execution: { title: string; text: string; image: string; managesTitle: string; manages: string[]; focusTitle: string; focus: string[] };
  steps: SolutionStep[];
  band: { eyebrow: string; image: string; line: string; cta: string; video?: { src: string; webm: string; poster: string; label: string; scenes: ConstructionScene[] } };
  bento: { title: string; text: string; image: string; video?: { src: string; webm: string }; feature: string; tiles: SolutionTile[] };
  faqs: SolutionFaq[];
  closing: { title: string; text: string; cta: string };
  capabilities?: SolutionCapability[];
};

// Company-wide figures, matching the homepage impact section.
const impactTiles: SolutionTile[] = [
  { value: '3.5B Tons', label: 'Waste generated annually.', text: 'Construction and industrial waste represents a major material development opportunity.' },
  { value: '$1.48 Trillion', label: 'Global construction materials market.', text: 'Estimated opportunity across construction materials.' },
  { value: '$382 Billion', label: 'U.S. materials opportunity.', text: 'Estimated construction material market size.' },
  { value: '$44 Billion', label: 'Initial market.', text: 'Estimated urban construction materials opportunity for manufacturers.' },
];

// Overview card stats are placeholders. Replace them with your real figures.
export const solutionPages: SolutionPageData[] = [
  {
    slug: 'feedstocks',
    subtitle: 'Feedstocks Material Intelligence',
    title: 'Explore Waste-Derived Feedstocks for Better Materials.',
    intro: 'A computational approach for exploring waste-derived materials within manufacturing constraints across concrete, masonry, and industrial byproduct streams. Our platform identifies promising pathways using characteristics and performance requirements.',
    image: stockPhoto('rubblePile', 2400),
    cta: 'Explore Feedstock Intelligence Solutions',
    overview: {
      title: 'Always-On Feedstock Intelligence',
      text: 'Compare waste streams against available feedstocks and target product requirements across concrete, masonry and byproduct applications.',
      cards: [
        { title: 'Characterize Waste Streams', stat: '3', statLabel: 'Feedstock characteristics compared', text: 'Waste streams characterized against your target requirements.' },
        { title: 'Consider Material Variability', stat: '4', statLabel: 'Development targets considered', text: 'Variability weighed alongside manufacturing equipment constraints.' },
        { title: 'Validate the Best Candidates', stat: 'R&D', statLabel: 'Intelligence for material development', text: 'Physical experiments prioritized for practical manufacturing validation.' },
      ],
    },
    ai: { title: 'AI That Reads Your Waste Streams', text: 'Our models are being trained to connect waste stream characteristics with material performance, so promising feedstocks surface before lab work starts.', image: stockPhoto('aiNetwork') },
    execution: {
      title: 'Feedstock Intelligence Without Internal Burden',
      text: 'Our platform does the analysis, so your team can focus on the materials and products that matter most.',
      image: stockPhoto('concreteCrew'),
      managesTitle: 'Our platform manages:',
      manages: ['Feedstock Characterization', 'Waste Stream Matching', 'Variability Analysis', 'Formulation Recommendations', 'Experiment Prioritization', 'Continuous Improvement'],
      focusTitle: 'Your team focuses on:',
      focus: ['Core Product Priorities', 'Manufacturing Goals', 'Cost and Carbon Targets', 'Outcomes, Not Analysis'],
    },
    steps: [
      { eyebrow: 'CHARACTERIZE', title: 'See Which Waste Streams Fit Your Feedstock Needs', text: 'We characterize your waste streams and compare them against available feedstocks and target product requirements.', bullets: ['Waste stream characterization and composition review', 'Matching of feedstocks to target product requirements', 'Clear baseline to measure material performance'], cta: 'Characterize My Feedstocks', image: stockPhoto('aggregate') },
      { eyebrow: 'EVALUATE', title: 'Account for Variability Before Materials Reach the Plant', text: 'We consider material variability alongside your manufacturing equipment so recommendations stay practical for your operations.', bullets: ['Material variability tracked across batches and sources', 'Equipment constraints built into every recommendation', 'Feedstock performance compared under real conditions'], cta: 'Explore Equipment-Aware Options', image: stockPhoto('cementPlant') },
      { eyebrow: 'VALIDATE', title: 'Prioritize Experiments That Prove Manufacturing Value', text: 'Our computational recommendations point to the most promising formulations, and physical experiments confirm them before scale-up.', bullets: ['Computational shortlist of the most promising formulations', 'Targeted experiments prioritized for manufacturing validation', 'Results shared in a format your team can act on'], cta: 'Explore Validation Options', image: stockPhoto('testingLab') },
    ],
    band: { eyebrow: 'WHY FEEDSTOCK INTELLIGENCE MATTERS', image: stockPhoto('stackedBlocks', 2000), video: { src: withBase('/media/feedstock-intelligence.mp4'), webm: withBase('/media/feedstock-intelligence.webm'), poster: withBase('/media/feedstock-intelligence.jpg'), label: 'Why feedstock intelligence matters', scenes: feedstockIntelligenceScenes }, line: 'Better feedstocks. Smarter formulations. Better materials ahead.', cta: 'Start Your Feedstock Review' },
    bento: {
      title: 'Your Waste. Our Intelligence. Better Materials.',
      text: 'Every feedstock you explore and every formulation we recommend starts with your manufacturing.',
      image: modernConstruction.url,
      video: { src: modernConstructionVideo.url, webm: modernConstructionWebm.url },
      feature: 'Building a Better Future From Waste',
      tiles: impactTiles,
    },
    faqs: [
      { question: 'What kinds of waste streams can you assess?', answer: 'We assess concrete, masonry, and industrial byproduct streams, using their characteristics and the performance your product requires.' },
      { question: 'Do I need to share my full production data?', answer: 'No. We start with the feedstock details, equipment and goals you are comfortable sharing, and expand the analysis as the work progresses.' },
      { question: 'How do you account for material variability?', answer: 'We track how properties change across batches and sources, and build those ranges into every recommendation we make.' },
      { question: 'Will I need to change my current equipment?', answer: 'Usually not. Recommendations are designed around the equipment you already run, so the path to validation stays practical.' },
      { question: 'How long does a feedstock review take?', answer: 'A first review can be shared within a few weeks, depending on how much data is available and how many streams are involved.' },
    ],
    closing: { title: 'Ready to Develop Better Materials?', text: 'Share your feedstocks, equipment and goals. We will identify promising pathways for your next material development.', cta: 'Start Your Feedstock Review' },
    capabilities: [
      { id: 'formulations', eyebrow: 'FORMULATIONS', title: 'Turn Promising Feedstocks Into Practical Formulations', text: 'Compare feedstock combinations against your performance, cost and carbon targets before any mix reaches the lab.', bullets: ['Formulation models identify promising material combinations', 'Targeted experiments reduce trial batches', 'Lower-carbon mixes ranked alongside performance and cost'], image: stockPhoto('powders') },
      { id: 'processing', eyebrow: 'PROCESSING', title: 'Match Development to Your Manufacturing Conditions', text: 'Map processing constraints against material interactions and performance targets before production changes begin.', bullets: ['Equipment-aware recommendations for your plant', 'Processing conditions that suit how your line runs', 'Feedstock variability considered in every run'], image: stockPhoto('batchingPlant') },
      { id: 'validation', eyebrow: 'VALIDATION', title: 'Test the Materials That Show the Most Promising Results', text: 'Rank candidate formulations and test the strongest options first, so every experiment answers a clear question.', bullets: ['Candidates ranked by expected performance', 'Strength, durability, cost and carbon measured together', 'Documented results that build manufacturing confidence'], image: stockPhoto('labScientist') },
      { id: 'optimization', eyebrow: 'OPTIMIZATION', title: 'Balance Performance, Cost and Carbon', text: 'Set performance, cost and carbon targets together, then find the materials that balance all three.', bullets: ['Targets agreed before optimization begins', 'Manufacturing constraints inform every trade-off', 'Recommendations update as targets and inputs change'], image: stockPhoto('viaduct') },
    ],
  },
];

export const getSolutionPage = (slug: string) => solutionPages.find(page => page.slug === slug);
// Old capability pages, now sections of the feedstocks page: their URLs redirect to the section.
export const mergedSolutionSlugs = ['formulations', 'processing', 'validation', 'optimization'];
