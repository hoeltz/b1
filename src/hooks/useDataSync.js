// Basic data sync hook (replacement for deleted useDataSync)
import { useState, useEffect, useCallback } from 'react';
import dataSyncService from '../services/dataSync';

export const useDataSync = (dataType, autoLoad = true) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let result = [];
      switch (dataType) {
        case 'customers':
          result = await dataSyncService.getCustomers();
          break;
        case 'vendors':
          result = await dataSyncService.getVendors();
          break;
        case 'salesOrders':
          result = await dataSyncService.getSalesOrders();
          break;
        case 'hsCodes':
          result = await dataSyncService.getHSCodes();
          break;
        case 'operationalCosts':
          result = await dataSyncService.getOperationalCosts();
          break;
        default:
          result = [];
      }

      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load data');
      console.error(`Error loading ${dataType}:`, err);
    } finally {
      setLoading(false);
    }
  }, [dataType]);

  const createItem = useCallback(async (itemData) => {
    setLoading(true);
    setError(null);

    try {
      let result = null;
      switch (dataType) {
        case 'customers':
          result = await dataSyncService.createCustomer(itemData);
          break;
        case 'salesOrders':
          result = await dataSyncService.createSalesOrder(itemData);
          break;
        case 'operationalCosts':
          result = await dataSyncService.createOperationalCost(itemData);
          break;
        default:
          throw new Error(`Create operation not supported for ${dataType}`);
      }

      if (result) {
        setData(prev => [...prev, result]);
        return result;
      }
    } catch (err) {
      setError(err.message || 'Failed to create item');
      console.error(`Error creating ${dataType}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dataType]);

  const updateItem = useCallback(async (id, itemData) => {
    setLoading(true);
    setError(null);

    try {
      let result = null;
      switch (dataType) {
        case 'customers':
          result = await dataSyncService.updateCustomer(id, itemData);
          break;
        case 'salesOrders':
          result = await dataSyncService.updateSalesOrder(id, itemData);
          break;
        case 'operationalCosts':
          result = await dataSyncService.updateOperationalCost(id, itemData);
          break;
        default:
          throw new Error(`Update operation not supported for ${dataType}`);
      }

      if (result) {
        setData(prev => prev.map(item => item.id === id ? result : item));
        return result;
      }
    } catch (err) {
      setError(err.message || 'Failed to update item');
      console.error(`Error updating ${dataType}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dataType]);

  const deleteItem = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      let result = false;
      switch (dataType) {
        case 'customers':
          result = await dataSyncService.deleteCustomer(id);
          break;
        case 'salesOrders':
          result = await dataSyncService.deleteSalesOrder(id);
          break;
        case 'operationalCosts':
          result = await dataSyncService.deleteOperationalCost(id);
          break;
        default:
          throw new Error(`Delete operation not supported for ${dataType}`);
      }

      if (result) {
        setData(prev => prev.filter(item => item.id !== id));
        return true;
      }
    } catch (err) {
      setError(err.message || 'Failed to delete item');
      console.error(`Error deleting ${dataType}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dataType]);

  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]);

  return {
    data,
    loading,
    error,
    loadData,
    createItem,
    updateItem,
    deleteItem,
    setData
  };
};

// Dashboard statistics hook
export const useDashboardStats = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCosts: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));

        // Get data for statistics
        const [customers, orders] = await Promise.all([
          dataSyncService.getCustomers(),
          dataSyncService.getSalesOrders()
        ]);

        const totalRevenue = orders
          .filter(order => order.status === 'Delivered')
          .reduce((sum, order) => sum + (parseFloat(order.sellingPrice) || 0), 0);

        const totalCosts = orders
          .filter(order => order.status === 'Delivered')
          .reduce((sum, order) => sum + (parseFloat(order.estimatedCost) || 0), 0);

        setStats({
          totalCustomers: customers.length,
          totalOrders: orders.length,
          totalRevenue,
          totalCosts,
          loading: false,
          error: null
        });
      } catch (error) {
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to load dashboard stats'
        }));
      }
    };

    loadStats();
  }, []);

  return stats;
};

export default useDataSync;