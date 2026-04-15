import { gsap } from 'gsap';

/**
 * GSAP-Seitenübergang: `.load_grid` / `.load_grid-item` (Slide-out beim Load, Slide-in vor Navigation).
 * Kein jQuery — gleiche Regeln für interne Links wie im Original.
 * @returns {() => void}
 */
export function initPageTransition() {
  const loader = document.querySelector('.load_grid');
  const items = document.querySelectorAll('.load_grid-item');

  if (!loader || items.length === 0) {
    return () => {};
  }

  const itemsArr = gsap.utils.toArray(items);
  const ac = new AbortController();
  const { signal } = ac;

  gsap.set(loader, { display: 'grid' });
  gsap.set(itemsArr, { opacity: 1, x: '0%' });

  gsap.to(itemsArr, {
    x: '100%',
    duration: 0.8,
    ease: 'power2.out',
    stagger: { amount: 0.5, from: 'start' },
    onComplete: () => gsap.set(loader, { display: 'none' }),
  });

  const bootFallback = window.setTimeout(() => {
    if (getComputedStyle(loader).display !== 'none') {
      loader.style.display = 'none';
    }
  }, 2000);

  const onPageShow = (event) => {
    if (event.persisted) window.location.reload();
  };
  window.addEventListener('pageshow', onPageShow, { signal });

  const onDocClick = (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const a = e.target.closest?.('a');
    if (!a) return;

    const hrefAttr = a.getAttribute('href');
    if (!hrefAttr || hrefAttr.includes('#')) return;
    if (a.hostname !== window.location.hostname) return;
    if (a.target === '_blank' || a.getAttribute('target') === '_blank') return;
    if (a.hasAttribute('download')) return;

    const dest = a.href;
    if (!dest || dest.startsWith('javascript:')) return;

    e.preventDefault();

    gsap.set(loader, { display: 'grid' });
    gsap.set(itemsArr, { opacity: 1, x: '-100%' });

    let navigated = false;
    const go = () => {
      if (navigated) return;
      navigated = true;
      window.location.href = dest;
    };

    gsap.to(itemsArr, {
      x: '0%',
      duration: 0.8,
      ease: 'power2.out',
      stagger: { amount: 0.5, from: 'start' },
      onComplete: go,
    });

    window.setTimeout(go, 1500);
  };

  document.addEventListener('click', onDocClick, { capture: true, signal });

  return () => {
    window.clearTimeout(bootFallback);
    gsap.killTweensOf([loader, ...itemsArr]);
    ac.abort();
  };
}

export default initPageTransition;
