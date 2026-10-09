import { createFileRoute, notFound } from '@tanstack/react-router';
import { IndustryPage } from '@/components/industry-page';
import { getIndustryPage } from '@/lib/industry-data';

export const Route = createFileRoute('/who-we-help/$industry')({
  loader: ({ params }) => {
    const page = getIndustryPage(params.industry);
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData: page }) => {
    if (!page) return { meta: [{ title: 'Industry Not Found | Better Materials' }, { name: 'robots', content: 'noindex' }] };
    const title = `${page.name} Material Development | Better Materials`;
    return { meta: [
      { title }, { name: 'description', content: page.hero },
      { property: 'og:title', content: title }, { property: 'og:description', content: page.hero },
      { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
      ...(page.image.startsWith('https://') ? [{ property: 'og:image', content: page.image }, { name: 'twitter:image', content: page.image }] : []),
    ] };
  },
  component: IndustryRoute,
});

function IndustryRoute() {
  const page = Route.useLoaderData();
  return <IndustryPage key={page.slug} page={page}/>;
}