// One bundle for every page: the generated stylesheet, the site's original behaviour, then the motion layer.
import './styles/base.css';
import './styles/motion.css';
import './styles/theme.css';
import './legacy/site.js';
import { initMotion } from './motion/index.js';

initMotion();

// The tour is home-page only, so other pages never download it.
if (document.querySelector('.tour')) import('./tour/tour.js').then((m) => m.initTour());
