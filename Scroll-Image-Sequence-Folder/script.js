(() => {
  "use strict";

  const FRAME_COUNT = 150;
  const FRAME_PATH = (i) => `frames/${String(i).padStart(4, "0")}.jpg`;
  const PRELOAD_BLOCKING_COUNT = 10;
  const MAX_DPR = 2;

  const section = document.getElementById("sequence-section");
  const sticky = document.getElementById("sequence-sticky");
  const canvas = document.getElementById("sequence-canvas");
  const ctx = canvas.getContext("2d");

  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Frame index 1..FRAME_COUNT -> Image object (or null until loaded)
  const images = new Array(FRAME_COUNT + 1).fill(null);

  let currentIndex = -1; // last drawn frame index (1-based), -1 = nothing drawn yet
  let targetIndex = 1;
  let needsRedraw = false;
  let rafScheduled = false;

  function loadImage(frameNumber) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        images[frameNumber] = img;
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = FRAME_PATH(frameNumber);
    });
  }

  function sizeCanvasToDisplay() {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const rect = sticky.getBoundingClientRect();
    const displayWidth = Math.max(1, Math.round(rect.width));
    const displayHeight = Math.max(1, Math.round(rect.height));
    const targetW = Math.round(displayWidth * dpr);
    const targetH = Math.round(displayHeight * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
  }

  function drawFrame(frameNumber) {
    const img = images[frameNumber];
    if (!img) return;

    const cw = canvas.width;
    const ch = canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    // contain-fit: ganzes Bild sichtbar, mittig, Letterbox
    const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const dx = (cw - drawW) / 2;
    const dy = (ch - drawH) / 2;

    ctx.drawImage(img, dx, dy, drawW, drawH);
  }

  function requestDraw(frameNumber) {
    targetIndex = frameNumber;
    if (targetIndex === currentIndex) return;
    needsRedraw = true;
    scheduleRaf();
  }

  function scheduleRaf() {
    if (rafScheduled) return;
    rafScheduled = true;
    requestAnimationFrame(() => {
      rafScheduled = false;
      if (!needsRedraw) return;
      needsRedraw = false;
      if (targetIndex === currentIndex) return;
      if (!images[targetIndex]) return; // not loaded yet, keep last drawn frame
      drawFrame(targetIndex);
      currentIndex = targetIndex;
    });
  }

  function computeProgress() {
    const rect = section.getBoundingClientRect();
    const scrollable = section.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    const p = -rect.top / scrollable;
    return Math.min(1, Math.max(0, p));
  }

  function onScroll() {
    const p = computeProgress();
    const frameNumber = Math.round(p * (FRAME_COUNT - 1)) + 1; // 1-based index
    requestDraw(frameNumber);
  }

  function onResize() {
    sizeCanvasToDisplay();
    // Nach Resize bleibt der Canvas sonst leer, weil sich der Index nicht
    // geaendert hat -> erzwungen neu zeichnen.
    currentIndex = -1;
    const p = computeProgress();
    const frameNumber = Math.round(p * (FRAME_COUNT - 1)) + 1;
    targetIndex = frameNumber;
    if (images[frameNumber]) {
      drawFrame(frameNumber);
      currentIndex = frameNumber;
    }
  }

  async function loadRemainingInBackground(startFrom) {
    for (let i = startFrom; i <= FRAME_COUNT; i++) {
      if (images[i]) continue;
      await loadImage(i);
      // Falls waehrend des Nachladens genau dieser Frame Ziel ist, zeichnen.
      if (i === targetIndex && i !== currentIndex) {
        needsRedraw = true;
        scheduleRaf();
      }
    }
  }

  async function initFullMotion() {
    sizeCanvasToDisplay();

    const blockingCount = Math.min(PRELOAD_BLOCKING_COUNT, FRAME_COUNT);
    const blockingLoads = [];
    for (let i = 1; i <= blockingCount; i++) {
      blockingLoads.push(loadImage(i));
    }
    await Promise.all(blockingLoads);

    drawFrame(1);
    currentIndex = 1;

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    // Rest der Frames in Hintergrund-Queue nachladen.
    loadRemainingInBackground(blockingCount + 1);
  }

  async function initReducedMotion() {
    sizeCanvasToDisplay();
    await loadImage(1);
    drawFrame(1);
    currentIndex = 1;
    window.addEventListener("resize", onResize);
  }

  function init() {
    if (reduceMotionQuery.matches) {
      initReducedMotion();
    } else {
      initFullMotion();
    }
  }

  init();
})();
