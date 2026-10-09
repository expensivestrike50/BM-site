// Prefixes a root-relative path with the site's base path (Vite's `base`), so
// public files and plain <a> links keep working when the site is served from a
// sub-path such as GitHub Pages (/BM-site/). With the default base "/" it
// returns the path unchanged. Router <Link>s get the base from the router itself.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export const withBase = (path: string) => (path.startsWith('/') ? BASE + path : path);
