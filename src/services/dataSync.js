// Centralized Data Synchronization Service
// This service provides a unified interface for data operations across all entities
// and ensures proper cross-references, data consistency, and refresh mechanisms

import {
  customerService,
  salesOrderService,
  cargoService,
  shipmentService,
  operationalCostService,
  sellingCostService,
  vendorService,
  invoiceService,
  hsCodeService,
  initializeSampleData,
  resetToCleanSample
} from './localStorage';

import notificationService from './notificationService';

class DataSyncService {
  constructor() {
    this.listeners = new Map();
    this.isInitialized = false;
    this.isNotifying = false;
    this.initializeData();
  }

  // Initialize sample data if needed
  initializeData() {
    if (!this.isInitialized) {
      try {
        // Force clean sample data for demonstration
        resetToCleanSample();
        this.isInitialized = true;
      } catch (error) {
        console.error('Error initializing sample data:', error);
      }
    }
  }

  // Method to reset to clean sample data
  async resetToCleanSample() {
    try {
      const result = resetToCleanSample();
      if (result) {
        // Notify all listeners of the reset
        this.notifyListeners('all', 'reset', {
          message: 'Reset to clean sample data completed',
          timestamp: new Date().toISOString()
        });
        notificationService.showSuccess('Reset to clean sample data completed');
      }
      return result;
    } catch (error) {
      notificationService.showError(`Failed to reset data: ${error.message}`);
      throw error;
    }
  }

