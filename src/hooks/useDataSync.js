// React hook for data synchronization and refresh mechanisms
// This hook allows components to subscribe to data changes and automatically refresh

import { useState, useEffect, useCallback } from 'react';
import dataSyncService from '../services/dataSync';

// Hook for real-time dashboard statistics updates
export const useDashboardStats = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    confirmedOrders: 0,
    inTransitOrders: 0,
    deliveredOrders: 0,
    totalCustomers: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    totalRevenue: 0,
    totalCosts: 0,
    totalMargin: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;
    let initialized = false;

    const initializeStats = async () => {
      if (initialized) return;

      setLoading(true);
      initialized = true;

      try {
        // Subscribe to dashboard updates first
        unsubscribe = dataSyncService.subscribe('dashboard', (event) => {
          if (event.action === 'statsUpdate') {
            setStats(event.data);
          }
        });

        // Load initial stats
        await dataSyncService.updateDashboardStatistics();
      } catch (error) {
        console.error('Error initializing dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeStats();

    // Cleanup function
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []); // Empty dependency array to run only once

  const refreshStats = useCallback(async () => {
    setLoading(true);
    try {
      await dataSyncService.updateDashboardStatistics();
    } catch (error) {
      console.error('Error refreshing dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { stats, loading, refreshStats };
};

export const useDataSync = (entityType, autoRefresh = true) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Load data based on entity type
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let result = [];

      switch (entityType) {
        case 'customers':
          result = await dataSyncService.getCustomers();
          break;
        case 'salesOrders':
          result = await dataSyncService.getSalesOrders();
          break;
        case 'cargo':
          result = await dataSyncService.getCargo();
          break;
        case 'shipments':
          result = await dataSyncService.getShipments();
          break;
        case 'invoices':
          result = await dataSyncService.getInvoices();
          break;
        case 'vendors':
          result = await dataSyncService.getVendors();
          break;
        case 'operationalCosts':
          result = await dataSyncService.getOperationalCosts();
          break;
        case 'sellingCosts':
          result = await dataSyncService.getSellingCosts();
          break;
        case 'all':
          // For loading all data types
          const [customers, orders, cargo, shipments, invoices, vendors] = await Promise.all([
            dataSyncService.getCustomers(),
            dataSyncService.getSalesOrders(),
            dataSyncService.getCargo(),
            dataSyncService.getShipments(),
            dataSyncService.getInvoices(),
            dataSyncService.getVendors()
          ]);
          result = { customers, orders, cargo, shipments, invoices, vendors };
          break;
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }

      if (result) {
        setData(result);
        setLastRefresh(new Date());
      }
    } catch (err) {
      setError(err.message);
      console.error(`Error loading ${entityType}:`, err);
    } finally {
      setLoading(false);
    }
  }, [entityType]);

  // Manual refresh function
  const refresh = useCallback(() => {
    return loadData();
  }, [loadData]);

  // Subscribe to data changes - optimized to prevent infinite loops
  useEffect(() => {
    if (!autoRefresh) return;

    let isSubscribed = true;
    let refreshTimeout;

    // Load initial data
    loadData();

    // Subscribe to data changes with debouncing
    const unsubscribe = dataSyncService.subscribe(entityType, (event) => {
      if (!isSubscribed) return;

      console.log(`Data change detected for ${entityType}:`, event);

      // Auto-refresh data when changes are detected (debounced)
      if (event.entityType === entityType || event.entityType === 'all') {
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
          if (isSubscribed) {
            loadData();
          }
        }, 300); // 300ms debounce
      }
    });

    // Cleanup subscription on unmount
    return () => {
      isSubscribed = false;
      clearTimeout(refreshTimeout);
      if (typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('Error unsubscribing from data sync:', error);
        }
      }
    };
  }, [entityType, autoRefresh]); // Removed loadData from dependencies to prevent loops

  return {
    data,
    loading,
    error,
    lastRefresh,
    refresh,
    setData
  };
};

