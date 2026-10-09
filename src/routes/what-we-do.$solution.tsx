import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import { SolutionPage } from '@/components/solution-page';
import { getSolutionPage, mergedSolutionSlugs } from '@/lib/solution-pages-data';

export const Route = createFileRoute('/what-we-do/$solution')({
  loader: ({ params }) => {
    if (mergedSolutionSlugs.includes(params.solution)) throw redirect({ to: '/what-we-do/$solution', params: { solution: 'feedstocks' }, hash: params.solution, statusCode: 301 });
    const page = getSolutionPage(params.solution);
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData: page }) => {
    if (!page) return { meta: [{ title: 'Solution Not Found | Better Materials' }, { name: 'robots', content: 'noindex' }] };
    const title = `${page.subtitle} | Better Materials`;
    return { meta: [
      { title }, { name: 'description', content: page.intro },
      { property: 'og:title', content: title }, { property: 'og:description', content: page.intro },
      { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
    ] };
  },
  component: SolutionRoute,
});

function SolutionRoute() {
  const page = Route.useLoaderData();
  return <SolutionPage key={page.slug} page={page}/>;
}
