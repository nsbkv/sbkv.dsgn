/**
 * Erwartet im Host (z. B. Webflow): `#cursorCanvas`, `#cursorLabel`; Layout/CSS extern.
 * Optional: `html.custom-cursor` per CSS für `cursor: none` auf Desktop.
 */

const SAFE_SEL =
  'a[href],button,input:not([type=hidden]),textarea,select,[role=button]';

/** @param {Record<string, unknown>} [o] */
export function initCustomCursor(o = {}) {
  const color = o.color ?? '#ff0015';
  const base = o.base ?? 10;
  const nSeg = o.segments ?? 18;
  const eHead = o.eHead ?? 0.45;
  const eSeg = o.eSeg ?? 0.35;
  const maxW = o.maxWidth ?? 991;
  const dpr = Math.min(o.dprCap ?? 2, window.devicePixelRatio || 1);
  const safe = o.safeSel ?? SAFE_SEL;

  const canvas = document.getElementById('cursorCanvas');
  const label = document.getElementById('cursorLabel');
  const ctx = canvas?.getContext('2d') ?? null;
  if (!canvas || !ctx || !label) return null;

  const mq = matchMedia(`(max-width: ${maxW}px)`);
  const root = document.documentElement;
  const CURSOR_CLS = 'custom-cursor';
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  const segs = Array.from({ length: nSeg }, () => ({ x: mouse.x, y: mouse.y }));
  const explosions = [];
  const moveOpts = { passive: true };
  const GRAV = 900;

  let interEl = null;
  let rot = 0;
  let tRot = 0;
  let lt = performance.now();
  let rafId = 0;

  const toggleVis = (e) => {
    const on = !e.matches;
    canvas.style.display = on ? 'block' : 'none';
    label.style.display = on ? 'block' : 'none';
    root.classList.toggle(CURSOR_CLS, on);
  };

  const resize = () => {
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const closest = (el) => {
    if (!el || el.closest('[data-cursor-ignore]')) return null;
    const byText = el.closest('[data-cursor-text]');
    if (byText) return byText;
    const bySafe = el.closest(safe);
    if (bySafe) return bySafe;
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      if (n.hasAttribute?.('tabindex') && n.getAttribute('tabindex') !== '-1') return n;
    }
    return null;
  };

  const showLabel = (x, y, text) => {
    label.textContent = text;
    let lx = x + 24;
    let ly = y - 10;
    const w = label.offsetWidth || 100;
    const h = label.offsetHeight || 20;
    if (lx + w > innerWidth - 6) lx = innerWidth - w - 6;
    if (ly < 6) ly = 6;
    if (ly + h > innerHeight - 6) ly = innerHeight - h - 6;
    label.style.transform = `translate(${lx}px,${ly}px)`;
    label.style.opacity = '1';
  };

  const onMove = (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    const found = closest(document.elementFromPoint(e.clientX, e.clientY));
    if (found) {
      interEl = found;
      if (found.closest('[data-cursor-no-label]')) label.style.opacity = '0';
      else
        showLabel(
          e.clientX,
          e.clientY,
          found.getAttribute('data-cursor-text') || found.ariaLabel || found.title || 'Click',
        );
      tRot = Math.PI / 4;
    } else {
      interEl = null;
      label.style.opacity = '0';
      tRot = 0;
    }
  };

  const burst = (x, y) => {
    const parts = Array.from({ length: 20 }, () => {
      const ang = Math.random() * Math.PI * 2;
      const sp = 100 + Math.random() * 100;
      return {
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: 0.5 + Math.random() * 0.4,
        size: 3 + Math.random() * 4,
        alpha: 1,
      };
    });
    explosions.push(parts);
  };

  const loop = (nt) => {
    rafId = requestAnimationFrame(loop);
    const dt = Math.min(0.03, (nt - lt) / 1000);
    lt = nt;
    if (mq.matches) return;

    const W = innerWidth;
    const H = innerHeight;
    ctx.clearRect(0, 0, W, H);

    segs[0].x += (mouse.x - segs[0].x) * eHead;
    segs[0].y += (mouse.y - segs[0].y) * eHead;
    for (let i = 1; i < segs.length; i++) {
      segs[i].x += (segs[i - 1].x - segs[i].x) * eSeg;
      segs[i].y += (segs[i - 1].y - segs[i].y) * eSeg;
    }

    const denom = Math.max(1, segs.length - 1);
    for (let i = 0; i < segs.length; i++) {
      const t = i / denom;
      const s = Math.max(1.5, base * (1 - t * 0.6));
      ctx.globalAlpha = Math.max(0, 1 - t * 1.1);
      ctx.fillStyle = color;
      const p = segs[i];
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }

    rot += (tRot - rot) * 0.15;
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    const headS = base * (interEl ? 1.8 : 1);
    ctx.save();
    ctx.translate(mouse.x, mouse.y);
    ctx.rotate(rot);
    ctx.fillRect(-headS / 2, -headS / 2, headS, headS);
    ctx.restore();

    for (let i = explosions.length - 1; i >= 0; i--) {
      const ps = explosions[i];
      let alive = 0;
      for (const q of ps) {
        q.vy += GRAV * dt;
        q.vx *= 0.985;
        q.vy *= 0.985;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.life -= dt;
        q.alpha = Math.max(0, q.life * 2);
        if (q.alpha <= 0) continue;
        alive++;
        ctx.globalAlpha = q.alpha;
        ctx.fillStyle = color;
        const qs = Math.max(1, q.size * q.alpha);
        ctx.fillRect(q.x - qs / 2, q.y - qs / 2, qs, qs);
      }
      if (!alive) explosions.splice(i, 1);
    }
  };

  mq.addEventListener('change', toggleVis);
  toggleVis(mq);
  resize();
  window.addEventListener('resize', resize);
  const onDown = () => burst(mouse.x, mouse.y);
  window.addEventListener('mousemove', onMove, moveOpts);
  window.addEventListener('mousedown', onDown);
  rafId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(rafId);
    mq.removeEventListener('change', toggleVis);
    window.removeEventListener('resize', resize);
    window.removeEventListener('mousemove', onMove, moveOpts);
    window.removeEventListener('mousedown', onDown);
    root.classList.remove(CURSOR_CLS);
    canvas.style.display = '';
    label.style.display = '';
    label.style.opacity = '';
    label.style.transform = '';
  };
}

