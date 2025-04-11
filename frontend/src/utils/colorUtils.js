/**
 * Utility functions for color operations
 */

/**
 * Generate a random color with opacity
 * @param {number} opacity - Opacity value between 0 and 1
 * @returns {string} - RGBA color string
 */
export const getRandomColor = (opacity = 0.6) => {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Generate an array of random colors
 * @param {number} count - Number of colors to generate
 * @param {number} opacity - Opacity value between 0 and 1
 * @returns {string[]} - Array of RGBA color strings
 */
export const generateRandomColors = (count, opacity = 0.6) => {
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(getRandomColor(opacity));
  }
  return colors;
};

/**
 * Convert HEX color to RGBA
 * @param {string} hex - HEX color code
 * @param {number} opacity - Opacity value between 0 and 1
 * @returns {string} - RGBA color string
 */
export const hexToRgba = (hex, opacity = 1) => {
  let c;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')}, ${opacity})`;
  }
  return hex;
};

export default {
  getRandomColor,
  generateRandomColors,
  hexToRgba
}; 