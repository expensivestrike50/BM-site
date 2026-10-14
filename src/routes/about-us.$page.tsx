import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import { mergedAboutSlugs } from '@/lib/about-data';

// The old About sub-pages are now sections of /about-us.
export const Route = createFileRoute('/about-us/$page')({
  loader: ({ params }) => {
    if (mergedAboutSlugs.includes(params.page)) throw redirect({ to: '/about-us', hash: params.page, statusCode: 301 });
    throw notFound();
  },
});
