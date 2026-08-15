# Prompt for AI Visual Editor

Replace the existing "featured works" background element in the Hero section with a scroll-scrubbed image-sequence animation of a marble bust, using GSAP ScrollTrigger and Lenis. Follow the spec below exactly.

---

## 1. Goal

In the Hero section, there is currently a "featured works" element positioned behind the Name/heading, with some kind of scroll trigger already attached to it. Remove/replace that element entirely with a canvas-rendered WebP image sequence of a marble bust. As the user scrolls down from the top of the page, the bust animation scrubs forward frame-by-frame (head starts facing straight, gradually tilts and moves to the left side of the screen). The animation should feel tied directly to scroll position (scrubbing, not autoplay), and should smoothly fade out by the time the About section (which comes right after the Hero) transitions into the Featured Projects section — so it never visually collides with Featured Projects content.

## 2. Assets

- 121 WebP frames, transparent backgrounds, located in `final_clean_frames/`.
- Frames are sequential and represent a continuous motion: frame 1 = head facing straight, frame 121 = head tilted, moved to the left side of the frame.
- Frames are named sequentially (e.g. `frame_0001.webp` → `frame_0121.webp`).
- Frames are WebP with alpha transparency — load them via standard `Image()`/`new Image()` objects same as you would PNGs (all modern browsers decode WebP natively via `drawImage`, no extra library needed). No conversion step required.

## 3. Rendering approach

- Use a `<canvas>` element (not swapping `<img>` src per frame — too much layout thrashing/repaint cost for 121 frames scrubbed on scroll).
- Canvas should be absolutely/fixed positioned in front the Name/heading text in the Hero section (similar to how the featured work element is placed), sized to fill the hero viewport (or a defined bounding box matching where "featured works" currently sits), with `object-fit: contain`-style scaling logic drawn manually via canvas math (preserve aspect ratio, center appropriately, account for the head moving toward the left of the frame so it doesn't get cropped).
- Draw the current frame's WebP image onto the canvas using `drawImage`, clearing the canvas each time before redraw.
- Respect device pixel ratio (scale canvas backing store by `window.devicePixelRatio` for crispness on retina).

## 4. Preloading

- Preload all 121 WebP images into an array of `Image` objects before enabling scroll-scrub, so scrubbing never shows a blank/flash frame.
- Show a lightweight loading state (or just delay activating the ScrollTrigger) until all images are loaded, or at minimum until frame 1 is loaded and the rest load progressively in the background — prioritize no jank over instant load.
- Cache loaded images so this doesn't re-fetch on re-renders.

## 5. Scroll-driven animation (GSAP + Lenis)

- Use GSAP's `ScrollTrigger` plugin to drive playback, with `scrub: true` (or a small numeric value like `0.5`–`1` for slight smoothing lag) so the frame index is tightly coupled to scroll position — no easing/inertia beyond what scrub smoothing naturally gives.
- Ensure Lenis and ScrollTrigger are properly synced: Lenis should drive the scroll, and ScrollTrigger should update on Lenis's `scroll` event (via `lenis.on('scroll', ScrollTrigger.update)`), with `lagSmoothing` disabled on GSAP's ticker or Lenis driving the RAF loop — set this up so ScrollTrigger positions stay accurate and don't desync from Lenis's virtual scroll. If Lenis + ScrollTrigger integration isn't already wired up elsewhere in the codebase, wire it up here using GSAP's ticker (`gsap.ticker.add`) to drive `lenis.raf()`.
- Use a single GSAP tween on a plain JS object (e.g. `{ frame: 0 }`) tweened from `0` to `120`, with `onUpdate` rounding the value and redrawing the canvas with `frames[Math.round(obj.frame)]`.
- The ScrollTrigger's `trigger` should be the Hero section itself, with:
  - `start: 'top top'`
  - `end` calculated so the scrub completes as the user scrolls through the Hero section into the start of the About section (tune this — likely `end: 'bottom top'` on the Hero, or a defined pixel/viewport-height range — pick whichever produces a natural pace, not too fast/rushed, not stalled).
  - `pin: true` on the Hero (or on the canvas/bust wrapper specifically) is optional — decide based on whether the Name/heading should also stay pinned during the scrub or scroll normally over it. Default assumption: pin the Hero section so the bust animation fully plays out before the page continues scrolling, then unpin and continue into About.

## 6. Fade-out behavior

- Add a second ScrollTrigger (or extend the fade into the same timeline) that fades the canvas's opacity from `1` to `0` as the user scrolls through the About section, completing the fade before the Featured Projects section enters the viewport — so there's no overlap/flash between the bust fading and Featured Projects appearing.
- This should feel like a smooth, seamless dissolve, not an abrupt cutoff — use `ease: 'power1.out'` or similar on the opacity tween, scrubbed to scroll (not a fixed-duration animation).
- Once fully faded out, set canvas to `pointer-events: none` and consider `display: none` or unmounting the RAF/draw loop entirely to save perf on the rest of the page.

## 7. Replacing existing code

- Locate the current "featured works" element behind the Name in the Hero section, along with whatever scroll trigger logic is currently attached to it.
- Remove that element and its associated scroll-trigger code cleanly (don't leave dead imports, unused refs, or orphaned CSS).
- Replace it with the new canvas + GSAP ScrollTrigger + Lenis-driven bust sequence, in the same DOM position/z-index layer (behind the Name/heading, in front of the Hero background).

## 8. Performance & cleanup

- Kill/revert the ScrollTrigger instance(s) and cancel any RAF loops on component unmount to avoid memory leaks (especially important if this is a React/Vue/etc. component-based codebase — use the appropriate lifecycle/cleanup hook).
- Throttle canvas redraws to only happen on actual frame-index change (don't redraw every scroll event tick if the rounded frame index hasn't changed).
- Ensure this doesn't block scroll performance — profile if possible, and use `will-change: opacity` sparingly on the canvas.

## 9. Responsiveness

- On resize, recalculate canvas dimensions and redraw the current frame (don't just stretch/distort).
- On smaller viewports (mobile), consider whether the full 121-frame scrub is desirable or whether a reduced/faster scrub range makes more sense given shorter viewport scroll distances — use your judgment, but keep the head from being cropped when it moves left.

## 10. Acceptance criteria

- Scrolling down from the very top smoothly scrubs the bust from straight-facing to left-tilted/left-positioned, tightly following scroll position (via Lenis + GSAP ScrollTrigger, scrubbed).
- No flash of missing frames, no layout jank.
- By the time Featured Projects enters the viewport, the bust has fully and smoothly faded out.
- Scrolling back up reverses the scrub correctly (since it's scrubbed, not just played once).
- Old "featured works" element and its scroll logic are fully removed with no leftover dead code.