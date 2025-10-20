// Local Storage Service for Freight Forwarding App
const STORAGE_KEYS = {
  CUSTOMERS: 'freightflow_customers',
  SALES_ORDERS: 'freightflow_sales_orders',
  CARGO: 'freightflow_cargo',
  SHIPMENTS: 'freightflow_shipments',
  OPERATIONAL_COSTS: 'freightflow_operational_costs',
  SELLING_COSTS: 'freightflow_selling_costs',
  VENDORS: 'freightflow_vendors',
  INVOICES: 'freightflow_invoices',
  HS_CODES: 'freightflow_hs_codes',
  USERS: 'freightflow_users',
};

// Validation schemas
const VALIDATION_RULES = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[0-9\-\(\)\s]{10,}$/,
  // Indonesian NPWP format: XX.XXX.XXX.X-XXX.XXX
  taxId: /^([0-9]{2})\.([0-9]{3})\.([0-9]{3})\.([0-9]{1})\-([0-9]{3})\.([0-9]{3})$/,
  trackingNumber: /^TRK-\d+$/,
  orderNumber: /^SO-\d+$/,
  invoiceNumber: /^INV-\d+$/,
};

// Validation functions
const validateEmail = (email) => VALIDATION_RULES.email.test(email);
const validatePhone = (phone) => VALIDATION_RULES.phone.test(phone);
const validateTaxId = (taxId) => VALIDATION_RULES.taxId.test(taxId);
const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    throw new Error(`${fieldName} is required`);
  }
  return true;
};

