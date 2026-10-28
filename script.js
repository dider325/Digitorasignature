(() => {
  const $ = (selector) => document.querySelector(selector);
  const body = document.body;
  const loader = $('#loader');
  const progress = $('#loader-progress');
  const number = $('#loader-number');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const menuButton = $('.menu-toggle');
  const nav = $('.primary-nav');

  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    nav?.classList.toggle('open', open);
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Open navigation');
  }));

  function showAllWithoutGsap() {
    body.classList.add('is-ready');
    document.querySelectorAll('.hero .headline-left,.hero .headline-right,.hero .product-stage,.hero .topbar,.hero .side-label,.hero .intro-block,.hero .scroll-indicator,.hero .create-note,.hero .bottom-word,.hero .hero-index,.hero .netlify-pill').forEach(el => el.style.opacity = '1');
    loader?.classList.add('is-done');
    window.setTimeout(() => loader?.remove(), 950);
  }

  function runEntrance() {
    body.classList.add('is-ready');
    if (!window.gsap || reducedMotion) {
      showAllWithoutGsap();
      return;
    }
    const gsap = window.gsap;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    // Reuses the reference hero's entrance rhythm: opposing headline slides,
    // centered product reveal, oversized wordmark reveal, then utility details.
    tl.fromTo('.headline-left', { xPercent: -8, opacity: 0 }, { xPercent: 0, opacity: 1, duration: .85 }, 0)
      .fromTo('.headline-right', { xPercent: 8, opacity: 0 }, { xPercent: 0, opacity: 1, duration: .85 }, .32)
      .fromTo('.product-stage', { xPercent: -50, y: 42, opacity: 0 }, { xPercent: -50, y: 0, opacity: 1, duration: 1.05, ease: 'power2.out' }, .62)
      .fromTo('.bottom-word', { yPercent: 24, opacity: 0, clipPath: 'inset(35% 0 0 0)' }, { yPercent: 0, opacity: 1, clipPath: 'inset(0% 0 0 0)', duration: .85 }, 1.02)
      .fromTo('.topbar', { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: .55 }, 1.18)
      .fromTo('.side-label,.intro-block,.scroll-indicator,.create-note,.hero-index,.netlify-pill', { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .55, stagger: .07 }, 1.35);
  }

  const start = performance.now();
  const duration = reducedMotion ? 0 : 6000;
  let finished = false;
  const reveal = () => {
    if (finished) return;
    finished = true;
    body.classList.remove('is-loading');
    if (!window.gsap || reducedMotion) {
      showAllWithoutGsap();
    } else {
      loader?.classList.add('is-done');
      window.setTimeout(() => loader?.remove(), 950);
      runEntrance();
    }
  };
  const tick = now => {
    if (finished) return;
    const ratio = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
    if (progress) progress.style.width = `${Math.round(ratio * 100)}%`;
    if (number) number.textContent = String(Math.round(ratio * 100)).padStart(2, '0');
    if (ratio >= 1) reveal();
    else requestAnimationFrame(tick);
  };
  body.classList.add('is-loading');
  const safety = window.setTimeout(reveal, duration + 350);
  requestAnimationFrame(tick);
  window.addEventListener('pageshow', () => {
    if (!finished) { window.clearTimeout(safety); reveal(); }
  }, { once: true });
})();
