// Haupt-Einstiegspunkt für die Anwendung
import './components/smooth-scorll.js';
import { initCustomCursor } from './components/cursor.js';
import { initCarousel } from './components/carousel.js';
import { initLiveTime } from './components/time.js';
import { initCaseList } from './components/case-list.js';

initCustomCursor();
initCarousel();
initLiveTime();
initCaseList();

console.log('✅ Main.js loaded');