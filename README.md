# Neemamla scroll sequence

The landing page has two cinematic, scroll-controlled canvas chapters built from the same `ScrollSequence` section component, joined by a scroll-driven botanical interlude. The opening chapter uses 180 numbered frames in `public/assets/img/`; the second uses `src/assets/img/neem (1).jpg` through `neem (299).jpg` and features a stronger zooming title treatment. Framer Motion handles scroll mapping and story overlays. The second chapter starts loading as it approaches the viewport.

## Change the image sequence

Edit `FIRST_FRAME_COUNT`, `SECOND_FRAME_COUNT`, and the frame path constants near the top of `src/components/ScrollSequence.tsx`. Keep each set in sync with its naming pattern: `/assets/img/1.jpg` through `/180.jpg` for the opener, and `src/assets/img/neem (1).jpg` through `neem (299).jpg` for the second chapter. Each chapter loads its first 30 frames before reveal; the rest load in batches of 10.

## Change the story beats

Edit `FIRST_BEATS` or `SECOND_BEATS` in the same file. Each `range` is `[fadeInStart, fullyVisible, fadeOutStart, fadeOutEnd]` on the 0–1 scroll progress scale. Update the copy and optional `kind` (`hero`, `details`, or `closing`) alongside its range.

Both desktop chapters use a 500vh sticky sequence. Mobile uses 400vh and preloads the odd-numbered frames first. Canvas sizing, DPR capping, frame fallback, and reduced-motion behavior are handled by the component.
