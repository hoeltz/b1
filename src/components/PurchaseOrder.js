import React, { useState, useEffect, useMemo, useCallback, useReducer } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Autocomplete,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  GetApp as ExportIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  Business as BusinessIcon,
  ShoppingCart as PurchaseIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';
import dataSyncService from '../services/dataSync';
import notificationService from '../services/notificationService';
import * as XLSX from 'xlsx';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '../services/currencyUtils';

// Initial state for purchase order form
const initialFormState = {
  poNumber: '',
  vendorId: '',
  vendorName: '',
  salesOrderId: '',
  customerName: '',
  issueDate: new Date().toISOString().split('T')[0],
  requiredDate: '',
  currency: 'IDR',
  status: 'Draft',
  paymentTerms: 'Net 30',
  notes: '',
  items: [],
  subtotal: 0,
  taxRate: 11,
  taxAmount: 0,
  total: 0,
};

// Action types for purchase order reducer
const PO_ACTIONS = {
  SET_FIELD: 'SET_FIELD',
  SET_MULTIPLE_FIELDS: 'SET_MULTIPLE_FIELDS',
  ADD_ITEM: 'ADD_ITEM',
  UPDATE_ITEM: 'UPDATE_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  SET_ITEMS: 'SET_ITEMS',
  CALCULATE_TOTALS: 'CALCULATE_TOTALS',
  RESET_FORM: 'RESET_FORM',
  SET_ERRORS: 'SET_ERRORS',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Purchase order reducer
const poReducer = (state, action) => {
  switch (action.type) {
    case PO_ACTIONS.SET_FIELD:
      return { ...state, [action.field]: action.value };

    case PO_ACTIONS.SET_MULTIPLE_FIELDS:
      return { ...state, ...action.fields };

    case PO_ACTIONS.ADD_ITEM:
      return {
        ...state,
        items: [...state.items, action.item]
      };

    case PO_ACTIONS.UPDATE_ITEM:
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.id ? { ...item, [action.field]: action.value } : item
        )
      };

    case PO_ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.id)
      };

    case PO_ACTIONS.SET_ITEMS:
      return { ...state, items: action.items };

    case PO_ACTIONS.CALCULATE_TOTALS: {
      const subtotal = state.items.reduce((sum, item) => sum + (item.amount || 0), 0);
      const taxAmount = subtotal * (state.taxRate / 100);
      const total = subtotal + taxAmount;
      return { ...state, subtotal, taxAmount, total };
    }

    case PO_ACTIONS.RESET_FORM:
      return initialFormState;

    default:
      return state;
  }
};

// Error Boundary for PurchaseOrder
class PurchaseOrderErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PurchaseOrder Error:', error, errorInfo);
    notificationService.showError('An unexpected error occurred in Purchase Order Management');
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Something went wrong with Purchase Order Management
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {this.state.error?.message}
          </Typography>
          <Button
            variant="contained"
            onClick={() => this.setState({ hasError: false, error: null })}
            sx={{ mt: 2 }}
          >
            Try Again
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

