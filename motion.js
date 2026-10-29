(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const story = document.querySelector('.story-section');
  const isMobile = window.matchMedia('(max-width: 760px)').matches;
  let lenis = null;

  // Smooth the entire document with Lenis. The frame-by-frame story remains
  // native so its one-wheel-gesture-per-milestone controller stays in charge.
  if (!reduceMotion && typeof window.Lenis === 'function') {
    try {
      lenis = new window.Lenis({
        autoRaf: true,
        duration: 1.35,
        easing: t => 1 - Math.pow(1 - t, 4),
        smoothWheel: true,
        // Keep mobile touch scrolling native; Lenis smooths wheel/trackpad on desktop.
        syncTouch: false,
        wheelMultiplier: 0.9,
        touchMultiplier: 1,
        anchors: false,
        lerp: 0.085,
        prevent: node => Boolean(node && node.closest && node.closest('.story-section'))
      });
      document.documentElement.classList.add('lenis', 'lenis-smooth');
      document.body.classList.add('lenis-active');
      window.__jblLenis = lenis;

      document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', event => {
          const href = link.getAttribute('href');
          if (!href || href === '#') return;
          const target = document.querySelector(href);
          if (!target || (story && story.contains(link))) return;
          event.preventDefault();
          lenis.scrollTo(target, { offset: 0, duration: 1.35, easing: t => 1 - Math.pow(1 - t, 4) });
        });
      });
    } catch (error) {
      console.error('[JBL] Lenis failed to initialize:', error);
    }
  }

  // Soft, staggered section reveals as content enters the viewport.
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const revealTargets = document.querySelectorAll(
      '.about-label, .about-copy, .about-specs, .about-bottomline, .brand-heading, .brand-visual, .brand-feature-row > div, .cta-content, .footer-brand-block, .footer-statement, .footer-links-block'
    );
    revealTargets.forEach((el, index) => {
      el.classList.add('scroll-reveal');
      el.style.setProperty('--reveal-delay', `${(index % 3) * 90}ms`);
    });
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -7% 0px' });
    revealTargets.forEach(el => observer.observe(el));
  }

  // Subtle hero parallax; preserves the hero's existing layout and transforms.
  const hero = document.querySelector('.hero');
  if (!hero || reduceMotion) return;
  const layers = [
    [hero.querySelector('.headline-left'), .10, -.035],
    [hero.querySelector('.headline-right'), .15, .045],
    [hero.querySelector('.product-stage'), .19, 0],
    [hero.querySelector('.bottom-word'), -.10, 0],
    [hero.querySelector('.side-label.left-label'), .075, -.018],
    [hero.querySelector('.side-label.right-label'), .11, .018],
    [hero.querySelector('.intro-block'), .09, -.02],
    [hero.querySelector('.scroll-indicator'), .07, 0]
  ].filter(([el]) => el);
  let scheduled = false;
  const update = () => {
    const travel = Math.min(window.innerHeight * .72, Math.max(0, -hero.getBoundingClientRect().top));
    layers.forEach(([el, yf, xf]) => { el.style.translate = `${(travel * xf).toFixed(2)}px ${(travel * yf).toFixed(2)}px`; });
    const product = hero.querySelector('.product');
    if (product) product.style.translate = `0 ${(travel * -.035).toFixed(2)}px`;
    scheduled = false;
  };
  const schedule = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  update();
})();
