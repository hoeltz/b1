// Basic data sync service (replacement for deleted dataSync)
import { customerService, vendorService, cargoService, shipmentService, operationalCostService, sellingCostService, hsCodeService } from './localStorage';

// Mock data for development
const mockCustomers = [
  { id: '1', name: 'PT Example Corp', type: 'Corporation', email: 'contact@example.com', phone: '08123456789' }
];

const mockVendors = [
  { id: '1', name: 'PT Logistics Provider', serviceType: 'Sea Freight', email: 'info@logistics.com' }
];

const mockHSCodes = [
  // Electronics & Technology
  {
    id: 'hs_001',
    code: '8471.30.1000',
    description: 'Portable automatic data processing machines, weighing not more than 10 kg, consisting of at least a central processing unit, a keyboard and a display',
    category: 'Electronics',
    importDuty: 0,
    vat: 11,
    excise: 0,
    restrictions: [],
    requiredPermits: ['SNI'],
    notes: 'Laptop computers - bea masuk 0%'
  },
  {
    id: 'hs_002',
    code: '8517.12.0000',
    description: 'Telephones for cellular networks or for other wireless networks',
    category: 'Electronics',
    importDuty: 10,
    vat: 11,
    excise: 0,
    restrictions: ['Lartas', 'API'],
    requiredPermits: ['SNI', 'Postel'],
    notes: 'Handphone - bea masuk 10%'
  },
  {
    id: 'hs_003',
    code: '8528.72.9200',
    description: 'Television receivers, colour, with integral tube, whether or not incorporating radio-broadcast receivers or sound or video recording or reproducing apparatus',
    category: 'Electronics',
    importDuty: 15,
    vat: 11,
    excise: 0,
    restrictions: ['Lartas'],
    requiredPermits: ['SNI'],
    notes: 'LED TV - bea masuk 15%'
  },
  // Automotive & Transportation
  {
    id: 'hs_004',
    code: '8703.21.9900',
    description: 'Motor cars and other motor vehicles principally designed for the transport of persons, including station wagons and racing cars',
    category: 'Automotive',
    importDuty: 50,
    vat: 11,
    excise: 0,
    restrictions: ['Lartas', 'API'],
    requiredPermits: ['SIPI', 'SRUT'],
    notes: 'Mobil penumpang - bea masuk 50%'
  },
  {
    id: 'hs_005',
    code: '8711.20.1100',
    description: 'Motorcycles (including mopeds) and cycles fitted with an auxiliary motor, with or without side-cars; side-cars, with reciprocating internal combustion piston engine of a cylinder capacity exceeding 150 cc but not exceeding 250 cc',
    category: 'Automotive',
    importDuty: 60,
    vat: 11,
    excise: 0,
    restrictions: ['Lartas', 'API'],
    requiredPermits: ['SNI'],
    notes: 'Motorcycles 150-250cc - bea masuk 60%'
  },
  // Textile & Garment
  {
    id: 'hs_006',
    code: '6109.10.2000',
    description: 'T-shirts, singlets and other vests, of cotton, knitted or crocheted',
    category: 'Textile',
    importDuty: 25,
    vat: 11,
    excise: 0,
    restrictions: [],
    requiredPermits: ['SNI'],
    notes: 'Kaos oblong - bea masuk 25%'
  },
  {
    id: 'hs_007',
    code: '6203.42.9000',
    description: 'Men\'s or boys\' trousers, bib and brace overalls, breeches and shorts, of cotton',
    category: 'Textile',
    importDuty: 25,
    vat: 11,
    excise: 0,
    restrictions: [],
    requiredPermits: ['SNI'],
    notes: 'Celana panjang pria - bea masuk 25%'
  },
  // Food & Beverage
  {
    id: 'hs_008',
    code: '2203.00.9100',
    description: 'Beer made from malt, in bottles of 10 l or less',
    category: 'Food',
    importDuty: 20,
    vat: 11,
    excise: 5,
    restrictions: ['Lartas'],
    requiredPermits: ['BPOM', 'Izin Impor'],
    notes: 'Bir - bea masuk 20% + cukai 5%'
  },
  {
    id: 'hs_009',
    code: '1905.31.2000',
    description: 'Sweet biscuits, waffles and wafers, whether or not containing cocoa',
    category: 'Food',
    importDuty: 20,
    vat: 11,
    excise: 0,
    restrictions: [],
    requiredPermits: ['BPOM', 'SNI'],
    notes: 'Biskuit dan wafer - bea masuk 20%'
  },
  // Machinery & Equipment
  {
    id: 'hs_010',
    code: '8429.51.0000',
    description: 'Self-propelled bulldozers, angledozers, graders, levellers, scrapers, mechanical shovels, excavators, shovel loaders, tamping machines and road rollers',
    category: 'Machinery',
    importDuty: 5,
    vat: 11,
    excise: 0,
    restrictions: [],
    requiredPermits: ['API'],
    notes: 'Bulldozer and excavators - bea masuk 5%'
  },
  // Chemical Products
  {
    id: 'hs_011',
    code: '3004.90.0000',
    description: 'Medicaments (excluding goods of heading 30.02, 30.05 or 30.06) consisting of mixed or unmixed products for therapeutic or prophylactic uses, put up in measured doses',
    category: 'Chemical',
    importDuty: 5,
    vat: 11,
    excise: 0,
    restrictions: ['Lartas'],
    requiredPermits: ['BPOM', 'Izin Edar'],
    notes: 'Medicines and pharmaceuticals - bea masuk 5%'
  },
  {
    id: 'hs_012',
    code: '3402.20.1200',
    description: 'Surface-active preparations, washing preparations (including auxiliary washing preparations) and cleaning preparations, put up for retail sale',
    category: 'Chemical',
    importDuty: 20,
    vat: 11,
    excise: 0,
    restrictions: [],
    requiredPermits: ['BPOM'],
    notes: 'Detergents and cleaning products - bea masuk 20%'
  }
];

