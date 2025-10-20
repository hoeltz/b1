// Advanced Search and Filtering Utility for FreightFlow

export const SEARCH_OPERATORS = {
  EQUALS: 'eq',
  NOT_EQUALS: 'ne',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not_contains',
  STARTS_WITH: 'starts_with',
  ENDS_WITH: 'ends_with',
  GREATER_THAN: 'gt',
  GREATER_THAN_OR_EQUAL: 'gte',
  LESS_THAN: 'lt',
  LESS_THAN_OR_EQUAL: 'lte',
  IN: 'in',
  NOT_IN: 'not_in',
  BETWEEN: 'between',
  IS_NULL: 'is_null',
  IS_NOT_NULL: 'is_not_null',
};

export const SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc',
};

export class SearchFilter {
  constructor(data = []) {
    this.data = [...data];
    this.filters = [];
    this.sortConfig = null;
    this.searchTerm = '';
  }

  // Add a filter
  addFilter(field, operator, value, caseSensitive = false) {
    this.filters.push({
      field,
      operator,
      value,
      caseSensitive,
    });
    return this;
  }

  // Add multiple filters
  addFilters(filters) {
    filters.forEach(filter => {
      this.filters.push(filter);
    });
    return this;
  }

  // Set sorting
  setSort(field, order = SORT_ORDERS.ASC) {
    this.sortConfig = { field, order };
    return this;
  }

  // Set global search term
  setSearchTerm(term) {
    this.searchTerm = term.toLowerCase();
    return this;
  }

  // Execute search and filter
  execute() {
    let results = [...this.data];

    // Apply global search if term exists
    if (this.searchTerm) {
      results = this.applyGlobalSearch(results);
    }

    // Apply filters
    results = this.applyFilters(results);

    // Apply sorting
    if (this.sortConfig) {
      results = this.applySorting(results);
    }

    return results;
  }

  // Apply global search across multiple fields
  applyGlobalSearch(data) {
    if (!this.searchTerm) return data;

    return data.filter(item => {
      return this.searchInObject(item, this.searchTerm);
    });
  }

