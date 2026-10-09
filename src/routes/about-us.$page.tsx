import { createFileRoute, notFound } from '@tanstack/react-router';
import { AboutPage } from '@/components/about-page';
import { getAboutPage } from '@/lib/about-data';

export const Route = createFileRoute('/about-us/$page')({
  loader: ({ params }) => {
    const page = getAboutPage(params.page);
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData: page }) => {
    if (!page) return { meta: [{ title: 'Page Not Found | Better Materials' }, { name: 'robots', content: 'noindex' }] };
    const title = `${page.name} | Better Materials`;
    return { meta: [
      { title }, { name: 'description', content: page.description },
      { property: 'og:title', content: title }, { property: 'og:description', content: page.description },
      { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
    ] };
  },
  component: AboutRoute,
});

function AboutRoute() {
  const page = Route.useLoaderData();
  return <AboutPage key={page.slug} page={page}/>;
}
