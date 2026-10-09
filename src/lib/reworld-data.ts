import historic from '@/assets/historic-bridge.jpg.asset.json';
import drawing from '@/assets/historic-drawing.jpg.asset.json';
import precast from '@/assets/modern-precast.jpg';
import lab from '@/assets/modern-materials-lab.jpg';
import recycling from '@/assets/modern-recycling.jpg';
import byproducts from '@/assets/modern-byproducts.jpg';

export const originalUrl = (path: string) => path;
export const solutions = [
  { name: 'Feedstocks', subtitle: 'Material Intelligence', image: recycling, path: '#platform', description: 'A computational approach for exploring waste-derived materials within manufacturing constraints across concrete, masonry, and industrial byproduct streams. Our platform identifies promising pathways using characteristics and performance requirements.', bullets: ['Waste streams characterized against available feedstocks and target product requirements', 'Material variability considered alongside manufacturing equipment constraints', 'Computational recommendations to identify the most promising formulations', 'Physical experiments prioritized for practical manufacturing validation'], cta: 'Explore Feedstock Intelligence Solutions' },
  { name: 'Formulations', subtitle: 'Waste-to-Value Development', image: precast, path: '#platform', description: 'Your feedstocks inform promising formulations, processing conditions, and performance predictions. Unnecessary experimentation reduced. Recommendations guide validation.', bullets: ['Formulation models identifying promising material combinations', 'Recommendations for targeted experiments', 'Supports lower-carbon materials'], cta: 'Explore Waste-to-Value Formulation Solutions', stat: 'R&D', statLabel: 'Intelligence for material development' },
  { name: 'Processing', subtitle: 'Manufacturing Conditions', image: drawing.url, path: '#platform', description: 'From your equipment to potential products. Processing constraints, material interactions, and performance targets considered together.', bullets: ['Equipment-aware manufacturing recommendations', 'Practical processing conditions for manufacturers', 'Feedstock variability considered during development'], cta: 'Explore Manufacturing Process Solutions', stat: '3', statLabel: 'development decision factors' },
  { name: 'Validation', subtitle: 'Targeted Experiments', image: lab, path: '#platform', description: 'Promising material formulations identified, tested, and refined. Reduce unnecessary experimentation. Build manufacturing confidence.', bullets: ['Performance-led recommendations', 'Strength durability cost carbon', 'Focuses testing on potential'], cta: 'Explore Validation Solutions', stat: 'R&D', statLabel: 'experiments guided by intelligence' },
  { name: 'Optimization', subtitle: 'Performance Cost Carbon', image: byproducts, path: '#platform', description: 'Variable waste streams developed into high-performance materials for concrete, masonry, and infrastructure applications. Balances performance, manufacturing, cost, and carbon.', bullets: ['Formulations aligned with performance', 'Manufacturing constraints inform every recommendation', 'Cost and carbon targets considered together'], cta: 'Explore Material Optimization Solutions', stat: '4', statLabel: 'targets guide each material development' },
];
export const industries = [
  { name: 'Precast Concrete Manufacturers', slug: 'precast', image: precast, description: 'Computational formulation development for precast producers using feedstocks, recycled aggregates, and industrial byproducts. Performance considered.' },
  { name: 'Cement Companies', slug: 'cement', image: byproducts, description: 'Formulation intelligence for alternative binders, industrial byproducts, and lower-carbon materials. Designed around performance requirements.' },
  { name: 'Masonry', slug: 'masonry', image: historic.url, description: 'Material development for blocks, masonry, and waste-derived products. Balance performance, manufacturing requirements, costs.' },
  { name: 'Manufacturing', slug: 'manufacturing', image: lab, description: 'Waste streams, feedstocks, and processing conditions considered together. Develop promising materials through experimentation.' },
  { name: 'Industrial Waste Streams', slug: 'industrial', image: recycling, description: 'Ash, slag, and demolition byproducts explored computationally. Waste can become valuable feedstock for materials.' },
  { name: 'Infrastructure Companies', slug: 'infrastructure', image: drawing.url, description: 'Lower-carbon formulations, recycled feedstocks, and construction materials developed around performance requirements.' },
];
export const navigation = [
  { name: 'What We Do', path: '#platform', heading: 'Platform Capabilities', links: [{ name: 'Feedstocks Material Intelligence', path: '/what-we-do/feedstocks' }] },
  { name: 'Who We Serve', path: '#industries', heading: 'Manufacturers', links: industries.map(i => ({name:i.name,path:'/who-we-help/'+i.slug})) },
  { name: 'Our Approach', path: '#approach', heading: 'Our Approach', links: [{name:'Computational Intelligence',path:'#approach'}, {name:'Material Development',path:'#platform'}, {name:'Circular Manufacturing',path:'#impact'}, {name:'Performance & Validation',path:'#platform-validation'}] },
  { name: 'Why It Matters', path: '#impact', heading: '', links: [] },
  { name: 'About Us', path: '/about-us', heading: 'About Better Materials', links: [{name:'Our Mission',path:'/about-us/our-mission'}, {name:'Industry Opportunity',path:'/about-us/industry-opportunity'}, {name:'Become a Design Partner',path:'/about-us/become-a-design-partner'}] },
];