const validateNumber = (value, fieldName, min = 0, max = Infinity) => {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  if (num < min || num > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`);
  }
  return num;
};

const validateEnum = (value, fieldName, allowedValues) => {
  if (!allowedValues.includes(value)) {
    throw new Error(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }
  return value;
};

// Generic storage functions
const getFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return [];
  }
};

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
    return false;
  }
};

// Customer Management
export const customerService = {
  getAll: () => getFromStorage(STORAGE_KEYS.CUSTOMERS),

  getById: (id) => {
    if (!id) return null;
    const customers = getFromStorage(STORAGE_KEYS.CUSTOMERS);
    return customers.find(customer => customer.id === id) || null;
  },

  create: (customer) => {
    try {
      // Validate required fields
      validateRequired(customer.name, 'Customer name');
      validateRequired(customer.email, 'Email');
      validateRequired(customer.phone, 'Phone');

      // Validate email format
      if (!validateEmail(customer.email)) {
        throw new Error('Invalid email format');
      }

      // Validate phone format
      if (!validatePhone(customer.phone)) {
        throw new Error('Invalid phone number format');
      }

      // Validate tax ID if provided
      if (customer.taxId && !validateTaxId(customer.taxId)) {
        throw new Error('Format NPWP tidak valid (diharapkan: XX.XXX.XXX.X-XXX.XXX)');
      }

      // Validate credit limit
      if (customer.creditLimit !== undefined) {
        validateNumber(customer.creditLimit, 'Credit limit', 0);
      }

      const customers = getFromStorage(STORAGE_KEYS.CUSTOMERS);

      // Check for duplicate email
      const existingCustomer = customers.find(c => c.email.toLowerCase() === customer.email.toLowerCase());
      if (existingCustomer) {
        throw new Error('Customer with this email already exists');
      }

      const newCustomer = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        name: customer.name.trim(),
        email: customer.email.toLowerCase().trim(),
        phone: customer.phone.trim(),
        type: customer.type || 'Individual',
        address: customer.address?.trim() || '',
        taxId: customer.taxId?.trim() || '',
        creditLimit: customer.creditLimit || 0,
        paymentTerms: customer.paymentTerms || 'Net 30',
        contactPerson: customer.contactPerson?.trim() || '',
        contactPersonPhone: customer.contactPersonPhone?.trim() || '',
        contactPersonEmail: customer.contactPersonEmail?.toLowerCase().trim() || '',
        industry: customer.industry?.trim() || '',
        website: customer.website?.trim() || '',
        notes: customer.notes?.trim() || '',
        status: 'Active',
        ...customer,
      };

      customers.push(newCustomer);
      return saveToStorage(STORAGE_KEYS.CUSTOMERS, customers) ? newCustomer : null;
    } catch (error) {
      console.error('Error creating customer:', error.message);
      throw error;
    }
  },

  update: (id, customer) => {
    try {
      if (!id) throw new Error('Customer ID is required');

      const customers = getFromStorage(STORAGE_KEYS.CUSTOMERS);
      const index = customers.findIndex(c => c.id === id);

      if (index === -1) {
        throw new Error('Customer not found');
      }

      // Validate email format if provided
      if (customer.email && !validateEmail(customer.email)) {
        throw new Error('Invalid email format');
      }

      // Validate phone format if provided
      if (customer.phone && !validatePhone(customer.phone)) {
        throw new Error('Invalid phone number format');
      }

      // Validate tax ID if provided
      if (customer.taxId && !validateTaxId(customer.taxId)) {
        throw new Error('Format NPWP tidak valid (diharapkan: XX.XXX.XXX.X-XXX.XXX)');
      }

      // Validate credit limit if provided
      if (customer.creditLimit !== undefined) {
        validateNumber(customer.creditLimit, 'Credit limit', 0);
      }

      // Check for duplicate email
      if (customer.email) {
        const existingCustomer = customers.find(c =>
          c.id !== id && c.email.toLowerCase() === customer.email.toLowerCase()
        );
        if (existingCustomer) {
          throw new Error('Another customer with this email already exists');
        }
      }

      const updatedCustomer = {
        ...customers[index],
        ...customer,
        id,
        updatedAt: new Date().toISOString(),
        name: customer.name ? customer.name.trim() : customers[index].name,
        email: customer.email ? customer.email.toLowerCase().trim() : customers[index].email,
        phone: customer.phone ? customer.phone.trim() : customers[index].phone,
        contactPerson: customer.contactPerson !== undefined ? customer.contactPerson.trim() : customers[index].contactPerson,
        contactPersonPhone: customer.contactPersonPhone !== undefined ? customer.contactPersonPhone.trim() : customers[index].contactPersonPhone,
        contactPersonEmail: customer.contactPersonEmail !== undefined ? customer.contactPersonEmail.toLowerCase().trim() : customers[index].contactPersonEmail,
        industry: customer.industry !== undefined ? customer.industry.trim() : customers[index].industry,
        website: customer.website !== undefined ? customer.website.trim() : customers[index].website,
        notes: customer.notes !== undefined ? customer.notes.trim() : customers[index].notes,
      };

      customers[index] = updatedCustomer;
      return saveToStorage(STORAGE_KEYS.CUSTOMERS, customers) ? updatedCustomer : null;
    } catch (error) {
      console.error('Error updating customer:', error.message);
      throw error;
    }
  },

  delete: (id) => {
    try {
      if (!id) throw new Error('Customer ID is required');

      const customers = getFromStorage(STORAGE_KEYS.CUSTOMERS);
      const customerExists = customers.some(c => c.id === id);

      if (!customerExists) {
        throw new Error('Customer not found');
      }

      const filteredCustomers = customers.filter(c => c.id !== id);
      return saveToStorage(STORAGE_KEYS.CUSTOMERS, filteredCustomers);
    } catch (error) {
      console.error('Error deleting customer:', error.message);
      throw error;
    }
  },
};

// Sales Order Management
export const salesOrderService = {
  getAll: () => getFromStorage(STORAGE_KEYS.SALES_ORDERS),

  getById: (id) => {
    if (!id) return null;
    const orders = getFromStorage(STORAGE_KEYS.SALES_ORDERS);
    return orders.find(order => order.id === id) || null;
  },

  create: (order) => {
    console.log('localStorage salesOrderService.create called with:', order);
    try {
      // Validate required fields
      validateRequired(order.customerName, 'Customer name');
      validateRequired(order.origin, 'Origin');
      validateRequired(order.destination, 'Destination');
      validateRequired(order.cargoType, 'Cargo type');
      validateRequired(order.orderType, 'Order type');

      // Validate order type
      const validOrderTypes = ['REG', 'PAM', 'PRO'];
      validateEnum(order.orderType, 'Order type', validOrderTypes);

      // Validate numeric fields
      validateNumber(order.weight, 'Weight', 0.1);
      validateNumber(order.volume, 'Volume', 0.1);
      validateNumber(order.value, 'Cargo value', 0);
      validateNumber(order.estimatedCost, 'Estimated cost', 0);
      validateNumber(order.sellingPrice, 'Selling price', 0);

      // Validate cargo items if provided
      if (order.cargoItems && Array.isArray(order.cargoItems)) {
        order.cargoItems.forEach((item, index) => {
          if (item.weight !== undefined) {
            validateNumber(item.weight, `Cargo item ${index + 1} weight`, 0.1);
          }
          if (item.volume !== undefined) {
            validateNumber(item.volume, `Cargo item ${index + 1} volume`, 0.1);
          }
          if (item.value !== undefined) {
            validateNumber(item.value, `Cargo item ${index + 1} value`, 0);
          }
          if (item.hsCode && item.hsCode.trim()) {
            if (!/^\d{4}\.\d{2}\.\d{4}$/.test(item.hsCode)) {
              throw new Error(`Cargo item ${index + 1} has invalid HS Code format`);
            }
          }
        });
      }

      // Validate selling price is greater than estimated cost
      if (order.sellingPrice <= order.estimatedCost) {
        throw new Error('Selling price must be greater than estimated cost');
      }

      // Validate service type
      const validServiceTypes = ['Sea Freight', 'Air Freight', 'Land Freight', 'Express'];
      validateEnum(order.serviceType, 'Service type', validServiceTypes);

      const orders = getFromStorage(STORAGE_KEYS.SALES_ORDERS);

      // Generate order number with new format: SO/kode jenis/YY/MM/XXXXX
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
      const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month with leading zero

      // Get next order number for this type and month
      const existingOrders = orders.filter(o =>
        o.orderType === order.orderType &&
        o.createdAt &&
        new Date(o.createdAt).getFullYear() === now.getFullYear() &&
        (new Date(o.createdAt).getMonth() + 1) === (now.getMonth() + 1)
      );

      const nextNumber = (existingOrders.length + 1).toString().padStart(5, '0');
      const orderNumber = `SO/${order.orderType}/${year}/${month}/${nextNumber}`;

      const newOrder = {
        id: Date.now().toString(),
        orderNumber: orderNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'Draft',
        orderType: order.orderType,
        origin: order.origin.trim(),
        destination: order.destination.trim(),
        cargoType: order.cargoType.trim(),
        serviceType: order.serviceType,
        weight: order.weight,
        volume: order.volume,
        value: order.value,
        estimatedCost: order.estimatedCost,
        sellingPrice: order.sellingPrice,
        customerName: order.customerName.trim(),
        customerId: order.customerId || null,
        notes: order.notes?.trim() || '',
        priority: order.priority || 'Normal',
        estimatedDeliveryDate: order.estimatedDeliveryDate || null,
        ...order,
      };

      orders.push(newOrder);
      const saveResult = saveToStorage(STORAGE_KEYS.SALES_ORDERS, orders);
      console.log('localStorage save result:', saveResult);
      console.log('Returning newOrder:', newOrder);
      return saveResult ? newOrder : null;
    } catch (error) {
      console.error('Error creating sales order:', error.message);
      throw error;
    }
  },

  update: (id, order) => {
    try {
      if (!id) throw new Error('Order ID is required');

      const orders = getFromStorage(STORAGE_KEYS.SALES_ORDERS);
      const index = orders.findIndex(o => o.id === id);

      if (index === -1) {
        throw new Error('Sales order not found');
      }

      // Validate numeric fields if provided
      if (order.weight !== undefined) {
        validateNumber(order.weight, 'Weight', 0.1);
      }
      if (order.volume !== undefined) {
        validateNumber(order.volume, 'Volume', 0.1);
      }
      if (order.value !== undefined) {
        validateNumber(order.value, 'Cargo value', 0);
      }
      if (order.estimatedCost !== undefined) {
        validateNumber(order.estimatedCost, 'Estimated cost', 0);
      }
      if (order.sellingPrice !== undefined) {
        validateNumber(order.sellingPrice, 'Selling price', 0);
      }

      // Validate selling price vs estimated cost if both are provided
      if (order.sellingPrice !== undefined && order.estimatedCost !== undefined) {
        if (order.sellingPrice <= order.estimatedCost) {
          throw new Error('Selling price must be greater than estimated cost');
        }
      } else if (order.sellingPrice !== undefined && orders[index].estimatedCost) {
        if (order.sellingPrice <= orders[index].estimatedCost) {
          throw new Error('Selling price must be greater than estimated cost');
        }
      }

      // Validate service type if provided
      if (order.serviceType) {
        const validServiceTypes = ['Sea Freight', 'Air Freight', 'Land Freight', 'Express'];
        validateEnum(order.serviceType, 'Service type', validServiceTypes);
      }

      const updatedOrder = {
        ...orders[index],
        ...order,
        id,
        orderNumber: orders[index].orderNumber, // Preserve original order number
        updatedAt: new Date().toISOString(),
        origin: order.origin ? order.origin.trim() : orders[index].origin,
        destination: order.destination ? order.destination.trim() : orders[index].destination,
        cargoType: order.cargoType ? order.cargoType.trim() : orders[index].cargoType,
        customerName: order.customerName ? order.customerName.trim() : orders[index].customerName,
        notes: order.notes !== undefined ? order.notes.trim() : orders[index].notes,
      };

      orders[index] = updatedOrder;
      return saveToStorage(STORAGE_KEYS.SALES_ORDERS, orders) ? updatedOrder : null;
    } catch (error) {
      console.error('Error updating sales order:', error.message);
      throw error;
    }
  },

  delete: (id) => {
    try {
      if (!id) throw new Error('Order ID is required');

      const orders = getFromStorage(STORAGE_KEYS.SALES_ORDERS);
      const orderExists = orders.some(o => o.id === id);

      if (!orderExists) {
        throw new Error('Sales order not found');
      }

      const filteredOrders = orders.filter(o => o.id !== id);
      return saveToStorage(STORAGE_KEYS.SALES_ORDERS, filteredOrders);
    } catch (error) {
      console.error('Error deleting sales order:', error.message);
      throw error;
    }
  },
};

// Cargo Management
export const cargoService = {
  getAll: () => getFromStorage(STORAGE_KEYS.CARGO),

  getById: (id) => {
    const cargo = getFromStorage(STORAGE_KEYS.CARGO);
    return cargo.find(item => item.id === id);
  },

  create: (cargoItem) => {
    const cargo = getFromStorage(STORAGE_KEYS.CARGO);
    const newCargo = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...cargoItem,
    };
    cargo.push(newCargo);
    return saveToStorage(STORAGE_KEYS.CARGO, cargo) ? newCargo : null;
  },

  update: (id, cargoItem) => {
    const cargo = getFromStorage(STORAGE_KEYS.CARGO);
    const index = cargo.findIndex(item => item.id === id);
    if (index !== -1) {
      cargo[index] = { ...cargo[index], ...cargoItem, updatedAt: new Date().toISOString() };
      return saveToStorage(STORAGE_KEYS.CARGO, cargo) ? cargo[index] : null;
    }
    return null;
  },

  delete: (id) => {
    const cargo = getFromStorage(STORAGE_KEYS.CARGO);
    const filteredCargo = cargo.filter(item => item.id !== id);
    return saveToStorage(STORAGE_KEYS.CARGO, filteredCargo);
  },
};

// Shipment Management
export const shipmentService = {
  getAll: () => getFromStorage(STORAGE_KEYS.SHIPMENTS),

  getById: (id) => {
    const shipments = getFromStorage(STORAGE_KEYS.SHIPMENTS);
    return shipments.find(shipment => shipment.id === id);
  },

  create: (shipment) => {
    const shipments = getFromStorage(STORAGE_KEYS.SHIPMENTS);
    const newShipment = {
      id: Date.now().toString(),
      trackingNumber: `TRK-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'Booked',
      ...shipment,
    };
    shipments.push(newShipment);
    return saveToStorage(STORAGE_KEYS.SHIPMENTS, shipments) ? newShipment : null;
  },

  update: (id, shipment) => {
    const shipments = getFromStorage(STORAGE_KEYS.SHIPMENTS);
    const index = shipments.findIndex(s => s.id === id);
    if (index !== -1) {
      shipments[index] = { ...shipments[index], ...shipment, updatedAt: new Date().toISOString() };
      return saveToStorage(STORAGE_KEYS.SHIPMENTS, shipments) ? shipments[index] : null;
    }
    return null;
  },

  delete: (id) => {
    const shipments = getFromStorage(STORAGE_KEYS.SHIPMENTS);
    const filteredShipments = shipments.filter(s => s.id !== id);
    return saveToStorage(STORAGE_KEYS.SHIPMENTS, filteredShipments);
  },
};

