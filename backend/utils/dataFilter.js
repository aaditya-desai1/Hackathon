/**
 * Filter data based on filter criteria
 * @param {Array} data - Array of data objects
 * @param {Array} filters - Array of filter objects
 * @returns {Array} - Filtered data
 */
exports.filterData = (data, filters) => {
  if (!data || !data.length || !filters || !filters.length) {
    return data;
  }

  return data.filter(item => {
    // Every filter must match (AND condition)
    return filters.every(filter => {
      const { field, operator, value } = filter;
      
      if (!field || !operator) {
        return true;
      }

      const fieldValue = item[field];
      
      switch (operator) {
        case '=':
        case 'equals':
          return fieldValue == value;
        case '!=':
        case 'notEquals':
          return fieldValue != value;
        case '>':
        case 'gt':
          return fieldValue > value;
        case '<':
        case 'lt':
          return fieldValue < value;
        case '>=':
        case 'gte':
          return fieldValue >= value;
        case '<=':
        case 'lte':
          return fieldValue <= value;
        case 'contains':
          return String(fieldValue).includes(value);
        case 'notContains':
          return !String(fieldValue).includes(value);
        case 'startsWith':
          return String(fieldValue).startsWith(value);
        case 'endsWith':
          return String(fieldValue).endsWith(value);
        case 'in':
          return Array.isArray(value) && value.includes(fieldValue);
        case 'notIn':
          return Array.isArray(value) && !value.includes(fieldValue);
        case 'between':
          return Array.isArray(value) && 
                 value.length === 2 && 
                 fieldValue >= value[0] && 
                 fieldValue <= value[1];
        case 'isNull':
          return fieldValue === null || fieldValue === undefined;
        case 'isNotNull':
          return fieldValue !== null && fieldValue !== undefined;
        case 'isEmpty':
          return fieldValue === '' || fieldValue === null || fieldValue === undefined;
        case 'isNotEmpty':
          return fieldValue !== '' && fieldValue !== null && fieldValue !== undefined;
        default:
          return true;
      }
    });
  });
};

/**
 * Create a composite filter with AND/OR logic
 * @param {Array} filters - Array of filter objects or groups
 * @param {string} logic - Logic operator ('and' or 'or')
 * @returns {Function} - Filter function
 */
exports.createCompositeFilter = (filters, logic = 'and') => {
  if (!filters || !filters.length) {
    return () => true;
  }

  return (item) => {
    if (logic === 'and') {
      return filters.every(filter => {
        if (filter.filters) {
          // It's a nested filter group
          return exports.createCompositeFilter(filter.filters, filter.logic)(item);
        } else {
          // It's a simple filter
          return evaluateFilter(item, filter);
        }
      });
    } else {
      return filters.some(filter => {
        if (filter.filters) {
          // It's a nested filter group
          return exports.createCompositeFilter(filter.filters, filter.logic)(item);
        } else {
          // It's a simple filter
          return evaluateFilter(item, filter);
        }
      });
    }
  };
};

/**
 * Evaluate a single filter against an item
 * @param {Object} item - Data item
 * @param {Object} filter - Filter criteria
 * @returns {boolean} - Whether the item matches the filter
 */
function evaluateFilter(item, filter) {
  const { field, operator, value } = filter;
  
  if (!field || !operator) {
    return true;
  }

  const fieldValue = item[field];
  
  switch (operator) {
    case '=':
    case 'equals':
      return fieldValue == value;
    case '!=':
    case 'notEquals':
      return fieldValue != value;
    case '>':
    case 'gt':
      return fieldValue > value;
    case '<':
    case 'lt':
      return fieldValue < value;
    case '>=':
    case 'gte':
      return fieldValue >= value;
    case '<=':
    case 'lte':
      return fieldValue <= value;
    case 'contains':
      return String(fieldValue).includes(value);
    case 'notContains':
      return !String(fieldValue).includes(value);
    case 'startsWith':
      return String(fieldValue).startsWith(value);
    case 'endsWith':
      return String(fieldValue).endsWith(value);
    case 'in':
      return Array.isArray(value) && value.includes(fieldValue);
    case 'notIn':
      return Array.isArray(value) && !value.includes(fieldValue);
    case 'between':
      return Array.isArray(value) && 
             value.length === 2 && 
             fieldValue >= value[0] && 
             fieldValue <= value[1];
    case 'isNull':
      return fieldValue === null || fieldValue === undefined;
    case 'isNotNull':
      return fieldValue !== null && fieldValue !== undefined;
    case 'isEmpty':
      return fieldValue === '' || fieldValue === null || fieldValue === undefined;
    case 'isNotEmpty':
      return fieldValue !== '' && fieldValue !== null && fieldValue !== undefined;
    default:
      return true;
  }
} 