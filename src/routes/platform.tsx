import { createFileRoute } from '@tanstack/react-router';
import { ReworldHeader } from '@/components/reworld-header';
import { PlatformLab } from '@/components/platform-lab';

const description = 'Set target properties for a construction product and watch the plant predict the mix design, the trial batches worth running, and how each one will perform.';

export const Route = createFileRoute('/platform')({
  head: () => {
    const title = 'Interactive Platform | Better Materials';
    return { meta: [
      { title }, { name: 'description', content: description },
      { property: 'og:title', content: title }, { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
    ] };
  },
  component: () => <><ReworldHeader industryPage/><main><PlatformLab/></main></>,
});
