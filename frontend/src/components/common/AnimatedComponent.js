import React from 'react';
import { motion } from 'framer-motion';
import { 
  fadeIn,
  slideInLeft, 
  slideInRight, 
  slideInBottom, 
  scaleUp,
  staggerContainer 
} from '../../utils/animations';

/**
 * A reusable component that adds animations to any child element
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to animate
 * @param {string} props.type - Animation type: 'fade', 'slideLeft', 'slideRight', 'slideBottom', 'scale', 'stagger'
 * @param {number} props.delay - Delay before animation starts (in seconds)
 * @param {number} props.duration - Animation duration (in seconds)
 * @param {Object} props.customVariants - Custom animation variants (optional)
 * @param {Object} props.style - Additional style properties
 * @param {string} props.className - CSS class name
 * @returns {React.ReactElement} - Animated component
 */
const AnimatedComponent = ({ 
  children, 
  type = 'fade', 
  delay = 0, 
  duration = 0.5,
  customVariants,
  staggerChildren = 0.1,
  style = {},
  className,
  ...rest
}) => {
  // Select the appropriate animation variant based on type
  const getVariants = () => {
    if (customVariants) return customVariants;
    
    switch(type) {
      case 'slideLeft':
        return slideInLeft;
      case 'slideRight':
        return slideInRight;
      case 'slideBottom':
        return slideInBottom;
      case 'scale':
        return scaleUp;
      case 'stagger':
        return {
          ...staggerContainer,
          visible: {
            ...staggerContainer.visible,
            transition: { staggerChildren }
          }
        };
      case 'fade':
      default:
        return fadeIn;
    }
  };
  
  // Add custom transition timing if provided
  const customTransition = {
    ...getVariants().visible?.transition,
    delay,
    duration
  };
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={getVariants()}
      transition={customTransition}
      style={style}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedComponent; 