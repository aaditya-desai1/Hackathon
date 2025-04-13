/**
 * Utility functions for color operations
 */

// Modern chart color palette (punchy colors with good contrast)
const CHART_COLORS = [
  [53, 162, 235],   // Blue
  [255, 99, 132],   // Pink
  [75, 192, 192],   // Teal
  [255, 159, 64],   // Orange
  [153, 102, 255],  // Purple
  [255, 205, 86],   // Yellow
  [46, 204, 113],   // Emerald
  [41, 128, 185],   // Royal Blue
  [231, 76, 60],    // Red
  [142, 68, 173],   // Violet
  [52, 73, 94],     // Dark Slate
  [26, 188, 156]    // Turquoise
];

/**
 * Generate a random color with opacity
 * @param {number} opacity - Opacity value between 0 and 1
 * @returns {string} - RGBA color string
 */
export const getRandomColor = (opacity = 0.7) => {
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
export const generateRandomColors = (count, opacity = 0.7) => {
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(getRandomColor(opacity));
  }
  return colors;
};

/**
 * Generate consistent colors from the predefined modern color palette
 * @param {number} count - Number of colors to generate
 * @param {number} opacity - Opacity value between 0 and 1
 * @returns {Object} - Object containing colors and borderColors arrays
 */
export const generateChartColors = (count, opacity = 0.7) => {
  const colors = [];
  const borderColors = [];
  
  for (let i = 0; i < count; i++) {
    const colorIndex = i % CHART_COLORS.length;
    const color = CHART_COLORS[colorIndex];
    
    // Add slight variation for repeated colors
    const variation = Math.floor(i / CHART_COLORS.length) * 20;
    const r = Math.max(0, Math.min(255, color[0] - variation));
    const g = Math.max(0, Math.min(255, color[1] - variation));
    const b = Math.max(0, Math.min(255, color[2] - variation));
    
    colors.push(`rgba(${r}, ${g}, ${b}, ${opacity})`);
    borderColors.push(`rgba(${r}, ${g}, ${b}, 1)`);
  }
  
  return { colors, borderColors };
};

/**
 * Get a single color from the palette
 * @param {number} index - Index of the color to get
 * @param {number} opacity - Opacity value between 0 and 1
 * @returns {string} - RGBA color string
 */
export const getChartColor = (index = 0, opacity = 0.7) => {
  const colorIndex = index % CHART_COLORS.length;
  const color = CHART_COLORS[colorIndex];
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`;
};

/**
 * Generate chart style configuration for different chart types
 * @param {string} chartType - Type of chart (bar, line, pie, scatter)
 * @param {Array} values - Data values
 * @param {string} label - Dataset label
 * @returns {Object} - Chart.js dataset style configuration
 */
export const getChartStyleConfig = (chartType, values, label = 'Value') => {
  const { colors, borderColors } = generateChartColors(values.length);
  
  switch (chartType) {
    case 'pie':
    case 'doughnut':
      return {
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 1,
        hoverOffset: 15,
        borderRadius: 4
      };
    case 'line':
      return {
        label,
        backgroundColor: colors[0],
        borderColor: borderColors[0],
        fill: {
          target: 'origin',
          above: colors[0].replace(/0.7/, '0.1')
        },
        borderWidth: 2,
        tension: 0.3,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: borderColors[0],
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      };
    case 'scatter':
      return {
        label,
        backgroundColor: colors[0],
        borderColor: borderColors[0],
        borderWidth: 1,
        pointRadius: 6,
        pointHoverRadius: 8
      };
    default: // bar chart and others
      return {
        label,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 6,
        hoverBackgroundColor: colors.map(color => color.replace(/0.7/, '0.9')),
        barPercentage: 0.7,
        categoryPercentage: 0.8
      };
  }
};

export default {
  getRandomColor,
  generateRandomColors,
  generateChartColors,
  getChartColor,
  getChartStyleConfig
}; 