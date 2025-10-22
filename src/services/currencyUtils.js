// Enhanced currency utilities for freight forwarding
export const CURRENCIES = [
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', locale: 'id-ID', flag: '🇮🇩' },
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE', flag: '🇪🇺' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', locale: 'en-SG', flag: '🇸🇬' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP', flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', locale: 'zh-CN', flag: '🇨🇳' },
  { code: 'KRW', name: 'Korean Won', symbol: '₩', locale: 'ko-KR', flag: '🇰🇷' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', locale: 'ms-MY', flag: '🇲🇾' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', locale: 'th-TH', flag: '🇹🇭' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', locale: 'vi-VN', flag: '🇻🇳' }
];

// Enhanced currency formatting with better precision control
export const formatCurrency = (amount, currency = 'IDR', options = {}) => {
  if (amount === null || amount === undefined || amount === '') return '0';

  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return '0';

  const currencyInfo = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  const {
    useSymbol = true,
    minimumFractionDigits,
    maximumFractionDigits,
    compact = false
  } = options;

  // Default fraction digits based on currency
  const defaultFractionDigits = {
    'IDR': 0, 'JPY': 0, 'KRW': 0, 'VND': 0, // No decimals for these currencies
    'USD': 2, 'EUR': 2, 'SGD': 2, 'CNY': 2, 'MYR': 2, 'THB': 2 // 2 decimals for these
  };

  const minDigits = minimumFractionDigits !== undefined ? minimumFractionDigits : defaultFractionDigits[currency] || 2;
  const maxDigits = maximumFractionDigits !== undefined ? maximumFractionDigits : minDigits;

  try {
    let formattedNumber;

    if (compact && numericAmount >= 1000000) {
      // Use compact notation for large numbers
      formattedNumber = new Intl.NumberFormat(currencyInfo.locale, {
        notation: 'compact',
        minimumFractionDigits: minDigits,
        maximumFractionDigits: maxDigits,
      }).format(numericAmount);
    } else {
      formattedNumber = new Intl.NumberFormat(currencyInfo.locale, {
        minimumFractionDigits: minDigits,
        maximumFractionDigits: maxDigits,
      }).format(numericAmount);
    }

    if (useSymbol) {
      return `${currencyInfo.symbol} ${formattedNumber}`;
    } else {
      return formattedNumber;
    }
  } catch (error) {
    // Fallback formatting
    return `${currencyInfo.symbol} ${numericAmount.toLocaleString()}`;
  }
};

// Format currency input during typing (removes non-numeric characters)
export const formatCurrencyInput = (value, allowDecimal = true) => {
  if (!value) return '';

  // Remove any non-numeric characters except decimal point
  let cleaned = value.replace(/[^\d.]/g, '');

  if (!allowDecimal) {
    cleaned = cleaned.replace(/\./g, '');
  } else {
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
  }

  return cleaned;
};

// Parse formatted currency back to number
export const parseCurrencyInput = (formattedValue) => {
  if (!formattedValue) return 0;

  // Remove currency symbols and formatting
  const cleaned = formattedValue
    .replace(/[Rp$€£¥₩₫฿RM₽₦₨₹₺₴₸₺₼₽₾₿]/g, '') // Remove currency symbols
    .replace(/[^\d.-]/g, '') // Keep only numbers, decimal point, and minus sign
    .trim();

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

// Enhanced currency conversion with multiple rates
export const convertCurrency = (amount, fromCurrency, toCurrency, exchangeRates = {}) => {
  if (fromCurrency === toCurrency) return amount;
  if (!amount) return 0;

  // Default exchange rates (can be overridden)
  const defaultRates = {
    USD_IDR: 15000,
    EUR_IDR: 16500,
    SGD_IDR: 11200,
    JPY_IDR: 100,
    CNY_IDR: 2100,
    KRW_IDR: 11.5,
    MYR_IDR: 3600,
    THB_IDR: 450,
    VND_IDR: 0.65
  };

  const rates = { ...defaultRates, ...exchangeRates };

  // Convert to IDR first, then to target currency
  let idrAmount = amount;

  if (fromCurrency !== 'IDR') {
    const fromRateKey = `${fromCurrency}_IDR`;
    const fromRate = rates[fromRateKey] || 15000;
    idrAmount = amount * fromRate;
  }

  if (toCurrency === 'IDR') {
    return idrAmount;
  }

  const toRateKey = `IDR_${toCurrency}`;
  const toRate = rates[toRateKey] || (1/15000);
  return idrAmount * toRate;
};

// Get currency symbol by code
export const getCurrencySymbol = (currencyCode) => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency ? currency.symbol : currencyCode;
};

// Get currency name by code
export const getCurrencyName = (currencyCode) => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency ? currency.name : currencyCode;
};

// Format number with thousand separators
export const formatNumber = (number, decimals = 2) => {
  if (number === null || number === undefined || number === '') return '0';

  const num = typeof number === 'string' ? parseFloat(number) : number;
  if (isNaN(num)) return '0';

  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

// Calculate total from multiple currency amounts
export const calculateMultiCurrencyTotal = (items, exchangeRates = {}) => {
  return items.reduce((total, item) => {
    const amount = item.amount || 0;
    const currency = item.currency || 'IDR';

    if (currency === 'IDR') {
      return total + amount;
    } else {
      const convertedAmount = convertCurrency(amount, currency, 'IDR', exchangeRates);
      return total + convertedAmount;
    }
  }, 0);
};