// hero.js

// Import GSAP and ScrollTrigger plugin
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Wait for DOM to fully load before executing
document.addEventListener("DOMContentLoaded", () => {
  // Check if current page is the homepage; exit if not
  const isHomePage = document.querySelector(".page.home-page");
  if (!isHomePage) return;

  // Register ScrollTrigger plugin with GSAP
  gsap.registerPlugin(ScrollTrigger);

  const canvas = document.getElementById("hero-bust-canvas");
  const canvasContainer = document.querySelector(".hero-canvas-container");
  if (!canvas || !canvasContainer) return;

  const ctx = canvas.getContext("2d");
  const TOTAL_FRAMES = 121;
  const loadedImages = new Array(TOTAL_FRAMES);

  let currentFrameIndex = 0;
  let lastRenderedIndex = -1;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let dpr = 1;

  let scrubTween = null;
  let scrubScrollTrigger = null;
  let exitTween = null;
  let exitScrollTrigger = null;

  // Frame URL builder for sequential WebP assets
  const getFrameUrl = (index) => {
    const frameNum = String(index + 1).padStart(4, "0");
    return `/final_clean_frames/frame_${frameNum}.webp`;
  };

  // Draw frame with object-fit: contain scaling and retina crispness
  const drawFrame = (frameIndex) => {
    const img = loadedImages[frameIndex];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    // Clear canvas in logical coordinate space
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;
    const imgAspect = imgW / imgH;
    const canvasAspect = canvasWidth / canvasHeight;

    let drawW, drawH, drawX, drawY;

    // Object-fit contain logic to ensure the bust stays uncropped as it moves
    if (canvasAspect > imgAspect) {
      drawH = canvasHeight;
      drawW = canvasHeight * imgAspect;
      drawX = (canvasWidth - drawW) / 2;
      drawY = 0;
    } else {
      drawW = canvasWidth;
      drawH = canvasWidth / imgAspect;
      drawX = 0;
      drawY = (canvasHeight - drawH) / 2;
    }

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  };

  // Throttled frame rendering: only redraw when integer frame index changes or force requested
  const renderFrame = (frameIndex, force = false) => {
    const rounded = Math.min(
      TOTAL_FRAMES - 1,
      Math.max(0, Math.round(frameIndex))
    );
    if (rounded !== lastRenderedIndex || force) {
      lastRenderedIndex = rounded;
      drawFrame(rounded);
    }
  };

  // Recalculate canvas backing store and logical sizing for devicePixelRatio
  const resizeCanvas = () => {
    dpr = window.devicePixelRatio || 1;
    const rect = canvasContainer.getBoundingClientRect();
    canvasWidth = rect.width;
    canvasHeight = rect.height;

    canvas.width = Math.round(canvasWidth * dpr);
    canvas.height = Math.round(canvasHeight * dpr);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    renderFrame(currentFrameIndex, true);
  };

  // Preload all 121 WebP frames into memory array
  const preloadFrames = () => {
    return new Promise((resolve) => {
      // 1. Preload frame 0 first for immediate rendering
      const firstImg = new Image();
      firstImg.src = getFrameUrl(0);
      firstImg.onload = () => {
        loadedImages[0] = firstImg;
        resizeCanvas();
        renderFrame(0, true);

        // 2. Preload remaining 120 frames in the background
        let pending = TOTAL_FRAMES - 1;
        if (pending <= 0) {
          resolve();
          return;
        }

        for (let i = 1; i < TOTAL_FRAMES; i++) {
          const img = new Image();
          img.src = getFrameUrl(i);
          const onDone = () => {
            loadedImages[i] = img;
            pending--;
            if (pending === 0) {
              resolve();
            }
          };
          img.onload = onDone;
          img.onerror = onDone;
        }
      };

      firstImg.onerror = () => {
        resolve();
      };
    });
  };

  // Initialize ScrollTrigger scrub and exit animations
  const initScrollTriggers = () => {
    if (scrubScrollTrigger) scrubScrollTrigger.kill();
    if (scrubTween) scrubTween.kill();
    if (exitScrollTrigger) exitScrollTrigger.kill();
    if (exitTween) exitTween.kill();

    gsap.set(canvasContainer, {
      clearProps: "transform,opacity,visibility",
    });
    canvasContainer.style.opacity = "1";
    canvasContainer.style.visibility = "visible";

    const heroEl = document.querySelector(".hero");
    const aboutEl = document.querySelector(".about-hero");
    const featuredEl = document.querySelector(".featured-work");

    if (!heroEl) return;

    const frameObj = { frame: 0 };

    // 1. Bust scrub animation: Head turns from straight (0) to left-tilted (120)
    // Synchronized freely across the scroll distance from top of Hero to top of About (no pinning)
    scrubTween = gsap.to(frameObj, {
      frame: TOTAL_FRAMES - 1,
      ease: "none",
      scrollTrigger: {
        trigger: heroEl,
        start: "top top",
        endTrigger: aboutEl || heroEl,
        end: aboutEl ? "top top" : "bottom top",
        scrub: 0.5,
        onUpdate: () => {
          currentFrameIndex = frameObj.frame;
          renderFrame(frameObj.frame);
        },
      },
    });
    scrubScrollTrigger = scrubTween.scrollTrigger;

    // 2. Cinematic exit animation: Moves right, scales down slightly, and fades out
    // Starts the moment About begins scrolling away / Featured Projects starts entering the viewport
    if (featuredEl || aboutEl) {
      exitTween = gsap.to(canvasContainer, {
        opacity: 0,
        x: "15vw",
        scale: 0.85,
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: featuredEl || aboutEl,
          start: featuredEl ? "top bottom" : "top top",
          end: featuredEl ? "top top" : "bottom top",
          scrub: 0.5,
          onUpdate: (self) => {
            if (self.progress >= 0.999) {
              canvasContainer.style.visibility = "hidden";
            } else {
              canvasContainer.style.visibility = "visible";
            }
          },
        },
      });
      exitScrollTrigger = exitTween.scrollTrigger;
    }
  };

  // Handle window resizing with debounce/RAF
  window.addEventListener("resize", () => {
    resizeCanvas();
    ScrollTrigger.refresh();
  });

  // Preload frames and activate ScrollTriggers
  preloadFrames().then(() => {
    initScrollTriggers();
    ScrollTrigger.refresh();
  });
});