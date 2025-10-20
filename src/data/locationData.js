// Location data for FreightFlow Application

export const INDONESIAN_CITIES = [
   // Major Ports and Cities (sorted alphabetically)
   'Aceh', 'Balikpapan', 'Bandar Lampung', 'Bandung', 'Banjarbaru', 'Batam', 'Bekasi', 'Bengkulu',
   'Bogor', 'Cimahi', 'Cirebon', 'Depok', 'Jakarta', 'Jakarta Raya', 'Jambi', 'Kediri',
   'Makassar', 'Malang', 'Manado', 'Medan', 'Padang', 'Palembang', 'Pekanbaru', 'Pontianak',
   'Samarinda', 'Semarang', 'Serang', 'Sukabumi', 'Surabaya', 'Tangerang', 'Tasikmalaya',

   // Provinces (sorted alphabetically)
   'Bali', 'Banten', 'Gorontalo', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Kalimantan Barat',
   'Kalimantan Selatan', 'Kalimantan Tengah', 'Kalimantan Timur', 'Kepulauan Bangka Belitung',
   'Kepulauan Riau', 'Lampung', 'Maluku', 'Maluku Utara', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
   'Papua', 'Papua Barat', 'Riau', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tengah',
   'Sulawesi Tenggara', 'Sulawesi Utara', 'Sumatera Barat', 'Sumatera Selatan', 'Sumatera Utara'
];

export const COUNTRIES = [
   // Africa (sorted alphabetically)
   'Algeria', 'Angola', 'Egypt', 'Ethiopia', 'Ghana', 'Kenya', 'Morocco', 'Nigeria',
   'South Africa', 'Tanzania',

   // Asia Pacific (sorted alphabetically)
   'Australia', 'Bangladesh', 'Brunei', 'Cambodia', 'China', 'Hong Kong', 'India', 'Indonesia',
   'Japan', 'Jordan', 'Laos', 'Malaysia', 'Mongolia', 'Myanmar', 'Nepal', 'New Zealand',
   'Pakistan', 'Philippines', 'Singapore', 'South Korea', 'Sri Lanka', 'Taiwan', 'Thailand',
   'Vietnam',

   // Europe (sorted alphabetically)
   'Austria', 'Belgium', 'Czech Republic', 'Denmark', 'Finland', 'France', 'Germany',
   'Greece', 'Hungary', 'Italy', 'Netherlands', 'Norway', 'Poland', 'Portugal', 'Romania',
   'Russia', 'Spain', 'Sweden', 'Switzerland', 'Turkey', 'United Kingdom',

   // Middle East (sorted alphabetically)
   'Bahrain', 'Iran', 'Iraq', 'Israel', 'Kuwait', 'Lebanon', 'Oman', 'Qatar',
   'Saudi Arabia', 'United Arab Emirates',

   // North America (sorted alphabetically)
   'Canada', 'Mexico', 'United States',

   // South America (sorted alphabetically)
   'Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Paraguay', 'Peru',
   'Uruguay', 'Venezuela'
];

export const CURRENCIES = [
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'USD', name: 'US Dollar', symbol: '$' }
];

export const PACKAGE_TYPES = [
  { value: 'Domestic', label: 'Domestic Shipping' },
  { value: 'International', label: 'International Shipping' }
];

export const STANDARD_COSTS = {
  operational: [
    { id: 'handling', name: 'Cargo Handling', description: 'Loading/unloading charges', defaultAmount: 500000, currency: 'IDR' },
    { id: 'documentation', name: 'Documentation', description: 'Customs and paperwork', defaultAmount: 200000, currency: 'IDR' },
    { id: 'insurance', name: 'Insurance', description: 'Cargo insurance premium', defaultAmount: 150000, currency: 'IDR' },
    { id: 'storage', name: 'Storage', description: 'Warehouse storage fees', defaultAmount: 100000, currency: 'IDR' },
    { id: 'transport', name: 'Local Transport', description: 'Local transportation', defaultAmount: 300000, currency: 'IDR' },
    { id: 'fuel', name: 'Fuel Surcharge', description: 'Fuel and energy costs', defaultAmount: 250000, currency: 'IDR' },
    { id: 'labor', name: 'Labor', description: 'Personnel costs', defaultAmount: 400000, currency: 'IDR' },
    { id: 'equipment', name: 'Equipment', description: 'Machinery and tools', defaultAmount: 200000, currency: 'IDR' }
  ],
  selling: [
    { id: 'commission', name: 'Sales Commission', description: 'Sales team commission', defaultAmount: 5, currency: 'USD', type: 'percentage' },
    { id: 'marketing', name: 'Marketing', description: 'Marketing and advertising', defaultAmount: 1000000, currency: 'IDR' },
    { id: 'admin', name: 'Administration', description: 'Administrative costs', defaultAmount: 300000, currency: 'IDR' },
    { id: 'overhead', name: 'Overhead', description: 'General overhead costs', defaultAmount: 500000, currency: 'IDR' },
    { id: 'profit_margin', name: 'Profit Margin', description: 'Expected profit margin', defaultAmount: 15, currency: 'USD', type: 'percentage' },
    { id: 'tax', name: 'Tax', description: 'Tax obligations', defaultAmount: 10, currency: 'USD', type: 'percentage' }
  ]
};

export const CARGO_TYPES = [
  'General Cargo',
  'Dangerous Goods',
  'Perishable Goods',
  'Oversized Cargo',
  'Heavy Machinery',
  'Electronics',
  'Textiles',
  'Chemicals',
  'Food Products',
  'Automotive Parts',
  'Pharmaceuticals',
  'Consumer Goods',
  'Raw Materials',
  'Finished Goods'
];

export const SERVICE_TYPES = [
  'Sea Freight',
  'Air Freight',
  'Land Freight',
  'Express',
  'Rail Freight',
  'Multi-modal'
];

export const ORDER_TYPES = [
  { value: 'REG', label: 'Regular Order', description: 'Standard freight forwarding services' },
  { value: 'PAM', label: 'Pameran (Exhibition)', description: 'Exhibition and trade show logistics' },
  { value: 'PRO', label: 'Project Cargo', description: 'Specialized project cargo handling' }
];

export const SHIPPING_PROVIDERS = [
  'Maersk Line',
  'MSC',
  'CMA CGM',
  'Hapag-Lloyd',
  'Evergreen',
  'Yang Ming',
  'PIL',
  'Garuda Indonesia Cargo',
  'Lion Air Cargo',
  'Citilink Cargo',
  'PT. Samudera Indonesia',
  'PT. Berlian Laju Tanker',
  'PT. Djakarta Lloyd',
  'PT. Meratus Line',
  'PT. Tempuran Emas'
];

export default {
  INDONESIAN_CITIES,
  COUNTRIES,
  CURRENCIES,
  PACKAGE_TYPES,
  STANDARD_COSTS,
  CARGO_TYPES,
  SERVICE_TYPES,
  SHIPPING_PROVIDERS,
  ORDER_TYPES,
};