// Operational Cost Management
export const operationalCostService = {
  getAll: () => getFromStorage(STORAGE_KEYS.OPERATIONAL_COSTS),

  getById: (id) => {
    const costs = getFromStorage(STORAGE_KEYS.OPERATIONAL_COSTS);
    return costs.find(cost => cost.id === id);
  },

  create: (cost) => {
    const costs = getFromStorage(STORAGE_KEYS.OPERATIONAL_COSTS);
    const newCost = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...cost,
    };
    costs.push(newCost);
    return saveToStorage(STORAGE_KEYS.OPERATIONAL_COSTS, costs) ? newCost : null;
  },

  update: (id, cost) => {
    const costs = getFromStorage(STORAGE_KEYS.OPERATIONAL_COSTS);
    const index = costs.findIndex(c => c.id === id);
    if (index !== -1) {
      costs[index] = { ...costs[index], ...cost, updatedAt: new Date().toISOString() };
      return saveToStorage(STORAGE_KEYS.OPERATIONAL_COSTS, costs) ? costs[index] : null;
    }
    return null;
  },

  delete: (id) => {
    const costs = getFromStorage(STORAGE_KEYS.OPERATIONAL_COSTS);
    const filteredCosts = costs.filter(c => c.id !== id);
    return saveToStorage(STORAGE_KEYS.OPERATIONAL_COSTS, filteredCosts);
  },
};

// Selling Cost Management
export const sellingCostService = {
  getAll: () => getFromStorage(STORAGE_KEYS.SELLING_COSTS),

  getById: (id) => {
    const costs = getFromStorage(STORAGE_KEYS.SELLING_COSTS);
    return costs.find(cost => cost.id === id);
  },

  create: (cost) => {
    const costs = getFromStorage(STORAGE_KEYS.SELLING_COSTS);
    const newCost = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...cost,
    };
    costs.push(newCost);
    return saveToStorage(STORAGE_KEYS.SELLING_COSTS, costs) ? newCost : null;
  },

  update: (id, cost) => {
    const costs = getFromStorage(STORAGE_KEYS.SELLING_COSTS);
    const index = costs.findIndex(c => c.id === id);
    if (index !== -1) {
      costs[index] = { ...costs[index], ...cost, updatedAt: new Date().toISOString() };
      return saveToStorage(STORAGE_KEYS.SELLING_COSTS, costs) ? costs[index] : null;
    }
    return null;
  },

  delete: (id) => {
    const costs = getFromStorage(STORAGE_KEYS.SELLING_COSTS);
    const filteredCosts = costs.filter(c => c.id !== id);
    return saveToStorage(STORAGE_KEYS.SELLING_COSTS, filteredCosts);
  },
};

