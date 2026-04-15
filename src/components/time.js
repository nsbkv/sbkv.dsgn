/**
 * Aktualisiert `#live-time` jede Sekunde (de-DE, HH:mm:ss).
 * Erwartet das Element im Host-Dokument (z. B. Webflow); sonst noop.
 */

const INTERVAL_MS = 1000;

/** @returns {() => void} */
export function initLiveTime() {
  const el = document.getElementById('live-time');
  if (!el) return () => {};

  const updateTime = () => {
    el.textContent = new Date().toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  updateTime();
  const id = window.setInterval(updateTime, INTERVAL_MS);

  return () => {
    window.clearInterval(id);
  };
}

export default initLiveTime;
