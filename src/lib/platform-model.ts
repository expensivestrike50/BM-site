// Illustrative mix-design model behind the interactive platform demo on the
// homepage. It uses textbook relationships (Abrams' law, SCM k-factors, a
// maturity-style strength gain curve) so the numbers move sensibly, but it is a
// demonstration, not a lab-validated prediction.

export type ProductId = 'precast' | 'masonry' | 'paver' | 'readymix';
export type FeedstockId = 'flyash' | 'slag' | 'clay' | 'glass';
export type Priority = 'carbon' | 'balanced' | 'cost';

export type Targets = {
  product: ProductId;
  strength: number; // MPa at 28 days
  slump: number; // mm
  carbon: number; // kg CO2e per m3 cap
  cost: number; // $ per m3 cap
  feedstock: FeedstockId;
  recycledAggregate: boolean;
  priority: Priority;
};

export type Product = { id: ProductId; name: string; short: string; strength: [number, number, number]; slump: [number, number, number]; carbon: number; cost: number; note: string };
export const products: Product[] = [
  { id: 'precast', name: 'Precast concrete panel', short: 'Precast', strength: [30, 70, 45], slump: [50, 200, 120], carbon: 340, cost: 150, note: 'Early stripping strength drives cycle time.' },
  { id: 'masonry', name: 'Concrete masonry block', short: 'Masonry', strength: [10, 35, 18], slump: [0, 25, 0], carbon: 220, cost: 95, note: 'Dry-cast, zero-slump mix for block machines.' },
  { id: 'paver', name: 'Interlocking paver', short: 'Paver', strength: [35, 65, 50], slump: [0, 25, 10], carbon: 300, cost: 140, note: 'High strength and freeze-thaw durability.' },
  { id: 'readymix', name: 'Ready-mix structural concrete', short: 'Ready-mix', strength: [20, 60, 35], slump: [75, 220, 150], carbon: 280, cost: 135, note: 'Pumpable workability with a 90-minute window.' },
];

export type Feedstock = { id: FeedstockId; name: string; source: string; k: number; slow: number; co2: number; price: number; color: string; max: number };
export const feedstocks: Feedstock[] = [
  { id: 'flyash', name: 'Fly ash', source: 'Coal power byproduct', k: 0.4, slow: 1.4, co2: 0.02, price: 50, color: '#4f5560', max: 0.4 },
  { id: 'slag', name: 'Ground slag (GGBS)', source: 'Steelmaking byproduct', k: 0.9, slow: 0.8, co2: 0.07, price: 90, color: '#ece8de', max: 0.65 },
  { id: 'clay', name: 'Calcined clay', source: 'Kaolinitic clay waste', k: 1.0, slow: 0.5, co2: 0.3, price: 110, color: '#c8875a', max: 0.4 },
  { id: 'glass', name: 'Glass pozzolan', source: 'Post-consumer glass', k: 0.55, slow: 1.1, co2: 0.03, price: 60, color: '#bfe3e6', max: 0.3 },
];

export const priorities: { id: Priority; name: string }[] = [
  { id: 'carbon', name: 'Lowest carbon' },
  { id: 'balanced', name: 'Balanced' },
  { id: 'cost', name: 'Lowest cost' },
];

export type IngredientId = 'cement' | 'scm' | 'water' | 'admixture' | 'sand' | 'coarse' | 'rca';
export type Ingredient = { id: IngredientId; name: string; kg: number; color: string; co2: number; cost: number };

export type Design = { wb: number; scm: number; rca: number };
export type Prediction = {
  design: Design;
  ingredients: Ingredient[];
  strength: number;
  sigma: number;
  gain: { day: number; mpa: number }[];
  slump: number;
  carbon: number;
  cost: number;
  wasteKg: number;
  passProbability: number;
};