// Vendor Management - Enhanced
export const vendorService = {
  getAll: () => getFromStorage(STORAGE_KEYS.VENDORS),

  getById: (id) => {
    if (!id) return null;
    const vendors = getFromStorage(STORAGE_KEYS.VENDORS);
    return vendors.find(vendor => vendor.id === id) || null;
  },

  create: (vendor) => {
    try {
      // Validate required fields
      validateRequired(vendor.name, 'Vendor name');
      validateRequired(vendor.type, 'Vendor type');
      validateRequired(vendor.serviceType, 'Service type');
      validateRequired(vendor.contactPerson, 'Contact person');

      // Validate email format if provided
      if (vendor.email && !validateEmail(vendor.email)) {
        throw new Error('Invalid email format');
      }

      // Validate phone format if provided
      if (vendor.phone && !validatePhone(vendor.phone)) {
        throw new Error('Invalid phone number format');
      }

      const vendors = getFromStorage(STORAGE_KEYS.VENDORS);

      // Generate vendor code
      const vendorCode = `VENDOR-${Date.now()}`;

      const newVendor = {
        id: Date.now().toString(),
        vendorCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'Active',
        // Basic Information
        name: vendor.name.trim(),
        type: vendor.type,
        registrationNumber: vendor.registrationNumber || '',
        taxId: vendor.taxId || '',
        licenseNumber: vendor.licenseNumber || '',
        establishedDate: vendor.establishedDate || '',
        companySize: vendor.companySize || 'Medium',
        website: vendor.website || '',
        // Contact Information
        contactPerson: vendor.contactPerson.trim(),
        position: vendor.position || '',
        phone: vendor.phone?.trim() || '',
        email: vendor.email?.toLowerCase().trim() || '',
        // Service Information
        serviceType: vendor.serviceType,
        serviceAreas: vendor.serviceAreas || [],
        equipment: vendor.equipment || [],
        capacity: vendor.capacity || {},
        // Business Information
        paymentTerms: vendor.paymentTerms || 'Net 30',
        creditLimit: vendor.creditLimit || 0,
        currency: vendor.currency || 'IDR',
        // Performance & Compliance
        rating: vendor.rating || 3,
        certifications: vendor.certifications || [],
        insurance: vendor.insurance || {},
        compliance: vendor.compliance || {},
        // Contract Information
        contracts: vendor.contracts || [],
        // System Information
        notes: vendor.notes || '',
        tags: vendor.tags || [],
        ...vendor,
      };

      vendors.push(newVendor);
      return saveToStorage(STORAGE_KEYS.VENDORS, vendors) ? newVendor : null;
    } catch (error) {
      console.error('Error creating vendor:', error.message);
      throw error;
    }
  },

  update: (id, vendor) => {
    try {
      if (!id) throw new Error('Vendor ID is required');

      const vendors = getFromStorage(STORAGE_KEYS.VENDORS);
      const index = vendors.findIndex(v => v.id === id);

      if (index === -1) {
        throw new Error('Vendor not found');
      }

      // Validate email format if provided
      if (vendor.email && !validateEmail(vendor.email)) {
        throw new Error('Invalid email format');
      }

      // Validate phone format if provided
      if (vendor.phone && !validatePhone(vendor.phone)) {
        throw new Error('Invalid phone number format');
      }

      const updatedVendor = {
        ...vendors[index],
        ...vendor,
        id,
        vendorCode: vendors[index].vendorCode, // Preserve vendor code
        updatedAt: new Date().toISOString(),
        name: vendor.name ? vendor.name.trim() : vendors[index].name,
        contactPerson: vendor.contactPerson ? vendor.contactPerson.trim() : vendors[index].contactPerson,
        email: vendor.email ? vendor.email.toLowerCase().trim() : vendors[index].email,
        phone: vendor.phone ? vendor.phone.trim() : vendors[index].phone,
      };

      vendors[index] = updatedVendor;
      return saveToStorage(STORAGE_KEYS.VENDORS, vendors) ? updatedVendor : null;
    } catch (error) {
      console.error('Error updating vendor:', error.message);
      throw error;
    }
  },

  delete: (id) => {
    try {
      if (!id) throw new Error('Vendor ID is required');

      // Check for related records before deletion
      const salesOrders = getFromStorage(STORAGE_KEYS.SALES_ORDERS);
      const relatedOrders = salesOrders.filter(order => order.vendorId === id);

      if (relatedOrders.length > 0) {
        throw new Error(`Cannot delete vendor with ${relatedOrders.length} associated sales orders`);
      }

      const vendors = getFromStorage(STORAGE_KEYS.VENDORS);
      const vendorExists = vendors.some(v => v.id === id);

      if (!vendorExists) {
        throw new Error('Vendor not found');
      }

      const filteredVendors = vendors.filter(v => v.id !== id);
      return saveToStorage(STORAGE_KEYS.VENDORS, filteredVendors);
    } catch (error) {
      console.error('Error deleting vendor:', error.message);
      throw error;
    }
  },

  // Enhanced vendor methods
  getByServiceType: (serviceType) => {
    const vendors = getFromStorage(STORAGE_KEYS.VENDORS);
    return vendors.filter(vendor => vendor.serviceType === serviceType && vendor.status === 'Active');
  },

  getByRating: (minRating = 0) => {
    const vendors = getFromStorage(STORAGE_KEYS.VENDORS);
    return vendors.filter(vendor => vendor.rating >= minRating && vendor.status === 'Active');
  },

  updateRating: (id, newRating) => {
    const vendors = getFromStorage(STORAGE_KEYS.VENDORS);
    const index = vendors.findIndex(v => v.id === id);

    if (index !== -1) {
      vendors[index].rating = newRating;
      vendors[index].lastRatingUpdate = new Date().toISOString();
      return saveToStorage(STORAGE_KEYS.VENDORS, vendors) ? vendors[index] : null;
    }
    return null;
  },

  getPerformanceMetrics: (id) => {
    // Get performance data from related records
    const salesOrders = getFromStorage(STORAGE_KEYS.SALES_ORDERS);
    const operationalCosts = getFromStorage(STORAGE_KEYS.OPERATIONAL_COSTS);

    const vendorOrders = salesOrders.filter(order => order.vendorId === id);
    const vendorCosts = operationalCosts.filter(cost => cost.vendorId === id);

    return {
      totalOrders: vendorOrders.length,
      totalCosts: vendorCosts.length,
      totalCostValue: vendorCosts.reduce((sum, cost) => sum + cost.amount, 0),
      averageOrderValue: vendorOrders.length > 0
        ? vendorOrders.reduce((sum, order) => sum + (order.sellingPrice || 0), 0) / vendorOrders.length
        : 0,
      lastActivity: vendorOrders.length > 0
        ? Math.max(...vendorOrders.map(order => new Date(order.createdAt)))
        : null
    };
  }
};

