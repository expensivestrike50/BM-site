<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep uploaded and downloaded website media in CDN asset pointers and import their URLs; this preserves imagery without committing large binaries.
- Keep homepage content data in a browser-safe shared module and site navigation in a separate component; this makes solution tabs and menus consistent.
- Keep company and platform navigation on homepage sections and industry navigation on local industry routes; this avoids linking to the reference brand.
- Keep industry copy in a browser-safe data module and render industry routes through one shared Reworld-style template with route-specific metadata; this maintains consistent layouts without changing the homepage.
- Use a shared inline video component with posters, viewport-aware playback and reduced-motion support; this keeps construction footage accessible and avoids offscreen playback.
- Serve construction clips with VP9 WebM first and MP4 fallback plus matching frame posters; this preserves reliable playback across preview browsers.
- Define hero scene annotations in browser-safe data and synchronize them to video playback time; this keeps labels accurate through pauses, seeks and looping.
