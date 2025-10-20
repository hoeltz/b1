import { useState, useCallback, useMemo } from 'react';
import { useFormValidation } from '../services/errorHandler';
import {
  calculateMargin,
  calculateOperationalCosts,
  calculateSellingCosts,
  generateInvoiceLineItems,
  calculateFinancialSummary
} from '../services/costUtils';

/**
 * Custom hook for Sales Order form management
 * Optimizes performance and reduces code duplication
 */
export const useSalesOrderForm = (initialValues = {}, validationRules = {}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Memoized initial form values to prevent unnecessary re-renders
  const defaultValues = useMemo(() => ({
    customerId: '',
    customerName: '',
    orderType: 'REG',
    packageType: 'Domestic',
    origin: '',
    originCountry: 'Indonesia',
    destination: '',
    destinationCountry: '',
    cargoType: '',
    weight: '',
    volume: '',
    value: '',
    serviceType: 'Sea Freight',
    estimatedCost: '',
    sellingPrice: '',
    margin: '',
    specialInstructions: '',
    priority: 'Normal',
    vendorId: '',
    vendorName: '',
    operationalCosts: [],
    sellingCosts: [],
    cargoItems: [],
    shipmentDetails: {
      trackingNumber: '',
      estimatedDeparture: '',
      estimatedArrival: '',
      status: 'Booked'
    }
  }), []);

  const formValues = { ...defaultValues, ...initialValues };

  const formValidation = useFormValidation(formValues, validationRules);

  const {
    values,
    errors,
    touched,
    fieldStates,
    isSubmitting,
    handleFieldChange,
    handleFieldBlur,
    handleSubmit: validateAndSubmit,
    reset,
    getFieldProps,
    setValues
  } = formValidation;

  // Memoized cost calculations
  const financialSummary = useMemo(() => {
    return calculateFinancialSummary(values);
  }, [values.estimatedCost, values.sellingPrice, values.operationalCosts, values.sellingCosts, values.cargoItems]);

  // Optimized cargo item management
  const addCargoItem = useCallback(() => {
    const newCargo = {
      id: Date.now().toString(),
      description: '',
      type: '',
      weight: 0,
      volume: 0,
      value: 0,
      valueUSD: 0,
      currency: 'IDR',
      hazardous: false,
      specialHandling: '',
      containerType: '',
      containerSize: '',
      containerQuantity: 1,
      length: 0,
      width: 0,
      height: 0,
      hsCode: '',
      hsCodeDescription: '',
      importDuty: 0,
      vat: 11,
      excise: 0,
      freightCost: 0,
      freightCostUSD: 0,
      insuranceCost: 0,
      insuranceCostUSD: 0
    };

    setValues(prev => {
      const exists = prev.cargoItems.some(item => item.id === newCargo.id);
      if (!exists) {
        return {
          ...prev,
          cargoItems: [...prev.cargoItems, newCargo]
        };
      }
      return prev;
    });
  }, [setValues]);

  // Optimized cargo item updates
  const updateCargoItem = useCallback((id, field, value) => {
    setValues(prev => {
      const updatedItems = prev.cargoItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      );

      // Only update if items actually changed
      const hasChanges = updatedItems.some((item, index) => {
        const prevItem = prev.cargoItems[index];
        return prevItem && prevItem[field] !== item[field];
      });

      if (hasChanges) {
        return {
          ...prev,
          cargoItems: updatedItems
        };
      }
      return prev;
    });
  }, [setValues]);

  // Optimized cargo item removal
  const removeCargoItem = useCallback((id) => {
    setValues(prev => ({
      ...prev,
      cargoItems: prev.cargoItems.filter(item => item.id !== id)
    }));
  }, [setValues]);

  // Optimized margin calculation
  const calculateMarginValue = useCallback(() => {
    const cost = parseFloat(values.estimatedCost) || 0;
    const price = parseFloat(values.sellingPrice) || 0;
    const margin = calculateMargin(cost, price);

    if (parseFloat(values.margin) !== margin) {
      setValues(prev => ({
        ...prev,
        margin: margin.toString(),
      }));
    }
  }, [values.estimatedCost, values.sellingPrice, values.margin, setValues]);

  // Optimized shipment booking
  const bookShipment = useCallback(() => {
    if (isSubmitting) return;

    const trackingNumber = `TRK-${Date.now()}`;
    const estimatedDeparture = new Date();
    estimatedDeparture.setDate(estimatedDeparture.getDate() + 1);
    const estimatedArrival = new Date(estimatedDeparture);
    estimatedArrival.setDate(estimatedArrival.getDate() + (values.packageType === 'International' ? 7 : 3));

    const shipmentDetails = {
      trackingNumber,
      estimatedDeparture: estimatedDeparture.toISOString().split('T')[0],
      estimatedArrival: estimatedArrival.toISOString().split('T')[0],
      status: 'Booked'
    };

    setValues(prev => ({
      ...prev,
      shipmentDetails
    }));

    setSnackbar({ open: true, message: 'Shipment booked successfully!', severity: 'success' });
  }, [isSubmitting, values.packageType, setValues]);

  // Optimized invoice generation
  const generateInvoice = useCallback(async (dataSyncService) => {
    if (isSubmitting) return;

    try {
      const lineItems = generateInvoiceLineItems(values);
      const { subtotal, taxAmount, total } = financialSummary;

      const notes = [
        `Sales Order: ${values.orderNumber}`,
        `Service: ${values.serviceType}`,
        `Route: ${values.origin} → ${values.destination}`,
        `Package Type: ${values.packageType}`,
        `Priority: ${values.priority}`,
        '',
        'Cargo Details:',
        ...values.cargoItems.map(item =>
          `- ${item.description}: ${item.weight}kg, ${item.volume}cbm, ${item.containerType} ${item.containerSize}${item.hsCode ? ` (HS: ${item.hsCode})` : ''}`
        ),
        '',
        'Cost Breakdown:',
        `Operational Costs: IDR ${financialSummary.operationalTotal.toLocaleString()}`,
        `Selling Costs: IDR ${financialSummary.sellingTotal.toLocaleString()}`,
        `Subtotal: IDR ${subtotal.toLocaleString()}`,
        `Tax (11%): IDR ${taxAmount.toLocaleString()}`,
        `Total: IDR ${total.toLocaleString()}`,
        '',
        values.specialInstructions ? `Special Instructions: ${values.specialInstructions}` : ''
      ].filter(line => line.trim()).join('\n');

      const invoiceData = {
        customerId: values.customerId,
        customerName: values.customerName,
        salesOrderId: values.id,
        items: lineItems,
        subtotal: subtotal,
        taxRate: 11,
        taxAmount: taxAmount,
        total: total,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paymentTerms: 'Net 30',
        notes: notes,
        orderDetails: {
          serviceType: values.serviceType,
          packageType: values.packageType,
          priority: values.priority,
          origin: values.origin,
          destination: values.destination,
          cargoCount: values.cargoItems.length,
          operationalCostCount: values.operationalCosts.length,
          sellingCostCount: values.sellingCosts.length
        }
      };

      const invoice = await dataSyncService.createInvoice(invoiceData);
      if (invoice) {
        setSnackbar({ open: true, message: 'Invoice generated successfully!', severity: 'success' });
        return invoice;
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to generate invoice', severity: 'error' });
      throw error;
    }
  }, [isSubmitting, values, financialSummary, setSnackbar]);

  // Optimized form submission
  const handleSubmit = useCallback(async (onSave) => {
    if (isSubmitting) return;

    try {
      const result = await validateAndSubmit(async (formData) => {
        const orderData = {
          ...formData,
          totalOperationalCosts: financialSummary.operationalTotal,
          totalSellingCosts: financialSummary.sellingTotal,
          status: formData.status || 'Draft'
        };

        const savedOrder = await onSave(orderData);
        return savedOrder;
      });

      if (result) {
        setSnackbar({ open: true, message: `Sales order ${values.id ? 'updated' : 'created'} successfully!`, severity: 'success' });
        return { success: true, data: result };
      } else {
        setSnackbar({ open: true, message: 'Please correct the validation errors', severity: 'error' });
        return { success: false };
      }
    } catch (error) {
      setSnackbar({ open: true, message: `Error saving sales order: ${error.message}`, severity: 'error' });
      throw error;
    }
  }, [isSubmitting, validateAndSubmit, financialSummary, values.id, setSnackbar]);

  // Reset form function
  const resetForm = useCallback(() => {
    setValues(defaultValues);
    reset();
  }, [setValues, reset, defaultValues]);

  return {
    // Form state
    values,
    errors,
    touched,
    fieldStates,
    isSubmitting,
    activeTab,
    snackbar,

    // Form actions
    setActiveTab,
    setSnackbar,
    setValues,
    handleFieldChange,
    handleFieldBlur,
    getFieldProps,
    resetForm,

    // Cargo management
    addCargoItem,
    updateCargoItem,
    removeCargoItem,

    // Actions
    bookShipment,
    generateInvoice,
    handleSubmit,

    // Utilities
    formValidation
  };
};