// Invoice Management
export const invoiceService = {
  getAll: () => getFromStorage(STORAGE_KEYS.INVOICES),

  getById: (id) => {
    if (!id) return null;
    const invoices = getFromStorage(STORAGE_KEYS.INVOICES);
    return invoices.find(invoice => invoice.id === id) || null;
  },

  create: (invoice) => {
    console.log('localStorage invoiceService.create called with:', invoice);
    try {
      // Validate required fields
      validateRequired(invoice.customerName, 'Customer name');
      validateRequired(invoice.customerId, 'Customer ID');

      // Validate invoice items
      if (!invoice.items || !Array.isArray(invoice.items) || invoice.items.length === 0) {
        throw new Error('Invoice must contain at least one item');
      }

      // Validate each item
      invoice.items.forEach((item, index) => {
        validateRequired(item.description, `Item ${index + 1} description`);
        validateNumber(item.quantity, `Item ${index + 1} quantity`, 1);
        validateNumber(item.unitPrice, `Item ${index + 1} unit price`, 0);
        validateNumber(item.amount, `Item ${index + 1} amount`, 0);
      });

      // Calculate subtotal from items
      const calculatedSubtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);

      // Validate subtotal if provided
      if (invoice.subtotal !== undefined && Math.abs(invoice.subtotal - calculatedSubtotal) > 0.01) {
        throw new Error('Invoice subtotal does not match item amounts');
      }

      const invoices = getFromStorage(STORAGE_KEYS.INVOICES);
      const newInvoice = {
        id: Date.now().toString(),
        invoiceNumber: `INV-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'Draft',
        customerName: invoice.customerName.trim(),
        customerId: invoice.customerId,
        items: invoice.items,
        subtotal: calculatedSubtotal,
        taxRate: invoice.taxRate || 0,
        taxAmount: (calculatedSubtotal * (invoice.taxRate || 0)) / 100,
        total: calculatedSubtotal + ((calculatedSubtotal * (invoice.taxRate || 0)) / 100),
        dueDate: invoice.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: invoice.notes?.trim() || '',
        paymentTerms: invoice.paymentTerms || 'Net 30',
        ...invoice,
      };

      invoices.push(newInvoice);
      const saveResult = saveToStorage(STORAGE_KEYS.INVOICES, invoices);
      console.log('localStorage invoice save result:', saveResult);
      console.log('Returning newInvoice:', newInvoice);
      return saveResult ? newInvoice : null;
    } catch (error) {
      console.error('Error creating invoice:', error.message);
      throw error;
    }
  },

  update: (id, invoice) => {
    try {
      if (!id) throw new Error('Invoice ID is required');

      const invoices = getFromStorage(STORAGE_KEYS.INVOICES);
      const index = invoices.findIndex(i => i.id === id);

      if (index === -1) {
        throw new Error('Invoice not found');
      }

      // Validate invoice items if provided
      if (invoice.items) {
        if (!Array.isArray(invoice.items) || invoice.items.length === 0) {
          throw new Error('Invoice must contain at least one item');
        }

        invoice.items.forEach((item, index) => {
          validateRequired(item.description, `Item ${index + 1} description`);
          validateNumber(item.quantity, `Item ${index + 1} quantity`, 1);
          validateNumber(item.unitPrice, `Item ${index + 1} unit price`, 0);
          validateNumber(item.amount, `Item ${index + 1} amount`, 0);
        });

        // Recalculate totals
        const calculatedTotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
        invoice.subtotal = calculatedTotal;
        invoice.taxAmount = (calculatedTotal * (invoice.taxRate || invoices[index].taxRate || 0)) / 100;
        invoice.total = calculatedTotal + invoice.taxAmount;
      }

      const updatedInvoice = {
        ...invoices[index],
        ...invoice,
        id,
        invoiceNumber: invoices[index].invoiceNumber, // Preserve original invoice number
        updatedAt: new Date().toISOString(),
        customerName: invoice.customerName ? invoice.customerName.trim() : invoices[index].customerName,
        notes: invoice.notes !== undefined ? invoice.notes.trim() : invoices[index].notes,
      };

      invoices[index] = updatedInvoice;
      return saveToStorage(STORAGE_KEYS.INVOICES, invoices) ? updatedInvoice : null;
    } catch (error) {
      console.error('Error updating invoice:', error.message);
      throw error;
    }
  },

  delete: (id) => {
    try {
      if (!id) throw new Error('Invoice ID is required');

      const invoices = getFromStorage(STORAGE_KEYS.INVOICES);
      const invoiceExists = invoices.some(i => i.id === id);

      if (!invoiceExists) {
        throw new Error('Invoice not found');
      }

      const filteredInvoices = invoices.filter(i => i.id !== id);
      return saveToStorage(STORAGE_KEYS.INVOICES, filteredInvoices);
    } catch (error) {
      console.error('Error deleting invoice:', error.message);
      throw error;
    }
  },
};

// HS Code Management
export const hsCodeService = {
  getAll: () => getFromStorage(STORAGE_KEYS.HS_CODES),

  getById: (id) => {
    if (!id) return null;
    const hsCodes = getFromStorage(STORAGE_KEYS.HS_CODES);
    return hsCodes.find(hs => hs.id === id) || null;
  },

  getByCode: (code) => {
    if (!code) return null;
    const hsCodes = getFromStorage(STORAGE_KEYS.HS_CODES);
    return hsCodes.find(hs => hs.code === code) || null;
  },

  create: (hsCode) => {
    try {
      // Validate required fields
      validateRequired(hsCode.code, 'HS Code');
      validateRequired(hsCode.description, 'Description');
      validateRequired(hsCode.category, 'Category');

      // Validate HS Code format
      if (!/^\d{4}\.\d{2}\.\d{4}$/.test(hsCode.code)) {
        throw new Error('HS Code must be in format: 1234.56.7890');
      }

      // Validate percentages
      validateNumber(hsCode.importDuty, 'Import duty', 0, 100);
      validateNumber(hsCode.vat, 'VAT', 0, 100);
      validateNumber(hsCode.excise, 'Excise', 0, 100);

      const hsCodes = getFromStorage(STORAGE_KEYS.HS_CODES);

      // Check for duplicate HS Code
      const existingHS = hsCodes.find(hs => hs.code === hsCode.code);
      if (existingHS) {
        throw new Error('HS Code already exists');
      }

      const newHSCode = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        code: hsCode.code.trim(),
        description: hsCode.description.trim(),
        category: hsCode.category,
        importDuty: hsCode.importDuty,
        vat: hsCode.vat || 11,
        excise: hsCode.excise || 0,
        restrictions: hsCode.restrictions || [],
        requiredPermits: hsCode.requiredPermits || [],
        notes: hsCode.notes?.trim() || '',
        status: 'Active',
        ...hsCode,
      };

      hsCodes.push(newHSCode);
      return saveToStorage(STORAGE_KEYS.HS_CODES, hsCodes) ? newHSCode : null;
    } catch (error) {
      console.error('Error creating HS Code:', error.message);
      throw error;
    }
  },

  update: (id, hsCode) => {
    try {
      if (!id) throw new Error('HS Code ID is required');

      const hsCodes = getFromStorage(STORAGE_KEYS.HS_CODES);
      const index = hsCodes.findIndex(hs => hs.id === id);

      if (index === -1) {
        throw new Error('HS Code not found');
      }

      // Validate HS Code format if provided
      if (hsCode.code && !/^\d{4}\.\d{2}\.\d{4}$/.test(hsCode.code)) {
        throw new Error('HS Code must be in format: 1234.56.7890');
      }

      // Validate percentages if provided
      if (hsCode.importDuty !== undefined) {
        validateNumber(hsCode.importDuty, 'Import duty', 0, 100);
      }
      if (hsCode.vat !== undefined) {
        validateNumber(hsCode.vat, 'VAT', 0, 100);
      }
      if (hsCode.excise !== undefined) {
        validateNumber(hsCode.excise, 'Excise', 0, 100);
      }

      // Check for duplicate HS Code
      if (hsCode.code) {
        const existingHS = hsCodes.find(hs =>
          hs.id !== id && hs.code === hsCode.code
        );
        if (existingHS) {
          throw new Error('Another HS Code with this code already exists');
        }
      }

      const updatedHSCode = {
        ...hsCodes[index],
        ...hsCode,
        id,
        updatedAt: new Date().toISOString(),
        code: hsCode.code ? hsCode.code.trim() : hsCodes[index].code,
        description: hsCode.description ? hsCode.description.trim() : hsCodes[index].description,
        restrictions: hsCode.restrictions !== undefined ? hsCode.restrictions : hsCodes[index].restrictions,
        requiredPermits: hsCode.requiredPermits !== undefined ? hsCode.requiredPermits : hsCodes[index].requiredPermits,
        notes: hsCode.notes !== undefined ? hsCode.notes.trim() : hsCodes[index].notes,
      };

      hsCodes[index] = updatedHSCode;
      return saveToStorage(STORAGE_KEYS.HS_CODES, hsCodes) ? updatedHSCode : null;
    } catch (error) {
      console.error('Error updating HS Code:', error.message);
      throw error;
    }
  },

  delete: (id) => {
    try {
      if (!id) throw new Error('HS Code ID is required');

      // Check for related records before deletion
      const salesOrders = getFromStorage(STORAGE_KEYS.SALES_ORDERS);
      const relatedOrders = salesOrders.filter(order => order.hsCode === id);

      if (relatedOrders.length > 0) {
        throw new Error(`Cannot delete HS Code with ${relatedOrders.length} associated sales orders`);
      }

      const hsCodes = getFromStorage(STORAGE_KEYS.HS_CODES);
      const hsExists = hsCodes.some(hs => hs.id === id);

      if (!hsExists) {
        throw new Error('HS Code not found');
      }

      const filteredHSCodes = hsCodes.filter(hs => hs.id !== id);
      return saveToStorage(STORAGE_KEYS.HS_CODES, filteredHSCodes);
    } catch (error) {
      console.error('Error deleting HS Code:', error.message);
      throw error;
    }
  },

  // Enhanced HS Code methods
  getByCategory: (category) => {
    const hsCodes = getFromStorage(STORAGE_KEYS.HS_CODES);
    return hsCodes.filter(hs => hs.category === category && hs.status === 'Active');
  },

  searchByCode: (searchTerm) => {
    const hsCodes = getFromStorage(STORAGE_KEYS.HS_CODES);
    return hsCodes.filter(hs =>
      hs.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hs.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  },

  calculateImportCost: (cifValue, hsCodeId) => {
    const hsCode = hsCodeService.getById(hsCodeId);
    if (!hsCode) {
      throw new Error('HS Code not found');
    }

    const cif = parseFloat(cifValue);
    if (isNaN(cif) || cif < 0) {
      throw new Error('Invalid CIF value');
    }

    const importDuty = cif * (hsCode.importDuty / 100);
    const vatBase = cif + importDuty;
    const vat = vatBase * (hsCode.vat / 100);
    const excise = cif * (hsCode.excise / 100);
    const total = cif + importDuty + vat + excise;

    return {
      cifValue: cif,
      importDuty,
      vat,
      excise,
      totalCost: total,
      hsCode,
      breakdown: {
        cif: cif,
        duty: `${hsCode.importDuty}%`,
        vat: `${hsCode.vat}%`,
        excise: `${hsCode.excise}%`,
      }
    };
  },

  getCategories: () => {
    const hsCodes = getFromStorage(STORAGE_KEYS.HS_CODES);
    const categories = [...new Set(hsCodes.map(hs => hs.category))];
    return categories.sort();
  },

  getDutyRange: (category) => {
    const hsCodes = category
      ? getFromStorage(STORAGE_KEYS.HS_CODES).filter(hs => hs.category === category)
      : getFromStorage(STORAGE_KEYS.HS_CODES);

    if (hsCodes.length === 0) return { min: 0, max: 0, avg: 0 };

    const duties = hsCodes.map(hs => hs.importDuty);
    return {
      min: Math.min(...duties),
      max: Math.max(...duties),
      avg: duties.reduce((sum, duty) => sum + duty, 0) / duties.length
    };
  }
};

// Initialize sample data
export const initializeSampleData = () => {
  // Clear all existing data first to ensure clean state
  localStorage.removeItem('freightflow_customers');
  localStorage.removeItem('freightflow_sales_orders');
  localStorage.removeItem('freightflow_cargo');
  localStorage.removeItem('freightflow_shipments');
  localStorage.removeItem('freightflow_operational_costs');
  localStorage.removeItem('freightflow_selling_costs');
  localStorage.removeItem('freightflow_vendors');
  localStorage.removeItem('freightflow_invoices');

  console.log('🧹 Cleared all existing sample data');

  // Create 1 sample customer
  const sampleCustomer = customerService.create({
    name: 'PT. Global Trade Indonesia',
    type: 'Corporation',
    email: 'contact@globaltrade.co.id',
    phone: '+62-21-555-0123',
    address: 'Jl. Sudirman No. 123, Jakarta Pusat',
    taxId: '01.234.567.8-901.000',
    creditLimit: 100000000,
    paymentTerms: 'Net 30',
  });

  // Create 1 sample vendor with comprehensive information
  const sampleVendor = vendorService.create({
    name: 'PT. Samudera Logistics',
    type: 'PT',
    registrationNumber: '9123456789012345',
    taxId: '01.234.567.8-901.000',
    licenseNumber: 'SIUP/123456789',
    establishedDate: '2010-05-15',
    companySize: 'Large',
    website: 'www.samudera-logistics.co.id',
    email: 'ops@samudera.co.id',
    phone: '+62-21-555-0789',
    address: 'Jl. Merdeka No. 789, Tanjung Priok, Jakarta',
    billingAddress: 'Jl. Merdeka No. 789, Tanjung Priok, Jakarta',
    serviceType: 'Sea Freight',
    contactPerson: 'Captain Hendro Wijaya',
    position: 'Operations Director',
    paymentTerms: 'Net 30',
    creditLimit: 500000000,
    currency: 'IDR',
    rating: 4.5,
    serviceAreas: ['Asia Pacific', 'Europe', 'America', 'Australia'],
    equipment: [
      'Container 20ft (500 units)',
      'Container 40ft (300 units)',
      'Reefer Container (50 units)',
      'Heavy Lift Equipment'
    ],
    capacity: {
      teu: 15000,
      containers: 800,
      tonnage: 500000
    },
    certifications: [
      'ISO 9001:2015',
      'IMO Certified',
      'IATA Dangerous Goods',
      'AEO Certified',
      'OHSAS 18001'
    ],
    insurance: {
      publicLiability: 'IDR 10,000,000,000',
      cargoInsurance: 'IDR 50,000,000,000',
      professionalIndemnity: 'IDR 5,000,000,000'
    },
    compliance: {
      businessLicense: 'Active',
      safetyCertification: 'Valid until 2025',
      environmentalCompliance: 'Compliant'
    },
    contracts: [
      {
        contractNumber: 'SL-2024-001',
        type: 'Annual',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        value: 5000000000,
        currency: 'IDR'
      }
    ],
    notes: 'Premier shipping line with extensive network covering major global routes',
    tags: ['Premium', 'Global', 'Reliable', 'ISO Certified']
  });

  // Create 1 sample sales order with operational costs
  const sampleSalesOrder = salesOrderService.create({
    customerId: sampleCustomer.id,
    customerName: sampleCustomer.name,
    packageType: 'International',
    origin: 'Jakarta',
    originCountry: 'Indonesia',
    destination: 'Singapore',
    destinationCountry: 'Singapore',
    cargoType: 'Electronics',
    weight: 1500,
    volume: 8.5,
    value: 75000000,
    serviceType: 'Sea Freight',
    estimatedCost: 8500000,
    sellingPrice: 12000000,
    margin: 3500000,
    vendorId: sampleVendor.id,
    vendorName: sampleVendor.name,
    priority: 'Normal',
    specialInstructions: 'Handle with care - fragile electronics',
    status: 'Draft', // Start as Draft, will be confirmed by user
    operationalCosts: [], // Will be populated from operational cost service
    sellingCosts: [
      {
        id: 'commission_001',
        name: 'Sales Commission',
        description: 'Sales commission for closing the deal',
        amount: 5,
        currency: 'IDR',
        type: 'percentage'
      }
    ],
    cargoItems: [
      {
        id: 'cargo-001',
        description: 'Samsung LED TV 55 inch - Batch 2024',
        type: 'Electronics',
        weight: 1500,
        volume: 8.5,
        value: 75000000,
        hazardous: false,
        specialHandling: 'Handle with care, fragile electronics'
      }
    ],
    shipmentDetails: {
      // No initial tracking number - will be generated when order is confirmed
      estimatedDeparture: '2024-01-15',
      estimatedArrival: '2024-01-20',
      status: 'Pending'
    }
  });

  // Create operational costs linked to the sample sales order
  if (sampleSalesOrder) {
    operationalCostService.create({
      description: 'Ocean freight charges - Jakarta to Singapore',
      vendorName: 'PT. Samudera Logistics',
      costType: 'Ocean Freight',
      amount: 6500000,
      currency: 'IDR',
      status: 'Paid',
      salesOrderId: sampleSalesOrder.id,
      vendorId: sampleVendor.id,
      invoiceNumber: 'SAM-2024-001',
      dueDate: '2024-02-15'
    });

    operationalCostService.create({
      description: 'Container drayage - port to warehouse',
      vendorName: 'PT. Darat Express',
      costType: 'Trucking',
      amount: 1200000,
      currency: 'IDR',
      status: 'Paid',
      salesOrderId: sampleSalesOrder.id,
      invoiceNumber: 'DAR-2024-001',
      dueDate: '2024-02-10'
    });

    operationalCostService.create({
      description: 'Export documentation and customs clearance',
      vendorName: 'PT. Customs Agent',
      costType: 'Customs Clearance',
      amount: 800000,
      currency: 'IDR',
      status: 'Paid',
      salesOrderId: sampleSalesOrder.id,
      invoiceNumber: 'DOC-2024-001',
      dueDate: '2024-02-05'
    });

    operationalCostService.create({
      description: 'Cargo insurance premium',
      vendorName: 'PT. Asuransi Jasa',
      costType: 'Insurance',
      amount: 450,
      currency: 'USD',
      status: 'Pending',
      salesOrderId: sampleSalesOrder.id,
      invoiceNumber: 'INS-2024-001',
      dueDate: '2024-02-20'
    });

    operationalCostService.create({
      description: 'Terminal handling charges at Tanjung Priok',
      vendorName: 'Jakarta International Container Terminal',
      costType: 'Terminal Handling',
      amount: 2500000,
      currency: 'IDR',
      status: 'Paid',
      salesOrderId: sampleSalesOrder.id,
      invoiceNumber: 'THC-2024-001',
      dueDate: '2024-02-01'
    });

    console.log('✅ Created sample operational costs linked to sales order:', sampleSalesOrder.orderNumber);
  }

  // Create sample selling costs linked to the sales order
  if (sampleSalesOrder && sampleCustomer) {
    sellingCostService.create({
      description: 'Base freight rate - Sea Freight Jakarta to Singapore',
      costType: 'Base Freight Rate',
      amount: 8500000,
      markup: 41.18,
      margin: 3500000,
      currency: 'IDR',
      customerId: sampleCustomer.id,
      customerName: sampleCustomer.name,
      salesOrderId: sampleSalesOrder.id,
      serviceType: 'Sea Freight',
      validFrom: '2024-01-01',
      validUntil: '2024-12-31',
      status: 'Approved'
    });

    sellingCostService.create({
      description: 'Documentation service fee',
      costType: 'Documentation Fee',
      amount: 1200000,
      markup: 25,
      margin: 300000,
      currency: 'IDR',
      customerId: sampleCustomer.id,
      customerName: sampleCustomer.name,
      salesOrderId: sampleSalesOrder.id,
      serviceType: 'Documentation',
      validFrom: '2024-01-01',
      validUntil: '2024-12-31',
      status: 'Approved'
    });

    sellingCostService.create({
      description: 'Cargo insurance premium selling rate',
      costType: 'Insurance Premium',
      amount: 600,
      markup: 33.33,
      margin: 200,
      currency: 'USD',
      customerId: sampleCustomer.id,
      customerName: sampleCustomer.name,
      salesOrderId: sampleSalesOrder.id,
      serviceType: 'Insurance',
      validFrom: '2024-01-01',
      validUntil: '2024-12-31',
      status: 'Approved'
    });

    console.log('✅ Created sample selling costs linked to sales order:', sampleSalesOrder.orderNumber);
  }

  // Create general selling costs (not linked to specific sales order)
  sellingCostService.create({
    description: 'Standard sea freight rate per CBM',
    costType: 'Base Freight Rate',
    amount: 2500000,
    markup: 40,
    margin: 1000000,
    currency: 'IDR',
    serviceType: 'Sea Freight',
    validFrom: '2024-01-01',
    validUntil: '2024-12-31',
    status: 'Approved'
  });

  sellingCostService.create({
    description: 'Air freight premium rate per kg',
    costType: 'Base Freight Rate',
    amount: 15000,
    markup: 35,
    margin: 5250,
    currency: 'IDR',
    serviceType: 'Air Freight',
    validFrom: '2024-01-01',
    validUntil: '2024-12-31',
    status: 'Approved'
  });

  // Create sample invoice
  if (sampleSalesOrder) {
    invoiceService.create({
      customerId: sampleSalesOrder.customerId,
      customerName: sampleSalesOrder.customerName,
      salesOrderId: sampleSalesOrder.id,
      items: [
        {
          description: `Freight Service - ${sampleSalesOrder.origin} to ${sampleSalesOrder.destination}`,
          quantity: 1,
          unitPrice: sampleSalesOrder.sellingPrice,
          amount: sampleSalesOrder.sellingPrice
        }
      ],
      subtotal: sampleSalesOrder.sellingPrice,
      taxRate: 11,
      taxAmount: sampleSalesOrder.sellingPrice * 0.11,
      total: sampleSalesOrder.sellingPrice * 1.11,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      paymentTerms: 'Net 30',
      notes: `Sales Order: ${sampleSalesOrder.orderNumber}\nService: ${sampleSalesOrder.serviceType}\nRoute: ${sampleSalesOrder.origin} → ${sampleSalesOrder.destination}\nThank you for your business`
    });

    console.log('✅ Created sample invoice for sales order:', sampleSalesOrder.orderNumber);
  }

  // Create comprehensive sample HS Codes for freight forwarding
  const sampleHSCodes = [
    // Electronics & Technology
    {
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
    {
      code: '8471.50.1000',
      description: 'Processing units other than those of subheading 8471.41 or 8471.49, whether or not containing in the same housing one or two of the following types of unit: storage units, input units, output units',
      category: 'Electronics',
      importDuty: 0,
      vat: 11,
      excise: 0,
      restrictions: [],
      requiredPermits: ['SNI'],
      notes: 'Computer servers - bea masuk 0%'
    },
    {
      code: '8542.31.0000',
      description: 'Electronic integrated circuits - processors and controllers, whether or not combined with memories, converters, logic circuits, amplifiers, clock and timing circuits, or other circuits',
      category: 'Electronics',
      importDuty: 5,
      vat: 11,
      excise: 0,
      restrictions: [],
      requiredPermits: ['SNI'],
      notes: 'Microchips and processors - bea masuk 5%'
    },

    // Automotive & Transportation
    {
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
      code: '8704.21.1100',
      description: 'Motor vehicles for the transport of goods, with compression-ignition internal combustion piston engine (diesel or semi-diesel), gross vehicle weight not exceeding 5 tonnes',
      category: 'Automotive',
      importDuty: 40,
      vat: 11,
      excise: 0,
      restrictions: ['Lartas'],
      requiredPermits: ['SIPI'],
      notes: 'Trucks and commercial vehicles - bea masuk 40%'
    },
    {
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
    {
      code: '6110.20.0000',
      description: 'Jerseys, pullovers, cardigans, waistcoats and similar articles, knitted or crocheted, of cotton',
      category: 'Textile',
      importDuty: 25,
      vat: 11,
      excise: 0,
      restrictions: [],
      requiredPermits: ['SNI'],
      notes: 'Sweater dan cardigan - bea masuk 25%'
    },

    // Food & Beverage
    {
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
    {
      code: '2009.89.9100',
      description: 'Fruit juices (including grape must) and vegetable juices, unfermented and not containing added spirit, whether or not containing added sugar or other sweetening matter',
      category: 'Food',
      importDuty: 25,
      vat: 11,
      excise: 0,
      restrictions: [],
      requiredPermits: ['BPOM'],
      notes: 'Jus buah - bea masuk 25%'
    },

    // Machinery & Equipment
    {
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
    {
      code: '8474.20.1100',
      description: 'Crushing or grinding machines for earth, stone, ores or other mineral substances',
      category: 'Machinery',
      importDuty: 0,
      vat: 11,
      excise: 0,
      restrictions: [],
      requiredPermits: [],
      notes: 'Stone crushing machines - bea masuk 0%'
    },

    // Chemical Products
    {
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
      code: '3402.20.1200',
      description: 'Surface-active preparations, washing preparations (including auxiliary washing preparations) and cleaning preparations, put up for retail sale',
      category: 'Chemical',
      importDuty: 20,
      vat: 11,
      excise: 0,
      restrictions: [],
      requiredPermits: ['BPOM'],
      notes: 'Detergents and cleaning products - bea masuk 20%'
    },

    // Furniture & Wood Products
    {
      code: '9403.60.9000',
      description: 'Other wooden furniture',
      category: 'Furniture',
      importDuty: 20,
      vat: 11,
      excise: 0,
      restrictions: [],
      requiredPermits: ['SNI'],
      notes: 'Wooden furniture - bea masuk 20%'
    },
    {
      code: '9401.61.0000',
      description: 'Upholstered seats, with wooden frames',
      category: 'Furniture',
      importDuty: 20,
      vat: 11,
      excise: 0,
      restrictions: [],
      requiredPermits: ['SNI'],
      notes: 'Upholstered furniture - bea masuk 20%'
    },

    // Plastic & Rubber Products
    {
      code: '3923.21.1100',
      description: 'Sacks and bags (including cones) of polymers of ethylene',
      category: 'Plastic',
      importDuty: 25,
      vat: 11,
      excise: 0,
      restrictions: [],
      requiredPermits: [],
      notes: 'Plastic bags and sacks - bea masuk 25%'
    },
    {
      code: '4011.10.0000',
      description: 'New pneumatic tyres, of rubber, of a kind used on motor cars (including station wagons and racing cars)',
      category: 'Rubber',
      importDuty: 30,
      vat: 11,
      excise: 0,
      restrictions: [],
      requiredPermits: ['SNI'],
      notes: 'Car tires - bea masuk 30%'
    },

    // Metal Products
    {
      code: '7308.90.9900',
      description: 'Structures (excluding prefabricated buildings of heading 94.06) and parts of structures (for example, bridges and bridge-sections, lock-gates, towers, lattice masts, roofs, roofing frame-works, doors and windows and their frames and thresholds for doors, shutters, balustrades, pillars and columns), of iron or steel; plates, rods, angles, shapes, sections, tubes and the like, prepared for use in structures, of iron or steel',
      category: 'Metal',
      importDuty: 15,
      vat: 11,
      excise: 0,
      restrictions: [],
      requiredPermits: [],
      notes: 'Steel structures and frames - bea masuk 15%'
    },
    {
      code: '7210.49.9100',
      description: 'Flat-rolled products of iron or non-alloy steel, of a width of 600 mm or more, clad, plated or coated, plated or coated with zinc',
      category: 'Metal',
      importDuty: 15,
      vat: 11,
      excise: 0,
      restrictions: [],
      requiredPermits: [],
      notes: 'Galvanized steel sheets - bea masuk 15%'
    },

    // Paper & Paper Products
    {
      code: '4802.56.9000',
      description: 'Uncoated paper and paperboard, of a kind used for writing, printing or other graphic purposes, and non-perforated punch-cards and punch tape paper, in rolls or rectangular (including square) sheets, of any size, other than paper of heading 48.01 or 48.03; hand-made paper and paperboard',
      category: 'Paper',
      importDuty: 15,
      vat: 11,
      excise: 0,
      restrictions: [],
      requiredPermits: [],
      notes: 'Writing and printing paper - bea masuk 15%'
    },

    // Construction Materials
    {
      code: '2523.29.0000',
      description: 'Portland cement, aluminous cement, slag cement, supersulphate cement and similar hydraulic cements, whether or not coloured or in the form of clinkers',
      category: 'Construction',
      importDuty: 10,
      vat: 11,
      excise: 0,
      restrictions: [],
      requiredPermits: ['SNI'],
      notes: 'Portland cement - bea masuk 10%'
    },
    {
      code: '6810.11.0000',
      description: 'Building blocks and bricks, tiles and other ceramic goods of siliceous fossil meals (for example, kieselguhr, tripolite or diatomite) or of similar siliceous earths',
      category: 'Construction',
      importDuty: 15,
      vat: 11,
      excise: 0,
      restrictions: [],
      requiredPermits: ['SNI'],
      notes: 'Ceramic tiles and bricks - bea masuk 15%'
    },

    // Agricultural Products
    {
      code: '1006.30.9900',
      description: 'Rice, semi-milled or wholly milled, whether or not polished or glazed',
      category: 'Agriculture',
      importDuty: 25,
      vat: 11,
      excise: 0,
      restrictions: ['Lartas', 'API'],
      requiredPermits: ['Izin Impor', 'Kementan'],
      notes: 'Rice - bea masuk 25%'
    },
    {
      code: '0803.90.1000',
      description: 'Bananas, including plantains, fresh or dried',
      category: 'Agriculture',
      importDuty: 25,
      vat: 11,
      excise: 0,
      restrictions: ['Lartas'],
      requiredPermits: ['Kementan'],
      notes: 'Fresh bananas - bea masuk 25%'
    },

    // Industrial Raw Materials
    {
      code: '2709.00.2000',
      description: 'Petroleum oils and oils obtained from bituminous minerals, crude',
      category: 'Energy',
      importDuty: 0,
      vat: 11,
      excise: 0,
      restrictions: ['Lartas', 'API'],
      requiredPermits: ['Izin ESDM', 'BPH Migas'],
      notes: 'Crude oil - bea masuk 0%'
    },
    {
      code: '7601.10.0000',
      description: 'Aluminium, not alloyed, unwrought',
      category: 'Metal',
      importDuty: 5,
      vat: 11,
      excise: 0,
      restrictions: [],
      requiredPermits: [],
      notes: 'Aluminium ingots - bea masuk 5%'
    },

    // Consumer Goods
    {
      code: '3304.10.0000',
      description: 'Beauty or make-up preparations and preparations for the care of the skin (other than medicaments), including sunscreen or sun tan preparations; manicure or pedicure preparations',
      category: 'Cosmetics',
      importDuty: 20,
      vat: 11,
      excise: 0,
      restrictions: ['Lartas'],
      requiredPermits: ['BPOM'],
      notes: 'Cosmetics and skincare - bea masuk 20%'
    },
    {
      code: '9503.00.2100',
      description: 'Tricycles, scooters, pedal cars and similar wheeled toys; dolls\' carriages; dolls; other toys; reduced-size ("scale") models and similar recreational models, working or not; puzzles of all kinds',
      category: 'Toys',
      importDuty: 20,
      vat: 11,
      excise: 0,
      restrictions: [],
      requiredPermits: ['SNI'],
      notes: 'Toys and games - bea masuk 20%'
    }
  ];

  // Create sample HS Codes
  sampleHSCodes.forEach(hsData => {
    try {
      hsCodeService.create(hsData);
      console.log(`✅ Created HS Code: ${hsData.code} - ${hsData.description.substring(0, 50)}...`);
    } catch (error) {
      console.error(`❌ Failed to create HS Code ${hsData.code}:`, error.message);
    }
  });

  console.log('🎯 Sample data initialization completed with proper flow:');
  console.log('   📦 Sales Order:', sampleSalesOrder?.orderNumber);
  console.log('   👥 Customer:', sampleCustomer.name);
  console.log('   🚛 Vendor:', sampleVendor.name);
  console.log('   💰 Operational Costs: 5 items linked to sales order');
  console.log('   🧾 Invoice: Generated from sales order');
};

// Function to reset all data and create clean sample
export const resetToCleanSample = () => {
  console.log('🔄 Resetting to clean sample data...');

  // Clear all data
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });

  // Reinitialize with clean sample
  initializeSampleData();

  console.log('✅ Reset completed! Clean sample data created.');
  return true;
};

export default {
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
};