/**
 * Currency formatting utilities for Indonesian business applications
 * Supports IDR (Indonesian Rupiah) and USD formatting
 */

// Indonesian Rupiah formatting (xxx.xxx.xxx.xxx)
export const formatIDR = (amount) => {
  if (amount === null || amount === undefined || amount === '') return '0';

  const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : amount;

  if (isNaN(numAmount)) return '0';

  // Handle negative numbers
  const isNegative = numAmount < 0;
  const absAmount = Math.abs(numAmount);

  // Format with Indonesian thousands separator
  const formatted = absAmount.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return isNegative ? `-${formatted}` : formatted;
};

// US Dollar formatting ($xxx,xxx.xx)
export const formatUSD = (amount) => {
  if (amount === null || amount === undefined || amount === '') return '$0.00';

  const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : amount;

  if (isNaN(numAmount)) return '$0.00';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

// Generic currency formatter
export const formatCurrency = (amount, currency = 'IDR') => {
  if (currency === 'USD') {
    return formatUSD(amount);
  } else {
    return formatIDR(amount);
  }
};

// Parse formatted currency back to number
export const parseCurrencyInput = (formattedValue, currency = 'IDR') => {
  if (!formattedValue) return 0;

  // Remove currency symbols and formatting
  let numericValue = formattedValue.toString();

  if (currency === 'USD') {
    // Remove $ and commas
    numericValue = numericValue.replace(/[$,]/g, '');
  } else {
    // Remove periods (thousands separators) and other non-digits except decimal point
    numericValue = numericValue.replace(/[.,]/g, '');
  }

  // Remove any remaining non-numeric characters except decimal point and minus sign
  numericValue = numericValue.replace(/[^\d.-]/g, '');

  const parsed = parseFloat(numericValue);
  return isNaN(parsed) ? 0 : parsed;
};

// Real-time currency input formatting for form inputs
export const formatCurrencyInput = (value, currency = 'IDR') => {
  if (!value) return '';

  // Handle different input scenarios
  if (typeof value === 'string') {
    // If it's already formatted, parse it first
    const numericValue = value.replace(/[^\d]/g, '');
    if (!numericValue) return '';

    if (currency === 'USD') {
      return formatUSD(numericValue);
    } else {
      return formatIDR(numericValue);
    }
  } else {
    // If it's a number, format it
    if (currency === 'USD') {
      return formatUSD(value);
    } else {
      return formatIDR(value);
    }
  }
};

// Enhanced currency input formatter with live formatting
export const formatCurrencyInputLive = (inputValue, currency = 'IDR') => {
  if (!inputValue) return '';

  // Remove all non-digits first
  const numericString = inputValue.toString().replace(/[^\d]/g, '');

  if (!numericString) return '';

  // Convert to number for processing
  const numericValue = parseInt(numericString, 10);

  if (currency === 'USD') {
    // Format as USD with commas and decimal
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numericValue);
  } else {
    // Format as IDR with Indonesian thousands separator (xxx.xxx.xxx.xxx)
    return numericValue.toLocaleString('id-ID');
  }
};

// Format number as user types (for input fields)
export const formatNumberAsTyping = (value) => {
  if (!value) return '';

  // Remove existing formatting
  const cleanValue = value.toString().replace(/[.,]/g, '');

  // Add formatting as user types
  return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Format currency for display in tables and summaries
export const formatCurrencyDisplay = (amount, currency = 'IDR', showSymbol = true) => {
  const formatted = formatCurrency(amount, currency);

  if (!showSymbol) {
    // Return just the number without currency symbol
    if (currency === 'USD') {
      return formatted.replace('$', '').trim();
    } else {
      return formatted.replace(/[^\d.,-]/g, '');
    }
  }

  return formatted;
};

// Calculate totals with currency consideration
export const calculateCurrencyTotal = (items, currency = 'IDR') => {
  return items.reduce((total, item) => {
    const amount = parseCurrencyInput(item.amount, item.currency || currency);
    return total + amount;
  }, 0);
};

// Convert between currencies (basic implementation)
export const convertCurrency = (amount, fromCurrency, toCurrency, exchangeRate = 15000) => {
  if (fromCurrency === toCurrency) return amount;

  if (fromCurrency === 'IDR' && toCurrency === 'USD') {
    return amount / exchangeRate;
  } else if (fromCurrency === 'USD' && toCurrency === 'IDR') {
    return amount * exchangeRate;
  }

  return amount;
};

// Validate currency amount
export const validateCurrencyAmount = (amount, currency = 'IDR') => {
  const numAmount = parseCurrencyInput(amount, currency);

  if (isNaN(numAmount)) return false;
  if (numAmount < 0) return false; // Negative amounts not allowed for most business cases
  if (!isFinite(numAmount)) return false;

  return true;
};

// Get currency symbol
export const getCurrencySymbol = (currency = 'IDR') => {
  switch (currency) {
    case 'USD': return '$';
    case 'IDR': return 'Rp';
    case 'SGD': return 'S$';
    default: return '';
  }
};

// Format amount with currency symbol
export const formatWithSymbol = (amount, currency = 'IDR') => {
  const symbol = getCurrencySymbol(currency);
  const formatted = formatCurrency(amount, currency);

  if (currency === 'IDR') {
    return `${symbol} ${formatted}`;
  } else {
    return formatted; // USD already includes $ symbol
  }
};

export default {
  formatIDR,
  formatUSD,
  formatCurrency,
  parseCurrencyInput,
  formatCurrencyInput,
  formatCurrencyDisplay,
  calculateCurrencyTotal,
  convertCurrency,
  validateCurrencyAmount,
  getCurrencySymbol,
  formatWithSymbol,
};