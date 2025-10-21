// Basic currency utilities (replacement for deleted currencyUtils)
export const CURRENCIES = [
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' }
];

export const formatCurrency = (amount, currency = 'IDR') => {
  if (!amount) return '0';

  const currencyInfo = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  switch (currency) {
    case 'IDR':
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount);
    case 'USD':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(amount);
    case 'EUR':
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
      }).format(amount);
    case 'SGD':
      return new Intl.NumberFormat('en-SG', {
        style: 'currency',
        currency: 'SGD',
        minimumFractionDigits: 2,
      }).format(amount);
    case 'JPY':
      return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
        minimumFractionDigits: 0,
      }).format(amount);
    default:
      return `${amount} ${currency}`;
  }
};

export const convertCurrency = (amount, fromCurrency, toCurrency, exchangeRate = 15000) => {
  if (fromCurrency === toCurrency) return amount;
  if (fromCurrency === 'IDR' && toCurrency === 'USD') return amount / exchangeRate;
  if (fromCurrency === 'USD' && toCurrency === 'IDR') return amount * exchangeRate;
  return amount; // Simplified conversion
};