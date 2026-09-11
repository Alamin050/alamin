# Follow-up Prompt: Fix About-Hero Layout Overlap + Exit Trigger Timing

Two more fixes needed on top of the existing marble bust scroll implementation.

---

## Issue 1: About-hero text content overlaps the marble bust — needs to shift left

**Current (buggy) behavior:** In the About-hero section (see attached screenshot), the bust is resting in its final tilted pose on the right side of the screen, but the About content (heading "HI, I'M ALAMIN", the profile photo, the bio paragraph, and the "CODE / DESIGN / CRAFT / REPEAT" line) is positioned such that it overlaps/collides with the bust — the bio text runs underneath/behind the bust's jaw and neck, and the profile photo sits right against the bust's face, both partially obscured/crowded.

**Desired behavior:** Shift the entire About-hero content block (heading, profile photo, bio paragraph, tagline) further to the left so it sits cleanly clear of the bust's final resting position, with no text or image overlapping the bust. There should be clean visual separation between the two — the bust occupies the right portion of the viewport, the text content occupies the left portion, with a comfortable gap between them.

**Implementation notes:**
- Locate the About-hero section's content container and adjust its layout (reduce its width/max-width, add `padding-right` or `margin-right`, or shift it via flexbox/grid column allocation) so it's constrained to the left ~50-55% of the viewport instead of centering/spanning wide enough to reach where the bust sits.
- Check the bio paragraph specifically — right now it appears to span nearly the full width and run under the bust; it should wrap within the narrower left-aligned column instead.
- Verify this doesn't break the layout at the point where the bust hasn't fully appeared yet (earlier in the Hero section) — this shift should apply specifically to the About-hero section's content, not accidentally affect the Hero section above it, unless the same content also currently appears there and needs the same treatment.
- Confirm responsiveness — on smaller viewports where there may not be room for a stacked bust + left-aligned text, check whether the bust is hidden/adjusted already (per earlier responsiveness notes) and make sure the text reflows to full width in that case rather than staying artificially narrow.

---

## Issue 2: Bust's disappearing sequence (fade + shrink + translate) starts too late, causing overlap with Featured Projects section

**Current (buggy) behavior:** After the About-hero section reaches its resting state (bust fully tilted, About content visible), scrolling further causes the About section to scroll up and away — but the bust does NOT begin its exit animation (fade/shrink/translate-right) until the About section is almost completely scrolled past. This means the Featured Projects section starts appearing on screen *before* the bust has started disappearing, so for a stretch of scroll, the bust is still fully visible while Featured Projects content is already overlapping/appearing behind or alongside it — looking broken.

**Desired behavior:** The bust's exit sequence (opacity fade, rightward translate, scale-down — all three together, as already implemented) should begin the moment the About-hero section starts scrolling away / Featured Projects starts entering the viewport — not later. In other words, the exit animation and the About→Featured-Projects section transition should be in sync and start together, so the bust is actively disappearing during the same scroll range that Featured Projects is arriving, and should be fully gone (opacity 0) by the time Featured Projects is settled/fully in view.

**Implementation notes:**
- This is a ScrollTrigger start-point timing fix on the existing exit timeline (the one built for the previous fade/translate/scale fix).
- Move the `start` value earlier. Currently it's likely set to something like `start: 'bottom bottom'` or `start: 'bottom center'` on the About section (triggering only once About has almost fully scrolled past) — change this to trigger right as the About section begins leaving the viewport / Featured Projects begins entering, e.g. `start: 'bottom top'` on the About section, or `start: 'top bottom'` on the Featured Projects section itself (pick whichever anchor is more reliable given the current DOM/section structure — inspect and adjust).
- Keep the `end` point as-is (or verify it still lines up) so the full exit — fade, shrink, translate — completes right as Featured Projects is fully settled in view, giving a longer, smoother exit runway rather than a rushed one.
- Re-verify `scrub` is still tightly tied to scroll (no jump/pop when the trigger point changes) and that reversing scroll (scrolling back up from Featured Projects into About) smoothly brings the bust back in sync with the section transition reversing.
- Double check there's no dead zone or overlap between the end of the frame-scrub ScrollTrigger (Hero → About, from the earlier fix) and the start of this exit ScrollTrigger — the bust should hold its fully-tilted resting pose calmly through the middle of the About section, then transition into the exit only as About starts leaving, with no gap or premature trigger in between.

---

## Acceptance criteria

- About-hero text content (heading, photo, bio, tagline) is fully clear of the bust with no overlapping text/image elements.
- As soon as the About section starts scrolling away and Featured Projects starts entering, the bust visibly begins fading, shrinking, and moving right — in sync, not delayed.
- At no point is Featured Projects content visible on screen at the same time the bust is still at full opacity/size — the exit should already be underway before Featured Projects arrives.
- The bust is fully gone (opacity 0, no longer interactable/rendered) by the time Featured Projects is fully settled in the viewport.
- Scrolling back up reverses both fixes correctly: text stays left-aligned/clear of the bust throughout, and the bust reappears in sync as Featured Projects scrolls back out and About scrolls back into view.