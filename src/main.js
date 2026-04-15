// Haupt-Einstiegspunkt für die Anwendung
import './components/smooth-scorll.js';
import { initCustomCursor } from './components/cursor.js';
import { initCarousel } from './components/carousel.js';
import { initLiveTime } from './components/time.js';

initCustomCursor();
initCarousel();
initLiveTime();

console.log('✅ Main.js loaded');