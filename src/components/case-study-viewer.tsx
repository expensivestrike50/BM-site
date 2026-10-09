import { useState, type ReactElement, type MouseEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Download, X } from 'lucide-react';
import type { MediaPost } from '@/lib/media-data';
import './case-study-viewer.css';

// Opens a case study in place: the page behind blurs and the case study's
// pages scroll in a panel. The card keeps its PDF href so a middle-click or
// no-JS visit still reaches the file.
export function CaseStudyViewer({ post, children }: { post: MediaPost; children: (open: (event: MouseEvent) => void) => ReactElement }) {
  const [open, setOpen] = useState(false);
  if (!post.pages?.length) return children(() => {});
  return <>
    {children(event => { event.preventDefault(); setOpen(true); })}
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="case-viewer-overlay"/>
        <Dialog.Content className="case-viewer" aria-describedby={undefined}>
          <header className="case-viewer-bar">
            <div>
              <p className="case-viewer-tag">{post.category}</p>
              <Dialog.Title className="case-viewer-title">{post.title}</Dialog.Title>
            </div>
            <div className="case-viewer-actions">
              {post.href && <a className="case-viewer-download" href={post.href} download>Download PDF<Download size={16}/></a>}
              <Dialog.Close className="case-viewer-close" aria-label="Close case study"><X size={20}/></Dialog.Close>
            </div>
          </header>
          <div className="case-viewer-pages">
            {post.pages.map((page, index) => <img key={page} src={page} alt={`${post.title}, page ${index + 1} of ${post.pages!.length}`} width={2479} height={3508} decoding="async" loading={index ? 'lazy' : 'eager'}/>)}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}
