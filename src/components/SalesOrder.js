import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Snackbar,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Calculate as CalculateIcon,
  ExpandMore as ExpandMoreIcon,
  LocalShipping as ShippingIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import {
  customerService,
  vendorService,
  cargoService,
  shipmentService,
  operationalCostService,
  sellingCostService
} from '../services/localStorage';
import dataSyncService from '../services/dataSync';
import {
  INDONESIAN_CITIES,
  COUNTRIES,
  CURRENCIES,
  PACKAGE_TYPES,
  STANDARD_COSTS,
  CARGO_TYPES,
  SERVICE_TYPES,
  SHIPPING_PROVIDERS
} from '../data/locationData';
import {
  handleError,
  showSuccessToast,
  showErrorToast,
  useFormValidation,
  getFieldStateColor,
  getFieldStateIcon,
  FIELD_STATES,
  VALIDATION_MODES,
  extendedValidationPatterns,
  freightValidationRules
} from '../services/errorHandler';
import notificationService from '../services/notificationService';

const SalesOrderForm = ({ open, onClose, salesOrder, onSave }) => {
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [hsCodes, setHSCodes] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [redlineDialog, setRedlineDialog] = useState(false);
  const [redlineFormData, setRedlineFormData] = useState({
    urgencyLevel: 'urgent',
    justification: '',
    requestedBy: '',
    additionalCosts: 0
  });

  // Status color helper function
  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'success';
      case 'In Transit': return 'primary';
      case 'Delivered': return 'default';
      case 'Cancelled': return 'error';
      case 'Draft': return 'warning';
      default: return 'info';
    }
  };

  // Priority color helper function
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'error';
      case 'High': return 'warning';
      case 'Normal': return 'info';
      case 'Low': return 'default';
      default: return 'default';
    }
  };

  // Enhanced validation for key fields
  const validationRules = {
    customerId: {
      required: true,
      patternMessage: 'Please select a customer'
    },
    origin: {
      required: true,
      minLength: 2,
      patternMessage: 'Origin must be at least 2 characters'
    },
    destination: {
      required: true,
      minLength: 2,
      patternMessage: 'Destination must be at least 2 characters'
    },
    estimatedCost: {
      ...freightValidationRules.cargoValue,
      required: true
    },
    sellingPrice: {
      ...freightValidationRules.cargoValue,
      required: true,
      custom: (value) => {
        const num = parseFloat(value);
        if (num <= 0) return 'Selling price must be greater than 0';
        return true;
      }
    }
  };

  const formValidation = useFormValidation(
    salesOrder || {
      customerId: '',
      customerName: '',
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
    },
    validationRules
  );

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


  useEffect(() => {
    let loaded = false;

    const loadData = () => {
      if (!loaded) {
        loadSupportingData();
        loaded = true;
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (salesOrder) {
      loadOperationalCostsForOrder(salesOrder.id);
      setValues({
        ...salesOrder,
        operationalCosts: salesOrder.operationalCosts || [],
        sellingCosts: salesOrder.sellingCosts || [],
        cargoItems: salesOrder.cargoItems || [],
        shipmentDetails: salesOrder.shipmentDetails || {
          trackingNumber: '',
          estimatedDeparture: '',
          estimatedArrival: '',
          status: 'Booked'
        }
      });
    } else {
      resetForm();
    }
  }, [salesOrder?.id, setValues]); // Only depend on ID to prevent unnecessary re-renders

  const loadSupportingData = async () => {
    setCustomers(customerService.getAll());
    setVendors(vendorService.getAll());

    // Load HS Codes for cargo items
    try {
      const hsCodesData = await dataSyncService.getHSCodes?.() || [];
      setHSCodes(hsCodesData);
    } catch (error) {
      console.error('Error loading HS Codes:', error);
      setHSCodes([]);
    }
  };

  const loadOperationalCostsForOrder = async (salesOrderId) => {
    if (!salesOrderId) return;

    try {
      const allCosts = await dataSyncService.getOperationalCosts();
      const orderCosts = allCosts.filter(cost => cost.salesOrderId === salesOrderId);

      setValues(prev => ({
        ...prev,
        operationalCosts: orderCosts
      }));
    } catch (error) {
      console.error('Error loading operational costs for order:', error);
    }
  };

  const resetForm = () => {
    setValues({
      customerId: '',
      customerName: '',
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
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Only update if value actually changed
    setValues(prev => {
      if (prev[name] !== value) {
        return {
          ...prev,
          [name]: value,
        };
      }
      return prev;
    });
  };

  const handleCustomerChange = (event, newValue) => {
    const customerId = newValue?.id || '';
    const customerName = newValue?.name || '';

    setValues(prev => {
      // Only update if values actually changed
      if (prev.customerId !== customerId || prev.customerName !== customerName) {
        return {
          ...prev,
          customerId,
          customerName,
        };
      }
      return prev;
    });
  };

  const handleVendorChange = (event, newValue) => {
    const vendorId = newValue?.id || '';
    const vendorName = newValue?.name || '';

    setValues(prev => {
      // Only update if values actually changed
      if (prev.vendorId !== vendorId || prev.vendorName !== vendorName) {
        return {
          ...prev,
          vendorId,
          vendorName,
        };
      }
      return prev;
    });
  };

  const handlePackageTypeChange = (e) => {
    const packageType = e.target.value;

    setValues(prev => {
      // Only update if package type actually changed
      if (prev.packageType !== packageType) {
        return {
          ...prev,
          packageType,
          // Reset locations when package type changes
          origin: '',
          destination: '',
          originCountry: packageType === 'Domestic' ? 'Indonesia' : '',
          destinationCountry: packageType === 'Domestic' ? 'Indonesia' : '',
        };
      }
      return prev;
    });
  };

  const calculateMargin = () => {
    const cost = parseFloat(values.estimatedCost) || 0;
    const price = parseFloat(values.sellingPrice) || 0;
    const margin = price - cost;

    // Only update if margin actually changed
    if (parseFloat(values.margin) !== margin) {
      setValues(prev => ({
        ...prev,
        margin: margin.toString(),
      }));
    }
  };

  const calculateTotalCosts = () => {
    const operationalTotal = values.operationalCosts.reduce((sum, cost) => {
      return sum + (cost.type === 'percentage' ?
        (parseFloat(values.estimatedCost) || 0) * (cost.amount / 100) :
        cost.amount);
    }, 0);

    const sellingTotal = values.sellingCosts.reduce((sum, cost) => {
      return sum + (cost.type === 'percentage' ?
        (parseFloat(values.sellingPrice) || 0) * (cost.amount / 100) :
        cost.amount);
    }, 0);

    return { operationalTotal, sellingTotal };
  };

  const addCargoItem = () => {
    const newCargo = {
      id: Date.now().toString(),
      description: '',
      type: '',
      weight: 0,
      volume: 0,
      value: 0,
      hazardous: false,
      specialHandling: '',
      // Container details
      containerType: '',
      containerSize: '',
      containerQuantity: 1,
      length: 0,
      width: 0,
      height: 0,
      // HS Code integration
      hsCode: '',
      hsCodeDescription: '',
      importDuty: 0,
      vat: 11,
      excise: 0
    };

    setValues(prev => {
      // Only add if cargo item with same ID doesn't exist
      const exists = prev.cargoItems.some(item => item.id === newCargo.id);
      if (!exists) {
        return {
          ...prev,
          cargoItems: [...prev.cargoItems, newCargo]
        };
      }
      return prev;
    });
  };

  const updateCargoItem = (id, field, value) => {
    setValues(prev => {
      const updatedItems = prev.cargoItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      );

      // Only update if items actually changed
      const hasChanges = updatedItems.some((item, index) =>
        prev.cargoItems[index] && prev.cargoItems[index][field] !== item[field]
      );

      if (hasChanges) {
        return {
          ...prev,
          cargoItems: updatedItems
        };
      }
      return prev;
    });
  };

  const removeCargoItem = (id) => {
    setValues(prev => ({
      ...prev,
      cargoItems: prev.cargoItems.filter(item => item.id !== id)
    }));
  };

  const addOperationalCost = async (costTemplate) => {
    try {
      const currentOrderId = values.id || 'new';

      const newCost = {
        id: `${costTemplate.id}_${Date.now()}`,
        name: costTemplate.name,
        description: costTemplate.description,
        amount: costTemplate.defaultAmount,
        currency: costTemplate.currency,
        costType: costTemplate.name,
        vendorName: costTemplate.vendorName || 'TBD',
        status: 'Pending',
        salesOrderId: currentOrderId,
        type: costTemplate.type || 'fixed'
      };

      // Save to operational cost service
      const savedCost = await dataSyncService.createOperationalCost(newCost);

      if (savedCost) {
        // Update local state with the saved cost
        setValues(prev => {
          const exists = prev.operationalCosts.some(cost => cost.id === savedCost.id);
          if (!exists) {
            return {
              ...prev,
              operationalCosts: [...prev.operationalCosts, savedCost]
            };
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error adding operational cost:', error);
      notificationService.showError('Failed to add operational cost');
    }
  };

  const addSellingCost = (costTemplate) => {
    const newCost = {
      id: costTemplate.id,
      name: costTemplate.name,
      description: costTemplate.description,
      amount: costTemplate.defaultAmount,
      currency: costTemplate.currency,
      type: costTemplate.type || 'fixed'
    };

    setValues(prev => {
      // Only add if cost with same ID doesn't exist
      const exists = prev.sellingCosts.some(cost => cost.id === costTemplate.id);
      if (!exists) {
        return {
          ...prev,
          sellingCosts: [...prev.sellingCosts, newCost]
        };
      }
      return prev;
    });
  };

  const updateCost = (costType, id, field, value) => {
    setValues(prev => {
      const updatedCosts = prev[costType].map(cost =>
        cost.id === id ? { ...cost, [field]: value } : cost
      );

      // Only update if costs actually changed
      const hasChanges = updatedCosts.some((cost, index) =>
        prev[costType][index] && prev[costType][index][field] !== cost[field]
      );

      if (hasChanges) {
        return {
          ...prev,
          [costType]: updatedCosts
        };
      }
      return prev;
    });
  };

  const removeCost = async (costType, id) => {
    try {
      if (costType === 'operationalCosts') {
        await dataSyncService.deleteOperationalCost(id);
      }

      setValues(prev => ({
        ...prev,
        [costType]: prev[costType].filter(cost => cost.id !== id)
      }));
    } catch (error) {
      console.error('Error removing cost:', error);
      notificationService.showError('Failed to remove cost');
    }
  };

  const bookShipment = () => {
    // Prevent multiple simultaneous shipment bookings
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

    // Only update if shipment details actually changed
    setValues(prev => {
      const currentTracking = prev.shipmentDetails?.trackingNumber;
      if (currentTracking !== trackingNumber) {
        return {
          ...prev,
          shipmentDetails
        };
      }
      return prev;
    });

    setSnackbar({ open: true, message: 'Shipment booked successfully!', severity: 'success' });
  };

  const generateInvoice = async () => {
    // Prevent multiple simultaneous invoice generations
    if (isSubmitting) {
      console.log('Form is submitting, cannot generate invoice');
      return;
    }

    console.log('Starting invoice generation...');
    console.log('Current form values:', values);

    try {
      // Calculate totals
      const { operationalTotal, sellingTotal } = calculateTotalCosts();
      const subtotal = values.sellingPrice || 0;
      const taxAmount = subtotal * 0.11;
      const total = subtotal + taxAmount;

      // Build comprehensive line items
      const lineItems = [];

      // Main freight service
      lineItems.push({
        description: `Freight Service - ${values.serviceType} (${values.origin} to ${values.destination})`,
        quantity: 1,
        unitPrice: values.sellingPrice || 0,
        amount: values.sellingPrice || 0,
        type: 'service'
      });

      // Add operational costs as line items
      values.operationalCosts.forEach(cost => {
        const costAmount = cost.type === 'percentage'
          ? (values.estimatedCost || 0) * (cost.amount / 100)
          : cost.amount;

        lineItems.push({
          description: `${cost.name} - ${cost.description}`,
          quantity: 1,
          unitPrice: costAmount,
          amount: costAmount,
          type: 'operational_cost'
        });
      });

      // Add selling costs as line items
      values.sellingCosts.forEach(cost => {
        const costAmount = cost.type === 'percentage'
          ? (values.sellingPrice || 0) * (cost.amount / 100)
          : cost.amount;

        lineItems.push({
          description: `${cost.name} - ${cost.description}`,
          quantity: 1,
          unitPrice: costAmount,
          amount: costAmount,
          type: 'selling_cost'
        });
      });

      // Add cargo items with HS code calculations
      values.cargoItems.forEach((item, index) => {
        if (item.hsCode && item.value) {
          const cifValue = item.value;
          const importDuty = cifValue * (item.importDuty / 100);
          const vatBase = cifValue + importDuty;
          const vat = vatBase * (item.vat / 100);
          const excise = cifValue * (item.excise / 100);
          const totalCost = cifValue + importDuty + vat + excise;

          lineItems.push({
            description: `HS Code ${item.hsCode} - ${item.description} (${item.containerType} ${item.containerSize} x${item.containerQuantity})`,
            quantity: item.containerQuantity || 1,
            unitPrice: totalCost,
            amount: totalCost,
            type: 'cargo_hs_code'
          });
        }
      });

      // Build comprehensive notes
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
        `Operational Costs: IDR ${operationalTotal.toLocaleString()}`,
        `Selling Costs: IDR ${sellingTotal.toLocaleString()}`,
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
        // Additional metadata
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

      console.log('Invoice data prepared:', invoiceData);
      console.log('Creating invoice with', lineItems.length, 'line items...');

      const invoice = await dataSyncService.createInvoice(invoiceData);
      console.log('Invoice creation result:', invoice);
      if (invoice) {
        console.log('Invoice created successfully:', invoice);
        setSnackbar({ open: true, message: 'Invoice generated successfully!', severity: 'success' });
        notificationService.showSuccess(`Invoice ${invoice.invoiceNumber} generated for ${values.customerName} with ${lineItems.length} line items`);
      } else {
        console.error('Invoice creation returned null');
        setSnackbar({ open: true, message: 'Failed to generate invoice - no response', severity: 'error' });
      }
    } catch (error) {
      console.error('Invoice generation error:', error);
      setSnackbar({ open: true, message: 'Failed to generate invoice', severity: 'error' });
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      // Prevent multiple simultaneous status changes
      if (isSubmitting) return;

      // Use the enhanced dataSync service for status changes with automatic synchronization
      const updatedOrder = await dataSyncService.changeSalesOrderStatus(values.id || 'new', newStatus, {
        includeShipment: true,
        updateDashboard: true,
        sendNotifications: true
      });

      // Update local state with the synchronized data
      setValues(updatedOrder);

      setSnackbar({
        open: true,
        message: `Sales order status updated to ${newStatus}`,
        severity: 'success'
      });

    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update order status',
        severity: 'error'
      });
    }
  };

  const handleSubmit = async () => {
    // Prevent multiple simultaneous submissions
    if (isSubmitting) {
      console.log('Already submitting, preventing duplicate submission');
      return;
    }

    console.log('Starting sales order submission...');
    console.log('Current form values:', values);
    console.log('Current form errors:', errors);
    console.log('Current field states:', fieldStates);
    console.log('isSubmitting state:', isSubmitting);

    // Add timeout to prevent infinite loading
    const submissionTimeout = setTimeout(() => {
      console.error('Submission timeout - forcing reset');
      // Force reset of form validation state
      if (window.confirm('Submission is taking too long. Would you like to retry?')) {
        window.location.reload();
      }
    }, 15000); // 15 second timeout - reduced for faster feedback

    try {
      console.log('Calling validateAndSubmit...');
      console.log('Form isSubmitting state before validation:', isSubmitting);
      const result = await validateAndSubmit(async (formData) => {
        console.log('Form validation passed, preparing order data...');

        const orderData = {
          ...formData,
          // Calculate totals
          totalOperationalCosts: calculateTotalCosts().operationalTotal,
          totalSellingCosts: calculateTotalCosts().sellingTotal,
          // Set initial status based on whether it's a new order or existing
          status: salesOrder ? values.status : 'Draft'
        };

        console.log('Order data prepared:', orderData);

        // If this is a new order, save it first to get the ID
        let savedOrder;
        if (salesOrder) {
          console.log('Updating existing order:', salesOrder.id);
          console.log('Calling onSave with orderData:', orderData);
          savedOrder = await onSave(orderData);
          console.log('Order update result:', savedOrder);
        } else {
          console.log('Creating new order...');
          console.log('Calling onSave with orderData:', orderData);
          savedOrder = await onSave(orderData);
          console.log('Order creation result:', savedOrder);
        }

        console.log('Order saved successfully:', savedOrder);

        // Update operational costs with the correct sales order ID
        if (savedOrder && values.operationalCosts.length > 0) {
          console.log('Updating operational costs with new order ID...');
          for (const cost of values.operationalCosts) {
            if (cost.salesOrderId !== savedOrder.id) {
              await dataSyncService.updateOperationalCost(cost.id, {
                salesOrderId: savedOrder.id
              });
            }
          }
        }

        return savedOrder;
      });

      console.log('Submission result:', result);

      if (result.success) {
        console.log('Submission successful, closing dialog...');
        setSnackbar({ open: true, message: `Sales order ${salesOrder ? 'updated' : 'created'} successfully!`, severity: 'success' });
        onClose();
      } else {
        console.log('Submission failed due to validation errors');
        setSnackbar({ open: true, message: 'Please correct the validation errors', severity: 'error' });
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setSnackbar({ open: true, message: `Error saving sales order: ${error.message}`, severity: 'error' });
    } finally {
      // Clear timeout and ensure isSubmitting is reset in all cases
      clearTimeout(submissionTimeout);
      console.log('Resetting isSubmitting state...');

      // Force reset isSubmitting state after a short delay
      setTimeout(() => {
        console.log('Force resetting form validation state...');
        try {
          // Try to reset the form validation state
          if (typeof reset === 'function') {
            reset();
          }
          // Force set isSubmitting to false by manipulating the state
          if (formValidation && typeof formValidation.setIsSubmitting === 'function') {
            formValidation.setIsSubmitting(false);
          }
          // Also try to reset via setValues
          if (typeof setValues === 'function') {
            setValues(prev => ({ ...prev }));
          }
          // Force reset the isSubmitting state directly
          if (typeof setIsSubmitting === 'function') {
            setIsSubmitting(false);
          }
          // Force reset by recreating the form validation
          if (typeof setFormValidation === 'function') {
            setFormValidation(prev => ({ ...prev, isSubmitting: false }));
          }
          // Last resort: force reset via direct state manipulation
          console.log('Final attempt to reset isSubmitting...');

          // Ultimate fallback: reload the page if nothing works
          setTimeout(() => {
            if (isSubmitting) {
              console.error('Ultimate fallback: isSubmitting still true, reloading page...');
              window.location.reload();
            }
          }, 3000);
        } catch (resetError) {
          console.error('Error resetting form state:', resetError);
        }
      }, 1000);
    }
  };

  const handleRedlineSubmit = async () => {
    try {
      const redlineData = {
        id: `redline_so_${Date.now()}`,
        redlineNumber: `RED-SO-${Date.now().toString().slice(-6)}`,
        salesOrderId: values.id || 'new',
        customerName: values.customerName,
        originalServiceType: values.serviceType,
        originalRoute: `${values.origin} → ${values.destination}`,
        originalValue: values.sellingPrice || 0,
        originalCurrency: 'IDR',
        urgencyLevel: redlineFormData.urgencyLevel,
        justification: redlineFormData.justification,
        requestedBy: redlineFormData.requestedBy,
        additionalCosts: redlineFormData.additionalCosts,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        source: 'sales_order'
      };

      await dataSyncService.createRedline?.(redlineData);
      notificationService.showSuccess('Redline request created successfully');
      setRedlineDialog(false);

      // Reset redline form
      setRedlineFormData({
        urgencyLevel: 'urgent',
        justification: '',
        requestedBy: '',
        additionalCosts: 0
      });
    } catch (error) {
      notificationService.showError('Failed to create redline request');
    }
  };

  const getLocationOptions = () => {
    return values.packageType === 'Domestic' ? INDONESIAN_CITIES : COUNTRIES;
  };

  const steps = ['Basic Info', 'Cargo Details', 'Cost Management', 'Vendor & Shipment', 'Review & Submit'];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {salesOrder ? 'Edit Sales Order' : 'Create New Sales Order'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ width: '100%', mt: 2 }}>
          <Stepper activeStep={activeTab} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ mt: 3 }}>
            {activeTab === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={customers}
                    getOptionLabel={(option) => `${option.name} (${option.type})`}
                    value={customers.find(c => c.id === values.customerId) || null}
                    onChange={handleCustomerChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Customer"
                        {...getFieldProps('customerId')}
                        color={getFieldStateColor(fieldStates.customerId)}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {fieldStates.customerId && fieldStates.customerId !== FIELD_STATES.IDLE ? (
                                <Box component="span" sx={{ color: getFieldStateColor(fieldStates.customerId) + '.main', fontSize: '20px', mr: 1 }}>
                                  {getFieldStateIcon(fieldStates.customerId)}
                                </Box>
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Package Type</InputLabel>
                    <Select
                      name="packageType"
                      value={values.packageType}
                      onChange={handlePackageTypeChange}
                      label="Package Type"
                    >
                      {PACKAGE_TYPES.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    freeSolo
                    options={getLocationOptions()}
                    value={values.origin}
                    onChange={(e, value) => handleFieldChange('origin', value || '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Origin"
                        {...getFieldProps('origin')}
                        color={getFieldStateColor(fieldStates.origin)}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {fieldStates.origin && fieldStates.origin !== FIELD_STATES.IDLE ? (
                                <Box component="span" sx={{ color: getFieldStateColor(fieldStates.origin) + '.main', fontSize: '20px', mr: 1 }}>
                                  {getFieldStateIcon(fieldStates.origin)}
                                </Box>
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    freeSolo
                    options={getLocationOptions()}
                    value={values.destination}
                    onChange={(e, value) => handleFieldChange('destination', value || '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Destination"
                        {...getFieldProps('destination')}
                        color={getFieldStateColor(fieldStates.destination)}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {fieldStates.destination && fieldStates.destination !== FIELD_STATES.IDLE ? (
                                <Box component="span" sx={{ color: getFieldStateColor(fieldStates.destination) + '.main', fontSize: '20px', mr: 1 }}>
                                  {getFieldStateIcon(fieldStates.destination)}
                                </Box>
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Service Type</InputLabel>
                    <Select
                      name="serviceType"
                      value={values.serviceType}
                      onChange={handleChange}
                      label="Service Type"
                    >
                      {SERVICE_TYPES.map(type => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      name="priority"
                      value={values.priority}
                      onChange={handleChange}
                      label="Priority"
                    >
                      <MenuItem value="Low">Low</MenuItem>
                      <MenuItem value="Normal">Normal</MenuItem>
                      <MenuItem value="High">High</MenuItem>
                      <MenuItem value="Urgent">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}

            {activeTab === 1 && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Cargo Items</Typography>
                  <Button startIcon={<AddIcon />} onClick={addCargoItem}>
                    Add Cargo Item
                  </Button>
                </Box>

                {values.cargoItems.map((item, index) => (
                  <Card key={item.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Description"
                            value={item.description || ''}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              if (item.description !== newValue) {
                                updateCargoItem(item.id, 'description', newValue);
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>Cargo Type</InputLabel>
                            <Select
                              value={item.type || ''}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                if (item.type !== newValue) {
                                  updateCargoItem(item.id, 'type', newValue);
                                }
                              }}
                              label="Cargo Type"
                            >
                              {CARGO_TYPES.map(type => (
                                <MenuItem key={type} value={type}>
                                  {type}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Weight (kg)"
                            type="number"
                            value={item.weight || 0}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value) || 0;
                              if (item.weight !== newValue) {
                                updateCargoItem(item.id, 'weight', newValue);
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Volume (cbm)"
                            type="number"
                            value={item.volume || 0}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value) || 0;
                              if (item.volume !== newValue) {
                                updateCargoItem(item.id, 'volume', newValue);
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Value (IDR)"
                            type="number"
                            value={item.value || 0}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value) || 0;
                              if (item.value !== newValue) {
                                updateCargoItem(item.id, 'value', newValue);
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <FormControl fullWidth>
                            <InputLabel>Container Type</InputLabel>
                            <Select
                              value={item.containerType || ''}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                if (item.containerType !== newValue) {
                                  updateCargoItem(item.id, 'containerType', newValue);
                                }
                              }}
                              label="Container Type"
                            >
                              <MenuItem value="Dry">Dry Container</MenuItem>
                              <MenuItem value="Reefer">Reefer Container</MenuItem>
                              <MenuItem value="Open Top">Open Top Container</MenuItem>
                              <MenuItem value="Flat Rack">Flat Rack Container</MenuItem>
                              <MenuItem value="Tank">Tank Container</MenuItem>
                              <MenuItem value="Bulk">Bulk Container</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <FormControl fullWidth>
                            <InputLabel>Container Size</InputLabel>
                            <Select
                              value={item.containerSize || ''}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                if (item.containerSize !== newValue) {
                                  updateCargoItem(item.id, 'containerSize', newValue);
                                }
                              }}
                              label="Container Size"
                            >
                              <MenuItem value="20ft">20 feet</MenuItem>
                              <MenuItem value="40ft">40 feet</MenuItem>
                              <MenuItem value="40ft HC">40 feet HC</MenuItem>
                              <MenuItem value="45ft">45 feet</MenuItem>
                              <MenuItem value="20ft Reefer">20ft Reefer</MenuItem>
                              <MenuItem value="40ft Reefer">40ft Reefer</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Container Qty"
                            type="number"
                            value={item.containerQuantity || 1}
                            onChange={(e) => {
                              const newValue = parseInt(e.target.value) || 1;
                              if (item.containerQuantity !== newValue) {
                                updateCargoItem(item.id, 'containerQuantity', newValue);
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Length (cm)"
                            type="number"
                            value={item.length || 0}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value) || 0;
                              if (item.length !== newValue) {
                                updateCargoItem(item.id, 'length', newValue);
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Width (cm)"
                            type="number"
                            value={item.width || 0}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value) || 0;
                              if (item.width !== newValue) {
                                updateCargoItem(item.id, 'width', newValue);
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Height (cm)"
                            type="number"
                            value={item.height || 0}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value) || 0;
                              if (item.height !== newValue) {
                                updateCargoItem(item.id, 'height', newValue);
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Autocomplete
                            options={hsCodes}
                            getOptionLabel={(option) => `${option.code} - ${option.description}`}
                            value={hsCodes.find(hs => hs.code === item.hsCode) || null}
                            onChange={(event, newValue) => {
                              updateCargoItem(item.id, 'hsCode', newValue?.code || '');
                              updateCargoItem(item.id, 'hsCodeDescription', newValue?.description || '');
                              updateCargoItem(item.id, 'importDuty', newValue?.importDuty || 0);
                              updateCargoItem(item.id, 'vat', newValue?.vat || 11);
                              updateCargoItem(item.id, 'excise', newValue?.excise || 0);
                            }}
                            renderInput={(params) => (
                              <TextField {...params} label="HS Code" fullWidth />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Box display="flex" gap={1} alignItems="center">
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={item.hazardous}
                                  onChange={(e) => updateCargoItem(item.id, 'hazardous', e.target.checked)}
                                />
                              }
                              label="Hazardous"
                            />
                            <IconButton onClick={() => removeCargoItem(item.id)} color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Special Handling Requirements"
                            value={item.specialHandling || ''}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              if (item.specialHandling !== newValue) {
                                updateCargoItem(item.id, 'specialHandling', newValue);
                              }
                            }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}

                {values.cargoItems.length === 0 && (
                  <Alert severity="info">No cargo items added yet. Click "Add Cargo Item" to begin.</Alert>
                )}

                {/* HS Code Cost Calculator Summary */}
                {values.cargoItems.length > 0 && (
                  <Card sx={{ mt: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>HS Code Cost Breakdown</Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Item</TableCell>
                              <TableCell>HS Code</TableCell>
                              <TableCell align="right">CIF Value</TableCell>
                              <TableCell align="right">Import Duty</TableCell>
                              <TableCell align="right">VAT</TableCell>
                              <TableCell align="right">Total Cost</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {values.cargoItems.map((item, index) => {
                              if (!item.hsCode || !item.value) return null;

                              const cifValue = item.value;
                              const importDuty = cifValue * (item.importDuty / 100);
                              const vatBase = cifValue + importDuty;
                              const vat = vatBase * (item.vat / 100);
                              const excise = cifValue * (item.excise / 100);
                              const totalCost = cifValue + importDuty + vat + excise;

                              return (
                                <TableRow key={item.id}>
                                  <TableCell>{item.description}</TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                      {item.hsCode}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    {new Intl.NumberFormat('id-ID', {
                                      style: 'currency',
                                      currency: 'IDR',
                                      minimumFractionDigits: 0,
                                    }).format(cifValue)}
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography color="error.main">
                                      {new Intl.NumberFormat('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 0,
                                      }).format(importDuty)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography color="warning.main">
                                      {new Intl.NumberFormat('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 0,
                                      }).format(vat)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="subtitle2" color="success.main">
                                      {new Intl.NumberFormat('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 0,
                                      }).format(totalCost)}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}

            {activeTab === 2 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Operational Costs</Typography>
                  <Box display="flex" gap={1} mb={2}>
                    {STANDARD_COSTS.operational.map(cost => (
                      <Button
                        key={cost.id}
                        size="small"
                        variant="outlined"
                        onClick={() => addOperationalCost(cost)}
                        disabled={values.operationalCosts.some(c => c.id === cost.id)}
                      >
                        {cost.name}
                      </Button>
                    ))}
                  </Box>

                  {values.operationalCosts.map(cost => (
                    <Card key={cost.id} sx={{ mb: 1 }}>
                      <CardContent sx={{ pb: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={3}>
                            <Typography variant="subtitle2">{cost.name}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {cost.description}
                            </Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Currency</InputLabel>
                              <Select
                                value={cost.currency || 'IDR'}
                                onChange={(e) => {
                                  const newValue = e.target.value;
                                  if (cost.currency !== newValue) {
                                    updateCost('operationalCosts', cost.id, 'currency', newValue);
                                  }
                                }}
                                label="Currency"
                              >
                                {CURRENCIES.map(curr => (
                                  <MenuItem key={curr.code} value={curr.code}>
                                    {curr.code} - {curr.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={2}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Amount"
                              type="number"
                              value={cost.amount || 0}
                              onChange={(e) => {
                                const newValue = parseFloat(e.target.value) || 0;
                                if (cost.amount !== newValue) {
                                  updateCost('operationalCosts', cost.id, 'amount', newValue);
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={2}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Converted (IDR)"
                              value={cost.currency === 'USD' ? (cost.amount * 15000).toLocaleString() : cost.amount.toLocaleString()}
                              disabled
                            />
                          </Grid>
                          <Grid item xs={3}>
                            <IconButton onClick={() => removeCost('operationalCosts', cost.id)} color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Selling Costs & Pricing</Typography>
                  <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                    {STANDARD_COSTS.selling.map(cost => (
                      <Button
                        key={cost.id}
                        size="small"
                        variant="outlined"
                        onClick={() => addSellingCost(cost)}
                        disabled={values.sellingCosts.some(c => c.id === cost.id)}
                      >
                        {cost.name}
                      </Button>
                    ))}
                  </Box>

                  {values.sellingCosts.map(cost => (
                    <Card key={cost.id} sx={{ mb: 1 }}>
                      <CardContent sx={{ pb: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={2}>
                            <Typography variant="subtitle2">{cost.name}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {cost.description}
                            </Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Currency</InputLabel>
                              <Select
                                value={cost.currency || 'IDR'}
                                onChange={(e) => {
                                  const newValue = e.target.value;
                                  if (cost.currency !== newValue) {
                                    updateCost('sellingCosts', cost.id, 'currency', newValue);
                                  }
                                }}
                                label="Currency"
                              >
                                {CURRENCIES.map(curr => (
                                  <MenuItem key={curr.code} value={curr.code}>
                                    {curr.code} - {curr.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={2}>
                            <TextField
                              fullWidth
                              size="small"
                              label={cost.type === 'percentage' ? 'Percentage (%)' : 'Amount'}
                              type="number"
                              value={cost.amount || 0}
                              onChange={(e) => {
                                const newValue = parseFloat(e.target.value) || 0;
                                if (cost.amount !== newValue) {
                                  updateCost('sellingCosts', cost.id, 'amount', newValue);
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={2}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Base Amount"
                              value={cost.currency === 'USD' ?
                                (cost.type === 'percentage' ?
                                  ((parseFloat(values.sellingPrice) || 0) * (cost.amount / 100) * 15000) :
                                  (cost.amount * 15000)
                                ).toLocaleString() :
                                (cost.type === 'percentage' ?
                                  ((parseFloat(values.sellingPrice) || 0) * (cost.amount / 100)) :
                                  cost.amount
                                ).toLocaleString()
                              }
                              disabled
                            />
                          </Grid>
                          <Grid item xs={2}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Margin"
                              value={cost.currency === 'USD' ?
                                (cost.type === 'percentage' ?
                                  ((parseFloat(values.sellingPrice) || 0) * (cost.amount / 100) * 15000) :
                                  (cost.amount * 15000)
                                ).toLocaleString() :
                                (cost.type === 'percentage' ?
                                  ((parseFloat(values.sellingPrice) || 0) * (cost.amount / 100)) :
                                  cost.amount
                                ).toLocaleString()
                              }
                              disabled
                              sx={{
                                '& .MuiInputBase-input': {
                                  color: 'success.main',
                                  fontWeight: 'bold'
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={2}>
                            <Box display="flex" gap={1} alignItems="center">
                              <Chip
                                label={cost.status || 'Draft'}
                                size="small"
                                color={cost.status === 'Approved' ? 'success' : 'warning'}
                                variant="outlined"
                              />
                              <IconButton onClick={() => removeCost('sellingCosts', cost.id)} color="error" size="small">
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Cost Summary</Typography>
                      {(() => {
                        const { operationalTotal, sellingTotal } = calculateTotalCosts();
                        return (
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography>Total Operational Costs: IDR {operationalTotal.toLocaleString()}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography>Total Selling Costs: IDR {sellingTotal.toLocaleString()}</Typography>
                            </Grid>
                          </Grid>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {activeTab === 3 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={vendors}
                    getOptionLabel={(option) => `${option.name} (${option.serviceType})`}
                    value={vendors.find(v => v.id === values.vendorId) || null}
                    onChange={handleVendorChange}
                    renderInput={(params) => (
                      <TextField {...params} label="Select Vendor/Provider" fullWidth />
                    )}
                  />
                </Grid>

                {values.shipmentDetails && (
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Shipment Details</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Tracking Number"
                              value={values.shipmentDetails.trackingNumber}
                              disabled
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Status"
                              value={values.shipmentDetails.status}
                              disabled
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Estimated Departure"
                              type="date"
                              value={values.shipmentDetails?.estimatedDeparture || ''}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setValues(prev => {
                                  const currentValue = prev.shipmentDetails?.estimatedDeparture;
                                  if (currentValue !== newValue) {
                                    return {
                                      ...prev,
                                      shipmentDetails: { ...prev.shipmentDetails, estimatedDeparture: newValue }
                                    };
                                  }
                                  return prev;
                                });
                              }}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Estimated Arrival"
                              type="date"
                              value={values.shipmentDetails?.estimatedArrival || ''}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setValues(prev => {
                                  const currentValue = prev.shipmentDetails?.estimatedArrival;
                                  if (currentValue !== newValue) {
                                    return {
                                      ...prev,
                                      shipmentDetails: { ...prev.shipmentDetails, estimatedArrival: newValue }
                                    };
                                  }
                                  return prev;
                                });
                              }}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                        </Grid>
                        <Box mt={2}>
                          <Button
                            variant="contained"
                            startIcon={<ShippingIcon />}
                            onClick={bookShipment}
                            disabled={!values.origin || !values.destination}
                          >
                            Book Shipment
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            )}

            {activeTab === 4 && (
              <Box>
                <Typography variant="h6" gutterBottom>Review & Submit</Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>Order Summary</Typography>
                        <Typography>Customer: {values.customerName}</Typography>
                        <Typography>Route: {values.origin} → {values.destination}</Typography>
                        <Typography>Service: {values.serviceType}</Typography>
                        <Typography>Package Type: {values.packageType}</Typography>
                        <Typography>Priority: {values.priority}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>Status Management</Typography>
                        <Box mb={2}>
                          <Typography variant="body2" gutterBottom>Current Status:</Typography>
                          <Chip
                            label={values.status || 'Draft'}
                            color={getStatusColor(values.status)}
                            size="small"
                            sx={{ mb: 2 }}
                          />
                        </Box>

                        {values.status === 'Draft' && (
                          <Box>
                            <Typography variant="body2" gutterBottom>Change Status:</Typography>
                            <Box display="flex" gap={1} flexWrap="wrap">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleStatusChange('Confirmed')}
                                disabled={!values.customerId || !values.origin || !values.destination}
                              >
                                Confirm Order
                              </Button>
                            </Box>
                          </Box>
                        )}

                        {values.status === 'Confirmed' && (
                          <Box>
                            <Typography variant="body2" gutterBottom>Next Actions:</Typography>
                            <Box display="flex" gap={1} flexWrap="wrap">
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={() => handleStatusChange('In Transit')}
                                disabled={!values.shipmentDetails?.trackingNumber}
                              >
                                Mark In Transit
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={bookShipment}
                                disabled={!values.origin || !values.destination}
                              >
                                Book Shipment
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                onClick={() => setRedlineDialog(true)}
                              >
                                Request Redline
                              </Button>
                            </Box>
                          </Box>
                        )}

                        {values.status === 'In Transit' && (
                          <Box>
                            <Typography variant="body2" gutterBottom>Complete Order:</Typography>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleStatusChange('Delivered')}
                            >
                              Mark as Delivered
                            </Button>
                          </Box>
                        )}

                        {values.status === 'Delivered' && (
                          <Box>
                            <Typography variant="body2" color="success.main">
                              ✓ Order completed successfully!
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>Financial Summary</Typography>
                        <TextField
                          fullWidth
                          label="Estimated Cost (IDR)"
                          type="number"
                          {...getFieldProps('estimatedCost')}
                          color={getFieldStateColor(fieldStates.estimatedCost)}
                          onChange={(e) => handleFieldChange('estimatedCost', e.target.value)}
                          InputProps={{
                            endAdornment: fieldStates.estimatedCost && fieldStates.estimatedCost !== FIELD_STATES.IDLE ? (
                              <Box component="span" sx={{ color: getFieldStateColor(fieldStates.estimatedCost) + '.main', fontSize: '20px' }}>
                                {getFieldStateIcon(fieldStates.estimatedCost)}
                              </Box>
                            ) : null
                          }}
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          label="Selling Price (IDR)"
                          type="number"
                          {...getFieldProps('sellingPrice')}
                          color={getFieldStateColor(fieldStates.sellingPrice)}
                          onChange={(e) => handleFieldChange('sellingPrice', e.target.value)}
                          InputProps={{
                            endAdornment: fieldStates.sellingPrice && fieldStates.sellingPrice !== FIELD_STATES.IDLE ? (
                              <Box component="span" sx={{ color: getFieldStateColor(fieldStates.sellingPrice) + '.main', fontSize: '20px' }}>
                                {getFieldStateIcon(fieldStates.sellingPrice)}
                              </Box>
                            ) : null
                          }}
                          sx={{ mb: 2 }}
                        />
                        <Box display="flex" gap={1} alignItems="center">
                          <TextField
                            fullWidth
                            label="Margin (IDR)"
                            type="number"
                            value={values.margin}
                            disabled
                          />
                          <IconButton onClick={calculateMargin} color="primary">
                            <CalculateIcon />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Special Instructions"
                      multiline
                      rows={3}
                      value={values.specialInstructions || ''}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setValues(prev => {
                          if (prev.specialInstructions !== newValue) {
                            return { ...prev, specialInstructions: newValue };
                          }
                          return prev;
                        });
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {activeTab > 0 && (
          <Button onClick={() => setActiveTab(prev => prev - 1)}>
            Previous
          </Button>
        )}
        {activeTab < steps.length - 1 ? (
          <Button onClick={() => setActiveTab(prev => prev + 1)} variant="contained">
            Next
          </Button>
        ) : (
          <Box display="flex" gap={1}>
            <Button
              onClick={generateInvoice}
              variant="outlined"
              startIcon={<ReceiptIcon />}
              disabled={!values.customerId || !values.sellingPrice || isSubmitting}
            >
              Generate Invoice
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              startIcon={isSubmitting ? <CircularProgress size={16} /> : <SaveIcon />}
              disabled={isSubmitting || Object.values(fieldStates).some(state => state === FIELD_STATES.VALIDATING)}
            >
              {isSubmitting ? 'Saving...' : (salesOrder ? 'Update' : 'Create')} Order
            </Button>
          </Box>
        )}
      </DialogActions>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Redline Request Dialog */}
      <Dialog open={redlineDialog} onClose={() => setRedlineDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Redline Order</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="body2" gutterBottom>
                <strong>Sales Order:</strong> {values.orderNumber} - {values.customerName}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Current Route:</strong> {values.origin} → {values.destination}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Current Value:</strong> {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(values.sellingPrice)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Urgency Level</InputLabel>
                <Select
                  value={redlineFormData.urgencyLevel}
                  onChange={(e) => setRedlineFormData(prev => ({ ...prev, urgencyLevel: e.target.value }))}
                  label="Urgency Level"
                >
                  <MenuItem value="normal">Normal (1x)</MenuItem>
                  <MenuItem value="urgent">Urgent (1.5x)</MenuItem>
                  <MenuItem value="express">Express (2x)</MenuItem>
                  <MenuItem value="critical">Critical (3x)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Requested By"
                value={redlineFormData.requestedBy}
                onChange={(e) => setRedlineFormData(prev => ({ ...prev, requestedBy: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Justification"
                multiline
                rows={3}
                value={redlineFormData.justification}
                onChange={(e) => setRedlineFormData(prev => ({ ...prev, justification: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Estimated Additional Costs"
                type="number"
                step="0.01"
                value={redlineFormData.additionalCosts}
                onChange={(e) => setRedlineFormData(prev => ({ ...prev, additionalCosts: parseFloat(e.target.value) || 0 }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Redline Request Impact:</strong><br />
                  • This will create an urgent request for faster processing<br />
                  • Additional costs may apply based on urgency level<br />
                  • Requires approval from management before execution<br />
                  • Will be tracked separately in cost management system
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRedlineDialog(false)}>Cancel</Button>
          <Button
            onClick={handleRedlineSubmit}
            variant="contained"
            color="warning"
          >
            Submit Redline Request
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

const SalesOrder = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOrderId, setMenuOrderId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await dataSyncService.getSalesOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading sales orders:', error);
    }
  };

  const handleAdd = () => {
    setSelectedOrder(null);
    setDialogOpen(true);
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
    setAnchorEl(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this sales order?')) {
      try {
        await dataSyncService.deleteSalesOrder(id);
        notificationService.showSuccess('Sales order deleted successfully');
        loadOrders();
      } catch (error) {
        notificationService.showError('Failed to delete sales order');
      }
    }
    setAnchorEl(null);
  };

  const handleSave = async (orderData) => {
    console.log('Parent handleSave called with orderData:', orderData);
    console.log('selectedOrder:', selectedOrder);

    try {
      if (selectedOrder) {
        console.log('Updating existing order:', selectedOrder.id);
        const result = await dataSyncService.updateSalesOrder(selectedOrder.id, orderData);
        console.log('Update result:', result);
        notificationService.showSuccess('Sales order updated successfully');
      } else {
        console.log('Creating new order...');
        const newOrder = await dataSyncService.createSalesOrder(orderData);
        console.log('Creation result:', newOrder);
        notificationService.showSuccess(`Sales order ${newOrder.orderNumber} created successfully`);
      }
      console.log('Reloading orders...');
      await loadOrders();
      console.log('Orders reloaded successfully');
    } catch (error) {
      console.error('Error in parent handleSave:', error);
      notificationService.showError(`Failed to save sales order: ${error.message}`);
      throw error; // Re-throw to allow form to handle the error
    }
  };

  const handleMenuOpen = (event, orderId) => {
    setAnchorEl(event.currentTarget);
    setMenuOrderId(orderId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuOrderId(null);
  };

  const filteredOrders = orders.filter(order =>
    order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.origin?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    if (!amount) return 'IDR 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'success';
      case 'In Transit': return 'primary';
      case 'Delivered': return 'default';
      case 'Cancelled': return 'error';
      case 'Draft': return 'warning';
      default: return 'info';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'error';
      case 'High': return 'warning';
      case 'Normal': return 'info';
      case 'Low': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Sales Orders</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          New Sales Order
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            label="Search orders..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order #</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Route</TableCell>
              <TableCell>Package Type</TableCell>
              <TableCell>Cargo Details</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Financial</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id} hover>
                <TableCell>
                  <Typography variant="subtitle2">{order.orderNumber}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">{order.customerName}</Typography>
                  <Chip
                    label={order.packageType}
                    size="small"
                    color={order.packageType === 'International' ? 'primary' : 'secondary'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{order.origin}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    → {order.destination}
                  </Typography>
                  {order.shipmentDetails?.trackingNumber && (
                    <Typography variant="caption" color="primary">
                      Track: {order.shipmentDetails.trackingNumber}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={order.packageType}
                    size="small"
                    color={order.packageType === 'International' ? 'primary' : 'secondary'}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {order.cargoItems?.length || 0} items
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {order.cargoItems?.reduce((sum, item) => sum + (item.weight || 0), 0)}kg total
                  </Typography>
                  {order.cargoItems?.some(item => item.hazardous) && (
                    <Chip label="Hazardous" size="small" color="error" />
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={order.serviceType}
                    size="small"
                    variant="outlined"
                  />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                    Priority: <Chip label={order.priority} size="small" color={getPriorityColor(order.priority)} />
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatCurrency(order.sellingPrice)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Cost: {formatCurrency(order.estimatedCost)}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    Margin: {formatCurrency(order.margin)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={order.status || 'Draft'}
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                  {order.shipmentDetails?.status && (
                    <Typography variant="caption" display="block">
                      Shipment: {order.shipmentDetails.status}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, order.id)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEdit(orders.find(o => o.id === menuOrderId))}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleDelete(menuOrderId)}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      <SalesOrderForm
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        salesOrder={selectedOrder}
        onSave={handleSave}
      />
    </Box>
  );
};

export default SalesOrder;