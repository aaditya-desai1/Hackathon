// Animation variants for Framer Motion

// Fade in animation
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 }
  }
};

// Slide in from left animation (very subtle)
export const slideInLeft = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { 
      type: "tween",
      duration: 0.2
    }
  }
};

// Slide in from right animation (very subtle)
export const slideInRight = {
  hidden: { opacity: 0, x: 10 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { 
      type: "tween",
      duration: 0.2
    }
  }
};

// Slide in from bottom animation (very subtle)
export const slideInBottom = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { 
      type: "tween",
      duration: 0.2
    }
  }
};

// Scale up animation (very subtle)
export const scaleUp = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      type: "tween",
      duration: 0.2
    }
  }
};

// Staggered children animation
export const staggerContainer = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03
    }
  }
};

// Card hover animation (minimal)
export const cardHover = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.01,
    boxShadow: "0px 3px 5px rgba(0,0,0,0.03)",
    transition: { 
      type: "tween", 
      duration: 0.1
    }
  }
};

// Button hover animation (minimal)
export const buttonHover = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.01,
    transition: { 
      type: "tween", 
      duration: 0.1
    }
  }
};

// Page transition animation (fade only)
export const pageTransition = {
  initial: { opacity: 0 },
  enter: { 
    opacity: 1, 
    transition: { 
      duration: 0.2,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0,
    transition: { 
      duration: 0.1,
      ease: "easeIn"
    }
  }
};

// Chart animation (subtle)
export const chartAnimation = {
  hidden: { opacity: 0, scale: 0.99 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

// Custom loading animation
export const loadingAnimation = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.8, ease: "easeInOut" },
      opacity: { duration: 0.2 }
    }
  }
}; 