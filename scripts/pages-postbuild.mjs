// Finishes the static GitHub Pages build in dist/client:
//  - redirect pages for the old capability URLs (now sections of the feedstocks page)
//    and the old About sub-page URLs (now sections of /about-us),
//  - a 404 page that sends visitors to the homepage,
//  - .nojekyll so GitHub serves files exactly as built,
//  - CNAME so GitHub serves the site on the custom domain.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Keep in sync with mergedSolutionSlugs in src/lib/solution-pages-data.ts.
const mergedSolutionSlugs = ['formulations', 'processing', 'validation', 'optimization'];
// Keep in sync with mergedAboutSlugs in src/lib/about-data.ts.
const mergedAboutSlugs = ['our-mission', 'industry-opportunity', 'become-a-design-partner'];

const base = process.env.PAGES_BASE ?? '/';
const out = 'dist/client';
const domain = 'thebettermaterials.com';

const redirectPage = (to) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Better Materials</title>
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${to}">
<link rel="canonical" href="${to}">
<script>location.replace(${JSON.stringify(to)})</script>
</head><body><p><a href="${to}">Continue to Better Materials</a></p></body></html>
`;

for (const slug of mergedSolutionSlugs) {
  const dir = join(out, 'what-we-do', slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), redirectPage(`${base}what-we-do/feedstocks#${slug}`));
}
for (const slug of mergedAboutSlugs) {
  const dir = join(out, 'about-us', slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), redirectPage(`${base}about-us#${slug}`));
}
writeFileSync(join(out, '404.html'), redirectPage(base));
writeFileSync(join(out, '.nojekyll'), '');
// Custom domain. Deploys replace the whole gh-pages branch, so this must be in every build.
// Only valid when the site is built for the domain root.
if (base === '/') writeFileSync(join(out, 'CNAME'), `${domain}\n`);
console.log(`pages-postbuild: ${mergedSolutionSlugs.length + mergedAboutSlugs.length} redirects, 404.html, .nojekyll${base === '/' ? `, CNAME ${domain}` : ''} (base ${base})`);
