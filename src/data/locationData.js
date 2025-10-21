// Location data for FreightFlow Application

export const INDONESIAN_PROVINCE_CAPITALS = [
    // Province Capitals (sorted alphabetically by province name)
    { province: 'Aceh', capital: 'Banda Aceh', type: 'Province Capital' },
    { province: 'Bali', capital: 'Denpasar', type: 'Province Capital' },
    { province: 'Banten', capital: 'Serang', type: 'Province Capital' },
    { province: 'Bengkulu', capital: 'Bengkulu', type: 'Province Capital' },
    { province: 'DI Yogyakarta', capital: 'Yogyakarta', type: 'Province Capital' },
    { province: 'DKI Jakarta', capital: 'Jakarta', type: 'Province Capital' },
    { province: 'Gorontalo', capital: 'Gorontalo', type: 'Province Capital' },
    { province: 'Jambi', capital: 'Jambi', type: 'Province Capital' },
    { province: 'Jawa Barat', capital: 'Bandung', type: 'Province Capital' },
    { province: 'Jawa Tengah', capital: 'Semarang', type: 'Province Capital' },
    { province: 'Jawa Timur', capital: 'Surabaya', type: 'Province Capital' },
    { province: 'Kalimantan Barat', capital: 'Pontianak', type: 'Province Capital' },
    { province: 'Kalimantan Selatan', capital: 'Banjarmasin', type: 'Province Capital' },
    { province: 'Kalimantan Tengah', capital: 'Palangka Raya', type: 'Province Capital' },
    { province: 'Kalimantan Timur', capital: 'Samarinda', type: 'Province Capital' },
    { province: 'Kalimantan Utara', capital: 'Tanjung Selor', type: 'Province Capital' },
    { province: 'Kepulauan Bangka Belitung', capital: 'Pangkal Pinang', type: 'Province Capital' },
    { province: 'Kepulauan Riau', capital: 'Tanjung Pinang', type: 'Province Capital' },
    { province: 'Lampung', capital: 'Bandar Lampung', type: 'Province Capital' },
    { province: 'Maluku', capital: 'Ambon', type: 'Province Capital' },
    { province: 'Maluku Utara', capital: 'Sofifi', type: 'Province Capital' },
    { province: 'Nusa Tenggara Barat', capital: 'Mataram', type: 'Province Capital' },
    { province: 'Nusa Tenggara Timur', capital: 'Kupang', type: 'Province Capital' },
    { province: 'Papua', capital: 'Jayapura', type: 'Province Capital' },
    { province: 'Papua Barat', capital: 'Manokwari', type: 'Province Capital' },
    { province: 'Riau', capital: 'Pekanbaru', type: 'Province Capital' },
    { province: 'Sulawesi Barat', capital: 'Mamuju', type: 'Province Capital' },
    { province: 'Sulawesi Selatan', capital: 'Makassar', type: 'Province Capital' },
    { province: 'Sulawesi Tengah', capital: 'Palu', type: 'Province Capital' },
    { province: 'Sulawesi Tenggara', capital: 'Kendari', type: 'Province Capital' },
    { province: 'Sulawesi Utara', capital: 'Manado', type: 'Province Capital' },
    { province: 'Sumatera Barat', capital: 'Padang', type: 'Province Capital' },
    { province: 'Sumatera Selatan', capital: 'Palembang', type: 'Province Capital' },
    { province: 'Sumatera Utara', capital: 'Medan', type: 'Province Capital' }
 ];

// Indonesian Province Capitals for Domestic Routes (sorted alphabetically)
export const INDONESIAN_CAPITALS_LIST = INDONESIAN_PROVINCE_CAPITALS
  .map(item => item.capital)
  .sort((a, b) => a.localeCompare(b, 'id'));

// Countries for International Routes (sorted alphabetically)
export const INTERNATIONAL_COUNTRIES_LIST = [
  'Australia', 'Bangladesh', 'Brunei', 'Cambodia', 'Canada', 'China', 'Denmark', 'France',
  'Germany', 'Hong Kong', 'India', 'Italy', 'Japan', 'Malaysia', 'Netherlands', 'New Zealand',
  'Norway', 'Philippines', 'Singapore', 'South Korea', 'Spain', 'Sweden', 'Switzerland',
  'Taiwan', 'Thailand', 'United Kingdom', 'United States', 'Vietnam'
].sort((a, b) => a.localeCompare(b));

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
    'South Africa', 'Tanzania', 'Tunisia', 'Uganda',

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