const MAT = {
  cement: { co2: 0.9, price: 150, density: 3150, color: '#9ba1a8' },
  water: { co2: 0, price: 1, density: 1000, color: '#4aa3df' },
  admixture: { co2: 1.5, price: 2500, density: 1100, color: '#7a5cd6' },
  sand: { co2: 0.005, price: 22, density: 2600, color: '#d8c196' },
  coarse: { co2: 0.006, price: 25, density: 2650, color: '#8a8478' },
  rca: { co2: 0.003, price: 12, density: 2400, color: '#b4a28c' },
};
const SCM_DENSITY = 2400;
const AIR = 0.02;

export const productById = (id: ProductId) => products.find(p => p.id === id) ?? products[0]!;
export const feedstockById = (id: FeedstockId) => feedstocks.find(f => f.id === id) ?? feedstocks[0]!;

export function defaultTargets(product: ProductId = 'precast'): Targets {
  const p = productById(product);
  return { product, strength: p.strength[2], slump: p.slump[2], carbon: p.carbon, cost: p.cost, feedstock: 'slag', recycledAggregate: true, priority: 'balanced' };
}

const erf = (x: number) => {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
};
const normalCdf = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2));

export function predict(t: Targets, design: Design): Prediction {
  const fs = feedstockById(t.feedstock);
  const { wb, scm, rca } = design;
  // superplasticizer dose (% of binder) needed to keep low w/b mixes workable
  const sp = Math.min(1.6, Math.max(0, (0.5 - wb) * 6 + t.slump / 400));
  const water = (150 + 0.18 * t.slump) * (1 - 0.09 * sp) * (1 + 0.06 * rca);
  const binder = water / wb;
  const cement = binder * (1 - scm), scmKg = binder * scm, admixture = binder * sp / 100;
  const aggVol = 1 - AIR - water / MAT.water.density - cement / MAT.cement.density - scmKg / SCM_DENSITY - admixture / MAT.admixture.density;
  const sandVol = aggVol * 0.42, coarseVol = aggVol * 0.58;
  const sand = sandVol * MAT.sand.density;
  const coarse = coarseVol * (1 - rca) * MAT.coarse.density, rcaKg = coarseVol * rca * MAT.rca.density;

  const wbEff = wb / (1 - scm + fs.k * scm);
  const strength = (139 / Math.pow(12.87, wbEff)) * (1 - 0.22 * rca);
  const a = 4 + 9 * scm * fs.slow, b = (28 - a) / 28;
  const gain = [1, 3, 7, 14, 28, 56, 90].map(day => ({ day, mpa: (strength * day) / (a + b * day) }));
  const sigma = 2.5 + 0.05 * strength + 5 * scm * (1 - fs.k) + 3 * rca;

  const ingredients: Ingredient[] = [
    { id: 'cement', name: 'Portland cement', kg: cement, color: MAT.cement.color, co2: MAT.cement.co2, cost: MAT.cement.price },
    { id: 'scm', name: fs.name, kg: scmKg, color: fs.color, co2: fs.co2, cost: fs.price },
    { id: 'water', name: 'Water', kg: water, color: MAT.water.color, co2: MAT.water.co2, cost: MAT.water.price },
    { id: 'admixture', name: 'Superplasticizer', kg: admixture, color: MAT.admixture.color, co2: MAT.admixture.co2, cost: MAT.admixture.price },
    { id: 'sand', name: 'Sand', kg: sand, color: MAT.sand.color, co2: MAT.sand.co2, cost: MAT.sand.price },
    { id: 'coarse', name: 'Natural coarse aggregate', kg: coarse, color: MAT.coarse.color, co2: MAT.coarse.co2, cost: MAT.coarse.price },
    { id: 'rca', name: 'Recycled concrete aggregate', kg: rcaKg, color: MAT.rca.color, co2: MAT.rca.co2, cost: MAT.rca.price },
  ];
  const carbon = ingredients.reduce((s, i) => s + i.kg * i.co2, 0) + 12; // + batching and curing energy
  const cost = ingredients.reduce((s, i) => s + (i.kg / 1000) * i.cost, 0) + 18; // + production
  return {
    design, ingredients, strength, sigma, gain, slump: t.slump, carbon, cost,
    wasteKg: scmKg + rcaKg,
    passProbability: normalCdf((strength - t.strength) / sigma),
  };
}

