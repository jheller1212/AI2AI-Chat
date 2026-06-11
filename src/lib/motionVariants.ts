import type { Variants, Transition } from 'framer-motion';

const EASE: Transition['ease'] = [0.22, 1, 0.36, 1];

/** Dimmed backdrop fade for modals and drawers. */
export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** Centre dialog: subtle scale + lift. */
export const centerPanelVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: EASE } },
  exit: { opacity: 0, scale: 0.97, y: 6, transition: { duration: 0.14 } },
};

/** Right-side drawer: true edge-slide from off-screen right. */
export const drawerPanelVariants: Variants = {
  initial: { x: '100%' },
  animate: { x: 0, transition: { duration: 0.32, ease: EASE } },
  exit: { x: '100%', transition: { duration: 0.24, ease: 'easeIn' } },
};

/** App view transition (dashboard ↔ setup ↔ chat). Small offset — functional tool. */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.16, ease: 'easeIn' } },
};

/** Staggered list container + item, for card grids. */
export const staggerContainer: Variants = {
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE } },
};
