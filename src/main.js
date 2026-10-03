// One bundle for every page: the generated stylesheet, the site's original behaviour, then the motion layer.
import './styles/base.css';
import './styles/motion.css';
import './legacy/site.js';
import { initMotion } from './motion/index.js';

initMotion();
