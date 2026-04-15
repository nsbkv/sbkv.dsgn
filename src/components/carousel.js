/**
 * Unendliches vertikales Galerie-Scroll (`.ig` / `.ig__track` / Spalten A & B).
 * Aktiv nur ab MIN_WIDTH; bei schmalerem Viewport vollständiges Teardown.
 */

/** @returns {() => void} Gesamt-Dispose (Breakpoint-Listener + laufendes Modul) */
export function initCarousel() {
  const MIN_WIDTH = 992;

  let enabled = false;
  let teardown = null;

  function maybeToggle() {
    const wide = window.innerWidth >= MIN_WIDTH;
    if (wide && !enabled) {
      enabled = true;
      teardown = startModule();
    } else if (!wide && enabled) {
      enabled = false;
      if (typeof teardown === 'function') teardown();
      teardown = null;
    }
  }

  maybeToggle();
  window.addEventListener('resize', maybeToggle);
  window.addEventListener('orientationchange', maybeToggle);

  return () => {
    window.removeEventListener('resize', maybeToggle);
    window.removeEventListener('orientationchange', maybeToggle);
    if (typeof teardown === 'function') teardown();
    teardown = null;
    enabled = false;
  };
}

function startModule() {
  const DEFAULT_SPEED = 60;
  const MAX_MEASURE_RETRIES = 20;
  const MEASURE_RETRY_DELAY = 100;

  const sign = (v) => (v === 0 ? 0 : v > 0 ? 1 : -1);

  function normalizeWheelDelta(e) {
    if (e.deltaMode === 1) return e.deltaY * 16;
    if (e.deltaMode === 2) return e.deltaY * window.innerHeight;
    return e.deltaY;
  }

  function imgReadyPromises(imgs) {
    return imgs.map((img) => {
      try {
        img.loading = 'eager';
      } catch (_) {}
      try {
        img.decoding = 'sync';
      } catch (_) {}
      if (img.complete && img.naturalWidth > 0) {
        return typeof img.decode === 'function' ? img.decode().catch(() => {}) : Promise.resolve();
      }
      return new Promise((res) => {
        const done = () => res();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }).then(() => (typeof img.decode === 'function' ? img.decode().catch(() => {}) : undefined));
    });
  }

  const root = document.querySelector('.ig');
  const track = root?.querySelector('.ig__track');
  const colA = root?.querySelector('.ig__column--a');
  const colB = root?.querySelector('.ig__column--b');

  if (!root || !track || !colA || !colB) {
    return () => {};
  }

  const wheelOpts = { passive: false };
  const touchStartOpts = { passive: true };
  const touchMoveOpts = { passive: false };
  const touchEndOpts = { passive: true };

  const teardownObservers = [];

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let speed = Number(root.getAttribute('data-speed')) || DEFAULT_SPEED;
  if (reduced) speed = 0;

  let contentHeight = 0;
  let offset = 0;
  let dir = 1;
  let lastT = performance.now();
  let running = false;
  let started = false;
  let rafId = 0;

  function cloneColumn() {
    colB.innerHTML = '';
    colB.appendChild(colA.cloneNode(true));
    const inner = colB.querySelector('.ig__column--a');
    if (inner) {
      while (inner.firstChild) colB.appendChild(inner.firstChild);
      inner.remove();
    }
  }

  function measureOnce() {
    contentHeight = Math.ceil(colA.getBoundingClientRect().height);
    return contentHeight;
  }

  function ensureMeasured() {
    return new Promise((resolve) => {
      let tries = 0;
      (function tick() {
        const h = measureOnce();
        if (h > 0 || tries >= MAX_MEASURE_RETRIES) resolve(h);
        else {
          tries++;
          setTimeout(tick, MEASURE_RETRY_DELAY);
        }
      })();
    });
  }

  function layout() {
    track.style.transform = `translate3d(0, ${-offset}px, 0)`;
  }

  function loop(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;

    offset += dir * speed * dt;
    if (contentHeight > 0) {
      if (offset >= contentHeight) offset -= contentHeight;
      if (offset < 0) offset += contentHeight;
    } else {
      offset = 0;
    }
    layout();
    rafId = requestAnimationFrame(loop);
  }

  function startAnim() {
    if (running) return;
    running = true;
    lastT = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  function stopAnim() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  }

  function onWheel(e) {
    e.preventDefault();
    const dy = normalizeWheelDelta(e);
    if (!dy) return;
    dir = sign(dy);
    offset += dy;

    if (contentHeight > 0) {
      offset %= contentHeight;
      if (offset < 0) offset += contentHeight;
    }
    layout();
  }

  function onKey(e) {
    if (
      e.key !== 'ArrowDown' &&
      e.key !== 'ArrowUp' &&
      e.key !== 'PageDown' &&
      e.key !== 'PageUp' &&
      e.key !== 'Home' &&
      e.key !== 'End'
    )
      return;
    e.preventDefault();

    let delta = 0;
    if (e.key === 'ArrowDown') delta = 60;
    if (e.key === 'ArrowUp') delta = -60;
    if (e.key === 'PageDown') delta = window.innerHeight * 0.8;
    if (e.key === 'PageUp') delta = -window.innerHeight * 0.8;
    if (e.key === 'Home') delta = -contentHeight;
    if (e.key === 'End') delta = contentHeight;

    if (delta) {
      dir = sign(delta);
      offset += delta;

      if (contentHeight > 0) {
        offset %= contentHeight;
        if (offset < 0) offset += contentHeight;
      }
      layout();
    }
  }

  let touchActive = false;
  let touchLastY = 0;

  function onTouchStart(e) {
    if (!e.touches || e.touches.length === 0) return;
    touchActive = true;
    touchLastY = e.touches[0].clientY;
  }

  function onTouchMove(e) {
    if (!touchActive || !e.touches || e.touches.length === 0) return;
    const y = e.touches[0].clientY;
    const dy = touchLastY - y;
    if (dy) {
      dir = sign(dy);
      offset += dy;

      if (contentHeight > 0) {
        offset %= contentHeight;
        if (offset < 0) offset += contentHeight;
      }
      layout();
      touchLastY = y;
    }
  }

  function onTouchEnd() {
    touchActive = false;
  }

  let visHandler;
  let resizeHandler;
  let orientHandler;
  let moColA;

  function afterMeasured() {
    offset = 0;

    track.style.willChange = 'transform';
    track.style.contain = 'layout paint';

    root.addEventListener('wheel', onWheel, wheelOpts);
    root.addEventListener('keydown', onKey);
    root.setAttribute('tabindex', '0');
    root.style.outline = 'none';
    root.addEventListener('touchstart', onTouchStart, touchStartOpts);
    root.addEventListener('touchmove', onTouchMove, touchMoveOpts);
    root.addEventListener('touchend', onTouchEnd, touchEndOpts);

    layout();
    started = true;
    startAnim();

    visHandler = () => {
      if (document.hidden) stopAnim();
      else startAnim();
    };
    document.addEventListener('visibilitychange', visHandler);

    let resizeRaf = 0;
    resizeHandler = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        measureOnce();
        if (contentHeight > 0) {
          offset %= contentHeight;
          if (offset < 0) offset += contentHeight;
        }
        layout();
      });
    };
    orientHandler = resizeHandler;

    window.addEventListener('resize', resizeHandler);
    window.addEventListener('orientationchange', orientHandler);

    const mo = new MutationObserver(async (mutations) => {
      let need = false;
      for (const m of mutations) {
        if (m.type === 'childList' || (m.type === 'attributes' && m.target.tagName === 'IMG')) {
          need = true;
          break;
        }
      }
      if (!need) return;
      const imgs = Array.from(colA.querySelectorAll('img'));
      if (imgs.length) await Promise.all(imgReadyPromises(imgs));
      cloneColumn();
      await ensureMeasured();
      if (contentHeight > 0) {
        offset %= contentHeight;
        if (offset < 0) offset += contentHeight;
      }
      layout();
    });
    mo.observe(colA, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'style'],
    });

    teardownObservers.push(() => {
      mo.disconnect();
    });
  }

  async function initCore() {
    const imgs = Array.from(colA.querySelectorAll('img'));
    if (imgs.length) await Promise.all(imgReadyPromises(imgs));

    if (measureOnce() < window.innerHeight + 1) {
      let safety = 20;
      while (contentHeight < window.innerHeight * 1.5 && safety-- > 0) {
        const clones = Array.from(colA.querySelectorAll('img')).map((img) => {
          const c = img.cloneNode(true);
          c.removeAttribute('id');
          return c;
        });
        clones.forEach((n) => colA.appendChild(n));
        measureOnce();
      }
    }

    cloneColumn();

    await ensureMeasured();
    if (contentHeight === 0) {
      moColA = new MutationObserver(async () => {
        await ensureMeasured();
        if (contentHeight > 0) {
          moColA.disconnect();
          moColA = null;
          afterMeasured();
        }
      });
      moColA.observe(colA, { childList: true, subtree: true, attributes: true });
      return false;
    }

    afterMeasured();
    return true;
  }

  initCore();

  return function teardownAll() {
    stopAnim();

    try {
      root.removeEventListener('wheel', onWheel, wheelOpts);
      root.removeEventListener('keydown', onKey);
      root.removeEventListener('touchstart', onTouchStart, touchStartOpts);
      root.removeEventListener('touchmove', onTouchMove, touchMoveOpts);
      root.removeEventListener('touchend', onTouchEnd, touchEndOpts);
    } catch (_) {}

    try {
      if (visHandler) document.removeEventListener('visibilitychange', visHandler);
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      if (orientHandler) window.removeEventListener('orientationchange', orientHandler);
    } catch (_) {}

    teardownObservers.forEach((fn) => {
      try {
        fn();
      } catch (_) {}
    });
    if (moColA) {
      try {
        moColA.disconnect();
      } catch (_) {}
      moColA = null;
    }

    try {
      track.style.transform = '';
      track.style.willChange = '';
      track.style.contain = '';
    } catch (_) {}

    started = false;
  };
}

export default initCarousel;
