import Lenis from 'lenis'

// 1. Lenis Instanz initialisieren
const lenis = new Lenis({
  duration: 1.2, // Dauer der Scroll-Animation in Sekunden
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Mathematische Funktion für geschmeidiges Scrollen
  direction: 'vertical', // Scroll-Richtung festlegen
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1, // Empfindlichkeit des Mausrads
  infinite: false, // Endloses Scrollen deaktivieren
})

// 2. Den Animations-Loop (RAF) erstellen
// Diese Funktion sorgt dafür, dass Lenis bei jedem Frame aktualisiert wird
function raf(time) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}

// Den Loop starten
requestAnimationFrame(raf)

// 3. Überprüfung in der Konsole
console.log('✅ Lenis Smooth Scroll ist aktiv');

export default lenis;