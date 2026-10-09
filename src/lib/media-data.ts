import intelligent from '@/assets/intelligent-construction-hq.jpg.asset.json';
import lab from '@/assets/modern-materials-lab.jpg';
import precast from '@/assets/modern-precast.jpg';
import recycling from '@/assets/modern-recycling.jpg';
import byproducts from '@/assets/modern-byproducts.jpg';

export type MediaPost = { slug: string; title: string; category: string; date: string; image: string; href?: string; pages?: string[] };

// Real case studies: each has a PDF plus page images for the in-page viewer.
export const mediaPosts: MediaPost[] = [
  { slug: 'waste-derived-mortar', title: 'Low-cement mortar from demolished concrete: 50% less cement, 10x faster design', category: 'Case Study', date: 'Feb 10, 2025', image: '/media/case-study-mortar.webp', href: '/case-studies/waste-derived-mortar.pdf', pages: ['/case-studies/waste-derived-mortar-1.webp?v=hq', '/case-studies/waste-derived-mortar-2.webp?v=hq', '/case-studies/waste-derived-mortar-3.webp?v=hq'] },
  { slug: '3d-printed-concrete', title: '3D-printed concrete with 97% recycled sand and 66% better buildability', category: 'Case Study', date: 'Nov 2025', image: '/media/case-study-3d-printing.webp', href: '/case-studies/3d-printed-concrete.pdf', pages: ['/case-studies/3d-printed-concrete-1.webp?v=hq', '/case-studies/3d-printed-concrete-2.webp?v=hq', '/case-studies/3d-printed-concrete-3.webp?v=hq'] },
  { slug: 'banana-peel-additive', title: 'Banana peel powder as a cement additive: 18% stronger mortar at a 0.2% dose', category: 'Case Study', date: 'Dec 24, 2025', image: '/media/case-study-banana-peel.webp', href: '/case-studies/banana-peel-additive.pdf', pages: ['/case-studies/banana-peel-additive-1.webp?v=hq', '/case-studies/banana-peel-additive-2.webp?v=hq', '/case-studies/banana-peel-additive-3.webp?v=hq'] },
  { slug: 'wastewater-smart-tuning', title: 'Smart tuning for wastewater: balancing energy and effluent quality with Bayesian optimization', category: 'Case Study', date: 'May 13, 2025', image: '/media/case-study-wastewater.webp', href: '/case-studies/wastewater-smart-tuning.pdf', pages: ['/case-studies/wastewater-smart-tuning-1.webp?v=hq', '/case-studies/wastewater-smart-tuning-2.webp?v=hq', '/case-studies/wastewater-smart-tuning-3.webp?v=hq'] },
  { slug: 'co2-cured-copper-slag', title: 'CO₂-cured copper slag cement: 67% higher early strength and 35.5% lower net emissions', category: 'Case Study', date: 'Jun 2, 2025', image: '/media/case-study-copper-slag.webp', href: '/case-studies/co2-cured-copper-slag.pdf', pages: ['/case-studies/co2-cured-copper-slag-1.webp?v=hq', '/case-studies/co2-cured-copper-slag-2.webp?v=hq', '/case-studies/co2-cured-copper-slag-3.webp?v=hq'] },
];
