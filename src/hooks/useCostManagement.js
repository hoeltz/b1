import { useState, useCallback, useMemo, useReducer } from 'react';
import { formatCurrency } from '../services/currencyUtils';
import { calculateTotalCosts, calculateOperationalCosts, calculateSellingCosts } from '../services/costUtils';

/**
 * Custom hook for cost management operations
 * Provides optimized state management and calculations
 */

// Action types for cost reducer
const COST_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_COSTS: 'SET_COSTS',
  ADD_COST: 'ADD_COST',
  UPDATE_COST: 'UPDATE_COST',
  DELETE_COST: 'DELETE_COST',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_FILTERS: 'SET_FILTERS',
  BULK_UPDATE: 'BULK_UPDATE'
};

// Cost reducer for optimized state management
const costReducer = (state, action) => {
  switch (action.type) {
    case COST_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case COST_ACTIONS.SET_COSTS:
      return { ...state, costs: action.payload, loading: false };

    case COST_ACTIONS.ADD_COST:
      return { ...state, costs: [...state.costs, action.payload] };

    case COST_ACTIONS.UPDATE_COST:
      return {
        ...state,
        costs: state.costs.map(cost =>
          cost.id === action.payload.id ? { ...cost, ...action.payload } : cost
        )
      };

    case COST_ACTIONS.DELETE_COST:
      return {
        ...state,
        costs: state.costs.filter(cost => cost.id !== action.payload)
      };

    case COST_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };

    case COST_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case COST_ACTIONS.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };

    case COST_ACTIONS.BULK_UPDATE:
      return { ...state, costs: action.payload };

    default:
      return state;
  }
};

const initialState = {
  costs: [],
  loading: false,
  error: null,
  filters: {
    salesOrderId: '',
    costType: '',
    status: '',
    currency: ''
  }
};

