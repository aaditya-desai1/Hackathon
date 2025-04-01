/**
 * Apply transformations to data
 * @param {Array} data - Array of data objects
 * @param {Array} transformations - Array of transformation objects
 * @returns {Array} - Transformed data
 */
exports.transformData = (data, transformations) => {
  if (!data || !data.length || !transformations || !transformations.length) {
    return data;
  }

  let transformedData = [...data];

  transformations.forEach(transformation => {
    switch (transformation.type) {
      case 'filter':
        transformedData = applyFilter(transformedData, transformation);
        break;
      case 'sort':
        transformedData = applySort(transformedData, transformation);
        break;
      case 'group':
        transformedData = applyGrouping(transformedData, transformation);
        break;
      case 'aggregate':
        transformedData = applyAggregation(transformedData, transformation);
        break;
      case 'map':
        transformedData = applyMapping(transformedData, transformation);
        break;
      default:
        // Skip unknown transformation
        break;
    }
  });

  return transformedData;
};

/**
 * Apply filter transformation
 * @param {Array} data - Data to filter
 * @param {Object} transformation - Filter configuration
 * @returns {Array} - Filtered data
 */
function applyFilter(data, transformation) {
  const { field, operator, value } = transformation;
  
  if (!field || !operator) {
    return data;
  }

  return data.filter(item => {
    const fieldValue = item[field];
    
    switch (operator) {
      case '=':
        return fieldValue == value;
      case '!=':
        return fieldValue != value;
      case '>':
        return fieldValue > value;
      case '<':
        return fieldValue < value;
      case '>=':
        return fieldValue >= value;
      case '<=':
        return fieldValue <= value;
      case 'contains':
        return String(fieldValue).includes(value);
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
      default:
        return true;
    }
  });
}

/**
 * Apply sort transformation
 * @param {Array} data - Data to sort
 * @param {Object} transformation - Sort configuration
 * @returns {Array} - Sorted data
 */
function applySort(data, transformation) {
  const { field, direction = 'asc' } = transformation;
  
  if (!field) {
    return data;
  }

  return [...data].sort((a, b) => {
    let valueA = a[field];
    let valueB = b[field];
    
    // Handle numeric values
    if (!isNaN(Number(valueA)) && !isNaN(Number(valueB))) {
      valueA = Number(valueA);
      valueB = Number(valueB);
    }
    
    // Handle string values
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return direction === 'asc' 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    }
    
    // Handle other values
    if (direction === 'asc') {
      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    } else {
      return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
    }
  });
}

/**
 * Apply grouping transformation
 * @param {Array} data - Data to group
 * @param {Object} transformation - Grouping configuration
 * @returns {Array} - Grouped data
 */
function applyGrouping(data, transformation) {
  const { field } = transformation;
  
  if (!field) {
    return data;
  }

  // Group the data
  const groups = {};
  
  data.forEach(item => {
    const groupKey = item[field];
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    
    groups[groupKey].push(item);
  });
  
  // Convert grouped object to array
  return Object.entries(groups).map(([key, items]) => ({
    [field]: key,
    count: items.length,
    items
  }));
}

/**
 * Apply aggregation transformation
 * @param {Array} data - Data to aggregate
 * @param {Object} transformation - Aggregation configuration
 * @returns {Array} - Aggregated data
 */
function applyAggregation(data, transformation) {
  const { groupBy, aggregations } = transformation;
  
  if (!groupBy || !aggregations || !Array.isArray(aggregations)) {
    return data;
  }

  // Group the data
  const groups = {};
  
  data.forEach(item => {
    const groupKey = item[groupBy];
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    
    groups[groupKey].push(item);
  });
  
  // Apply aggregations to each group
  return Object.entries(groups).map(([key, items]) => {
    const result = { [groupBy]: key };
    
    aggregations.forEach(agg => {
      const { field, function: func, alias } = agg;
      const resultKey = alias || `${func}_${field}`;
      
      switch (func) {
        case 'sum':
          result[resultKey] = items.reduce((sum, item) => sum + Number(item[field] || 0), 0);
          break;
        case 'avg':
          result[resultKey] = items.reduce((sum, item) => sum + Number(item[field] || 0), 0) / items.length;
          break;
        case 'min':
          result[resultKey] = Math.min(...items.map(item => Number(item[field] || 0)));
          break;
        case 'max':
          result[resultKey] = Math.max(...items.map(item => Number(item[field] || 0)));
          break;
        case 'count':
          result[resultKey] = items.length;
          break;
        default:
          result[resultKey] = null;
      }
    });
    
    return result;
  });
}

/**
 * Apply mapping transformation (modify columns or create new ones)
 * @param {Array} data - Data to transform
 * @param {Object} transformation - Mapping configuration
 * @returns {Array} - Transformed data
 */
function applyMapping(data, transformation) {
  const { mappings } = transformation;
  
  if (!mappings || !Array.isArray(mappings)) {
    return data;
  }

  return data.map(item => {
    const result = { ...item };
    
    mappings.forEach(mapping => {
      const { target, source, formula, type } = mapping;
      
      if (!target) {
        return;
      }
      
      if (source) {
        // Simple copy
        result[target] = item[source];
      } else if (formula) {
        // Apply formula
        try {
          // Create a safe evaluation context with item properties
          const context = {};
          Object.keys(item).forEach(key => {
            context[key] = item[key];
          });
          
          // Add some helper functions
          context.toNumber = val => Number(val);
          context.toString = val => String(val);
          context.round = val => Math.round(val);
          context.floor = val => Math.floor(val);
          context.ceil = val => Math.ceil(val);
          
          // Evaluate the formula
          // Note: In a production environment, you should use a safer evaluation method
          const evalFunc = new Function(...Object.keys(context), `return ${formula};`);
          result[target] = evalFunc(...Object.values(context));
        } catch (error) {
          console.error(`Error evaluating formula '${formula}':`, error);
          result[target] = null;
        }
      }
      
      // Convert type if specified
      if (type && result[target] !== null && result[target] !== undefined) {
        switch (type) {
          case 'number':
            result[target] = Number(result[target]);
            break;
          case 'string':
            result[target] = String(result[target]);
            break;
          case 'boolean':
            result[target] = Boolean(result[target]);
            break;
          case 'date':
            result[target] = new Date(result[target]);
            break;
        }
      }
    });
    
    return result;
  });
} 