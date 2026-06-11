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

/** Right-side drawer: slide in from the edge. */
export const drawerPanelVariants: Variants = {
  initial: { opacity: 0, x: 48 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.26, ease: EASE } },
  exit: { opacity: 0, x: 48, transition: { duration: 0.18, ease: 'easeIn' } },
};

/** Staggered list container + item, for card grids. */
export const staggerContainer: Variants = {
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE } },
};
