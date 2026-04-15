import { gsap } from 'gsap';

const MIN_WIDTH = 992;
const OFFSET = 20;

/**
 * Hover-Follow-Bild für `[data-follow]` > `img` (nur ab min-width 992px).
 * @returns {() => void}
 */
export function initCaseList() {
  const mq = window.matchMedia(`(min-width: ${MIN_WIDTH}px)`);
  let detachInner = null;

  const onMq = () => {
    if (mq.matches && !detachInner) {
      detachInner = attachFollowImages();
    } else if (!mq.matches && detachInner) {
      detachInner();
      detachInner = null;
    }
  };

  onMq();
  mq.addEventListener('change', onMq);

  return () => {
    mq.removeEventListener('change', onMq);
    if (detachInner) {
      detachInner();
      detachInner = null;
    }
  };
}

function attachFollowImages() {
  const cleanups = [];

  document.querySelectorAll('[data-follow]').forEach((el) => {
    const img = el.querySelector('img');
    if (!img) return;

    const getPos = (e) => {
      const rect = el.getBoundingClientRect();
      return {
        x: e.clientX - rect.left + OFFSET,
        y: e.clientY - rect.top + OFFSET,
      };
    };

    const onEnter = (e) => {
      const { x, y } = getPos(e);
      gsap.killTweensOf(img);
      gsap.set(img, {
        display: 'block',
        x,
        y,
        scale: 0,
        opacity: 0,
        transformOrigin: 'top left',
        willChange: 'transform, opacity',
      });
      gsap.to(img, {
        scale: 1,
        opacity: 1,
        duration: 0.45,
        ease: 'power3.out',
      });
    };

    const onMove = (e) => {
      const { x, y } = getPos(e);
      gsap.to(img, {
        x,
        y,
        duration: 0.25,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const onLeave = () => {
      gsap.killTweensOf(img);
      gsap.to(img, {
        scale: 0,
        opacity: 0,
        duration: 0.35,
        ease: 'power3.inOut',
        onComplete: () => gsap.set(img, { display: 'none' }),
      });
    };

    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);

    cleanups.push(() => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      gsap.killTweensOf(img);
      gsap.set(img, { clearProps: 'all' });
    });
  });

  return () => {
    cleanups.forEach((fn) => fn());
  };
}

export default initCaseList;
