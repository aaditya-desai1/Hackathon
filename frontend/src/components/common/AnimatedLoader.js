import React from 'react';
import { motion } from 'framer-motion';
import { Box, useTheme } from '@mui/material';
import { loadingAnimation } from '../../utils/animations';

/**
 * An animated loading spinner created with Framer Motion
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the loader ('small', 'medium', 'large')
 * @param {string} props.color - Color of the loader (defaults to theme primary color)
 * @param {Object} props.style - Additional style properties
 * @returns {React.ReactElement} - Animated loading spinner
 */
const AnimatedLoader = ({ 
  size = 'medium', 
  color,
  style = {},
  ...rest
}) => {
  const theme = useTheme();
  
  // Determine the size in pixels
  const getSize = () => {
    switch(size) {
      case 'small': return 40;
      case 'large': return 100;
      case 'medium':
      default: return 60;
    }
  };
  
  // Use the theme primary color if no color is provided
  const loaderColor = color || theme.palette.primary.main;
  const pixelSize = getSize();
  
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      style={style}
      {...rest}
    >
      <motion.div
        style={{
          width: pixelSize,
          height: pixelSize,
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg 
          width={pixelSize} 
          height={pixelSize} 
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            stroke={loaderColor}
            strokeWidth="8"
            strokeLinecap="round"
            fill="transparent"
            variants={loadingAnimation}
            initial="hidden"
            animate="visible"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="20"
            stroke={theme.palette.secondary.main}
            strokeWidth="6"
            strokeLinecap="round"
            fill="transparent"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: 1,
              rotate: -180
            }}
            transition={{
              pathLength: { type: "spring", duration: 1.5, bounce: 0 },
              opacity: { duration: 0.5 },
              rotate: { duration: 2, repeat: Infinity, ease: "linear" }
            }}
            style={{ transformOrigin: "center" }}
          />
        </svg>
      </motion.div>
    </Box>
  );
};

export default AnimatedLoader; 