// Hook for creating new entities with automatic refresh
export const useEntityOperations = (entityType) => {
  const { refresh } = useDataSync(entityType);

  const createEntity = useCallback(async (entityData) => {
    try {
      let result;

      switch (entityType) {
        case 'customers':
          result = await dataSyncService.createCustomer(entityData);
          break;
        case 'salesOrders':
          result = await dataSyncService.createSalesOrder(entityData);
          break;
        case 'cargo':
          result = await dataSyncService.createCargo(entityData);
          break;
        case 'shipments':
          result = await dataSyncService.createShipment(entityData);
          break;
        case 'invoices':
          result = await dataSyncService.createInvoice(entityData);
          break;
        case 'vendors':
          result = await dataSyncService.createVendor(entityData);
          break;
        default:
          throw new Error(`Create operation not supported for entity type: ${entityType}`);
      }

      // Refresh data after creation
      refresh();
      return result;
    } catch (error) {
      console.error(`Error creating ${entityType}:`, error);
      throw error;
    }
  }, [entityType, refresh]);

  const updateEntity = useCallback(async (id, entityData) => {
    try {
      let result;

      switch (entityType) {
        case 'customers':
          result = await dataSyncService.updateCustomer(id, entityData);
          break;
        case 'salesOrders':
          result = await dataSyncService.updateSalesOrder(id, entityData);
          break;
        case 'cargo':
          result = await dataSyncService.updateCargo(id, entityData);
          break;
        case 'shipments':
          result = await dataSyncService.updateShipment(id, entityData);
          break;
        case 'invoices':
          result = await dataSyncService.updateInvoice(id, entityData);
          break;
        case 'vendors':
          result = await dataSyncService.updateVendor(id, entityData);
          break;
        default:
          throw new Error(`Update operation not supported for entity type: ${entityType}`);
      }

      // Refresh data after update
      refresh();
      return result;
    } catch (error) {
      console.error(`Error updating ${entityType}:`, error);
      throw error;
    }
  }, [entityType, refresh]);

  const deleteEntity = useCallback(async (id) => {
    try {
      let result;

      switch (entityType) {
        case 'customers':
          result = await dataSyncService.deleteCustomer(id);
          break;
        case 'salesOrders':
          result = await dataSyncService.deleteSalesOrder(id);
          break;
        case 'cargo':
          result = await dataSyncService.deleteCargo(id);
          break;
        case 'shipments':
          result = await dataSyncService.deleteShipment(id);
          break;
        case 'invoices':
          result = await dataSyncService.deleteInvoice(id);
          break;
        case 'vendors':
          result = await dataSyncService.deleteVendor(id);
          break;
        default:
          throw new Error(`Delete operation not supported for entity type: ${entityType}`);
      }

      // Refresh data after deletion
      refresh();
      return result;
    } catch (error) {
      console.error(`Error deleting ${entityType}:`, error);
      throw error;
    }
  }, [entityType, refresh]);

  return {
    createEntity,
    updateEntity,
    deleteEntity,
    refresh
  };
};

// Hook for cross-entity data relationships
export const useRelatedData = (entityType, entityId) => {
  const [relatedData, setRelatedData] = useState({
    customers: [],
    salesOrders: [],
    invoices: [],
    shipments: []
  });

  const loadRelatedData = useCallback(async () => {
    if (!entityId) return;

    try {
      const results = {};

      if (entityType === 'customers' || entityType === 'all') {
        // Load customer-related data
        const [orders, invoices] = await Promise.all([
          dataSyncService.getRelatedSalesOrders(entityId),
          dataSyncService.getInvoices()
        ]);
        results.salesOrders = orders;
        results.invoices = invoices.filter(inv => inv.customerId === entityId);
      }

      if (entityType === 'salesOrders' || entityType === 'all') {
        // Load sales order-related data
        const [customer, invoices, shipments] = await Promise.all([
          entityId ? dataSyncService.getCustomerById(entityId) : null,
          dataSyncService.getRelatedInvoices(entityId),
          dataSyncService.getShipments()
        ]);
        results.customers = customer ? [customer] : [];
        results.invoices = invoices;
        results.shipments = shipments.filter(ship => ship.salesOrderId === entityId);
      }

      setRelatedData(prev => ({ ...prev, ...results }));
    } catch (error) {
      console.error('Error loading related data:', error);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    loadRelatedData();
  }, [loadRelatedData]);

  return {
    relatedData,
    refreshRelatedData: loadRelatedData
  };
};

// Hook for data consistency validation
export const useDataValidation = () => {
  const [validationIssues, setValidationIssues] = useState([]);
  const [validating, setValidating] = useState(false);

  const validateConsistency = useCallback(async () => {
    setValidating(true);

    try {
      const issues = await dataSyncService.validateDataConsistency();
      setValidationIssues(issues);
      return issues;
    } catch (error) {
      console.error('Error validating data consistency:', error);
      return [];
    } finally {
      setValidating(false);
    }
  }, []);

  const fixValidationIssues = useCallback(async (issueIds) => {
    // Implementation would depend on specific fix strategies
    console.log('Fixing validation issues:', issueIds);
    // After fixes, re-validate
    await validateConsistency();
  }, [validateConsistency]);

  return {
    validationIssues,
    validating,
    validateConsistency,
    fixValidationIssues
  };
};

export default useDataSync;