const dataSyncService = {
  // Customer operations
  getCustomers: async () => {
    try {
      return customerService.getAll() || mockCustomers;
    } catch (error) {
      console.error('Error getting customers:', error);
      return mockCustomers;
    }
  },

  createCustomer: async (customerData) => {
    try {
      return customerService.create(customerData);
    } catch (error) {
      console.error('Error creating customer:', error);
      return { id: Date.now().toString(), ...customerData };
    }
  },

  updateCustomer: async (id, customerData) => {
    try {
      return customerService.update(id, customerData);
    } catch (error) {
      console.error('Error updating customer:', error);
      return { id, ...customerData };
    }
  },

  deleteCustomer: async (id) => {
    try {
      return customerService.delete(id);
    } catch (error) {
      console.error('Error deleting customer:', error);
      return true;
    }
  },

  // Vendor operations
  getVendors: async () => {
    try {
      return vendorService.getAll() || mockVendors;
    } catch (error) {
      console.error('Error getting vendors:', error);
      return mockVendors;
    }
  },

  // HS Code operations
  getHSCodes: async () => {
    try {
      return hsCodeService.getAll() || mockHSCodes;
    } catch (error) {
      console.error('Error getting HS codes:', error);
      return mockHSCodes;
    }
  },

  createHSCode: async (hsCodeData) => {
    try {
      return hsCodeService.create(hsCodeData);
    } catch (error) {
      console.error('Error creating HS code:', error);
      return { id: Date.now().toString(), ...hsCodeData };
    }
  },

  updateHSCode: async (id, hsCodeData) => {
    try {
      return hsCodeService.update(id, hsCodeData);
    } catch (error) {
      console.error('Error updating HS code:', error);
      return { id, ...hsCodeData };
    }
  },

  deleteHSCode: async (id) => {
    try {
      return hsCodeService.delete(id);
    } catch (error) {
      console.error('Error deleting HS code:', error);
      return true;
    }
  },

  // Sales order operations
  getSalesOrders: async () => {
    try {
      return [];
    } catch (error) {
      console.error('Error getting sales orders:', error);
      return [];
    }
  },

  createSalesOrder: async (orderData) => {
    try {
      return { id: Date.now().toString(), orderNumber: `SO-${Date.now()}`, ...orderData };
    } catch (error) {
      console.error('Error creating sales order:', error);
      return { id: Date.now().toString(), orderNumber: `SO-${Date.now()}`, ...orderData };
    }
  },

  updateSalesOrder: async (id, orderData) => {
    try {
      return { id, ...orderData };
    } catch (error) {
      console.error('Error updating sales order:', error);
      return { id, ...orderData };
    }
  },

  deleteSalesOrder: async (id) => {
    try {
      return true;
    } catch (error) {
      console.error('Error deleting sales order:', error);
      return true;
    }
  },

  changeSalesOrderStatus: async (id, status, options) => {
    try {
      return { id, status, updatedAt: new Date().toISOString() };
    } catch (error) {
      console.error('Error changing sales order status:', error);
      return { id, status, updatedAt: new Date().toISOString() };
    }
  },

  // Invoice operations
  createInvoice: async (invoiceData) => {
    try {
      return {
        id: Date.now().toString(),
        invoiceNumber: `INV-${Date.now()}`,
        ...invoiceData,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating invoice:', error);
      return {
        id: Date.now().toString(),
        invoiceNumber: `INV-${Date.now()}`,
        ...invoiceData,
        createdAt: new Date().toISOString()
      };
    }
  },

  // Operational cost operations
  getOperationalCosts: async () => {
    try {
      return operationalCostService.getAll() || [];
    } catch (error) {
      console.error('Error getting operational costs:', error);
      return [];
    }
  },

  getSellingCosts: async () => {
    try {
      return sellingCostService.getAll() || [];
    } catch (error) {
      console.error('Error getting selling costs:', error);
      return [];
    }
  },

  createOperationalCost: async (costData) => {
    try {
      return operationalCostService.create(costData);
    } catch (error) {
      console.error('Error creating operational cost:', error);
      return { id: Date.now().toString(), ...costData };
    }
  },

  updateOperationalCost: async (id, costData) => {
    try {
      return operationalCostService.update(id, costData);
    } catch (error) {
      console.error('Error updating operational cost:', error);
      return { id, ...costData };
    }
  },

  deleteOperationalCost: async (id) => {
    try {
      return operationalCostService.delete(id);
    } catch (error) {
      console.error('Error deleting operational cost:', error);
      return true;
    }
  }
};

export default dataSyncService;