  // Search within an object recursively
  searchInObject(obj, term) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        if (typeof value === 'string') {
          if (value.toLowerCase().includes(term)) {
            return true;
          }
        } else if (typeof value === 'number') {
          if (value.toString().includes(term)) {
            return true;
          }
        } else if (Array.isArray(value)) {
          if (value.some(v => this.searchInObject({ value: v }, term).value)) {
            return true;
          }
        } else if (value && typeof value === 'object') {
          if (this.searchInObject(value, term)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Apply all filters
  applyFilters(data) {
    return this.filters.reduce((results, filter) => {
      return results.filter(item => this.applySingleFilter(item, filter));
    }, data);
  }

  // Apply a single filter
  applySingleFilter(item, filter) {
    const { field, operator, value, caseSensitive } = filter;
    const itemValue = this.getNestedValue(item, field);

    switch (operator) {
      case SEARCH_OPERATORS.EQUALS:
        return caseSensitive
          ? itemValue === value
          : String(itemValue).toLowerCase() === String(value).toLowerCase();

      case SEARCH_OPERATORS.NOT_EQUALS:
        return caseSensitive
          ? itemValue !== value
          : String(itemValue).toLowerCase() !== String(value).toLowerCase();

      case SEARCH_OPERATORS.CONTAINS:
        return caseSensitive
          ? String(itemValue).includes(value)
          : String(itemValue).toLowerCase().includes(String(value).toLowerCase());

      case SEARCH_OPERATORS.NOT_CONTAINS:
        return caseSensitive
          ? !String(itemValue).includes(value)
          : !String(itemValue).toLowerCase().includes(String(value).toLowerCase());

      case SEARCH_OPERATORS.STARTS_WITH:
        return caseSensitive
          ? String(itemValue).startsWith(value)
          : String(itemValue).toLowerCase().startsWith(String(value).toLowerCase());

      case SEARCH_OPERATORS.ENDS_WITH:
        return caseSensitive
          ? String(itemValue).endsWith(value)
          : String(itemValue).toLowerCase().endsWith(String(value).toLowerCase());

      case SEARCH_OPERATORS.GREATER_THAN:
        return Number(itemValue) > Number(value);

      case SEARCH_OPERATORS.GREATER_THAN_OR_EQUAL:
        return Number(itemValue) >= Number(value);

      case SEARCH_OPERATORS.LESS_THAN:
        return Number(itemValue) < Number(value);

      case SEARCH_OPERATORS.LESS_THAN_OR_EQUAL:
        return Number(itemValue) <= Number(value);

      case SEARCH_OPERATORS.IN:
        return Array.isArray(value) && value.includes(itemValue);

      case SEARCH_OPERATORS.NOT_IN:
        return Array.isArray(value) && !value.includes(itemValue);

      case SEARCH_OPERATORS.BETWEEN:
        if (!Array.isArray(value) || value.length !== 2) return false;
        const numValue = Number(itemValue);
        return numValue >= Number(value[0]) && numValue <= Number(value[1]);

      case SEARCH_OPERATORS.IS_NULL:
        return itemValue === null || itemValue === undefined || itemValue === '';

      case SEARCH_OPERATORS.IS_NOT_NULL:
        return itemValue !== null && itemValue !== undefined && itemValue !== '';

      default:
        return true;
    }
  }

  // Get nested value from object using dot notation
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  // Apply sorting
  applySorting(data) {
    if (!this.sortConfig) return data;

    const { field, order } = this.sortConfig;

    return data.sort((a, b) => {
      const aValue = this.getNestedValue(a, field);
      const bValue = this.getNestedValue(b, field);

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        // Convert to strings for comparison
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return order === SORT_ORDERS.DESC ? -comparison : comparison;
    });
  }

  // Clear all filters and search
  clear() {
    this.filters = [];
    this.sortConfig = null;
    this.searchTerm = '';
    return this;
  }

  // Get current filter count
  getFilterCount() {
    return this.filters.length + (this.searchTerm ? 1 : 0);
  }
}

// Predefined filter presets for common use cases
export const FILTER_PRESETS = {
  customers: {
    active: [
      { field: 'status', operator: SEARCH_OPERATORS.EQUALS, value: 'Active' }
    ],
    highCredit: [
      { field: 'creditLimit', operator: SEARCH_OPERATORS.GREATER_THAN, value: 50000000 }
    ],
    corporations: [
      { field: 'type', operator: SEARCH_OPERATORS.EQUALS, value: 'Corporation' }
    ],
  },

  salesOrders: {
    active: [
      { field: 'status', operator: SEARCH_OPERATORS.NOT_EQUALS, value: 'Cancelled' }
    ],
    highValue: [
      { field: 'sellingPrice', operator: SEARCH_OPERATORS.GREATER_THAN, value: 10000000 }
    ],
    urgent: [
      { field: 'priority', operator: SEARCH_OPERATORS.EQUALS, value: 'High' }
    ],
    seaFreight: [
      { field: 'serviceType', operator: SEARCH_OPERATORS.EQUALS, value: 'Sea Freight' }
    ],
  },

  invoices: {
    overdue: [
      { field: 'dueDate', operator: SEARCH_OPERATORS.LESS_THAN, value: new Date().toISOString().split('T')[0] },
      { field: 'status', operator: SEARCH_OPERATORS.NOT_EQUALS, value: 'Paid' }
    ],
    pending: [
      { field: 'status', operator: SEARCH_OPERATORS.EQUALS, value: 'Sent' }
    ],
    highValue: [
      { field: 'total', operator: SEARCH_OPERATORS.GREATER_THAN, value: 5000000 }
    ],
  },
};

// Utility functions for common search operations
export const createSearchFilter = (data) => new SearchFilter(data);

export const quickSearch = (data, term, searchFields = []) => {
  if (!term) return data;

  const searchLower = term.toLowerCase();

  return data.filter(item => {
    if (searchFields.length > 0) {
      // Search only in specified fields
      return searchFields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(searchLower);
      });
    } else {
      // Search in all string fields
      return Object.values(item).some(value => {
        return value && String(value).toLowerCase().includes(searchLower);
      });
    }
  });
};

export const quickFilter = (data, field, value) => {
  if (!value) return data;
  return data.filter(item => item[field] === value);
};

export const multiFilter = (data, filters) => {
  return filters.reduce((results, filter) => {
    const { field, value } = filter;
    return results.filter(item => item[field] === value);
  }, data);
};

export default {
  SearchFilter,
  SEARCH_OPERATORS,
  SORT_ORDERS,
  FILTER_PRESETS,
  createSearchFilter,
  quickSearch,
  quickFilter,
  multiFilter,
};