export const useCostManagement = (initialCosts = []) => {
  const [state, dispatch] = useReducer(costReducer, { ...initialState, costs: initialCosts });
  const [selectedCosts, setSelectedCosts] = useState(new Set());

  // Memoized filtered costs for performance
  const filteredCosts = useMemo(() => {
    let filtered = state.costs;

    if (state.filters.salesOrderId) {
      filtered = filtered.filter(cost => cost.salesOrderId === state.filters.salesOrderId);
    }

    if (state.filters.costType) {
      filtered = filtered.filter(cost => cost.costType === state.filters.costType);
    }

    if (state.filters.status) {
      filtered = filtered.filter(cost => cost.status === state.filters.status);
    }

    if (state.filters.currency) {
      filtered = filtered.filter(cost => cost.currency === state.filters.currency);
    }

    return filtered;
  }, [state.costs, state.filters]);

  // Memoized cost calculations
  const calculations = useMemo(() => {
    const operationalCosts = filteredCosts.filter(cost => cost.type === 'operational');
    const sellingCosts = filteredCosts.filter(cost => cost.type === 'selling');

    return {
      totalCosts: calculateTotalCosts(filteredCosts),
      operationalTotal: calculateTotalCosts(operationalCosts),
      sellingTotal: calculateTotalCosts(sellingCosts),
      costCount: filteredCosts.length,
      averageCost: filteredCosts.length > 0 ? calculateTotalCosts(filteredCosts) / filteredCosts.length : 0
    };
  }, [filteredCosts]);

  // Optimized cost operations
  const addCost = useCallback(async (costData, dataSyncService) => {
    try {
      dispatch({ type: COST_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: COST_ACTIONS.CLEAR_ERROR });

      const newCost = {
        id: `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...costData,
        createdAt: new Date().toISOString()
      };

      if (dataSyncService?.createOperationalCost) {
        const savedCost = await dataSyncService.createOperationalCost(newCost);
        if (savedCost) {
          dispatch({ type: COST_ACTIONS.ADD_COST, payload: savedCost });
          return savedCost;
        }
      } else {
        // Fallback for local storage
        dispatch({ type: COST_ACTIONS.ADD_COST, payload: newCost });
        return newCost;
      }
    } catch (error) {
      dispatch({ type: COST_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: COST_ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  const updateCost = useCallback(async (costId, updates, dataSyncService) => {
    try {
      dispatch({ type: COST_ACTIONS.CLEAR_ERROR });

      const updatedCost = {
        ...state.costs.find(cost => cost.id === costId),
        ...updates,
        updatedAt: new Date().toISOString()
      };

      if (dataSyncService?.updateOperationalCost) {
        const savedCost = await dataSyncService.updateOperationalCost(costId, updatedCost);
        if (savedCost) {
          dispatch({ type: COST_ACTIONS.UPDATE_COST, payload: savedCost });
          return savedCost;
        }
      } else {
        dispatch({ type: COST_ACTIONS.UPDATE_COST, payload: updatedCost });
        return updatedCost;
      }
    } catch (error) {
      dispatch({ type: COST_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.costs]);

  const deleteCost = useCallback(async (costId, dataSyncService) => {
    try {
      dispatch({ type: COST_ACTIONS.CLEAR_ERROR });

      if (dataSyncService?.deleteOperationalCost) {
        await dataSyncService.deleteOperationalCost(costId);
      }

      dispatch({ type: COST_ACTIONS.DELETE_COST, payload: costId });
    } catch (error) {
      dispatch({ type: COST_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  const bulkUpdateCosts = useCallback(async (costIds, updates, dataSyncService) => {
    try {
      dispatch({ type: COST_ACTIONS.CLEAR_ERROR });

      const updatedCosts = state.costs.map(cost =>
        costIds.includes(cost.id)
          ? { ...cost, ...updates, updatedAt: new Date().toISOString() }
          : cost
      );

      if (dataSyncService?.bulkUpdateOperationalCosts) {
        await dataSyncService.bulkUpdateOperationalCosts(costIds, updates);
      }

      dispatch({ type: COST_ACTIONS.BULK_UPDATE, payload: updatedCosts });
    } catch (error) {
      dispatch({ type: COST_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.costs]);

  // Filter management
  const updateFilters = useCallback((newFilters) => {
    dispatch({ type: COST_ACTIONS.SET_FILTERS, payload: newFilters });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: COST_ACTIONS.SET_FILTERS, payload: initialState.filters });
  }, []);

  // Selection management
  const toggleCostSelection = useCallback((costId) => {
    setSelectedCosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(costId)) {
        newSet.delete(costId);
      } else {
        newSet.add(costId);
      }
      return newSet;
    });
  }, []);

  const selectAllCosts = useCallback(() => {
    setSelectedCosts(new Set(filteredCosts.map(cost => cost.id)));
  }, [filteredCosts]);

  const clearSelection = useCallback(() => {
    setSelectedCosts(new Set());
  }, []);

  // Export functionality
  const exportToExcel = useCallback((filename = 'costs') => {
    try {
      const data = filteredCosts.map(cost => ({
        Description: cost.description,
        Vendor: cost.vendorName,
        'Cost Type': cost.costType,
        Amount: cost.amount,
        Currency: cost.currency,
        'Sales Order': cost.salesOrderId || 'General',
        Status: cost.status,
        'Created At': new Date(cost.createdAt).toLocaleDateString()
      }));

      // Create Excel file logic here
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Costs');
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);

      return true;
    } catch (error) {
      dispatch({ type: COST_ACTIONS.SET_ERROR, payload: 'Export failed' });
      return false;
    }
  }, [filteredCosts]);

  return {
    // State
    costs: filteredCosts,
    allCosts: state.costs,
    loading: state.loading,
    error: state.error,
    filters: state.filters,
    selectedCosts: Array.from(selectedCosts),
    calculations,

    // Actions
    addCost,
    updateCost,
    deleteCost,
    bulkUpdateCosts,
    updateFilters,
    clearFilters,

    // Selection
    toggleCostSelection,
    selectAllCosts,
    clearSelection,

    // Export
    exportToExcel,

    // Utilities
    formatCurrency: (amount, currency) => formatCurrency(amount, currency)
  };
};