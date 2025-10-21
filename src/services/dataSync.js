// Basic data sync service (replacement for deleted dataSync)
import { customerService, vendorService, cargoService, shipmentService, operationalCostService, sellingCostService } from './localStorage';

// Mock data for development
const mockCustomers = [
  { id: '1', name: 'PT Example Corp', type: 'Corporation', email: 'contact@example.com', phone: '08123456789' }
];

const mockVendors = [
  { id: '1', name: 'PT Logistics Provider', serviceType: 'Sea Freight', email: 'info@logistics.com' }
];

const mockHSCodes = [
  { code: '847130', description: 'Laptop computers', importDuty: 0, vat: 11, excise: 0 }
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
      return mockHSCodes;
    } catch (error) {
      console.error('Error getting HS codes:', error);
      return mockHSCodes;
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