const PurchaseOrder = () => {
  // Core state management
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [selectedPO, setSelectedPO] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Form state with reducer
  const [formData, dispatch] = useReducer(poReducer, initialFormState);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Data source tracking
  const [dataSource, setDataSource] = useState('fresh');
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Memoized calculations
  const calculations = useMemo(() => {
    console.log('Calculating totals for items:', formData.items);
    const subtotal = formData.items.reduce((sum, item) => {
      const amount = (item.amount || 0);
      console.log(`Item ${item.id}: quantity=${item.quantity}, unitPrice=${item.unitPrice}, amount=${amount}`);
      return sum + amount;
    }, 0);
    const taxAmount = subtotal * (formData.taxRate / 100);
    const total = subtotal + taxAmount;

    console.log('Calculated totals:', { subtotal, taxAmount, total, taxRate: formData.taxRate });

    return { subtotal, taxAmount, total };
  }, [formData.items, formData.taxRate]);

  // Enhanced data loading with robust persistence
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [poData, soData, vendorData, customerData] = await Promise.allSettled([
        dataSyncService.getPurchaseOrders?.() || Promise.resolve([]),
        dataSyncService.getSalesOrders?.() || Promise.resolve([]),
        dataSyncService.getVendors?.() || Promise.resolve([]),
        dataSyncService.getCustomers?.() || Promise.resolve([])
      ]);

      const purchaseOrders = poData.status === 'fulfilled' ? poData.value : [];
      const salesOrders = soData.status === 'fulfilled' ? soData.value : [];
      const vendors = vendorData.status === 'fulfilled' ? vendorData.value : [];
      const customers = customerData.status === 'fulfilled' ? customerData.value : [];

      setPurchaseOrders(purchaseOrders);
      setSalesOrders(salesOrders);
      setVendors(vendors);
      setCustomers(customers);

      // Track data source
      let source = 'fresh';
      if (poData.status === 'rejected' || soData.status === 'rejected' ||
          vendorData.status === 'rejected' || customerData.status === 'rejected') {
        source = 'partial';
      }
      setDataSource(source);

      // Persist data to localStorage
      persistDataToStorage({ purchaseOrders, salesOrders, vendors, customers });

    } catch (error) {
      console.error('Error loading purchase order data:', error);
      loadDataFromStorage();
      setDataSource('cached');
      notificationService.showError('Failed to load fresh data. Using cached data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Data persistence functions
  const persistDataToStorage = useCallback((data) => {
    try {
      if (data.purchaseOrders && data.purchaseOrders.length > 0) {
        localStorage.setItem('purchase_order_management_pos', JSON.stringify(data.purchaseOrders));
      }
      if (data.salesOrders && data.salesOrders.length > 0) {
        localStorage.setItem('purchase_order_management_sos', JSON.stringify(data.salesOrders));
      }
      if (data.vendors && data.vendors.length > 0) {
        localStorage.setItem('purchase_order_management_vendors', JSON.stringify(data.vendors));
      }
      if (data.customers && data.customers.length > 0) {
        localStorage.setItem('purchase_order_management_customers', JSON.stringify(data.customers));
      }
    } catch (error) {
      console.warn('Failed to persist purchase order data:', error);
    }
  }, []);

  const loadDataFromStorage = useCallback(() => {
    try {
      const poData = localStorage.getItem('purchase_order_management_pos');
      const soData = localStorage.getItem('purchase_order_management_sos');
      const vendorData = localStorage.getItem('purchase_order_management_vendors');
      const customerData = localStorage.getItem('purchase_order_management_customers');

      if (poData) setPurchaseOrders(JSON.parse(poData));
      if (soData) setSalesOrders(JSON.parse(soData));
      if (vendorData) setVendors(JSON.parse(vendorData));
      if (customerData) setCustomers(JSON.parse(customerData));
    } catch (error) {
      console.warn('Failed to load purchase order data from storage:', error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh mechanism
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key?.includes('purchase_order') || e.key?.includes('sales_order') || e.key?.includes('vendor')) {
        console.log('Detected external data change in purchase orders, refreshing...');
        handleRefresh();
      }
    };

    const handleFocus = () => {
      const timeSinceLastRefresh = Date.now() - lastRefresh;
      if (timeSinceLastRefresh > 30000) {
        handleRefresh();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [lastRefresh]);

  // Form handlers
  const handleInputChange = useCallback((field) => (event) => {
    let value = event.target.value;
    dispatch({ type: PO_ACTIONS.SET_FIELD, field, value });
  }, []);

  const handleVendorChange = useCallback((event, newValue) => {
    const fields = {
      vendorId: newValue?.id || '',
      vendorName: newValue?.name || '',
    };
    dispatch({ type: PO_ACTIONS.SET_MULTIPLE_FIELDS, fields });
  }, []);

  const handleSalesOrderChange = useCallback((event, newValue) => {
    if (newValue) {
      const fields = {
        salesOrderId: newValue.id,
        customerName: newValue.customerName,
      };
      dispatch({ type: PO_ACTIONS.SET_MULTIPLE_FIELDS, fields });
    }
  }, []);

  // Purchase order item management
  const addItem = useCallback(() => {
    const newItem = {
      id: `po_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: '',
      serviceType: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      currency: 'IDR',
      notes: ''
    };

    dispatch({ type: PO_ACTIONS.ADD_ITEM, item: newItem });
  }, []);

  const updateItem = useCallback((id, field, value) => {
    dispatch({ type: PO_ACTIONS.UPDATE_ITEM, id, field, value });

    // Auto-calculate amount for quantity/unitPrice changes
    if (field === 'quantity' || field === 'unitPrice') {
      setTimeout(() => {
        // Update the specific item's amount
        const item = formData.items.find(item => item.id === id);
        if (item) {
          const quantity = field === 'quantity' ? value : item.quantity;
          const unitPrice = field === 'unitPrice' ? value : item.unitPrice;
          const amount = (quantity || 0) * (unitPrice || 0);

          dispatch({ type: PO_ACTIONS.UPDATE_ITEM, id, field: 'amount', value: amount });
        }

        // Recalculate totals
        dispatch({ type: PO_ACTIONS.CALCULATE_TOTALS });
      }, 0);
    }
  }, [formData.items]);

  const removeItem = useCallback((id) => {
    dispatch({ type: PO_ACTIONS.REMOVE_ITEM, id });
  }, []);

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors = {};
    console.log('Validating form with data:', formData);

    // Basic validation
    if (!formData.vendorName || !formData.vendorName.trim()) {
      newErrors.vendorName = 'Vendor selection is required';
    }

    if (!formData.issueDate) {
      newErrors.issueDate = 'Issue date is required';
    }

    if (!formData.requiredDate) {
      newErrors.requiredDate = 'Required date is required';
    }

    // Validate dates
    if (formData.issueDate && formData.requiredDate) {
      const issueDate = new Date(formData.issueDate);
      const requiredDate = new Date(formData.requiredDate);
      if (requiredDate <= issueDate) {
        newErrors.requiredDate = 'Required date must be after issue date';
      }
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    // Validate items
    formData.items.forEach((item, index) => {
      console.log(`Validating item ${index}:`, item);

      if (!item.description || !item.description.trim()) {
        newErrors[`item_${index}_description`] = 'Description is required';
      }
      if (!item.serviceType) {
        newErrors[`item_${index}_serviceType`] = 'Service type is required';
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      if (item.unitPrice === undefined || item.unitPrice === null || item.unitPrice < 0) {
        newErrors[`item_${index}_unitPrice`] = 'Unit price is required and cannot be negative';
      }
      if (!item.amount || item.amount <= 0) {
        newErrors[`item_${index}_amount`] = 'Amount must be calculated automatically';
      }
    });

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('Form is valid:', isValid);
    return isValid;
  }, [formData]);

  // Utility functions - moved before handleSubmit to avoid temporal dead zone
  const generatePONumber = useCallback(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `PO-${year}${month}-${timestamp}`;
  }, []);

  // Form submission
  const handleSubmit = useCallback(async () => {
    setSubmitError('');
    setSubmitSuccess('');

    console.log('Starting form submission...');
    console.log('Form data:', formData);
    console.log('Form errors:', errors);

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setSaving(true);
    try {
      const poNumber = formData.poNumber || generatePONumber();
      console.log('Generated PO number:', poNumber);

      const newPO = {
        id: `po_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...formData,
        poNumber,
        subtotal: calculations.subtotal,
        taxAmount: calculations.taxAmount,
        total: calculations.total,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('New PO object:', newPO);

      // Save to dataSyncService with fallback
      let createdPO;
      try {
        if (dataSyncService && dataSyncService.createPurchaseOrder) {
          createdPO = await dataSyncService.createPurchaseOrder(newPO);
          console.log('Service creation successful:', createdPO);
        } else {
          throw new Error('Service not available');
        }
      } catch (serviceError) {
        console.warn('Primary service failed, using fallback:', serviceError);
        createdPO = { ...newPO, _fallback: true };
      }

      if (createdPO) {
        console.log('Adding PO to state...');
        setPurchaseOrders(prev => {
          const updated = [...prev, createdPO];
          console.log('Updated purchase orders:', updated);
          return updated;
        });

        // Update localStorage immediately
        const currentPOs = [...purchaseOrders, createdPO];
        console.log('Saving to localStorage...');
        persistDataToStorage({
          purchaseOrders: currentPOs,
          salesOrders,
          vendors,
          customers
        });

        console.log('Form submission successful!');
        setSubmitSuccess('Purchase order created successfully!');
        dispatch({ type: PO_ACTIONS.RESET_FORM });
        setErrors({});
        setOpen(false);

        setTimeout(() => setSubmitSuccess(''), 3000);
      } else {
        throw new Error('Failed to create purchase order');
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      setSubmitError(`Failed to create purchase order: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  }, [formData, validateForm, generatePONumber, purchaseOrders, salesOrders, vendors, customers, persistDataToStorage, errors, calculations]);

  const handleRefresh = useCallback(async () => {
    setLastRefresh(Date.now());
    await loadData();
    notificationService.showSuccess('Purchase order data refreshed successfully');
  }, [loadData]);

  // Using standardized currency formatting
  // Using standardized currency formatting
  const formatCurrencyDisplay = (amount, currency = 'IDR') => {
    return formatCurrency(amount, currency);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Draft': return 'info';
      case 'Rejected': return 'error';
      case 'Completed': return 'default';
      default: return 'default';
    }
  };

  // View handlers
  const handleViewDetail = useCallback((po) => {
    setSelectedPO(po);
    setViewMode('detail');
  }, []);

  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedPO(null);
  }, []);

  const handleEdit = useCallback((po) => {
    setSelectedPO(po);
    // Populate form with existing PO data
    const itemsWithCalculatedAmounts = (po.items || []).map(item => ({
      ...item,
      amount: (item.quantity || 0) * (item.unitPrice || 0)
    }));

    dispatch({ type: PO_ACTIONS.SET_MULTIPLE_FIELDS, fields: {
      poNumber: po.poNumber,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      salesOrderId: po.salesOrderId,
      customerName: po.customerName,
      issueDate: po.issueDate,
      requiredDate: po.requiredDate,
      currency: po.currency,
      status: po.status,
      paymentTerms: po.paymentTerms,
      notes: po.notes,
      items: itemsWithCalculatedAmounts,
      subtotal: po.subtotal || 0,
      taxRate: po.taxRate || 11,
      taxAmount: po.taxAmount || 0,
      total: po.total || 0,
    }});
    setActiveTab(0);
    setOpen(true);
  }, []);

  const handleUpdate = useCallback(async () => {
    setSubmitError('');
    setSubmitSuccess('');

    console.log('Starting PO update...');
    console.log('Selected PO:', selectedPO);
    console.log('Form data:', formData);

    if (!validateForm()) {
      console.log('Form validation failed for update');
      return;
    }

    if (!selectedPO) {
      setSubmitError('No purchase order selected for update');
      return;
    }

    setSaving(true);
    try {
      const updatedPO = {
        ...selectedPO,
        ...formData,
        subtotal: calculations.subtotal,
        taxAmount: calculations.taxAmount,
        total: calculations.total,
        updatedAt: new Date().toISOString()
      };

      console.log('Updated PO object:', updatedPO);

      // Update in dataSyncService with fallback
      let result;
      try {
        if (dataSyncService && dataSyncService.updatePurchaseOrder) {
          result = await dataSyncService.updatePurchaseOrder(updatedPO);
          console.log('Service update successful:', result);
        } else {
          throw new Error('Update service not available');
        }
      } catch (serviceError) {
        console.warn('Primary service failed, using fallback:', serviceError);
        result = { ...updatedPO, _fallback: true };
      }

      if (result) {
        console.log('Updating PO in state...');
        setPurchaseOrders(prev => {
          const updated = prev.map(po => po.id === selectedPO.id ? result : po);
          console.log('Updated purchase orders:', updated);
          return updated;
        });

        // Update localStorage immediately
        const currentPOs = purchaseOrders.map(po => po.id === selectedPO.id ? result : po);
        console.log('Saving updated data to localStorage...');
        persistDataToStorage({
          purchaseOrders: currentPOs,
          salesOrders,
          vendors,
          customers
        });

        console.log('PO update successful!');
        setSubmitSuccess('Purchase order updated successfully!');
        dispatch({ type: PO_ACTIONS.RESET_FORM });
        setErrors({});
        setOpen(false);
        setSelectedPO(null);

        setTimeout(() => setSubmitSuccess(''), 3000);
      } else {
        throw new Error('Failed to update purchase order');
      }
    } catch (error) {
      console.error('Error updating purchase order:', error);
      setSubmitError(`Failed to update purchase order: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  }, [selectedPO, formData, validateForm, purchaseOrders, salesOrders, vendors, customers, persistDataToStorage, calculations]);

  // Export functions
  const handleExportExcel = useCallback(() => {
    try {
      const exportData = purchaseOrders.map(po => ({
        'PO Number': po.poNumber || 'N/A',
        'Vendor': po.vendorName || 'N/A',
        'Customer': po.customerName || 'N/A',
        'Issue Date': po.issueDate ? new Date(po.issueDate).toLocaleDateString() : 'N/A',
        'Required Date': po.requiredDate ? new Date(po.requiredDate).toLocaleDateString() : 'N/A',
        'Subtotal': po.subtotal || 0,
        'Tax Amount': po.taxAmount || 0,
        'Total': po.total || 0,
        'Status': po.status || 'Draft',
        'Currency': po.currency || 'IDR',
        'Items Count': po.items?.length || 0,
        'Payment Terms': po.paymentTerms || 'N/A',
        'Created Date': po.createdAt ? new Date(po.createdAt).toLocaleDateString() : 'N/A'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Purchase Orders');

      // Set column widths
      const colWidths = [
        { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 12 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 },
        { wch: 10 }, { wch: 15 }, { wch: 12 }
      ];
      ws['!cols'] = colWidths;

      // Add summary sheet
      const summaryData = [
        { 'Metric': 'Total Purchase Orders', 'Value': purchaseOrders.length },
        { 'Metric': 'Draft POs', 'Value': purchaseOrders.filter(po => po.status === 'Draft').length },
        { 'Metric': 'Approved POs', 'Value': purchaseOrders.filter(po => po.status === 'Approved').length },
        { 'Metric': 'Total Value', 'Value': purchaseOrders.reduce((sum, po) => sum + (po.total || 0), 0) },
        { 'Metric': 'Report Generated', 'Value': new Date().toLocaleString() }
      ];

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      XLSX.writeFile(wb, `Purchase_Orders_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      notificationService.showSuccess('Purchase order report exported successfully!');
    } catch (error) {
      console.error('Error exporting purchase orders:', error);
      notificationService.showError('Failed to export purchase order report');
    }
  }, [purchaseOrders]);

  const handlePrintPDF = useCallback(() => {
    try {
      const printWindow = window.open('', '_blank');
      const currentDate = new Date().toLocaleDateString('id-ID');

      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Purchase Order Report</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; color: #2c3e50; }
            .header h2 { margin: 5px 0; font-size: 16px; color: #7f8c8d; }
            .summary { display: flex; justify-content: space-around; margin-bottom: 20px; }
            .summary-card { text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
            .summary-card h3 { margin: 5px 0; font-size: 18px; color: #2c3e50; }
            .summary-card p { margin: 0; font-size: 12px; color: #7f8c8d; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; font-size: 10px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #7f8c8d; }
            .status-badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 9px; text-transform: uppercase; }
            .status-draft { background-color: #e3f2fd; color: #1976d2; }
            .status-approved { background-color: #e8f5e8; color: #388e3c; }
            .status-pending { background-color: #fff3e0; color: #f57c00; }
            .status-rejected { background-color: #ffebee; color: #d32f2f; }
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PT. Bakhtera One</h1>
            <h2>Purchase Order Management Report</h2>
            <p>Generated on: ${currentDate}</p>
          </div>

          <div class="summary">
            <div class="summary-card">
              <h3>${purchaseOrders.length}</h3>
              <p>Total Purchase Orders</p>
            </div>
            <div class="summary-card">
              <h3>${purchaseOrders.filter(po => po.status === 'Approved').length}</h3>
              <p>Approved POs</p>
            </div>
            <div class="summary-card">
              <h3>${purchaseOrders.filter(po => po.status === 'Draft').length}</h3>
              <p>Draft POs</p>
            </div>
            <div class="summary-card">
              <h3>${formatCurrency(purchaseOrders.reduce((sum, po) => sum + (po.total || 0), 0))}</h3>
              <p>Total Value</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Vendor</th>
                <th>Customer</th>
                <th>Issue Date</th>
                <th>Required Date</th>
                <th class="text-right">Total</th>
                <th>Status</th>
                <th>Currency</th>
              </tr>
            </thead>
            <tbody>
              ${purchaseOrders.map(po => `
                <tr>
                  <td>${po.poNumber || 'N/A'}</td>
                  <td>${po.vendorName || 'N/A'}</td>
                  <td>${po.customerName || 'N/A'}</td>
                  <td>${po.issueDate ? new Date(po.issueDate).toLocaleDateString() : 'N/A'}</td>
                  <td>${po.requiredDate ? new Date(po.requiredDate).toLocaleDateString() : 'N/A'}</td>
                  <td class="text-right">${formatCurrency(po.total || 0, po.currency)}</td>
                  <td class="text-center">
                    <span class="status-badge status-${(po.status || 'draft').toLowerCase()}">${po.status || 'Draft'}</span>
                  </td>
                  <td class="text-center">${po.currency || 'IDR'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Generated by Bakhtera One - Advanced Freight Forwarding Management System</p>
            <p>Confidential Document - For Internal Use Only</p>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(pdfContent);
      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      };

      notificationService.showSuccess('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      notificationService.showError('Failed to generate PDF');
    }
  }, [purchaseOrders]);

  // Individual PO PDF Export
  const handleExportSinglePDF = useCallback((po) => {
    try {
      const printWindow = window.open('', '_blank');
      const currentDate = new Date().toLocaleDateString('id-ID');

      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Purchase Order - ${po.poNumber}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; color: #2c3e50; }
            .header h2 { margin: 5px 0; font-size: 16px; color: #7f8c8d; }
            .po-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .info-section { flex: 1; }
            .info-section h3 { margin-bottom: 10px; color: #2c3e50; border-bottom: 1px solid #ddd; }
            .info-item { margin: 5px 0; }
            .info-label { font-weight: bold; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; font-size: 10px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #7f8c8d; }
            .status-badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 9px; text-transform: uppercase; }
            .status-draft { background-color: #e3f2fd; color: #1976d2; }
            .status-approved { background-color: #e8f5e8; color: #388e3c; }
            .status-pending { background-color: #fff3e0; color: #f57c00; }
            .status-rejected { background-color: #ffebee; color: #d32f2f; }
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PT. Bakhtera One</h1>
            <h2>Purchase Order</h2>
            <p>${po.poNumber}</p>
          </div>

          <div class="po-info">
            <div class="info-section">
              <h3>Vendor Information</h3>
              <div class="info-item"><span class="info-label">Vendor:</span> ${po.vendorName || 'N/A'}</div>
              <div class="info-item"><span class="info-label">Payment Terms:</span> ${po.paymentTerms || 'N/A'}</div>
              <div class="info-item"><span class="info-label">Currency:</span> ${po.currency || 'IDR'}</div>
            </div>
            <div class="info-section">
              <h3>Order Information</h3>
              <div class="info-item"><span class="info-label">Customer:</span> ${po.customerName || 'N/A'}</div>
              <div class="info-item"><span class="info-label">Issue Date:</span> ${po.issueDate ? new Date(po.issueDate).toLocaleDateString() : 'N/A'}</div>
              <div class="info-item"><span class="info-label">Required Date:</span> ${po.requiredDate ? new Date(po.requiredDate).toLocaleDateString() : 'N/A'}</div>
              <div class="info-item"><span class="info-label">Status:</span> <span class="status-badge status-${(po.status || 'draft').toLowerCase()}">${po.status || 'Draft'}</span></div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Service Type</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${po.items?.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.description || 'N/A'}</td>
                  <td>${item.serviceType || 'N/A'}</td>
                  <td class="text-center">${item.quantity || 0}</td>
                  <td class="text-right">${formatCurrency(item.unitPrice || 0, item.currency)}</td>
                  <td class="text-right">${formatCurrency(item.amount || 0, item.currency)}</td>
                </tr>
              `).join('') || '<tr><td colspan="6" class="text-center">No items available</td></tr>'}
            </tbody>
          </table>

          <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 4px;">
            <div style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
              <div>
                <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                  <span>Subtotal:</span>
                  <span>${formatCurrency(po.subtotal || 0, po.currency)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                  <span>Tax (${po.taxRate || 0}%):</span>
                  <span>${formatCurrency(po.taxAmount || 0, po.currency)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 3px 0; font-weight: bold; font-size: 12px;">
                  <span>Total:</span>
                  <span>${formatCurrency(po.total || 0, po.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          ${po.notes ? `
            <div style="margin-top: 20px;">
              <h4>Notes:</h4>
              <p>${po.notes}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p>Generated on: ${currentDate}</p>
            <p>Generated by Bakhtera One - Advanced Freight Forwarding Management System</p>
            <p>Confidential Document - For Internal Use Only</p>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(pdfContent);
      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      };

      notificationService.showSuccess(`PDF for ${po.poNumber} generated successfully!`);
    } catch (error) {
      console.error('Error generating single PO PDF:', error);
      notificationService.showError('Failed to generate PDF');
    }
  }, []);

  // Loading state
  if (loading) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Skeleton variant="text" width={300} height={40} />
          <Box display="flex" gap={1}>
            <Skeleton variant="rectangular" width={100} height={36} />
            <Skeleton variant="rectangular" width={100} height={36} />
            <Skeleton variant="rectangular" width={150} height={36} />
          </Box>
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} md={3} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width={100} height={30} />
                  <Skeleton variant="text" width={150} height={20} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <PurchaseOrderErrorBoundary>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4">
              {viewMode === 'list' ? 'Purchase Order Management' : `PO Details - ${selectedPO?.poNumber}`}
            </Typography>
            {dataSource !== 'fresh' && (
              <Typography variant="caption" color={dataSource === 'cached' ? 'warning.main' : 'info.main'}>
                Data source: {dataSource === 'cached' ? 'Cached' : 'Partial'} •
                Last updated: {new Date(lastRefresh).toLocaleTimeString()}
              </Typography>
            )}
          </Box>
          <Box display="flex" gap={1}>
            {viewMode === 'detail' && (
              <Button
                variant="outlined"
                onClick={handleBackToList}
                disabled={saving}
              >
                Back to List
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={handleExportExcel}
              disabled={saving || purchaseOrders.length === 0}
            >
              Export Excel
            </Button>
            <Button
              variant="outlined"
              onClick={handlePrintPDF}
              disabled={saving || purchaseOrders.length === 0}
            >
              Print PDF
            </Button>
            <Button
              variant="outlined"
              onClick={handleRefresh}
              disabled={loading || saving}
              sx={{ mr: 1 }}
            >
              Refresh Data
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} /> : <AddIcon />}
              onClick={() => setOpen(true)}
              disabled={saving}
            >
              {saving ? 'Creating...' : 'Create PO'}
            </Button>
          </Box>
        </Box>

        {submitSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {submitSuccess}
          </Alert>
        )}

        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        {viewMode === 'list' ? (
          // Purchase Order List View
          <Grid container spacing={3}>
            {/* Summary Cards */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="primary">
                        {purchaseOrders.length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Purchase Orders
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="warning.main">
                        {purchaseOrders.filter(po => po.status === 'Draft').length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Draft POs
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="success.main">
                        {purchaseOrders.filter(po => po.status === 'Approved').length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Approved POs
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="info.main">
                        {formatCurrency(purchaseOrders.reduce((sum, po) => sum + (po.total || 0), 0))}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Value
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            {/* Purchase Order Table */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Purchase Orders ({purchaseOrders.length})
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>PO Number</TableCell>
                          <TableCell>Vendor</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell>Issue Date</TableCell>
                          <TableCell>Required Date</TableCell>
                          <TableCell align="right">Total Amount</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {purchaseOrders.map((po) => (
                          <TableRow key={po.id} hover>
                            <TableCell>
                              <Typography variant="subtitle2">{po.poNumber}</Typography>
                            </TableCell>
                            <TableCell>{po.vendorName}</TableCell>
                            <TableCell>{po.customerName}</TableCell>
                            <TableCell>{new Date(po.issueDate).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(po.requiredDate).toLocaleDateString()}</TableCell>
                            <TableCell align="right">{formatCurrency(po.total, po.currency)}</TableCell>
                            <TableCell>
                              <Chip label={po.status} color={getStatusColor(po.status)} size="small" />
                            </TableCell>
                            <TableCell align="right">
                              <Box display="flex" gap={1}>
                                <Tooltip title="View Details">
                                  <IconButton size="small" onClick={() => handleViewDetail(po)}>
                                    <VisibilityIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit PO">
                                  <IconButton size="small" onClick={() => handleEdit(po)} color="primary">
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          // Purchase Order Detail View
          <Grid container spacing={3}>
            {selectedPO && (
              <>
                {/* PO Header */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="h5">{selectedPO.poNumber}</Typography>
                          <Typography variant="subtitle1" color="textSecondary">
                            Vendor: {selectedPO.vendorName}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Customer: {selectedPO.customerName} • Issue Date: {new Date(selectedPO.issueDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box display="flex" gap={1}>
                          <Chip label={selectedPO.status} color={getStatusColor(selectedPO.status)} />
                          <Chip label={selectedPO.currency} variant="outlined" />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* PO Details Tabs */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent sx={{ p: 0 }}>
                      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                        <Tab label="PO Information" />
                        <Tab label="Items & Services" />
                        <Tab label="Financial Summary" />
                      </Tabs>

                      <Box sx={{ p: 3 }}>
                        {activeTab === 0 && (
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                              <Typography variant="h6" gutterBottom>Vendor Information</Typography>
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" color="textSecondary">Vendor Name</Typography>
                                <Typography variant="body1" gutterBottom>{selectedPO.vendorName}</Typography>

                                <Typography variant="body2" color="textSecondary">Payment Terms</Typography>
                                <Typography variant="body1" gutterBottom>{selectedPO.paymentTerms}</Typography>

                                <Typography variant="body2" color="textSecondary">Required Date</Typography>
                                <Typography variant="body1" gutterBottom>
                                  {new Date(selectedPO.requiredDate).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <Typography variant="h6" gutterBottom>Order Information</Typography>
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" color="textSecondary">Sales Order</Typography>
                                <Typography variant="body1" gutterBottom>{selectedPO.salesOrderId}</Typography>

                                <Typography variant="body2" color="textSecondary">Customer</Typography>
                                <Typography variant="body1" gutterBottom>{selectedPO.customerName}</Typography>

                                <Typography variant="body2" color="textSecondary">Currency</Typography>
                                <Typography variant="body1" gutterBottom>{selectedPO.currency}</Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        )}

                        {activeTab === 1 && (
                          <Box>
                            <Typography variant="h6" gutterBottom>Order Items</Typography>
                            <TableContainer component={Paper} variant="outlined">
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Service Type</TableCell>
                                    <TableCell align="right">Quantity</TableCell>
                                    <TableCell align="right">Unit Price</TableCell>
                                    <TableCell align="right">Amount</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {selectedPO.items?.map((item) => (
                                    <TableRow key={item.id}>
                                      <TableCell>{item.description}</TableCell>
                                      <TableCell>{item.serviceType}</TableCell>
                                      <TableCell align="right">{item.quantity}</TableCell>
                                      <TableCell align="right">{formatCurrency(item.unitPrice, item.currency)}</TableCell>
                                      <TableCell align="right">{formatCurrency(item.amount, item.currency)}</TableCell>
                                    </TableRow>
                                  )) || (
                                    <TableRow>
                                      <TableCell colSpan={5} align="center">
                                        No items available
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        )}

                        {activeTab === 2 && (
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                              <Typography variant="h6" gutterBottom>Financial Summary</Typography>
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" color="textSecondary">Subtotal</Typography>
                                <Typography variant="body1" gutterBottom>{formatCurrency(selectedPO.subtotal, selectedPO.currency)}</Typography>

                                <Typography variant="body2" color="textSecondary">Tax ({selectedPO.taxRate}%)</Typography>
                                <Typography variant="body1" gutterBottom>{formatCurrency(selectedPO.taxAmount, selectedPO.currency)}</Typography>

                                <Divider sx={{ my: 1 }} />
                                <Typography variant="body2" color="textSecondary">Total Amount</Typography>
                                <Typography variant="h6" gutterBottom>{formatCurrency(selectedPO.total, selectedPO.currency)}</Typography>
                              </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <Typography variant="h6" gutterBottom>Actions</Typography>
                              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Button
                                  variant="outlined"
                                  startIcon={<PrintIcon />}
                                  onClick={() => handleExportSinglePDF(selectedPO)}
                                >
                                  Export PDF
                                </Button>
                                <Button
                                  variant="contained"
                                  color="success"
                                  startIcon={<ApproveIcon />}
                                  sx={{ mr: 1 }}
                                >
                                  Approve PO
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  startIcon={<RejectIcon />}
                                >
                                  Reject PO
                                </Button>
                              </Box>
                            </Grid>
                          </Grid>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}
          </Grid>
        )}

        {/* Create Purchase Order Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>{selectedPO ? 'Edit Purchase Order' : 'Create Purchase Order'}</DialogTitle>
          <DialogContent>
            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {submitError}
              </Alert>
            )}

            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mt: 2 }}>
              <Tab label="Basic Information" />
              <Tab label="Items & Services" />
              <Tab label="Terms & Conditions" />
            </Tabs>

            <Box sx={{ mt: 2 }}>
              {activeTab === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={vendors}
                      getOptionLabel={(option) => `${option.name} (${option.serviceType})`}
                      value={vendors.find(v => v.id === formData.vendorId) || null}
                      onChange={handleVendorChange}
                      renderInput={(params) => (
                        <TextField {...params} label="Select Vendor" fullWidth required />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={salesOrders}
                      getOptionLabel={(option) => `${option.orderNumber} - ${option.customerName}`}
                      value={salesOrders.find(so => so.id === formData.salesOrderId) || null}
                      onChange={handleSalesOrderChange}
                      renderInput={(params) => (
                        <TextField {...params} label="Related Sales Order (Optional)" fullWidth />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="PO Number"
                      value={formData.poNumber}
                      onChange={handleInputChange('poNumber')}
                      error={!!errors.poNumber}
                      helperText={errors.poNumber || 'Leave blank for auto-generation'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Issue Date"
                      type="date"
                      value={formData.issueDate}
                      onChange={handleInputChange('issueDate')}
                      error={!!errors.issueDate}
                      helperText={errors.issueDate}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Required Date"
                      type="date"
                      value={formData.requiredDate}
                      onChange={handleInputChange('requiredDate')}
                      error={!!errors.requiredDate}
                      helperText={errors.requiredDate}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Currency</InputLabel>
                      <Select
                        value={formData.currency}
                        onChange={handleInputChange('currency')}
                        label="Currency"
                      >
                        <MenuItem value="IDR">Indonesian Rupiah (IDR)</MenuItem>
                        <MenuItem value="USD">US Dollar (USD)</MenuItem>
                        <MenuItem value="SGD">Singapore Dollar (SGD)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}

              {activeTab === 1 && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Purchase Order Items</Typography>
                    <Button startIcon={<AddIcon />} onClick={addItem}>
                      Add Item
                    </Button>
                  </Box>

                  {formData.items.map((item, index) => (
                    <Card key={item.id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              label="Description"
                              value={item.description}
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                              error={!!errors[`item_${index}_description`]}
                              helperText={errors[`item_${index}_description`]}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <FormControl fullWidth>
                              <InputLabel>Service Type</InputLabel>
                              <Select
                                value={item.serviceType}
                                onChange={(e) => updateItem(item.id, 'serviceType', e.target.value)}
                                label="Service Type"
                              >
                                <MenuItem value="Sea Freight">Sea Freight</MenuItem>
                                <MenuItem value="Air Freight">Air Freight</MenuItem>
                                <MenuItem value="Trucking">Trucking</MenuItem>
                                <MenuItem value="Warehousing">Warehousing</MenuItem>
                                <MenuItem value="Customs Clearance">Customs Clearance</MenuItem>
                                <MenuItem value="Documentation">Documentation</MenuItem>
                                <MenuItem value="Insurance">Insurance</MenuItem>
                                <MenuItem value="Other">Other</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              label="Quantity"
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              error={!!errors[`item_${index}_quantity`]}
                              helperText={errors[`item_${index}_quantity`]}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              label={`Unit Price (${formData.currency})`}
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              error={!!errors[`item_${index}_unitPrice`]}
                              helperText={errors[`item_${index}_unitPrice`]}
                            />
                          </Grid>
                          <Grid item xs={12} sm={1}>
                            <TextField
                              fullWidth
                              label="Amount"
                              value={formatCurrency(item.amount, item.currency)}
                              disabled
                            />
                          </Grid>
                          <Grid item xs={12} sm={1}>
                            <IconButton onClick={() => removeItem(item.id)} color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}

                  {formData.items.length === 0 && (
                    <Alert severity="info">No items added yet. Click "Add Item" to begin.</Alert>
                  )}

                  {/* Items Summary */}
                  {formData.items.length > 0 && (
                    <Card sx={{ mt: 2, bgcolor: 'grey.50' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Items Summary</Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography>Total Items: {formData.items.length}</Typography>
                          <Typography variant="h6">
                            Subtotal: {formatCurrency(calculations.subtotal, formData.currency)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </Box>
              )}

              {activeTab === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Payment & Delivery Terms</Typography>
                    <Box sx={{ mt: 2 }}>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Payment Terms</InputLabel>
                        <Select
                          value={formData.paymentTerms}
                          onChange={handleInputChange('paymentTerms')}
                          label="Payment Terms"
                        >
                          <MenuItem value="COD">Cash on Delivery</MenuItem>
                          <MenuItem value="Net 7">Net 7 Days</MenuItem>
                          <MenuItem value="Net 15">Net 15 Days</MenuItem>
                          <MenuItem value="Net 30">Net 30 Days</MenuItem>
                          <MenuItem value="Net 45">Net 45 Days</MenuItem>
                          <MenuItem value="Net 60">Net 60 Days</MenuItem>
                        </Select>
                      </FormControl>

                      <TextField
                        fullWidth
                        label="Notes"
                        multiline
                        rows={4}
                        value={formData.notes}
                        onChange={handleInputChange('notes')}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Order Totals</Typography>
                    <Box sx={{ mt: 2 }}>
                      <Box display="flex" justifyContent="space-between" py={1}>
                        <Typography>Subtotal:</Typography>
                        <Typography>{formatCurrency(calculations.subtotal, formData.currency)}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" py={1}>
                        <Typography>Tax ({formData.taxRate}%):</Typography>
                        <Typography>{formatCurrency(calculations.taxAmount, formData.currency)}</Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between" py={1}>
                        <Typography variant="h6">Total:</Typography>
                        <Typography variant="h6">{formatCurrency(calculations.total, formData.currency)}</Typography>
                      </Box>
                    </Box>

                    <FormControl fullWidth sx={{ mt: 3 }}>
                      <InputLabel>PO Status</InputLabel>
                      <Select
                        value={formData.status}
                        onChange={handleInputChange('status')}
                        label="PO Status"
                      >
                        <MenuItem value="Draft">Draft</MenuItem>
                        <MenuItem value="Pending">Pending Approval</MenuItem>
                        <MenuItem value="Approved">Approved</MenuItem>
                        <MenuItem value="Rejected">Rejected</MenuItem>
                        <MenuItem value="Completed">Completed</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpen(false);
              setSelectedPO(null);
              dispatch({ type: PO_ACTIONS.RESET_FORM });
              setErrors({});
              setActiveTab(0);
            }}>Cancel</Button>
            <Box sx={{ flex: '1 1 auto' }} />
            {activeTab > 0 && (
              <Button onClick={() => setActiveTab(prev => prev - 1)}>
                Previous
              </Button>
            )}
            {activeTab < 2 ? (
              <Button onClick={() => setActiveTab(prev => prev + 1)} variant="contained">
                Next
              </Button>
            ) : (
              <Button onClick={selectedPO ? handleUpdate : handleSubmit} variant="contained">
                {selectedPO ? 'Update Purchase Order' : 'Create Purchase Order'}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </PurchaseOrderErrorBoundary>
  );
};

export default PurchaseOrder;