export type Recommendation = { best: Prediction; feasible: boolean; issues: string[]; baseline: Prediction };

// Grid search over the three design factors for the mix that meets the strength
// target with margin and best satisfies the carbon and cost caps.
export function recommend(t: Targets): Recommendation {
  const fs = feedstockById(t.feedstock);
  const weights = t.priority === 'carbon' ? [1, 0.25] : t.priority === 'cost' ? [0.25, 1] : [0.6, 0.6];
  let best: { p: Prediction; score: number; ok: boolean } | null = null;
  for (let scm = 0; scm <= fs.max + 1e-9; scm += 0.05) for (let rca = 0; rca <= (t.recycledAggregate ? 0.5 : 0) + 1e-9; rca += 0.1) for (let wb = 0.28; wb <= 0.66; wb += 0.01) {
    const p = predict(t, { wb, scm, rca });
    const margin = p.strength - (t.strength + 1.34 * p.sigma); // ACI-style required average strength
    const overC = Math.max(0, p.carbon - t.carbon), overK = Math.max(0, p.cost - t.cost);
    const ok = margin >= 0 && overC === 0 && overK === 0;
    const score = (margin < 0 ? 400 - margin * 40 : 0) + overC * 3 + overK * 6
      + weights[0]! * p.carbon / t.carbon * 100 + weights[1]! * p.cost / t.cost * 100 - p.wasteKg / 40;
    if (!best || (ok && !best.ok) || (ok === best.ok && score < best.score)) best = { p, score, ok };
  }
  const baseline = recommendBaseline(t);
  const p = best!.p, issues: string[] = [];
  if (p.strength < t.strength + 1.34 * p.sigma) issues.push(`Strength target of ${t.strength} MPa is out of reach with ${fs.name.toLowerCase()} at these caps.`);
  if (p.carbon > t.carbon) issues.push(`Lowest carbon that meets strength is ${Math.round(p.carbon)} kg CO₂e/m³.`);
  if (p.cost > t.cost) issues.push(`Lowest cost that meets strength is $${Math.round(p.cost)}/m³.`);
  return { best: p, feasible: best!.ok, issues, baseline };
}

// Plain portland-cement mix with natural aggregate, for comparison.
function recommendBaseline(t: Targets): Prediction {
  let wb = 0.66;
  while (wb > 0.28) {
    const p = predict(t, { wb, scm: 0, rca: 0 });
    if (p.strength >= t.strength + 1.34 * p.sigma) return p;
    wb -= 0.01;
  }
  return predict(t, { wb: 0.28, scm: 0, rca: 0 });
}

export type Trial = { id: string; prediction: Prediction; level: [number, number, number]; selected: boolean; rank: number; role: string };
export type ExperimentPlan = { candidates: Trial[]; selected: Trial[]; steps: { wb: number; scm: number; rca: number } };

