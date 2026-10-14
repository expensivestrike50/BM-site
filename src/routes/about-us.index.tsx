import { createFileRoute } from '@tanstack/react-router';
import { AboutPage } from '@/components/about-page';
import { aboutPage } from '@/lib/about-data';

export const Route = createFileRoute('/about-us/')({
  head: () => {
    const title = 'About Us | Better Materials';
    return { meta: [
      { title }, { name: 'description', content: aboutPage.description },
      { property: 'og:title', content: title }, { property: 'og:description', content: aboutPage.description },
      { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
    ] };
  },
  component: () => <AboutPage page={aboutPage}/>,
});
