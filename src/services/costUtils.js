/**
 * Cost Management Utility Functions
 * Optimized for performance and reusability across components
 */

// Currency conversion constants
export const EXCHANGE_RATES = {
  USD_TO_IDR: 15000,
  IDR_TO_USD: 1 / 15000
};

// Cost calculation utilities
export const calculateMargin = (cost, price) => {
  if (!cost || !price || cost <= 0 || price <= 0) return 0;
  return price - cost;
};

export const calculateMarginPercentage = (cost, price) => {
  if (!cost || cost <= 0) return 0;
  const margin = calculateMargin(cost, price);
  return (margin / cost) * 100;
};

export const calculateTotalCosts = (costs = []) => {
  return costs.reduce((total, cost) => {
    const amount = parseFloat(cost.amount) || 0;
    if (cost.currency === 'USD') {
      return total + (amount * EXCHANGE_RATES.USD_TO_IDR);
    }
    return total + amount;
  }, 0);
};

export const calculateOperationalCosts = (operationalCosts = [], baseCost = 0) => {
  return operationalCosts.reduce((total, cost) => {
    let amount = 0;

    if (cost.type === 'percentage') {
      amount = baseCost * (cost.amount / 100);
    } else {
      amount = parseFloat(cost.amount) || 0;
      if (cost.currency === 'USD') {
        amount = amount * EXCHANGE_RATES.USD_TO_IDR;
      }
    }

    return total + amount;
  }, 0);
};

export const calculateSellingCosts = (sellingCosts = [], basePrice = 0) => {
  return sellingCosts.reduce((total, cost) => {
    let amount = 0;

    if (cost.type === 'percentage') {
      amount = basePrice * (cost.amount / 100);
    } else {
      amount = parseFloat(cost.amount) || 0;
      if (cost.currency === 'USD') {
        amount = amount * EXCHANGE_RATES.USD_TO_IDR;
      }
    }

    return total + amount;
  }, 0);
};

// HS Code calculations for cargo items
export const calculateHSCosts = (cargoItems = []) => {
  return cargoItems.map(item => {
    if (!item.hsCode || !item.value) {
      return {
        ...item,
        cifValue: 0,
        importDuty: 0,
        vat: 0,
        excise: 0,
        totalCost: 0
      };
    }

    const cifValue = parseFloat(item.value) || 0;
    const importDuty = cifValue * ((item.importDuty || 0) / 100);
    const vatBase = cifValue + importDuty;
    const vat = vatBase * ((item.vat || 11) / 100);
    const excise = cifValue * ((item.excise || 0) / 100);
    const totalCost = cifValue + importDuty + vat + excise;

    return {
      ...item,
      cifValue,
      importDuty,
      vat,
      excise,
      totalCost
    };
  });
};

export const calculateTotalHSCosts = (cargoItems = []) => {
  const itemsWithCosts = calculateHSCosts(cargoItems);
  return itemsWithCosts.reduce((total, item) => total + (item.totalCost || 0), 0);
};

// Invoice line item generation
export const generateInvoiceLineItems = (values) => {
  const lineItems = [];

  // Main freight service
  if (values.sellingPrice) {
    lineItems.push({
      description: `Freight Service - ${values.serviceType} (${values.origin} to ${values.destination})`,
      quantity: 1,
      unitPrice: parseFloat(values.sellingPrice) || 0,
      amount: parseFloat(values.sellingPrice) || 0,
      type: 'service'
    });
  }

  // Operational costs
  if (values.operationalCosts?.length > 0) {
    values.operationalCosts.forEach(cost => {
      const costAmount = cost.type === 'percentage'
        ? (parseFloat(values.estimatedCost) || 0) * (cost.amount / 100)
        : parseFloat(cost.amount) || 0;

      if (costAmount > 0) {
        lineItems.push({
          description: `${cost.name} - ${cost.description}`,
          quantity: 1,
          unitPrice: costAmount,
          amount: costAmount,
          type: 'operational_cost'
        });
      }
    });
  }

  // Selling costs
  if (values.sellingCosts?.length > 0) {
    values.sellingCosts.forEach(cost => {
      const costAmount = cost.type === 'percentage'
        ? (parseFloat(values.sellingPrice) || 0) * (cost.amount / 100)
        : parseFloat(cost.amount) || 0;

      if (costAmount > 0) {
        lineItems.push({
          description: `${cost.name} - ${cost.description}`,
          quantity: 1,
          unitPrice: costAmount,
          amount: costAmount,
          type: 'selling_cost'
        });
      }
    });
  }

  // HS Code costs for cargo items
  if (values.cargoItems?.length > 0) {
    const itemsWithCosts = calculateHSCosts(values.cargoItems);
    itemsWithCosts.forEach(item => {
      if (item.totalCost > 0) {
        lineItems.push({
          description: `HS Code ${item.hsCode} - ${item.description} (${item.containerType} ${item.containerSize} x${item.containerQuantity})`,
          quantity: item.containerQuantity || 1,
          unitPrice: item.totalCost,
          amount: item.totalCost,
          type: 'cargo_hs_code'
        });
      }
    });
  }

  return lineItems;
};

// Financial summary calculations
export const calculateFinancialSummary = (values) => {
  const operationalTotal = calculateOperationalCosts(values.operationalCosts || [], parseFloat(values.estimatedCost) || 0);
  const sellingTotal = calculateSellingCosts(values.sellingCosts || [], parseFloat(values.sellingPrice) || 0);
  const hsCodeTotal = calculateTotalHSCosts(values.cargoItems || []);

  const subtotal = parseFloat(values.sellingPrice) || 0;
  const taxAmount = subtotal * 0.11; // 11% VAT
  const total = subtotal + taxAmount;

  return {
    operationalTotal,
    sellingTotal,
    hsCodeTotal,
    subtotal,
    taxAmount,
    total,
    margin: calculateMargin(parseFloat(values.estimatedCost) || 0, subtotal)
  };
};

// Validation utilities
export const validateCostAmount = (amount, currency = 'IDR') => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return 'Amount must be greater than 0';
  }
  if (numAmount > 1000000000) { // 1 billion limit
    return 'Amount seems too high. Please verify.';
  }
  return true;
};

export const validatePercentage = (percentage) => {
  const numPercentage = parseFloat(percentage);
  if (isNaN(numPercentage) || numPercentage < 0 || numPercentage > 100) {
    return 'Percentage must be between 0 and 100';
  }
  return true;
};

// Memoized calculation functions for performance
import { useMemo } from 'react';

export const useCostCalculations = (values) => {
  return useMemo(() => {
    return calculateFinancialSummary(values);
  }, [
    values.estimatedCost,
    values.sellingPrice,
    values.operationalCosts?.length,
    values.sellingCosts?.length,
    values.cargoItems?.length,
    // Add specific fields that affect calculations
    ...(values.operationalCosts || []).map(cost => cost.amount),
    ...(values.sellingCosts || []).map(cost => cost.amount),
    ...(values.cargoItems || []).map(item => item.value)
  ]);
};

// Performance monitoring utility
export const measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
  return result;
};

// Debounce utility for expensive calculations
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};