// 3 x 3 x 3 candidate batches around the recommendation; pick six that cover the
// space (greedy maximin) while keeping a reasonable chance of passing.
export function planExperiments(t: Targets, best: Prediction): ExperimentPlan {
  const fs = feedstockById(t.feedstock);
  const steps = { wb: 0.04, scm: 0.1, rca: t.recycledAggregate ? 0.15 : 0 };
  // three distinct levels per factor that include the optimum, shifted inward at a bound
  const levels = (v: number, step: number, lo: number, hi: number) => {
    if (!step) return [v];
    const ls = v + step > hi + 1e-6 ? [v - 2 * step, v - step, v] : v - step < lo - 1e-6 ? [v, v + step, v + 2 * step] : [v - step, v, v + step];
    return ls.map(x => Math.round(x * 1000) / 1000);
  };
  const L = [levels(best.design.wb, steps.wb, 0.26, 0.7), levels(best.design.scm, steps.scm, 0, fs.max), levels(best.design.rca, steps.rca, 0, 0.6)] as const;
  const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
  const at = (ls: readonly number[], v: number) => { const i = ls.findIndex(x => near(x, v)); return i < 0 ? ls.reduce((bi, x, n) => (Math.abs(x - v) < Math.abs(ls[bi]! - v) ? n : bi), 0) : i; };
  const optimum = [at(L[0], best.design.wb), at(L[1], best.design.scm), at(L[2], best.design.rca)];
  const candidates: Trial[] = [];
  L[0].forEach((wb, i) => L[1].forEach((scm, j) => L[2].forEach((rca, k) => {
    const isOpt = i === optimum[0] && j === optimum[1] && k === optimum[2];
    const prediction = isOpt ? best : predict(t, { wb, scm, rca });
    candidates.push({ id: '', prediction, level: [i - 1, L[1].length > 1 ? j - 1 : 0, L[2].length > 1 ? k - 1 : 0], selected: false, rank: 0, role: '' });
  })));
  const dist = (a: Trial, b: Trial) => Math.hypot(a.level[0] - b.level[0], a.level[1] - b.level[1], a.level[2] - b.level[2]);
  const centre = candidates.find(c => c.prediction === best)!;
  const chosen = [centre];
  while (chosen.length < 6) {
    let pick: Trial | null = null, pickScore = -Infinity;
    for (const c of candidates) {
      if (chosen.includes(c) || c.prediction.passProbability < 0.15) continue;
      const d = Math.min(...chosen.map(s => dist(c, s)));
      const s = d + c.prediction.passProbability * 0.8 - (c.prediction.carbon / t.carbon) * 0.3;
      if (s > pickScore) { pickScore = s; pick = c; }
    }
    if (!pick) break;
    chosen.push(pick);
  }
  const short = fs.name.replace(/ \(.*\)/, '').toLowerCase();
  chosen.forEach((c, n) => {
    c.selected = true; c.rank = n + 1; c.id = `T${n + 1}`;
    const d = c.prediction.design, o = best.design, parts: string[] = [];
    if (d.wb < o.wb - 1e-6) parts.push('lower w/b'); else if (d.wb > o.wb + 1e-6) parts.push('higher w/b');
    if (d.scm > o.scm + 1e-6) parts.push(`more ${short}`); else if (d.scm < o.scm - 1e-6) parts.push(`less ${short}`);
    if (d.rca > o.rca + 1e-6) parts.push('more RCA'); else if (d.rca < o.rca - 1e-6) parts.push('less RCA');
    const text = n === 0 ? 'Predicted optimum' : parts.join(', ');
    c.role = text.charAt(0).toUpperCase() + text.slice(1);
  });
  let n = 0;
  candidates.forEach(c => { if (!c.selected) c.id = `C${String(++n).padStart(2, '0')}`; });
  return { candidates, selected: chosen, steps };
}

export const stages = [
  { id: 'targets', name: 'Target properties', short: 'Targets', blurb: 'Set the product, performance and the cost and carbon you can accept.' },
  { id: 'mix', name: 'Predicted mix design', short: 'Mix design', blurb: 'Proportions per cubic metre, chosen to hit strength with margin.' },
  { id: 'experiments', name: 'Predicted experiment set', short: 'Experiments', blurb: 'The few trial batches that teach the most, out of 27 candidates.' },
  { id: 'results', name: 'Predicted properties', short: 'Properties', blurb: 'Strength gain, pass probability, carbon and cost for each trial.' },
] as const;
export type StageId = (typeof stages)[number]['id'];
