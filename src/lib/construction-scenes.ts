export type ConstructionScene = {
  start: number;
  title: string;
  description: string;
  note: string;
};

export const heroConstructionScenes: ConstructionScene[] = [
  { start: 0, title: 'Cement’s CO₂ challenge', description: 'Cement production releases CO₂ from limestone and fuel.', note: 'The carbon problem in cement' },
  { start: 6, title: 'Waste is a starting point', description: 'Construction waste. New material possibilities.', note: 'Construction and demolition' },
  { start: 12, title: 'Rethinking resources', description: 'Waste streams become potential feedstocks.', note: 'Material recovery' },
  { start: 18, title: 'Built for construction', description: 'Performance, cost and carbon matter.', note: 'Construction applications' },
  { start: 24, title: 'Grounded in manufacturing', description: 'Your equipment. Your process. Your goals.', note: 'Practical development constraints' },
  { start: 30, title: 'Modern construction', description: 'Smarter formulations for engineered materials.', note: 'Illustrative manufacturing scene' },
  { start: 36, title: 'Intelligent development', description: 'Computational R&D. Targeted experiments.', note: 'Better Materials · Conceptual scene' },
];
export const feedstockIntelligenceScenes: ConstructionScene[] = [
  { start: 0, title: 'Every material starts as a feedstock', description: 'Waste streams hold value most plants never measure.', note: 'Feedstock sourcing' },
  { start: 8, title: 'Know what’s in every stream', description: 'Composition and quality, characterized before you commit.', note: 'Feedstock characterization' },
  { start: 16, title: 'Analysis that ranks the options', description: 'Computational models shortlist the strongest formulations.', note: 'Formulation recommendations' },
  { start: 24, title: 'Variability, planned for', description: 'Batch-to-batch changes are tracked before materials reach the plant.', note: 'Variability analysis' },
  { start: 32, title: 'Proven before scale-up', description: 'Targeted experiments confirm performance on your equipment.', note: 'Experiment prioritization' },
  { start: 40, title: 'Lower cost. Lower carbon.', description: 'Better feedstocks carry through to every structure you build.', note: 'Construction applications' },
  { start: 48, title: 'Better materials ahead', description: 'Better feedstocks. Smarter formulations.', note: 'Better Materials · Feedstock intelligence' },
];
