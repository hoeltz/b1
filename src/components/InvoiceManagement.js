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
  GetApp as ExportIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  Payment as PaymentIcon,
  Email as EmailIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import dataSyncService from '../services/dataSync';
import notificationService from '../services/notificationService';
import * as XLSX from 'xlsx';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '../services/currencyUtils';

// Initial state for form data
const initialFormState = {
  invoiceNumber: '',
  customerId: '',
  customerName: '',
  customerEmail: '',
  customerAddress: '',
  billingAddress: '',
  salesOrderId: '',
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  paymentTerms: 'Net 30',
  currency: 'IDR',
  status: 'Draft',
  notes: '',
  paymentStatus: 'Unpaid',
  lineItems: [],
  subtotal: 0,
  taxRate: 11,
  taxAmount: 0,
  total: 0,
  paidAmount: 0,
  paidDate: '',
  // Indonesian business specific fields
  redlineStatus: 'normal',
  beacukaiCode: '',
  customsCost: 0,
  urgencyMultiplier: 1.0,
};

// Action types for reducer
const FORM_ACTIONS = {
  SET_FIELD: 'SET_FIELD',
  SET_MULTIPLE_FIELDS: 'SET_MULTIPLE_FIELDS',
  ADD_LINE_ITEM: 'ADD_LINE_ITEM',
  UPDATE_LINE_ITEM: 'UPDATE_LINE_ITEM',
  REMOVE_LINE_ITEM: 'REMOVE_LINE_ITEM',
  SET_LINE_ITEMS: 'SET_LINE_ITEMS',
  CALCULATE_TOTALS: 'CALCULATE_TOTALS',
  RESET_FORM: 'RESET_FORM',
  SET_ERRORS: 'SET_ERRORS',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Form reducer for better state management
const formReducer = (state, action) => {
  switch (action.type) {
    case FORM_ACTIONS.SET_FIELD:
      return { ...state, [action.field]: action.value };

    case FORM_ACTIONS.SET_MULTIPLE_FIELDS:
      return { ...state, ...action.fields };

    case FORM_ACTIONS.ADD_LINE_ITEM:
      return {
        ...state,
        lineItems: [...state.lineItems, action.item]
      };

    case FORM_ACTIONS.UPDATE_LINE_ITEM:
      return {
        ...state,
        lineItems: state.lineItems.map(item =>
          item.id === action.id ? { ...item, [action.field]: action.value } : item
        )
      };

    case FORM_ACTIONS.REMOVE_LINE_ITEM:
      return {
        ...state,
        lineItems: state.lineItems.filter(item => item.id !== action.id)
      };

    case FORM_ACTIONS.SET_LINE_ITEMS:
      return { ...state, lineItems: action.items };

    case FORM_ACTIONS.CALCULATE_TOTALS: {
      const subtotal = state.lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      const customsCost = state.beacukaiCode ?
        (beacukaiCodes.find(code => code.code === state.beacukaiCode)?.baseCost || 0) : 0;
      const urgencyCost = subtotal * (state.urgencyMultiplier - 1);
      const adjustedSubtotal = subtotal + customsCost + urgencyCost;
      const taxAmount = adjustedSubtotal * (state.taxRate / 100);
      const total = adjustedSubtotal + taxAmount;
      return {
        ...state,
        subtotal: adjustedSubtotal,
        customsCost,
        taxAmount,
        total
      };
    }

    case FORM_ACTIONS.RESET_FORM:
      return initialFormState;

    case FORM_ACTIONS.SET_ERRORS:
      return { ...state, errors: { ...state.errors, ...action.errors } };

    case FORM_ACTIONS.CLEAR_ERROR:
      const newErrors = { ...state.errors };
      delete newErrors[action.field];
      return { ...state, errors: newErrors };

    default:
      return state;
  }
};

// Error Boundary Component
class InvoiceErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Invoice Management Error:', error, errorInfo);
    notificationService.showError('An unexpected error occurred in Invoice Management');
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Something went wrong with Invoice Management
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

const InvoiceManagement = () => {
  // Simplified state management
  const [invoices, setInvoices] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Form state with reducer
  const [formData, dispatch] = useReducer(formReducer, initialFormState);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Enhanced state for Indonesian freight forwarding
  const [salesOrderData, setSalesOrderData] = useState(null);
  const [currencyFormat, setCurrencyFormat] = useState('IDR');
  const [dataSource, setDataSource] = useState('fresh'); // 'fresh', 'cached', 'sample'
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Indonesian business specific data
  const redlineStatusOptions = [
    { value: 'normal', label: 'Normal', costMultiplier: 1.0 },
    { value: 'urgent', label: 'Urgent', costMultiplier: 1.5 },
    { value: 'express', label: 'Express', costMultiplier: 2.0 },
    { value: 'critical', label: 'Critical', costMultiplier: 3.0 }
  ];

  const beacukaiCodes = [
    { code: '040', description: 'PIB - Impor Biasa', category: 'import', baseCost: 2500000 },
    { code: '041', description: 'PIB - Impor Khusus', category: 'import', baseCost: 3500000 },
    { code: '261', description: 'PEB - Ekspor Biasa', category: 'export', baseCost: 1500000 },
    { code: '040.01', description: 'PIB dengan ATGA', category: 'import', baseCost: 5000000 },
    { code: 'BC.23', description: 'Dokumen Pendukung', category: 'document', baseCost: 500000 },
    { code: 'BC.27', description: 'Jaminan Bank', category: 'guarantee', baseCost: 1000000 }
  ];

  // Memoized calculations
  const calculations = useMemo(() => {
    const subtotal = formData.lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxAmount = subtotal * (formData.taxRate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  }, [formData.lineItems, formData.taxRate]);

  // Enhanced data loading with real-time sync
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Always try to load fresh data from dataSyncService first
      const [invoicesData, salesOrdersData, customersData] = await Promise.allSettled([
        dataSyncService.getInvoices?.() || Promise.resolve([]),
        dataSyncService.getSalesOrders?.() || Promise.resolve([]),
        dataSyncService.getCustomers?.() || Promise.resolve([])
      ]);

      // Set primary data - prioritize fresh data over cached data
      const invoices = invoicesData.status === 'fulfilled' ? invoicesData.value : [];
      const salesOrders = salesOrdersData.status === 'fulfilled' ? salesOrdersData.value : [];
      const customers = customersData.status === 'fulfilled' ? customersData.value : [];

      // Track data source for UI feedback
      let source = 'fresh';
      if (invoicesData.status === 'rejected' || salesOrdersData.status === 'rejected' || customersData.status === 'rejected') {
        source = 'partial';
      }

      setInvoices(invoices);
      setSalesOrders(salesOrders);
      setCustomers(customers);
      setDataSource(source);

      // Only use cached data if service completely fails AND no cached data exists
      if ((invoices.length === 0 && salesOrders.length === 0 && customers.length === 0)) {
        console.log('No fresh data available, loading from cache...');
        loadDataFromStorage();
        setDataSource('cached');
      } else {
        // Store fresh data in localStorage for persistence
        persistDataToStorage({ invoices, salesOrders, customers });
      }

      // Show warnings only for actual failures
      const failedServices = [];
      if (invoicesData.status === 'rejected') failedServices.push('Invoices');
      if (salesOrdersData.status === 'rejected') failedServices.push('Sales Orders');
      if (customersData.status === 'rejected') failedServices.push('Customers');

      if (failedServices.length > 0) {
        notificationService.showWarning(`${failedServices.join(', ')} services unavailable. Using available data.`);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to localStorage data
      loadDataFromStorage();
      notificationService.showError('Failed to load fresh data. Using cached data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced data persistence to localStorage with Indonesian business data
  const persistDataToStorage = useCallback((data) => {
    try {
      if (data.invoices.length > 0) {
        localStorage.setItem('invoice_management_invoices', JSON.stringify(data.invoices));
      }
      if (data.salesOrders.length > 0) {
        localStorage.setItem('invoice_management_sales_orders', JSON.stringify(data.salesOrders));
      }
      if (data.customers.length > 0) {
        localStorage.setItem('invoice_management_customers', JSON.stringify(data.customers));
      }

      // Persist Indonesian business configuration
      const businessConfig = {
        redlineStatusOptions,
        beacukaiCodes,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('invoice_management_business_config', JSON.stringify(businessConfig));

    } catch (error) {
      console.warn('Failed to persist data to localStorage:', error);
    }
  }, []);

  // Load data from localStorage fallback
  const loadDataFromStorage = useCallback(() => {
    try {
      const invoicesData = localStorage.getItem('invoice_management_invoices');
      const salesOrdersData = localStorage.getItem('invoice_management_sales_orders');
      const customersData = localStorage.getItem('invoice_management_customers');

      if (invoicesData) setInvoices(JSON.parse(invoicesData));
      if (salesOrdersData) setSalesOrders(JSON.parse(salesOrdersData));
      if (customersData) setCustomers(JSON.parse(customersData));
    } catch (error) {
      console.warn('Failed to load data from localStorage:', error);
    }
  }, []);

  // Load sample data for development/demo
  const loadSampleData = useCallback(() => {
    const sampleInvoices = [
      {
        id: 'sample_inv_1',
        invoiceNumber: 'INV-202410-001',
        customerName: 'PT. Contoh Customer',
        customerEmail: 'contact@contoh.com',
        issueDate: '2024-10-15',
        dueDate: '2024-11-14',
        subtotal: 10000000,
        taxAmount: 1100000,
        total: 11100000,
        status: 'Sent',
        paymentStatus: 'Unpaid',
        currency: 'IDR',
        lineItems: [
          {
            id: 'item_1',
            description: 'Sea Freight Jakarta - Singapore',
            serviceType: 'Sea Freight',
            quantity: 1,
            unitPrice: 10000000,
            amount: 10000000
          }
        ]
      }
    ];

    const sampleSalesOrders = [
      {
        id: 'sample_so_1',
        orderNumber: 'SO-202410-001',
        customerName: 'PT. Contoh Customer',
        customerId: 'cust_1',
        serviceType: 'Sea Freight',
        origin: 'Jakarta',
        destination: 'Singapore',
        sellingPrice: 10000000,
        status: 'Confirmed'
      }
    ];

    const sampleCustomers = [
      {
        id: 'cust_1',
        name: 'PT. Contoh Customer',
        email: 'contact@contoh.com',
        phone: '021-12345678',
        address: 'Jl. Contoh No. 123, Jakarta'
      }
    ];

    setInvoices(sampleInvoices);
    setSalesOrders(sampleSalesOrders);
    setCustomers(sampleCustomers);

    // Persist sample data
    persistDataToStorage({
      invoices: sampleInvoices,
      salesOrders: sampleSalesOrders,
      customers: sampleCustomers
    });
  }, [persistDataToStorage]);

  // Manual refresh function for real-time sync - defined first
  const handleRefresh = useCallback(async () => {
    setLastRefresh(Date.now());
    await loadData();
    notificationService.showSuccess('Data refreshed successfully');
  }, [loadData]);

  // Load data on mount and add refresh capability
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh mechanism for cross-component data sync
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key?.includes('invoice_management') || e.key?.includes('sales_order')) {
        console.log('Detected external data change, refreshing...');
        handleRefresh();
      }
    };

    const handleFocus = () => {
      // Refresh data when window regains focus (user switched tabs)
      const timeSinceLastRefresh = Date.now() - lastRefresh;
      if (timeSinceLastRefresh > 30000) { // Refresh if > 30 seconds
        handleRefresh();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [lastRefresh, handleRefresh]);

  // Optimized handlers with useCallback
  const populateFromSalesOrder = useCallback((salesOrder) => {
    if (!salesOrder) return;

    const dueDate = calculateDueDate(formData.issueDate, formData.paymentTerms);
    const lineItems = generateLineItemsFromSalesOrder(salesOrder);

    dispatch({
      type: FORM_ACTIONS.SET_MULTIPLE_FIELDS,
      fields: {
        customerId: salesOrder.customerId,
        customerName: salesOrder.customerName,
        salesOrderId: salesOrder.id,
        dueDate,
        lineItems,
        subtotal: salesOrder.sellingPrice || 0,
        total: (salesOrder.sellingPrice || 0) * (1 + formData.taxRate / 100)
      }
    });
  }, [formData.issueDate, formData.paymentTerms, formData.taxRate]);

  const generateLineItemsFromSalesOrder = useCallback((salesOrder) => {
    const lineItems = [];

    if (salesOrder.sellingPrice) {
      lineItems.push({
        id: `base_freight_${Date.now()}`,
        description: `Base Freight Charge - ${salesOrder.serviceType}`,
        serviceType: salesOrder.serviceType,
        route: `${salesOrder.origin} → ${salesOrder.destination}`,
        quantity: 1,
        unitPrice: salesOrder.sellingPrice,
        amount: salesOrder.sellingPrice,
        type: 'service'
      });
    }

    if (salesOrder.operationalCosts?.length > 0) {
      salesOrder.operationalCosts.forEach((cost, index) => {
        lineItems.push({
          id: `op_cost_${index}_${Date.now()}`,
          description: `${cost.name} - ${cost.description}`,
          serviceType: 'Operational Cost',
          route: '',
          quantity: 1,
          unitPrice: cost.amount,
          amount: cost.amount,
          type: 'cost'
        });
      });
    }

    return lineItems;
  }, []);

  const calculateDueDate = useCallback((issueDate, paymentTerms) => {
    if (!issueDate) return '';

    const date = new Date(issueDate);
    const terms = parseInt(paymentTerms.replace('Net ', ''));
    date.setDate(date.getDate() + terms);
    return date.toISOString().split('T')[0];
  }, []);

  // Optimized line items management with useCallback
  const addLineItem = useCallback(() => {
    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: '',
      serviceType: '',
      route: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      type: 'service'
    };

    dispatch({ type: FORM_ACTIONS.ADD_LINE_ITEM, item: newItem });
  }, []);

  const updateLineItem = useCallback((id, field, value) => {
    dispatch({ type: FORM_ACTIONS.UPDATE_LINE_ITEM, id, field, value });

    // Auto-calculate amount for quantity/unitPrice changes
    if (field === 'quantity' || field === 'unitPrice') {
      setTimeout(() => {
        dispatch({ type: FORM_ACTIONS.CALCULATE_TOTALS });
      }, 0);
    }
  }, []);

  const removeLineItem = useCallback((id) => {
    dispatch({ type: FORM_ACTIONS.REMOVE_LINE_ITEM, id });
  }, []);

  // Enhanced form handlers with Indonesian business logic
  const handleInputChange = useCallback((field) => (event) => {
    let value = event.target.value;

    // Special handling for Indonesian business fields
    if (field === 'redlineStatus') {
      const selectedOption = redlineStatusOptions.find(opt => opt.value === value);
      dispatch({ type: FORM_ACTIONS.SET_MULTIPLE_FIELDS, fields: {
        redlineStatus: value,
        urgencyMultiplier: selectedOption?.costMultiplier || 1.0
      }});
      // Recalculate totals with new multiplier
      setTimeout(() => dispatch({ type: FORM_ACTIONS.CALCULATE_TOTALS }), 0);
      return;
    }

    if (field === 'beacukaiCode') {
      const selectedCode = beacukaiCodes.find(code => code.code === value);
      dispatch({ type: FORM_ACTIONS.SET_MULTIPLE_FIELDS, fields: {
        beacukaiCode: value,
        customsCost: selectedCode?.baseCost || 0
      }});
      // Recalculate totals with customs cost
      setTimeout(() => dispatch({ type: FORM_ACTIONS.CALCULATE_TOTALS }), 0);
      return;
    }

    // Special handling for currency fields with real-time formatting
    if (field === 'amount' || field === 'unitPrice') {
      const numericValue = parseCurrencyInput(value, formData.currency);
      dispatch({ type: FORM_ACTIONS.SET_FIELD, field: 'rawValue', value: numericValue });

      // Update line item amount if both quantity and unit price exist
      if (formData.lineItems.length > 0) {
        dispatch({ type: FORM_ACTIONS.CALCULATE_TOTALS });
      }
      return;
    }

    dispatch({ type: FORM_ACTIONS.SET_FIELD, field, value });

    // Special handling for calculated fields
    if (field === 'paymentTerms' || field === 'issueDate') {
      const dueDate = calculateDueDate(
        field === 'issueDate' ? value : formData.issueDate,
        field === 'paymentTerms' ? value : formData.paymentTerms
      );
      if (dueDate) {
        dispatch({ type: FORM_ACTIONS.SET_FIELD, field: 'dueDate', value: dueDate });
      }
    }
  }, [formData.issueDate, formData.paymentTerms, formData.currency, formData.lineItems.length, calculateDueDate]);

  const handleCustomerChange = useCallback((event, newValue) => {
    const fields = {
      customerId: newValue?.id || '',
      customerName: newValue?.name || '',
      customerEmail: newValue?.email || '',
      customerAddress: newValue?.address || ''
    };
    dispatch({ type: FORM_ACTIONS.SET_MULTIPLE_FIELDS, fields });
  }, []);

  const handleSalesOrderChange = useCallback((event, newValue) => {
    if (newValue) {
      populateFromSalesOrder(newValue);
    }
  }, [populateFromSalesOrder]);

  // Enhanced form validation with Indonesian business rules
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.invoiceNumber.trim()) {
      newErrors.invoiceNumber = 'Invoice number is required';
    }

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!formData.issueDate) {
      newErrors.issueDate = 'Issue date is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else if (formData.issueDate && new Date(formData.dueDate) <= new Date(formData.issueDate)) {
      newErrors.dueDate = 'Due date must be after issue date';
    }

    if (formData.lineItems.length === 0) {
      newErrors.lineItems = 'At least one line item is required';
    }

    // Validate line items with enhanced rules
    formData.lineItems.forEach((item, index) => {
      if (!item.description?.trim()) {
        newErrors[`lineItem_${index}_description`] = 'Description is required';
      }
      if (!item.serviceType) {
        newErrors[`lineItem_${index}_serviceType`] = 'Service type is required';
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`lineItem_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      if (item.unitPrice < 0) {
        newErrors[`lineItem_${index}_unitPrice`] = 'Unit price cannot be negative';
      }
    });

    // Indonesian business specific validation
    if (formData.redlineStatus && !redlineStatusOptions.find(opt => opt.value === formData.redlineStatus)) {
      newErrors.redlineStatus = 'Invalid redline status selected';
    }

    if (formData.beacukaiCode && !beacukaiCodes.find(code => code.code === formData.beacukaiCode)) {
      newErrors.beacukaiCode = 'Invalid customs code selected';
    }

    // Currency validation for Indonesian business
    if (formData.currency && !['IDR', 'USD', 'SGD'].includes(formData.currency)) {
      newErrors.currency = 'Currency must be IDR, USD, or SGD';
    }

    // Update errors state
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Invoice number generator - defined before useSubmit
  const generateInvoiceNumber = useCallback(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `INV-${year}${month}-${timestamp}`;
  }, []);

  // Optimized submission with better error handling
  const handleSubmit = useCallback(async () => {
    setSubmitError('');
    setSubmitSuccess('');

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const invoiceNumber = formData.invoiceNumber || generateInvoiceNumber();

      const newInvoice = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...formData,
        invoiceNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Enhanced Indonesian business fields
        redlineStatus: formData.redlineStatus,
        beacukaiCode: formData.beacukaiCode,
        customsCost: formData.customsCost,
        urgencyMultiplier: formData.urgencyMultiplier,
        // Enhanced calculations
        baseSubtotal: formData.lineItems.reduce((sum, item) => sum + (item.amount || 0), 0),
        additionalCosts: formData.customsCost + (formData.lineItems.reduce((sum, item) => sum + (item.amount || 0), 0) * (formData.urgencyMultiplier - 1)),
      };

      // Robust data persistence with fallback
      let createdInvoice;
      try {
        createdInvoice = await dataSyncService.createInvoice?.(newInvoice);
      } catch (serviceError) {
        console.warn('Primary dataSyncService failed, using fallback:', serviceError);
        // Fallback: store in localStorage if service fails
        createdInvoice = {
          ...newInvoice,
          id: newInvoice.id,
          createdAt: newInvoice.createdAt,
          _fallback: true
        };
      }

      if (createdInvoice) {
        // Update local state immediately
        setInvoices(prev => [...prev, createdInvoice]);

        // Update localStorage immediately for persistence
        const currentInvoices = [...invoices, createdInvoice];
        const currentSalesOrders = [...salesOrders];
        const currentCustomers = [...customers];
        persistDataToStorage({
          invoices: currentInvoices,
          salesOrders: currentSalesOrders,
          customers: currentCustomers
        });

        setSubmitSuccess('Invoice created successfully!');
        dispatch({ type: FORM_ACTIONS.RESET_FORM });
        setErrors({});
        setOpen(false);

        setTimeout(() => setSubmitSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      setSubmitError(`Failed to create invoice: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  }, [formData, validateForm, generateInvoiceNumber]);

  const resetForm = useCallback(() => {
    dispatch({ type: FORM_ACTIONS.RESET_FORM });
    setErrors({});
    setSalesOrderData(null);
  }, []);


  // Optimized view handlers
  const handleViewDetail = useCallback((invoice) => {
    setSelectedInvoice(invoice);
    setViewMode('detail');
  }, []);

  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedInvoice(null);
  }, []);

  // Optimized export functions with error handling
  const handleExportExcel = useCallback(() => {
    try {
      const exportData = invoices.map(invoice => ({
        'Invoice Number': invoice.invoiceNumber,
        'Customer': invoice.customerName,
        'Issue Date': invoice.issueDate,
        'Due Date': invoice.dueDate,
        'Subtotal': invoice.subtotal || 0,
        'Tax Amount': invoice.taxAmount || 0,
        'Total': invoice.total || 0,
        'Status': invoice.status,
        'Payment Status': invoice.paymentStatus,
        'Paid Amount': invoice.paidAmount || 0,
        'Outstanding': (invoice.total || 0) - (invoice.paidAmount || 0)
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Invoices');

      const colWidths = [
        { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 15 }
      ];
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `Invoices_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      notificationService.showSuccess('Invoice report exported successfully!');
    } catch (error) {
      console.error('Error exporting invoices:', error);
      notificationService.showError('Failed to export invoice report');
    }
  }, [invoices]);

  const handlePrintPDF = useCallback(() => {
    try {
      const printWindow = window.open('', '_blank');
      const currentDate = new Date().toLocaleDateString('id-ID');

      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice Report</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; color: #2c3e50; }
            .header h2 { margin: 5px 0; font-size: 16px; color: #7f8c8d; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #7f8c8d; }
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PT. Bakhtera1</h1>
            <h2>Invoice Report</h2>
            <p>Generated on: ${currentDate}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th class="text-right">Total</th>
                <th>Status</th>
                <th>Payment Status</th>
              </tr>
            </thead>
            <tbody>
              ${invoices.map(invoice => `
                <tr>
                  <td>${invoice.invoiceNumber || 'N/A'}</td>
                  <td>${invoice.customerName || 'N/A'}</td>
                  <td>${invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'N/A'}</td>
                  <td>${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</td>
                  <td class="text-right">${formatCurrency(invoice.total || 0)}</td>
                  <td class="text-center">${invoice.status || 'Draft'}</td>
                  <td class="text-center">${invoice.paymentStatus || 'Unpaid'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Generated by Bakhtera1 - Advanced Freight Forwarding Management System</p>
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
  }, [invoices]);

  const handleClose = useCallback(() => {
    setOpen(false);
    resetForm();
  }, [resetForm]);

  const getPaymentStatusColor = useCallback((status) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Partial': return 'warning';
      case 'Unpaid': return 'error';
      default: return 'default';
    }
  }, []);

  // Enhanced currency formatting for Indonesian business
  const formatCurrency = (amount, currency = 'IDR') => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } else {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount);
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Sent': return 'primary';
      case 'Draft': return 'warning';
      default: return 'default';
    }
  };

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
    <InvoiceErrorBoundary>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4">
              {viewMode === 'list' ? 'Invoice Management' : `Invoice Details - ${selectedInvoice?.invoiceNumber}`}
            </Typography>
            {dataSource !== 'fresh' && (
              <Typography variant="caption" color={dataSource === 'cached' ? 'warning.main' : 'info.main'}>
                Data source: {dataSource === 'cached' ? 'Cached' : 'Partial'} • Last updated: {new Date(lastRefresh).toLocaleTimeString()}
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
              startIcon={<ExportIcon />}
              onClick={handleExportExcel}
              disabled={saving || invoices.length === 0}
            >
              Export Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrintPDF}
              disabled={saving || invoices.length === 0}
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
              {saving ? 'Creating...' : 'Create Invoice'}
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
        // Invoice List View
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      {invoices.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Invoices
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="warning.main">
                      {invoices.filter(inv => inv.status === 'Draft').length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Draft Invoices
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="error.main">
                      {invoices.filter(inv => inv.paymentStatus === 'Unpaid').length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Unpaid Invoices
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0))}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Paid
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* Invoice Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Invoices ({invoices.length})
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Invoice #</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Issue Date</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell align="right">Total Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Payment Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2">{invoice.invoiceNumber}</Typography>
                          </TableCell>
                          <TableCell>{invoice.customerName}</TableCell>
                          <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                          <TableCell align="right">{formatCurrency(invoice.total)}</TableCell>
                          <TableCell>
                            <Chip label={invoice.status} color={getStatusColor(invoice.status)} size="small" />
                          </TableCell>
                          <TableCell>
                            <Chip label={invoice.paymentStatus} color={getPaymentStatusColor(invoice.paymentStatus)} size="small" />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="View Details">
                              <IconButton size="small" onClick={() => handleViewDetail(invoice)}>
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
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
        // Invoice Detail View
        <Grid container spacing={3}>
          {selectedInvoice && (
            <>
              {/* Invoice Header */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h5">{selectedInvoice.invoiceNumber}</Typography>
                        <Typography variant="subtitle1" color="textSecondary">
                          {selectedInvoice.customerName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Issue Date: {new Date(selectedInvoice.issueDate).toLocaleDateString()} |
                          Due Date: {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        <Chip label={selectedInvoice.status} color={getStatusColor(selectedInvoice.status)} />
                        <Chip label={selectedInvoice.paymentStatus} color={getPaymentStatusColor(selectedInvoice.paymentStatus)} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Invoice Details Tabs */}
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ p: 0 }}>
                    <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                      <Tab label="Invoice Details" />
                      <Tab label="Line Items" />
                      <Tab label="Payment Information" />
                    </Tabs>

                    <Box sx={{ p: 3 }}>
                      {activeTab === 0 && (
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Customer Information</Typography>
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" color="textSecondary">Customer Name</Typography>
                              <Typography variant="body1" gutterBottom>{selectedInvoice.customerName}</Typography>

                              {selectedInvoice.customerEmail && (
                                <>
                                  <Typography variant="body2" color="textSecondary">Email</Typography>
                                  <Typography variant="body1" gutterBottom>{selectedInvoice.customerEmail}</Typography>
                                </>
                              )}

                              {selectedInvoice.customerAddress && (
                                <>
                                  <Typography variant="body2" color="textSecondary">Address</Typography>
                                  <Typography variant="body1" gutterBottom>{selectedInvoice.customerAddress}</Typography>
                                </>
                              )}
                            </Box>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Invoice Information</Typography>
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" color="textSecondary">Invoice Number</Typography>
                              <Typography variant="body1" gutterBottom>{selectedInvoice.invoiceNumber}</Typography>

                              <Typography variant="body2" color="textSecondary">Issue Date</Typography>
                              <Typography variant="body1" gutterBottom>{new Date(selectedInvoice.issueDate).toLocaleDateString()}</Typography>

                              <Typography variant="body2" color="textSecondary">Due Date</Typography>
                              <Typography variant="body1" gutterBottom>{new Date(selectedInvoice.dueDate).toLocaleDateString()}</Typography>

                              <Typography variant="body2" color="textSecondary">Payment Terms</Typography>
                              <Typography variant="body1" gutterBottom>{selectedInvoice.paymentTerms}</Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      )}

                      {activeTab === 1 && (
                        <Box>
                          <Typography variant="h6" gutterBottom>Line Items</Typography>
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
                                {selectedInvoice.lineItems?.map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell>{item.description}</TableCell>
                                    <TableCell>{item.serviceType}</TableCell>
                                    <TableCell align="right">{item.quantity}</TableCell>
                                    <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                                    <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                                  </TableRow>
                                )) || (
                                  <TableRow>
                                    <TableCell colSpan={5} align="center">
                                      No line items available
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>

                          {/* Invoice Totals */}
                          <Box sx={{ mt: 3, maxWidth: 300, ml: 'auto' }}>
                            <Box display="flex" justifyContent="space-between" py={1}>
                              <Typography>Subtotal:</Typography>
                              <Typography>{formatCurrency(selectedInvoice.subtotal)}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" py={1}>
                              <Typography>Tax ({selectedInvoice.taxRate}%):</Typography>
                              <Typography>{formatCurrency(selectedInvoice.taxAmount)}</Typography>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box display="flex" justifyContent="space-between" py={1}>
                              <Typography variant="h6">Total:</Typography>
                              <Typography variant="h6">{formatCurrency(selectedInvoice.total)}</Typography>
                            </Box>
                          </Box>
                        </Box>
                      )}

                      {activeTab === 2 && (
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Payment Information</Typography>
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" color="textSecondary">Payment Status</Typography>
                              <Typography variant="body1" gutterBottom>
                                <Chip label={selectedInvoice.paymentStatus} color={getPaymentStatusColor(selectedInvoice.paymentStatus)} />
                              </Typography>

                              <Typography variant="body2" color="textSecondary">Total Amount</Typography>
                              <Typography variant="body1" gutterBottom>{formatCurrency(selectedInvoice.total)}</Typography>

                              <Typography variant="body2" color="textSecondary">Paid Amount</Typography>
                              <Typography variant="body1" gutterBottom>{formatCurrency(selectedInvoice.paidAmount || 0)}</Typography>

                              <Typography variant="body2" color="textSecondary">Outstanding Amount</Typography>
                              <Typography variant="body1" gutterBottom>{formatCurrency((selectedInvoice.total - (selectedInvoice.paidAmount || 0)))}</Typography>
                            </Box>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Payment Actions</Typography>
                            <Box sx={{ mt: 2 }}>
                              <Button
                                variant="contained"
                                color="success"
                                startIcon={<PaymentIcon />}
                                sx={{ mr: 1 }}
                              >
                                Record Payment
                              </Button>
                              <Button
                                variant="outlined"
                                startIcon={<EmailIcon />}
                              >
                                Send Reminder
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

      {/* Create Invoice Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Create New Invoice</DialogTitle>
        <DialogContent>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mt: 2 }}>
            <Tab label="Basic Information" />
            <Tab label="Line Items" />
            <Tab label="Tax & Payment" />
          </Tabs>

          <Box sx={{ mt: 2 }}>
            {activeTab === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={customers}
                    getOptionLabel={(option) => option.name}
                    value={customers.find(c => c.id === formData.customerId) || null}
                    onChange={handleCustomerChange}
                    renderInput={(params) => (
                      <TextField {...params} label="Customer" fullWidth required />
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
                      <TextField {...params} label="Sales Order (Optional)" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Invoice Number"
                    value={formData.invoiceNumber}
                    onChange={handleInputChange('invoiceNumber')}
                    error={!!errors.invoiceNumber}
                    helperText={errors.invoiceNumber || 'Leave blank for auto-generation'}
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
                  <FormControl fullWidth>
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
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Due Date"
                    type="date"
                    value={formData.dueDate}
                    onChange={handleInputChange('dueDate')}
                    error={!!errors.dueDate}
                    helperText={errors.dueDate}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    value={formData.notes}
                    onChange={handleInputChange('notes')}
                  />
                </Grid>
              </Grid>
            )}

            {activeTab === 1 && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Invoice Line Items</Typography>
                  <Button startIcon={<AddIcon />} onClick={addLineItem}>
                    Add Line Item
                  </Button>
                </Box>

                {formData.lineItems.map((item, index) => (
                  <Card key={item.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Description"
                            value={item.description}
                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                            error={!!errors[`lineItem_${index}_description`]}
                            helperText={errors[`lineItem_${index}_description`]}
                          />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <FormControl fullWidth>
                            <InputLabel>Service Type</InputLabel>
                            <Select
                              value={item.serviceType}
                              onChange={(e) => updateLineItem(item.id, 'serviceType', e.target.value)}
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
                            onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            error={!!errors[`lineItem_${index}_quantity`]}
                            helperText={errors[`lineItem_${index}_quantity`]}
                          />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <TextField
                            fullWidth
                            label="Unit Price"
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            error={!!errors[`lineItem_${index}_unitPrice`]}
                            helperText={errors[`lineItem_${index}_unitPrice`]}
                          />
                        </Grid>
                        <Grid item xs={12} sm={1}>
                          <TextField
                            fullWidth
                            label="Amount"
                            value={formatCurrency(item.amount)}
                            disabled
                          />
                        </Grid>
                        <Grid item xs={12} sm={1}>
                          <IconButton onClick={() => removeLineItem(item.id)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}

                {formData.lineItems.length === 0 && (
                  <Alert severity="info">No line items added yet. Click "Add Line Item" to begin.</Alert>
                )}

                {/* Line Items Summary */}
                {formData.lineItems.length > 0 && (
                  <Card sx={{ mt: 2, bgcolor: 'grey.50' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Line Items Summary</Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography>Total Items: {formData.lineItems.length}</Typography>
                        <Typography variant="h6">
                          Subtotal: {formatCurrency(formData.subtotal)}
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
                  <Typography variant="h6" gutterBottom>Tax Information</Typography>
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Tax Rate (%)"
                          type="number"
                          step="0.01"
                          value={formData.taxRate}
                          onChange={handleInputChange('taxRate')}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Tax Amount"
                          value={formatCurrency(formData.taxAmount)}
                          disabled
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Invoice Totals</Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box display="flex" justifyContent="space-between" py={1}>
                      <Typography>Subtotal:</Typography>
                      <Typography>{formatCurrency(formData.subtotal)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" py={1}>
                      <Typography>Tax ({formData.taxRate}%):</Typography>
                      <Typography>{formatCurrency(formData.taxAmount)}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="space-between" py={1}>
                      <Typography variant="h6">Total:</Typography>
                      <Typography variant="h6">{formatCurrency(formData.total)}</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Invoice Status</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={handleInputChange('status')}
                      label="Invoice Status"
                    >
                      <MenuItem value="Draft">Draft</MenuItem>
                      <MenuItem value="Sent">Sent</MenuItem>
                      <MenuItem value="Paid">Paid</MenuItem>
                      <MenuItem value="Overdue">Overdue</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Indonesian Business Fields */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Redline Status</InputLabel>
                    <Select
                      value={formData.redlineStatus}
                      onChange={handleInputChange('redlineStatus')}
                      label="Redline Status"
                    >
                      {redlineStatusOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label} ({option.costMultiplier}x)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Customs Code (Beacukai)</InputLabel>
                    <Select
                      value={formData.beacukaiCode}
                      onChange={handleInputChange('beacukaiCode')}
                      label="Customs Code (Beacukai)"
                    >
                      <MenuItem value="">
                        <em>No customs code</em>
                      </MenuItem>
                      {beacukaiCodes.map(code => (
                        <MenuItem key={code.code} value={code.code}>
                          {code.code} - {code.description} (Rp {formatCurrency(code.baseCost)})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Cost Breakdown Display */}
                {formData.customsCost > 0 && (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      <Typography variant="body2">
                        <strong>Cost Breakdown:</strong><br />
                        Base Subtotal: {formatCurrency(formData.lineItems.reduce((sum, item) => sum + (item.amount || 0), 0))}<br />
                        Customs Cost: {formatCurrency(formData.customsCost)}<br />
                        Urgency Cost: {formatCurrency(formData.lineItems.reduce((sum, item) => sum + (item.amount || 0), 0) * (formData.urgencyMultiplier - 1))}<br />
                        <strong>Total: {formatCurrency(formData.total)}</strong>
                      </Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
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
            <Button onClick={handleSubmit} variant="contained">
              Create Invoice
            </Button>
          )}
        </DialogActions>
      </Dialog>
      </Box>
    </InvoiceErrorBoundary>
  );
};

export default InvoiceManagement;