  // Event system for data changes
  subscribe(entityType, callback) {
    if (!this.listeners.has(entityType)) {
      this.listeners.set(entityType, new Set());
    }
    this.listeners.get(entityType).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(entityType);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  // Notify listeners of data changes - prevent infinite loops
  notifyListeners(entityType, action, data) {
    if (this.isNotifying) {
      return; // Prevent recursive notifications
    }

    this.isNotifying = true;
    const callbacks = this.listeners.get(entityType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback({ entityType, action, data, timestamp: new Date().toISOString() });
        } catch (error) {
          console.error('Error in data sync listener:', error);
        }
      });
    }
    // Reset the flag after a short delay to allow for cascading updates
    setTimeout(() => {
      this.isNotifying = false;
    }, 100);
  }

  // Customer Management with enhanced features
  async getCustomers() {
    try {
      return customerService.getAll();
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  async getCustomerById(id) {
    try {
      return customerService.getById(id);
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }

  async createCustomer(customerData) {
    try {
      const newCustomer = customerService.create(customerData);
      if (newCustomer) {
        this.notifyListeners('customers', 'create', newCustomer);
        notificationService.showSuccess(`Customer ${newCustomer.name} created successfully`);
      }
      return newCustomer;
    } catch (error) {
      notificationService.showError(`Failed to create customer: ${error.message}`);
      throw error;
    }
  }

  async updateCustomer(id, customerData) {
    try {
      const updatedCustomer = customerService.update(id, customerData);
      if (updatedCustomer) {
        this.notifyListeners('customers', 'update', updatedCustomer);

        // Update related sales orders
        await this.updateRelatedSalesOrders(id, updatedCustomer);

        notificationService.showSuccess(`Customer ${updatedCustomer.name} updated successfully`);
      }
      return updatedCustomer;
    } catch (error) {
      notificationService.showError(`Failed to update customer: ${error.message}`);
      throw error;
    }
  }

  async deleteCustomer(id) {
    try {
      // Check for related records before deletion
      const relatedOrders = await this.getRelatedSalesOrders(id);
      if (relatedOrders.length > 0) {
        throw new Error(`Cannot delete customer with ${relatedOrders.length} associated sales orders`);
      }

      const deleted = customerService.delete(id);
      if (deleted) {
        this.notifyListeners('customers', 'delete', { id });
        notificationService.showSuccess('Customer deleted successfully');
      }
      return deleted;
    } catch (error) {
      notificationService.showError(`Failed to delete customer: ${error.message}`);
      throw error;
    }
  }

  // Sales Order Management with cross-references
  async getSalesOrders() {
    try {
      return salesOrderService.getAll();
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      throw error;
    }
  }

  async getSalesOrderById(id) {
    try {
      return salesOrderService.getById(id);
    } catch (error) {
      console.error('Error fetching sales order:', error);
      throw error;
    }
  }

  async createSalesOrder(orderData) {
    console.log('DataSync createSalesOrder called with:', orderData);
    try {
      // Validate customer exists
      if (orderData.customerId) {
        console.log('Validating customer:', orderData.customerId);
        const customer = await this.getCustomerById(orderData.customerId);
        if (!customer) {
          throw new Error('Selected customer does not exist');
        }
        orderData.customerName = customer.name;
        console.log('Customer validation passed');
      }

      // Validate vendor exists if specified
      if (orderData.vendorId) {
        const vendor = vendorService.getById(orderData.vendorId);
        if (!vendor) {
          throw new Error('Selected vendor does not exist');
        }
        orderData.vendorName = vendor.name;
      }

      console.log('Calling salesOrderService.create...');
      const newOrder = salesOrderService.create(orderData);
      console.log('salesOrderService.create result:', newOrder);
      if (newOrder) {
        console.log('Notifying listeners...');
        this.notifyListeners('salesOrders', 'create', newOrder);

        // Create related shipment if shipment details provided
        if (orderData.shipmentDetails) {
          console.log('Creating related shipment...');
          await this.createRelatedShipment(newOrder);
        }

        notificationService.showSuccess(`Sales Order ${newOrder.orderNumber} created successfully`);
      }
      return newOrder;
    } catch (error) {
      notificationService.showError(`Failed to create sales order: ${error.message}`);
      throw error;
    }
  }

  async updateSalesOrder(id, orderData) {
    try {
      // Validate customer exists if customerId provided
      if (orderData.customerId) {
        const customer = await this.getCustomerById(orderData.customerId);
        if (!customer) {
          throw new Error('Selected customer does not exist');
        }
        orderData.customerName = customer.name;
      }

      // Validate vendor exists if vendorId provided
      if (orderData.vendorId) {
        const vendor = vendorService.getById(orderData.vendorId);
        if (!vendor) {
          throw new Error('Selected vendor does not exist');
        }
        orderData.vendorName = vendor.name;
      }

      const updatedOrder = salesOrderService.update(id, orderData);
      if (updatedOrder) {
        this.notifyListeners('salesOrders', 'update', updatedOrder);

        // Update related shipment if it exists
        if (updatedOrder.shipmentDetails) {
          await this.updateRelatedShipment(updatedOrder);
        }

        notificationService.showSuccess(`Sales Order ${updatedOrder.orderNumber} updated successfully`);
      }
      return updatedOrder;
    } catch (error) {
      notificationService.showError(`Failed to update sales order: ${error.message}`);
      throw error;
    }
  }

  async deleteSalesOrder(id) {
    try {
      // Check for related invoices
      const relatedInvoices = await this.getRelatedInvoices(id);
      if (relatedInvoices.length > 0) {
        throw new Error(`Cannot delete sales order with ${relatedInvoices.length} associated invoices`);
      }

      const deleted = salesOrderService.delete(id);
      if (deleted) {
        this.notifyListeners('salesOrders', 'delete', { id });

        // Delete related shipment if exists
        await this.deleteRelatedShipment(id);

        notificationService.showSuccess('Sales order deleted successfully');
      }
      return deleted;
    } catch (error) {
      notificationService.showError(`Failed to delete sales order: ${error.message}`);
      throw error;
    }
  }

  // Cargo Management
  async getCargo() {
    try {
      return cargoService.getAll();
    } catch (error) {
      console.error('Error fetching cargo:', error);
      throw error;
    }
  }

  async createCargo(cargoData) {
    try {
      const newCargo = cargoService.create(cargoData);
      if (newCargo) {
        this.notifyListeners('cargo', 'create', newCargo);
        notificationService.showSuccess('Cargo item created successfully');
      }
      return newCargo;
    } catch (error) {
      notificationService.showError(`Failed to create cargo: ${error.message}`);
      throw error;
    }
  }

  async updateCargo(id, cargoData) {
    try {
      const updatedCargo = cargoService.update(id, cargoData);
      if (updatedCargo) {
        this.notifyListeners('cargo', 'update', updatedCargo);
        notificationService.showSuccess('Cargo item updated successfully');
      }
      return updatedCargo;
    } catch (error) {
      notificationService.showError(`Failed to update cargo: ${error.message}`);
      throw error;
    }
  }

  async deleteCargo(id) {
    try {
      const deleted = cargoService.delete(id);
      if (deleted) {
        this.notifyListeners('cargo', 'delete', { id });
        notificationService.showSuccess('Cargo item deleted successfully');
      }
      return deleted;
    } catch (error) {
      notificationService.showError(`Failed to delete cargo: ${error.message}`);
      throw error;
    }
  }

  // Shipment Management
  async getShipments() {
    try {
      return shipmentService.getAll();
    } catch (error) {
      console.error('Error fetching shipments:', error);
      throw error;
    }
  }

  async createShipment(shipmentData) {
    try {
      const newShipment = shipmentService.create(shipmentData);
      if (newShipment) {
        this.notifyListeners('shipments', 'create', newShipment);
        notificationService.showSuccess(`Shipment ${newShipment.trackingNumber} created successfully`);
      }
      return newShipment;
    } catch (error) {
      notificationService.showError(`Failed to create shipment: ${error.message}`);
      throw error;
    }
  }

  async updateShipment(id, shipmentData) {
    try {
      const updatedShipment = shipmentService.update(id, shipmentData);
      if (updatedShipment) {
        this.notifyListeners('shipments', 'update', updatedShipment);
        notificationService.showSuccess(`Shipment ${updatedShipment.trackingNumber} updated successfully`);
      }
      return updatedShipment;
    } catch (error) {
      notificationService.showError(`Failed to update shipment: ${error.message}`);
      throw error;
    }
  }

  async deleteShipment(id) {
    try {
      const deleted = shipmentService.delete(id);
      if (deleted) {
        this.notifyListeners('shipments', 'delete', { id });
        notificationService.showSuccess('Shipment deleted successfully');
      }
      return deleted;
    } catch (error) {
      notificationService.showError(`Failed to delete shipment: ${error.message}`);
      throw error;
    }
  }

  // Invoice Management with cross-references
  async getInvoices() {
    try {
      return invoiceService.getAll();
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  async createInvoice(invoiceData) {
    console.log('DataSync createInvoice called with:', invoiceData);
    try {
      // Validate customer exists
      if (invoiceData.customerId) {
        console.log('Validating customer for invoice:', invoiceData.customerId);
        const customer = await this.getCustomerById(invoiceData.customerId);
        if (!customer) {
          throw new Error('Selected customer does not exist');
        }
        invoiceData.customerName = customer.name;
        console.log('Customer validation passed for invoice');
      }

      // Validate sales order exists if provided
      if (invoiceData.salesOrderId) {
        const salesOrder = await this.getSalesOrderById(invoiceData.salesOrderId);
        if (!salesOrder) {
          throw new Error('Referenced sales order does not exist');
        }
      }

      const newInvoice = invoiceService.create(invoiceData);
      if (newInvoice) {
        this.notifyListeners('invoices', 'create', newInvoice);

        // Update sales order status if linked
        if (invoiceData.salesOrderId) {
          await this.updateSalesOrderStatus(invoiceData.salesOrderId, 'Invoiced');
        }

        notificationService.showSuccess(`Invoice ${newInvoice.invoiceNumber} created successfully`);
      }
      return newInvoice;
    } catch (error) {
      notificationService.showError(`Failed to create invoice: ${error.message}`);
      throw error;
    }
  }

  async updateInvoice(id, invoiceData) {
    try {
      // Validate customer exists if customerId provided
      if (invoiceData.customerId) {
        const customer = await this.getCustomerById(invoiceData.customerId);
        if (!customer) {
          throw new Error('Selected customer does not exist');
        }
        invoiceData.customerName = customer.name;
      }

      const updatedInvoice = invoiceService.update(id, invoiceData);
      if (updatedInvoice) {
        this.notifyListeners('invoices', 'update', updatedInvoice);
        notificationService.showSuccess(`Invoice ${updatedInvoice.invoiceNumber} updated successfully`);
      }
      return updatedInvoice;
    } catch (error) {
      notificationService.showError(`Failed to update invoice: ${error.message}`);
      throw error;
    }
  }

  async deleteInvoice(id) {
    try {
      const deleted = invoiceService.delete(id);
      if (deleted) {
        this.notifyListeners('invoices', 'delete', { id });
        notificationService.showSuccess('Invoice deleted successfully');
      }
      return deleted;
    } catch (error) {
      notificationService.showError(`Failed to delete invoice: ${error.message}`);
      throw error;
    }
  }

  // Vendor Management
  async getVendors() {
    try {
      return vendorService.getAll();
    } catch (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }
  }

  async createVendor(vendorData) {
    try {
      const newVendor = vendorService.create(vendorData);
      if (newVendor) {
        this.notifyListeners('vendors', 'create', newVendor);
        notificationService.showSuccess(`Vendor ${newVendor.name} created successfully`);
      }
      return newVendor;
    } catch (error) {
      notificationService.showError(`Failed to create vendor: ${error.message}`);
      throw error;
    }
  }

  async updateVendor(id, vendorData) {
    try {
      const updatedVendor = vendorService.update(id, vendorData);
      if (updatedVendor) {
        this.notifyListeners('vendors', 'update', updatedVendor);

        // Update related sales orders
        await this.updateRelatedSalesOrdersVendor(id, updatedVendor);

        notificationService.showSuccess(`Vendor ${updatedVendor.name} updated successfully`);
      }
      return updatedVendor;
    } catch (error) {
      notificationService.showError(`Failed to update vendor: ${error.message}`);
      throw error;
    }
  }

  async deleteVendor(id) {
    try {
      // Check for related sales orders
      const relatedOrders = await this.getRelatedSalesOrdersByVendor(id);
      if (relatedOrders.length > 0) {
        throw new Error(`Cannot delete vendor with ${relatedOrders.length} associated sales orders`);
      }

      const deleted = vendorService.delete(id);
      if (deleted) {
        this.notifyListeners('vendors', 'delete', { id });
        notificationService.showSuccess('Vendor deleted successfully');
      }
      return deleted;
    } catch (error) {
      notificationService.showError(`Failed to delete vendor: ${error.message}`);
      throw error;
    }
  }

  // Cost Management
  async getOperationalCosts() {
    try {
      return operationalCostService.getAll();
    } catch (error) {
      console.error('Error fetching operational costs:', error);
      throw error;
    }
  }

  async getOperationalCostById(id) {
    try {
      return operationalCostService.getById(id);
    } catch (error) {
      console.error('Error fetching operational cost:', error);
      throw error;
    }
  }

  async createOperationalCost(costData) {
    try {
      const newCost = operationalCostService.create(costData);
      if (newCost) {
        this.notifyListeners('operationalCosts', 'create', newCost);
        notificationService.showSuccess('Operational cost created successfully');
      }
      return newCost;
    } catch (error) {
      notificationService.showError(`Failed to create operational cost: ${error.message}`);
      throw error;
    }
  }

  async updateOperationalCost(id, costData) {
    try {
      const updatedCost = operationalCostService.update(id, costData);
      if (updatedCost) {
        this.notifyListeners('operationalCosts', 'update', updatedCost);
        notificationService.showSuccess('Operational cost updated successfully');
      }
      return updatedCost;
    } catch (error) {
      notificationService.showError(`Failed to update operational cost: ${error.message}`);
      throw error;
    }
  }

  async deleteOperationalCost(id) {
    try {
      const deleted = operationalCostService.delete(id);
      if (deleted) {
        this.notifyListeners('operationalCosts', 'delete', { id });
        notificationService.showSuccess('Operational cost deleted successfully');
      }
      return deleted;
    } catch (error) {
      notificationService.showError(`Failed to delete operational cost: ${error.message}`);
      throw error;
    }
  }

  async getSellingCosts() {
    try {
      return sellingCostService.getAll();
    } catch (error) {
      console.error('Error fetching selling costs:', error);
      throw error;
    }
  }

  async getSellingCostById(id) {
    try {
      return sellingCostService.getById(id);
    } catch (error) {
      console.error('Error fetching selling cost:', error);
      throw error;
    }
  }

  async createSellingCost(costData) {
    try {
      const newCost = sellingCostService.create(costData);
      if (newCost) {
        this.notifyListeners('sellingCosts', 'create', newCost);
        notificationService.showSuccess('Selling cost created successfully');
      }
      return newCost;
    } catch (error) {
      notificationService.showError(`Failed to create selling cost: ${error.message}`);
      throw error;
    }
  }

  async updateSellingCost(id, costData) {
    try {
      const updatedCost = sellingCostService.update(id, costData);
      if (updatedCost) {
        this.notifyListeners('sellingCosts', 'update', updatedCost);
        notificationService.showSuccess('Selling cost updated successfully');
      }
      return updatedCost;
    } catch (error) {
      notificationService.showError(`Failed to update selling cost: ${error.message}`);
      throw error;
    }
  }

  async deleteSellingCost(id) {
    try {
      const deleted = sellingCostService.delete(id);
      if (deleted) {
        this.notifyListeners('sellingCosts', 'delete', { id });
        notificationService.showSuccess('Selling cost deleted successfully');
      }
      return deleted;
    } catch (error) {
      notificationService.showError(`Failed to delete selling cost: ${error.message}`);
      throw error;
    }
  }

  // HS Code Management
  async getHSCodes() {
    try {
      return hsCodeService.getAll();
    } catch (error) {
      console.error('Error fetching HS Codes:', error);
      throw error;
    }
  }

  async getHSCodeById(id) {
    try {
      return hsCodeService.getById(id);
    } catch (error) {
      console.error('Error fetching HS Code:', error);
      throw error;
    }
  }

  async createHSCode(hsCodeData) {
    try {
      const newHSCode = hsCodeService.create(hsCodeData);
      if (newHSCode) {
        this.notifyListeners('hsCodes', 'create', newHSCode);
        notificationService.showSuccess(`HS Code ${newHSCode.code} created successfully`);
      }
      return newHSCode;
    } catch (error) {
      notificationService.showError(`Failed to create HS Code: ${error.message}`);
      throw error;
    }
  }

  async updateHSCode(id, hsCodeData) {
    try {
      const updatedHSCode = hsCodeService.update(id, hsCodeData);
      if (updatedHSCode) {
        this.notifyListeners('hsCodes', 'update', updatedHSCode);
        notificationService.showSuccess(`HS Code ${updatedHSCode.code} updated successfully`);
      }
      return updatedHSCode;
    } catch (error) {
      notificationService.showError(`Failed to update HS Code: ${error.message}`);
      throw error;
    }
  }

  async deleteHSCode(id) {
    try {
      const deleted = hsCodeService.delete(id);
      if (deleted) {
        this.notifyListeners('hsCodes', 'delete', { id });
        notificationService.showSuccess('HS Code deleted successfully');
      }
      return deleted;
    } catch (error) {
      notificationService.showError(`Failed to delete HS Code: ${error.message}`);
      throw error;
    }
  }

  // Redline Management
  async getRedlines() {
    try {
      // For now, return empty array as redline service might not exist yet
      // This will be implemented when we create the redline service
      return [];
    } catch (error) {
      console.error('Error fetching redlines:', error);
      throw error;
    }
  }

  async createRedline(redlineData) {
    try {
      // For now, just return the data as redline service might not exist yet
      // This will be implemented when we create the redline service
      const newRedline = {
        ...redlineData,
        id: redlineData.id || `redline_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.notifyListeners('redlines', 'create', newRedline);
      notificationService.showSuccess('Redline request created successfully');
      return newRedline;
    } catch (error) {
      notificationService.showError(`Failed to create redline: ${error.message}`);
      throw error;
    }
  }

  async approveRedline(redlineId, approvalData) {
    try {
      // For now, return mock approval data
      const approvedRedline = {
        id: redlineId,
        status: 'Approved',
        approvedBy: approvalData.approver,
        approvedDate: approvalData.approvedDate,
        approverComments: approvalData.comments,
        updatedAt: new Date().toISOString()
      };

      this.notifyListeners('redlines', 'approve', approvedRedline);
      notificationService.showSuccess('Redline approved successfully');
      return approvedRedline;
    } catch (error) {
      notificationService.showError(`Failed to approve redline: ${error.message}`);
      throw error;
    }
  }

  async rejectRedline(redlineId, rejectionData) {
    try {
      // For now, return mock rejection data
      const rejectedRedline = {
        id: redlineId,
        status: 'Rejected',
        approvedBy: rejectionData.approver,
        approvedDate: rejectionData.approvedDate,
        approverComments: rejectionData.comments,
        updatedAt: new Date().toISOString()
      };

      this.notifyListeners('redlines', 'reject', rejectedRedline);
      notificationService.showSuccess('Redline rejected');
      return rejectedRedline;
    } catch (error) {
      notificationService.showError(`Failed to reject redline: ${error.message}`);
      throw error;
    }
  }

  // HS Code utility methods
  async calculateImportCost(cifValue, hsCodeId) {
    try {
      return hsCodeService.calculateImportCost(cifValue, hsCodeId);
    } catch (error) {
      notificationService.showError(`Failed to calculate import cost: ${error.message}`);
      throw error;
    }
  }

  async searchHSCodes(searchTerm) {
    try {
      return hsCodeService.searchByCode(searchTerm);
    } catch (error) {
      console.error('Error searching HS Codes:', error);
      throw error;
    }
  }

  async getHSCodesByCategory(category) {
    try {
      return hsCodeService.getByCategory(category);
    } catch (error) {
      console.error('Error fetching HS Codes by category:', error);
      throw error;
    }
  }

  // Cross-reference helpers
  async getRelatedSalesOrders(customerId) {
    const orders = await this.getSalesOrders();
    return orders.filter(order => order.customerId === customerId);
  }

  async getRelatedSalesOrdersByVendor(vendorId) {
    const orders = await this.getSalesOrders();
    return orders.filter(order => order.vendorId === vendorId);
  }

  async getRelatedInvoices(salesOrderId) {
    const invoices = await this.getInvoices();
    return invoices.filter(invoice => invoice.salesOrderId === salesOrderId);
  }

  async updateRelatedSalesOrders(customerId, customerData) {
    const relatedOrders = await this.getRelatedSalesOrders(customerId);
    for (const order of relatedOrders) {
      await this.updateSalesOrder(order.id, { customerName: customerData.name });
    }
  }

  async updateRelatedSalesOrdersVendor(vendorId, vendorData) {
    const relatedOrders = await this.getRelatedSalesOrdersByVendor(vendorId);
    for (const order of relatedOrders) {
      await this.updateSalesOrder(order.id, { vendorName: vendorData.name });
    }
  }

  async updateSalesOrderStatus(salesOrderId, status) {
    await this.updateSalesOrder(salesOrderId, { status });
  }

  // Enhanced cargo synchronization when sales orders are updated
  async syncCargoFromSalesOrders() {
    try {
      const salesOrders = await this.getSalesOrders();
      const cargoItems = [];

      // Extract all cargo items from sales orders
      salesOrders.forEach(order => {
        if (order.cargoItems && order.cargoItems.length > 0) {
          order.cargoItems.forEach(item => {
            cargoItems.push({
              ...item,
              salesOrderId: order.id,
              salesOrderNumber: order.orderNumber,
              trackingNumber: order.shipmentDetails?.trackingNumber || 'Not booked yet',
              customerName: order.customerName,
              status: order.status,
              origin: order.origin,
              destination: order.destination,
              source: 'salesOrder',
              lastUpdated: order.updatedAt || order.createdAt
            });
          });
        }
      });

      // Only notify if there are actual changes
      if (cargoItems.length > 0) {
        this.notifyListeners('cargo', 'syncFromSalesOrders', {
          cargoItems,
          salesOrderCount: salesOrders.length,
          timestamp: new Date().toISOString()
        });
      }

      return cargoItems;
    } catch (error) {
      console.error('Error syncing cargo from sales orders:', error);
      throw error;
    }
  }

  // Enhanced status change with automatic data synchronization
  async changeSalesOrderStatus(salesOrderId, newStatus, options = {}) {
    try {
      const salesOrder = await this.getSalesOrderById(salesOrderId);
      if (!salesOrder) {
        throw new Error('Sales order not found');
      }

      const oldStatus = salesOrder.status;
      const updates = { status: newStatus, updatedAt: new Date().toISOString() };

      // Auto-generate tracking number when status changes to Confirmed
      if (newStatus === 'Confirmed' && !salesOrder.shipmentDetails?.trackingNumber) {
        const trackingNumber = `TRK-${Date.now()}`;
        updates.shipmentDetails = {
          ...salesOrder.shipmentDetails,
          trackingNumber,
          status: 'Booked',
          estimatedDeparture: salesOrder.shipmentDetails?.estimatedDeparture || new Date().toISOString().split('T')[0],
          estimatedArrival: salesOrder.shipmentDetails?.estimatedArrival || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };

        // Auto-create shipment record when order is confirmed
        try {
          await this.createShipment({
            salesOrderId: salesOrder.id,
            trackingNumber,
            origin: salesOrder.origin,
            destination: salesOrder.destination,
            estimatedDeparture: updates.shipmentDetails.estimatedDeparture,
            estimatedArrival: updates.shipmentDetails.estimatedArrival,
            status: 'Booked'
          });
          console.log('✅ Auto-created shipment for confirmed order:', trackingNumber);
        } catch (shipmentError) {
          console.error('Error auto-creating shipment:', shipmentError);
        }

        // Auto-create operational costs when order is confirmed
        try {
          await this.createOperationalCostsForOrder(salesOrder);
          console.log('✅ Auto-created operational costs for confirmed order');
        } catch (costError) {
          console.error('Error auto-creating operational costs:', costError);
        }
      }

      // Auto-create cost management entry when status changes to Order (from Draft)
      if (newStatus === 'Order' && oldStatus === 'Draft') {
        try {
          await this.createCostManagementFromSalesOrder(salesOrder);
          console.log('✅ Auto-created cost management entry for order:', salesOrder.orderNumber);
        } catch (costError) {
          console.error('Error auto-creating cost management:', costError);
        }
      }

      // Auto-update shipment status when order status changes
      if (newStatus === 'In Transit' && updates.shipmentDetails) {
        updates.shipmentDetails.status = 'In Transit';
        // Update related shipment
        const shipments = await this.getShipments();
        const relatedShipment = shipments.find(s => s.salesOrderId === salesOrder.id);
        if (relatedShipment) {
          await this.updateShipment(relatedShipment.id, { status: 'In Transit' });
        }
      } else if (newStatus === 'Delivered' && updates.shipmentDetails) {
        updates.shipmentDetails.status = 'Delivered';
        updates.shipmentDetails.actualArrival = new Date().toISOString();
        // Update related shipment
        const shipments = await this.getShipments();
        const relatedShipment = shipments.find(s => s.salesOrderId === salesOrder.id);
        if (relatedShipment) {
          await this.updateShipment(relatedShipment.id, {
            status: 'Delivered',
            actualArrival: new Date().toISOString()
          });
        }
      }

      // Update the sales order
      const updatedOrder = await this.updateSalesOrder(salesOrderId, updates);

      // Trigger cascading updates based on new status (with delay to prevent loops)
      if (options.updateDashboard !== false) {
        setTimeout(() => {
          this.handleStatusChangeCascadingUpdates(updatedOrder, oldStatus, newStatus, options);
        }, 200);
      }

      // Notify all listeners of the status change
      this.notifyListeners('salesOrders', 'statusChange', {
        orderId: salesOrderId,
        oldStatus,
        newStatus,
        order: updatedOrder,
        timestamp: new Date().toISOString()
      });

      return updatedOrder;
    } catch (error) {
      notificationService.showError(`Failed to change order status: ${error.message}`);
      throw error;
    }
  }

  // Handle cascading updates when status changes
  async handleStatusChangeCascadingUpdates(salesOrder, oldStatus, newStatus, options = {}) {
    try {
      // Update related shipment
      if (salesOrder.shipmentDetails) {
        await this.updateRelatedShipment(salesOrder);
      }

      // Create shipment if status is Confirmed and no shipment exists
      if (newStatus === 'Confirmed' && !salesOrder.shipmentDetails) {
        await this.createRelatedShipment(salesOrder);
      }

      // Update dashboard statistics (with delay to prevent loops)
      if (options.updateDashboard !== false) {
        setTimeout(() => {
          this.updateDashboardStatistics();
        }, 500);
      }

      // Send notifications based on status
      await this.sendStatusChangeNotifications(salesOrder, oldStatus, newStatus);

      // Update related invoices if order is delivered
      if (newStatus === 'Delivered') {
        setTimeout(() => {
          this.updateRelatedInvoicesOnDelivery(salesOrder.id);
        }, 300);
      }

    } catch (error) {
      console.error('Error in cascading updates:', error);
      // Don't throw here as this shouldn't block the main status change
    }
  }

  // Send notifications for status changes
  async sendStatusChangeNotifications(salesOrder, oldStatus, newStatus) {
    const notifications = [];

    if (newStatus === 'Confirmed') {
      notifications.push(`Sales Order ${salesOrder.orderNumber} has been confirmed and is ready for processing`);
    } else if (newStatus === 'In Transit') {
      notifications.push(`Sales Order ${salesOrder.orderNumber} is now in transit to ${salesOrder.destination}`);
    } else if (newStatus === 'Delivered') {
      notifications.push(`Sales Order ${salesOrder.orderNumber} has been delivered successfully`);
    }

    notifications.forEach(message => {
      notificationService.showInfo(message);
    });
  }

  // Update related invoices when order is delivered
  async updateRelatedInvoicesOnDelivery(salesOrderId) {
    const invoices = await this.getRelatedInvoices(salesOrderId);
    for (const invoice of invoices) {
      if (invoice.status !== 'Paid') {
        // Mark invoice as ready for payment or paid if auto-payment is enabled
        await this.updateInvoice(invoice.id, { status: 'Paid', paidDate: new Date().toISOString() });
      }
    }
  }

  // Update dashboard statistics - prevent infinite loops
  async updateDashboardStatistics() {
    try {
      const orders = await this.getSalesOrders();
      const customers = await this.getCustomers();
      const invoices = await this.getInvoices();

      const stats = {
        totalOrders: orders.length,
        confirmedOrders: orders.filter(o => o.status === 'Confirmed').length,
        inTransitOrders: orders.filter(o => o.status === 'In Transit').length,
        deliveredOrders: orders.filter(o => o.status === 'Delivered').length,
        totalCustomers: customers.length,
        totalInvoices: invoices.length,
        paidInvoices: invoices.filter(i => i.status === 'Paid').length,
        pendingInvoices: invoices.filter(i => i.status === 'Sent').length,
        overdueInvoices: this.calculateOverdueInvoices(invoices),
        totalRevenue: orders.reduce((sum, o) => sum + (o.sellingPrice || 0), 0),
        totalCosts: orders.reduce((sum, o) => sum + (o.estimatedCost || 0), 0),
        totalMargin: orders.reduce((sum, o) => sum + (o.margin || 0), 0)
      };

      // Notify dashboard listeners (only if not already notifying)
      if (!this.isNotifying) {
        this.notifyListeners('dashboard', 'statsUpdate', stats);
      }
    } catch (error) {
      console.error('Error updating dashboard statistics:', error);
    }
  }

  // Calculate overdue invoices
  calculateOverdueInvoices(invoices) {
    const today = new Date();
    return invoices.filter(invoice => {
      const dueDate = new Date(invoice.dueDate);
      return dueDate < today && invoice.status !== 'Paid';
    }).length;
  }

  async createRelatedShipment(salesOrder) {
    if (salesOrder.shipmentDetails) {
      const shipmentData = {
        salesOrderId: salesOrder.id,
        origin: salesOrder.origin,
        destination: salesOrder.destination,
        trackingNumber: salesOrder.shipmentDetails.trackingNumber,
        estimatedDeparture: salesOrder.shipmentDetails.estimatedDeparture,
        estimatedArrival: salesOrder.shipmentDetails.estimatedArrival,
        status: salesOrder.shipmentDetails.status || 'Booked'
      };

      return await this.createShipment(shipmentData);
    }
  }

  // Auto-create operational costs when sales order is confirmed
  async createOperationalCostsForOrder(salesOrder) {
    try {
      const operationalCosts = [
        {
          description: 'Ocean freight charges - ' + salesOrder.origin + ' to ' + salesOrder.destination,
          vendorName: 'PT. Samudera Logistics',
          costType: 'Ocean Freight',
          amount: Math.round(salesOrder.estimatedCost * 0.65), // 65% of estimated cost
          currency: 'IDR',
          status: 'Paid',
          salesOrderId: salesOrder.id,
          invoiceNumber: `SAM-${salesOrder.orderNumber}`,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          description: 'Container drayage - port to warehouse',
          vendorName: 'PT. Darat Express',
          costType: 'Trucking',
          amount: Math.round(salesOrder.estimatedCost * 0.15), // 15% of estimated cost
          currency: 'IDR',
          status: 'Paid',
          salesOrderId: salesOrder.id,
          invoiceNumber: `DAR-${salesOrder.orderNumber}`,
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          description: 'Export documentation and customs clearance',
          vendorName: 'PT. Customs Agent',
          costType: 'Customs Clearance',
          amount: Math.round(salesOrder.estimatedCost * 0.10), // 10% of estimated cost
          currency: 'IDR',
          status: 'Paid',
          salesOrderId: salesOrder.id,
          invoiceNumber: `DOC-${salesOrder.orderNumber}`,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          description: 'Terminal handling charges',
          vendorName: 'Jakarta International Container Terminal',
          costType: 'Terminal Handling',
          amount: Math.round(salesOrder.estimatedCost * 0.10), // 10% of estimated cost
          currency: 'IDR',
          status: 'Paid',
          salesOrderId: salesOrder.id,
          invoiceNumber: `THC-${salesOrder.orderNumber}`,
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ];

      // Create each operational cost
      for (const costData of operationalCosts) {
        await this.createOperationalCost(costData);
      }

      console.log(`✅ Auto-created ${operationalCosts.length} operational costs for order ${salesOrder.orderNumber}`);
    } catch (error) {
      console.error('Error auto-creating operational costs:', error);
      throw error;
    }
  }

  async updateRelatedShipment(salesOrder) {
    try {
      const shipments = await this.getShipments();
      const relatedShipment = shipments.find(s => s.salesOrderId === salesOrder.id);

      if (relatedShipment && salesOrder.shipmentDetails) {
        // Only update if there are actual changes
        const currentData = {
          origin: salesOrder.origin,
          destination: salesOrder.destination,
          estimatedDeparture: salesOrder.shipmentDetails.estimatedDeparture,
          estimatedArrival: salesOrder.shipmentDetails.estimatedArrival,
          status: salesOrder.shipmentDetails.status || 'Booked'
        };

        const hasChanges = Object.keys(currentData).some(key =>
          relatedShipment[key] !== currentData[key]
        );

        if (hasChanges) {
          return await this.updateShipment(relatedShipment.id, currentData);
        }
      }
    } catch (error) {
      console.error('Error updating related shipment:', error);
    }
  }

  async deleteRelatedShipment(salesOrderId) {
    const shipments = await this.getShipments();
    const relatedShipment = shipments.find(s => s.salesOrderId === salesOrderId);

    if (relatedShipment) {
      return await this.deleteShipment(relatedShipment.id);
    }
  }

  // Auto-create cost management entry from sales order
  async createCostManagementFromSalesOrder(salesOrder) {
    try {
      // Create cost management entry with sales order data
      const costManagementData = {
        salesOrderId: salesOrder.id,
        salesOrderNumber: salesOrder.orderNumber,
        customerId: salesOrder.customerId,
        customerName: salesOrder.customerName,
        orderType: salesOrder.orderType,
        origin: salesOrder.origin,
        destination: salesOrder.destination,
        serviceType: salesOrder.serviceType,
        packageType: salesOrder.packageType,
        cargoItems: salesOrder.cargoItems || [],
        sellingPrice: salesOrder.sellingPrice,
        estimatedCost: salesOrder.estimatedCost,
        margin: salesOrder.margin,
        status: 'Draft', // Cost management starts as draft
        createdFromSalesOrder: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // For now, we'll store this in a simple way - in a real app this would be a separate service
      // We'll use localStorage directly for cost management data
      const costManagementKey = 'freightflow_cost_management';
      const existingData = JSON.parse(localStorage.getItem(costManagementKey) || '[]');

      // Check if cost management entry already exists for this sales order
      const existingEntry = existingData.find(entry => entry.salesOrderId === salesOrder.id);
      if (!existingEntry) {
        existingData.push(costManagementData);
        localStorage.setItem(costManagementKey, JSON.stringify(existingData));

        console.log(`✅ Created cost management entry for sales order ${salesOrder.orderNumber}`);
        return costManagementData;
      } else {
        console.log(`ℹ️ Cost management entry already exists for sales order ${salesOrder.orderNumber}`);
        return existingEntry;
      }
    } catch (error) {
      console.error('Error creating cost management from sales order:', error);
      throw error;
    }
  }

  // Data refresh mechanism
  async refreshAllData() {
    try {
      const refreshPromises = [
        this.getCustomers(),
        this.getSalesOrders(),
        this.getCargo(),
        this.getShipments(),
        this.getInvoices(),
        this.getVendors(),
        this.getOperationalCosts(),
        this.getSellingCosts()
      ];

      const results = await Promise.allSettled(refreshPromises);

      // Notify listeners of successful refresh
      this.notifyListeners('all', 'refresh', {
        timestamp: new Date().toISOString(),
        success: results.every(r => r.status === 'fulfilled')
      });

      return results.every(r => r.status === 'fulfilled');
    } catch (error) {
      console.error('Error refreshing all data:', error);
      throw error;
    }
  }

  // Data consistency check
  async validateDataConsistency() {
    const issues = [];

    try {
      // Check for orphaned sales orders (customer doesn't exist)
      const customers = await this.getCustomers();
      const orders = await this.getSalesOrders();
      const customerIds = new Set(customers.map(c => c.id));

      for (const order of orders) {
        if (order.customerId && !customerIds.has(order.customerId)) {
          issues.push({
            type: 'orphaned_order',
            entity: 'salesOrder',
            id: order.id,
            message: `Sales order ${order.orderNumber} references non-existent customer ${order.customerId}`
          });
        }
      }

      // Check for orphaned invoices (customer doesn't exist)
      const invoices = await this.getInvoices();
      for (const invoice of invoices) {
        if (invoice.customerId && !customerIds.has(invoice.customerId)) {
          issues.push({
            type: 'orphaned_invoice',
            entity: 'invoice',
            id: invoice.id,
            message: `Invoice ${invoice.invoiceNumber} references non-existent customer ${invoice.customerId}`
          });
        }
      }

      // Check for orphaned invoices (sales order doesn't exist)
      const orderIds = new Set(orders.map(o => o.id));
      for (const invoice of invoices) {
        if (invoice.salesOrderId && !orderIds.has(invoice.salesOrderId)) {
          issues.push({
            type: 'orphaned_invoice',
            entity: 'invoice',
            id: invoice.id,
            message: `Invoice ${invoice.invoiceNumber} references non-existent sales order ${invoice.salesOrderId}`
          });
        }
      }

      return issues;
    } catch (error) {
      console.error('Error validating data consistency:', error);
      throw error;
    }
  }

  // Bulk operations
  async bulkDelete(entityType, ids) {
    const results = [];

    for (const id of ids) {
      try {
        let deleted = false;
        switch (entityType) {
          case 'customers':
            deleted = await this.deleteCustomer(id);
            break;
          case 'salesOrders':
            deleted = await this.deleteSalesOrder(id);
            break;
          case 'cargo':
            deleted = await this.deleteCargo(id);
            break;
          case 'shipments':
            deleted = await this.deleteShipment(id);
            break;
          case 'invoices':
            deleted = await this.deleteInvoice(id);
            break;
          case 'vendors':
            deleted = await this.deleteVendor(id);
            break;
          default:
            throw new Error(`Unsupported entity type: ${entityType}`);
        }

        results.push({ id, success: !!deleted });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }

    return results;
  }

  // Purchase Order Management
  async getPurchaseOrders() {
    try {
      // For now, return data from localStorage as purchase order service might not exist yet
      const poData = localStorage.getItem('purchase_order_management_pos');
      return poData ? JSON.parse(poData) : [];
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }
  }

  async createPurchaseOrder(poData) {
    try {
      console.log('DataSync createPurchaseOrder called with:', poData);

      // Validate vendor exists if specified
      if (poData.vendorId) {
        const vendor = vendorService.getById(poData.vendorId);
        if (!vendor) {
          throw new Error('Selected vendor does not exist');
        }
        poData.vendorName = vendor.name;
      }

      // Validate sales order exists if specified
      if (poData.salesOrderId) {
        const salesOrder = await this.getSalesOrderById(poData.salesOrderId);
        if (!salesOrder) {
          throw new Error('Referenced sales order does not exist');
        }
        poData.customerName = salesOrder.customerName;
      }

      // For now, store directly in localStorage as purchase order service might not exist yet
      const purchaseOrdersKey = 'purchase_order_management_pos';
      const existingPOs = JSON.parse(localStorage.getItem(purchaseOrdersKey) || '[]');

      // Check if PO number already exists
      const existingPO = existingPOs.find(po => po.poNumber === poData.poNumber);
      if (existingPO) {
        throw new Error(`PO number ${poData.poNumber} already exists`);
      }

      const newPO = {
        ...poData,
        id: poData.id || `po_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      existingPOs.push(newPO);
      localStorage.setItem(purchaseOrdersKey, JSON.stringify(existingPOs));

      console.log('Purchase order created successfully:', newPO);

      this.notifyListeners('purchaseOrders', 'create', newPO);
      notificationService.showSuccess(`Purchase Order ${newPO.poNumber} created successfully`);

      return newPO;
    } catch (error) {
      notificationService.showError(`Failed to create purchase order: ${error.message}`);
      throw error;
    }
  }

  async updatePurchaseOrder(poData) {
    try {
      console.log('DataSync updatePurchaseOrder called with:', poData);

      // Validate vendor exists if specified
      if (poData.vendorId) {
        const vendor = vendorService.getById(poData.vendorId);
        if (!vendor) {
          throw new Error('Selected vendor does not exist');
        }
        poData.vendorName = vendor.name;
      }

      // For now, store directly in localStorage as purchase order service might not exist yet
      const purchaseOrdersKey = 'purchase_order_management_pos';
      const existingPOs = JSON.parse(localStorage.getItem(purchaseOrdersKey) || '[]');

      const index = existingPOs.findIndex(po => po.id === poData.id);
      if (index === -1) {
        throw new Error('Purchase order not found');
      }

      const updatedPO = {
        ...existingPOs[index],
        ...poData,
        updatedAt: new Date().toISOString()
      };

      existingPOs[index] = updatedPO;
      localStorage.setItem(purchaseOrdersKey, JSON.stringify(existingPOs));

      console.log('Purchase order updated successfully:', updatedPO);

      this.notifyListeners('purchaseOrders', 'update', updatedPO);
      notificationService.showSuccess(`Purchase Order ${updatedPO.poNumber} updated successfully`);

      return updatedPO;
    } catch (error) {
      notificationService.showError(`Failed to update purchase order: ${error.message}`);
      throw error;
    }
  }

  async deletePurchaseOrder(id) {
    try {
      const purchaseOrdersKey = 'purchase_order_management_pos';
      const existingPOs = JSON.parse(localStorage.getItem(purchaseOrdersKey) || '[]');

      const index = existingPOs.findIndex(po => po.id === id);
      if (index === -1) {
        throw new Error('Purchase order not found');
      }

      const deletedPO = existingPOs.splice(index, 1)[0];
      localStorage.setItem(purchaseOrdersKey, JSON.stringify(existingPOs));

      this.notifyListeners('purchaseOrders', 'delete', { id });
      notificationService.showSuccess('Purchase order deleted successfully');

      return deletedPO;
    } catch (error) {
      notificationService.showError(`Failed to delete purchase order: ${error.message}`);
      throw error;
    }
  }

  // Search across entities
  async searchAllEntities(query) {
    const results = {};
    const searchQuery = query.toLowerCase();

    try {
      // Search customers
      const customers = await this.getCustomers();
      results.customers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery) ||
        customer.email.toLowerCase().includes(searchQuery)
      );

      // Search sales orders
      const orders = await this.getSalesOrders();
      results.salesOrders = orders.filter(order =>
        order.orderNumber?.toLowerCase().includes(searchQuery) ||
        order.customerName?.toLowerCase().includes(searchQuery) ||
        order.destination?.toLowerCase().includes(searchQuery)
      );

      // Search invoices
      const invoices = await this.getInvoices();
      results.invoices = invoices.filter(invoice =>
        invoice.invoiceNumber?.toLowerCase().includes(searchQuery) ||
        invoice.customerName?.toLowerCase().includes(searchQuery)
      );

      // Search purchase orders
      const purchaseOrders = await this.getPurchaseOrders();
      results.purchaseOrders = purchaseOrders.filter(po =>
        po.poNumber?.toLowerCase().includes(searchQuery) ||
        po.vendorName?.toLowerCase().includes(searchQuery) ||
        po.customerName?.toLowerCase().includes(searchQuery)
      );

      return results;
    } catch (error) {
      console.error('Error searching entities:', error);
      throw error;
    }
  }
}

// Create singleton instance
const dataSyncService = new DataSyncService();

export default dataSyncService;