export default initCustomCursor;



/* (() => {
  // ---- базовая настройка ----
  const c = document.getElementById('cursorCanvas');
  const ctx = c.getContext('2d');
  const label = document.getElementById('cursorLabel');
  const color = '#ff0015'; // цвет курсора и эффектов
  const base = 10; // размер квадрата курсора
  const SEGMENTS = 18; // длина хвоста
  const E_HEAD = 0.45; // скорость головы к мыши
  const E_SEG = 0.35; // следование сегментов
  const safeSel = 'a[href],button,input:not([type=hidden]),textarea,select,[role=button]';

  // скрыть курсор < 992px
  const mq = matchMedia('(max-width: 991px)');

  function toggleVisibility(e) {
    const on = !e.matches;
    c.style.display = on ? 'block' : 'none';
    label.style.display = on ? 'block' : 'none';
  }
  mq.addEventListener('change', toggleVisibility);
  toggleVisibility(mq);

  // DPR/resize
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  function resize() {
    c.width = innerWidth * dpr;
    c.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener('resize', resize);

  // состояние
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  let interEl = null,
    rot = 0,
    tRot = 0;
  const segs = Array.from({ length: SEGMENTS }, () => ({ x: mouse.x, y: mouse.y }));
  const explosions = [];

  // утилиты интерактива
  function getClosestInteractive(el) {
    if (!el) return null;
    if (el.closest('[data-cursor-ignore]')) return null; // полностью отключить
    const withLabel = el.closest('[data-cursor-text]'); // элемент с текстом
    if (withLabel) return withLabel;
    const bySafe = el.closest(safeSel); // стандартные интерактивы
    if (bySafe) return bySafe;
    // ручная проверка tabindex != -1
    let n = el;
    while (n && n !== document.body) {
      if (n.hasAttribute && n.hasAttribute('tabindex') && n.getAttribute('tabindex') !== '-1')
        return n;
      n = n.parentElement;
    }
    return null;
  }

  function showLabel(x, y, text) {
    label.textContent = text;
    let lx = x + 24,
      ly = y - 10;
    const w = label.offsetWidth || 100,
      h = label.offsetHeight || 20;
    if (lx + w > innerWidth - 6) lx = innerWidth - w - 6;
    if (ly < 6) ly = 6;
    if (ly + h > innerHeight - 6) ly = innerHeight - h - 6;
    label.style.transform = `translate(${lx}px,${ly}px)`;
    label.style.opacity = '1';
  }

  function hideLabel() { label.style.opacity = '0'; }

  // ввод
  addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const found = getClosestInteractive(el);
    if (found) {
      interEl = found;
      // если стоит data-cursor-no-label — показываем ромб, но скрываем лейбл
      if (found.closest('[data-cursor-no-label]')) {
        hideLabel();
      } else {
        const txt = found.getAttribute('data-cursor-text') || found.ariaLabel || found
          .title || 'Click';
        showLabel(e.clientX, e.clientY, txt);
      }
      tRot = Math.PI / 4; // ромб
    } else {
      interEl = null;
      hideLabel();
      tRot = 0; // квадрат
    }
  }, { passive: true });

  addEventListener('mousedown', () => burst(mouse.x, mouse.y));

  // клик-взрыв
  function burst(x, y) {
    const parts = [];
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2,
        s = 100 + Math.random() * 100;
      parts.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.5 + Math.random() *
          0.4,
        size: 3 + Math.random() * 4,
        alpha: 1
      });
    }
    explosions.push(parts);
  }

  // цикл
  let lt = performance.now();
  (function loop(nt) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.03, (nt - lt) / 1000);
    lt = nt;

    // полностью выходим, если ширина < 992px
    if (mq.matches) return;

    ctx.clearRect(0, 0, innerWidth, innerHeight);

    // хвост
    segs[0].x += (mouse.x - segs[0].x) * E_HEAD;
    segs[0].y += (mouse.y - segs[0].y) * E_HEAD;
    for (let i = 1; i < segs.length; i++) {
      segs[i].x += (segs[i - 1].x - segs[i].x) * E_SEG;
      segs[i].y += (segs[i - 1].y - segs[i].y) * E_SEG;
    }
    for (let i = 0; i < segs.length; i++) {
      const t = i / (segs.length - 1);
      const s = Math.max(1.5, base * (1 - t * 0.6));
      const a = Math.max(0, 1 - t * 1.1);
      ctx.globalAlpha = a;
      ctx.fillStyle = color;
      const p = segs[i];
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }

    // поворот курсора
    rot += (tRot - rot) * 0.15;
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    const k = interEl ? 1.8 : 1,
      s = base * k;
    ctx.save();
    ctx.translate(mouse.x, mouse.y);
    ctx.rotate(rot);
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.restore();

    // взрывы
    const GRAV = 900;
    for (let i = explosions.length - 1; i >= 0; i--) {
      const ps = explosions[i];
      let alive = 0;
      for (const q of ps) {
        q.vy += GRAV * dt;
        q.vx *= .985;
        q.vy *= .985;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.life -= dt;
        q.alpha = Math.max(0, q.life * 2);
        if (q.alpha > 0) {
          alive++;
          ctx.globalAlpha = q.alpha;
          ctx.fillStyle = color;
          const qs = Math.max(1, q.size * q.alpha);
          ctx.fillRect(q.x - qs / 2, q.y - qs / 2, qs, qs);
        }
      }
      if (!alive) explosions.splice(i, 1);
    }
  })(performance.now());
})(); */
