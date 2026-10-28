(() => {
  const section = document.querySelector('.story-section');
  const canvas = document.getElementById('story-frame-canvas');
  const counter = document.getElementById('story-counter');
  const progress = document.getElementById('story-progress-fill');
  if (!section || !canvas) return;

  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const total = 103;
  const stops = [1, 11, 22, 33, 44, 55, 70, 81, 96, 103];
  const frameUrl = n => `assets/story-frames/frame-${String(n).padStart(3, '0')}.webp`;
  const frames = new Array(total + 1);
  let current = 1;
  let stopIndex = 0;
  let animating = false;
  let ready = false;
  let lastInputAt = 0;
  let touchStartY = null;
  let touchUsed = false;

  function sizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      draw(current);
    }
  }

  function draw(n) {
    current = Math.max(1, Math.min(total, n));
    const w = canvas.width, h = canvas.height;
    if (!w || !h) return;
    ctx.fillStyle = '#020202';
    ctx.fillRect(0, 0, w, h);
    const img = frames[current];
    if (img && img.complete && img.naturalWidth) {
      const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    }
    if (counter) counter.textContent = `${String(current).padStart(3, '0')} / ${total}`;
    if (progress) progress.style.width = `${((current - 1) / (total - 1)) * 100}%`;
  }

  function loadFrames() {
    const jobs = [];
    for (let n = 1; n <= total; n++) {
      jobs.push(new Promise(resolve => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => { frames[n] = img; resolve(); };
        img.onerror = () => resolve();
        img.src = frameUrl(n);
      }));
    }
    Promise.all(jobs).then(() => {
      ready = true;
      sizeCanvas();
      draw(current);
      section.classList.add('story-frames-ready');
    });
  }

  function isAligned() {
    return Math.abs(section.getBoundingClientRect().top) <= 8;
  }

  function playTo(target) {
    if (animating || !ready || target === current) return;
    animating = true;
    const from = current;
    const distance = Math.abs(target - from);
    // Moderate cinematic pacing: smooth enough to see the product turn, never a long wait.
    const duration = Math.min(1080, Math.max(480, 360 + distance * 31));
    const start = performance.now();

    const tick = now => {
      const t = Math.min(1, (now - start) / duration);
      // Quintic ease-in-out keeps movement gentle at both ends without feeling sluggish.
      const eased = t < 0.5
        ? 16 * t * t * t * t * t
        : 1 - Math.pow(-2 * t + 2, 5) / 2;
      const frame = Math.round(from + (target - from) * eased);
      if (frame !== current) draw(frame);
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        draw(target);
        stopIndex = stops.indexOf(target);
        animating = false;
      }
    };
    requestAnimationFrame(tick);
  }

  function canStep(direction) {
    const nextIndex = stopIndex + direction;
    return nextIndex >= 0 && nextIndex < stops.length;
  }

  function step(direction) {
    if (!ready || animating || !canStep(direction)) return false;
    playTo(stops[stopIndex + direction]);
    return true;
  }

  // While there are story beats left, one deliberate wheel gesture advances one beat.
  // At the first/last beat, native page scrolling is deliberately released (no preventDefault).
  window.addEventListener('wheel', event => {
    if (Math.abs(event.deltaY) < 2) return;
    const rect = section.getBoundingClientRect();
    const intersects = rect.bottom > 0 && rect.top < window.innerHeight;
    if (!intersects) return;

    const direction = event.deltaY > 0 ? 1 : -1;
    if (!isAligned()) {
      // Snap to the story only when entering it; don't trap the user when leaving it.
      const enteringFromAbove = direction > 0 && rect.top >= -8 && rect.top < window.innerHeight * 0.72;
      const enteringFromBelow = direction < 0 && rect.bottom <= window.innerHeight + 8 && rect.bottom > window.innerHeight * 0.28;
      if (enteringFromAbove || enteringFromBelow) {
        event.preventDefault();
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    // Crucial unlock: at frame 103 scrolling down, or frame 001 scrolling up, browser scroll is native.
    if (!canStep(direction)) return;

    event.preventDefault();
    const now = performance.now();
    if (animating || now - lastInputAt < 180) return;
    lastInputAt = now;
    step(direction);
  }, { passive: false });

  section.addEventListener('touchstart', event => {
    touchStartY = event.touches[0]?.clientY ?? null;
    touchUsed = false;
  }, { passive: true });

  section.addEventListener('touchmove', event => {
    if (touchStartY == null || !isAligned()) return;
    const y = event.touches[0]?.clientY ?? touchStartY;
    const delta = touchStartY - y;
    if (Math.abs(delta) < 42 || touchUsed) return;
    const direction = delta > 0 ? 1 : -1;
    // Leave native touch scrolling enabled at either end of the sequence.
    if (!canStep(direction)) return;
    touchUsed = true;
    event.preventDefault();
    const now = performance.now();
    if (animating || now - lastInputAt < 180) return;
    lastInputAt = now;
    step(direction);
  }, { passive: false });

  section.addEventListener('touchend', () => {
    touchStartY = null;
    touchUsed = false;
  }, { passive: true });

  window.addEventListener('keydown', event => {
    if (!isAligned()) return;
    let direction = 0;
    if (['ArrowDown', 'PageDown', ' '].includes(event.key)) direction = 1;
    else if (['ArrowUp', 'PageUp'].includes(event.key)) direction = -1;
    if (!direction || !canStep(direction)) return; // native keyboard scrolling at either endpoint
    event.preventDefault();
    if (!animating) step(direction);
  });

  if ('ResizeObserver' in window) new ResizeObserver(sizeCanvas).observe(canvas);
  else window.addEventListener('resize', sizeCanvas);
  sizeCanvas();
  loadFrames();
})();
