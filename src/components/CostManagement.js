import React, { useState, useEffect, useMemo, useCallback, useReducer } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  GetApp as ExportIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  Calculate as CalculateIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
} from '@mui/icons-material';
import dataSyncService from '../services/dataSync';
import notificationService from '../services/notificationService';
import * as XLSX from 'xlsx';

// Initial state for cost management
const initialCostState = {
  // Operational costs
  operationalCosts: [],
  // Selling costs
  sellingCosts: [],
  // Redline requests
  redlineRequests: [],
  // Form data
  selectedCostType: 'operational', // 'operational', 'selling', 'redline'
  formData: {
    description: '',
    costType: '',
    amount: '',
    currency: 'IDR',
    vendorName: '',
    salesOrderId: '',
    urgencyLevel: 'normal',
    justification: '',
    requestedBy: '',
  },
  errors: {},
};

// Action types for cost management reducer
const COST_ACTIONS = {
  SET_OPERATIONAL_COSTS: 'SET_OPERATIONAL_COSTS',
  SET_SELLING_COSTS: 'SET_SELLING_COSTS',
  SET_REDLINE_REQUESTS: 'SET_REDLINE_REQUESTS',
  ADD_OPERATIONAL_COST: 'ADD_OPERATIONAL_COST',
  ADD_SELLING_COST: 'ADD_SELLING_COST',
  ADD_REDLINE_REQUEST: 'ADD_REDLINE_REQUEST',
  UPDATE_COST: 'UPDATE_COST',
  DELETE_COST: 'DELETE_COST',
  SET_FORM_DATA: 'SET_FORM_DATA',
  SET_SELECTED_COST_TYPE: 'SET_SELECTED_COST_TYPE',
  SET_ERRORS: 'SET_ERRORS',
  CLEAR_ERRORS: 'CLEAR_ERRORS',
  RESET_FORM: 'RESET_FORM',
};

// Cost management reducer
const costReducer = (state, action) => {
  switch (action.type) {
    case COST_ACTIONS.SET_OPERATIONAL_COSTS:
      return { ...state, operationalCosts: action.payload };

    case COST_ACTIONS.SET_SELLING_COSTS:
      return { ...state, sellingCosts: action.payload };

    case COST_ACTIONS.SET_REDLINE_REQUESTS:
      return { ...state, redlineRequests: action.payload };

    case COST_ACTIONS.ADD_OPERATIONAL_COST:
      return {
        ...state,
        operationalCosts: [...state.operationalCosts, action.payload]
      };

    case COST_ACTIONS.ADD_SELLING_COST:
      return {
        ...state,
        sellingCosts: [...state.sellingCosts, action.payload]
      };

    case COST_ACTIONS.ADD_REDLINE_REQUEST:
      return {
        ...state,
        redlineRequests: [...state.redlineRequests, action.payload]
      };

    case COST_ACTIONS.UPDATE_COST:
      return {
        ...state,
        operationalCosts: state.operationalCosts.map(cost =>
          cost.id === action.payload.id ? action.payload : cost
        ),
        sellingCosts: state.sellingCosts.map(cost =>
          cost.id === action.payload.id ? action.payload : cost
        )
      };

    case COST_ACTIONS.DELETE_COST:
      return {
        ...state,
        operationalCosts: state.operationalCosts.filter(cost => cost.id !== action.payload),
        sellingCosts: state.sellingCosts.filter(cost => cost.id !== action.payload)
      };

    case COST_ACTIONS.SET_FORM_DATA:
      return {
        ...state,
        formData: { ...state.formData, ...action.payload }
      };

    case COST_ACTIONS.SET_SELECTED_COST_TYPE:
      return {
        ...state,
        selectedCostType: action.payload,
        formData: initialCostState.formData
      };

    case COST_ACTIONS.SET_ERRORS:
      return {
        ...state,
        formData: { ...state.formData, errors: { ...state.formData.errors, ...action.payload } }
      };

    case COST_ACTIONS.CLEAR_ERRORS:
      return {
        ...state,
        formData: { ...state.formData, errors: {} }
      };

    case COST_ACTIONS.RESET_FORM:
      return {
        ...state,
        formData: initialCostState.formData,
        errors: {}
      };

    default:
      return state;
  }
};

// Error Boundary for CostManagement
class CostManagementErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CostManagement Error:', error, errorInfo);
    notificationService.showError('An unexpected error occurred in Cost Management');
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Something went wrong with Cost Management
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

const CostManagement = () => {
  // State management
  const [state, dispatch] = useReducer(costReducer, initialCostState);
  const [salesOrders, setSalesOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState('overview');

  // Data source tracking
  const [dataSource, setDataSource] = useState('fresh');
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Memoized calculations
  const calculations = useMemo(() => {
    const totalOperational = state.operationalCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0);
    const totalSelling = state.sellingCosts.reduce((sum, cost) => sum + (cost.margin || 0), 0);
    const pendingRedlines = state.redlineRequests.filter(r => r.status === 'Pending').length;
    const approvedRedlines = state.redlineRequests.filter(r => r.status === 'Approved').length;

    return {
      totalOperational,
      totalSelling,
      pendingRedlines,
      approvedRedlines,
      totalCosts: totalOperational + totalSelling
    };
  }, [state.operationalCosts, state.sellingCosts, state.redlineRequests]);

  // Enhanced data loading
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [opCosts, sellCosts, redlines, soData, customerData] = await Promise.allSettled([
        dataSyncService.getOperationalCosts?.() || Promise.resolve([]),
        dataSyncService.getSellingCosts?.() || Promise.resolve([]),
        dataSyncService.getRedlines?.() || Promise.resolve([]),
        dataSyncService.getSalesOrders?.() || Promise.resolve([]),
        dataSyncService.getCustomers?.() || Promise.resolve([])
      ]);

      const operationalCosts = opCosts.status === 'fulfilled' ? opCosts.value : [];
      const sellingCosts = sellCosts.status === 'fulfilled' ? sellCosts.value : [];
      const redlineRequests = redlines.status === 'fulfilled' ? redlines.value : [];
      const salesOrders = soData.status === 'fulfilled' ? soData.value : [];
      const customers = customerData.status === 'fulfilled' ? customerData.value : [];

      dispatch({ type: COST_ACTIONS.SET_OPERATIONAL_COSTS, payload: operationalCosts });
      dispatch({ type: COST_ACTIONS.SET_SELLING_COSTS, payload: sellingCosts });
      dispatch({ type: COST_ACTIONS.SET_REDLINE_REQUESTS, payload: redlineRequests });
      setSalesOrders(salesOrders);
      setCustomers(customers);

      // Track data source
      let source = 'fresh';
      if (opCosts.status === 'rejected' || sellCosts.status === 'rejected' ||
          redlines.status === 'rejected' || soData.status === 'rejected' || customerData.status === 'rejected') {
        source = 'partial';
      }
      setDataSource(source);

      // Persist data to localStorage
      persistDataToStorage({
        operationalCosts,
        sellingCosts,
        redlineRequests,
        salesOrders,
        customers
      });

    } catch (error) {
      console.error('Error loading cost management data:', error);
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
      if (data.operationalCosts.length > 0) {
        localStorage.setItem('cost_management_operational', JSON.stringify(data.operationalCosts));
      }
      if (data.sellingCosts.length > 0) {
        localStorage.setItem('cost_management_selling', JSON.stringify(data.sellingCosts));
      }
      if (data.redlineRequests.length > 0) {
        localStorage.setItem('cost_management_redlines', JSON.stringify(data.redlineRequests));
      }
      if (data.salesOrders.length > 0) {
        localStorage.setItem('cost_management_sos', JSON.stringify(data.salesOrders));
      }
      if (data.customers.length > 0) {
        localStorage.setItem('cost_management_customers', JSON.stringify(data.customers));
      }
    } catch (error) {
      console.warn('Failed to persist cost management data:', error);
    }
  }, []);

  const loadDataFromStorage = useCallback(() => {
    try {
      const opData = localStorage.getItem('cost_management_operational');
      const sellData = localStorage.getItem('cost_management_selling');
      const redlineData = localStorage.getItem('cost_management_redlines');
      const soData = localStorage.getItem('cost_management_sos');
      const customerData = localStorage.getItem('cost_management_customers');

      if (opData) dispatch({ type: COST_ACTIONS.SET_OPERATIONAL_COSTS, payload: JSON.parse(opData) });
      if (sellData) dispatch({ type: COST_ACTIONS.SET_SELLING_COSTS, payload: JSON.parse(sellData) });
      if (redlineData) dispatch({ type: COST_ACTIONS.SET_REDLINE_REQUESTS, payload: JSON.parse(redlineData) });
      if (soData) setSalesOrders(JSON.parse(soData));
      if (customerData) setCustomers(JSON.parse(customerData));
    } catch (error) {
      console.warn('Failed to load cost management data from storage:', error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh mechanism
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key?.includes('cost_management') || e.key?.includes('sales_order')) {
        console.log('Detected external data change in cost management, refreshing...');
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
    const value = event.target.value;
    dispatch({ type: COST_ACTIONS.SET_FORM_DATA, payload: { [field]: value } });
  }, []);

  const handleSalesOrderChange = useCallback((event, newValue) => {
    if (newValue) {
      dispatch({ type: COST_ACTIONS.SET_FORM_DATA, payload: {
        salesOrderId: newValue.id,
        customerName: newValue.customerName
      }});
    }
  }, []);

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!state.formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!state.formData.costType && state.selectedCostType !== 'redline') {
      newErrors.costType = 'Cost type is required';
    }

    if (!state.formData.amount || state.formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (state.selectedCostType === 'redline') {
      if (!state.formData.justification.trim()) {
        newErrors.justification = 'Justification is required for redline requests';
      }
      if (!state.formData.requestedBy.trim()) {
        newErrors.requestedBy = 'Requested by is required';
      }
    }

    dispatch({ type: COST_ACTIONS.SET_ERRORS, payload: newErrors });
    return Object.keys(newErrors).length === 0;
  }, [state.formData, state.selectedCostType]);

  // Form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const baseData = {
        id: `${state.selectedCostType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...state.formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let result;
      if (state.selectedCostType === 'operational') {
        result = await dataSyncService.createOperationalCost?.(baseData);
        if (result) {
          dispatch({ type: COST_ACTIONS.ADD_OPERATIONAL_COST, payload: result });
        }
      } else if (state.selectedCostType === 'selling') {
        const margin = calculateMargin(baseData.amount, baseData.markup || 0);
        const sellingData = { ...baseData, margin };
        result = await dataSyncService.createSellingCost?.(sellingData);
        if (result) {
          dispatch({ type: COST_ACTIONS.ADD_SELLING_COST, payload: result });
        }
      } else if (state.selectedCostType === 'redline') {
        const redlineData = {
          ...baseData,
          redlineNumber: generateRedlineNumber(),
          status: 'Pending',
          changes: calculateRedlineChanges(baseData)
        };
        result = await dataSyncService.createRedline?.(redlineData);
        if (result) {
          dispatch({ type: COST_ACTIONS.ADD_REDLINE_REQUEST, payload: result });
        }
      }

      if (result) {
        setOpen(false);
        dispatch({ type: COST_ACTIONS.RESET_FORM });
        notificationService.showSuccess(`${state.selectedCostType} created successfully!`);
      }
    } catch (error) {
      console.error('Error creating cost:', error);
      notificationService.showError(`Failed to create ${state.selectedCostType}`);
    } finally {
      setSaving(false);
    }
  }, [state.formData, state.selectedCostType, validateForm]);

  // Utility functions
  const calculateMargin = (amount, markup) => {
    return parseFloat(amount) * (parseFloat(markup) / 100);
  };

  const calculateRedlineChanges = (data) => {
    // Implementation for calculating redline changes
    return [{
      field: 'Cost',
      original: 0,
      requested: data.amount,
      type: 'cost_increase'
    }];
  };

  const generateRedlineNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `RED-${year}${month}-${timestamp}`;
  };

  const handleRefresh = useCallback(async () => {
    setLastRefresh(Date.now());
    await loadData();
    notificationService.showSuccess('Cost management data refreshed successfully');
  }, [loadData]);

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
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Draft': return 'info';
      case 'Rejected': return 'error';
      default: return 'default';
    }
  };

  // Export functions
  const exportToPDF = useCallback(() => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text('COST MANAGEMENT REPORT', 105, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, 35);
      doc.text(`Total Operational Costs: ${formatCurrency(calculations.totalOperational)}`, 20, 42);
      doc.text(`Total Selling Margin: ${formatCurrency(calculations.totalSelling)}`, 20, 49);

      // Operational Costs Table
      doc.setFontSize(14);
      doc.text('OPERATIONAL COSTS', 20, 70);

      const operationalData = state.operationalCosts.map(cost => [
        cost.description || 'N/A',
        cost.vendorName || 'N/A',
        cost.costType || 'N/A',
        formatCurrency(cost.amount, cost.currency),
        cost.status || 'N/A'
      ]);

      doc.autoTable({
        startY: 80,
        head: [['Description', 'Vendor', 'Type', 'Amount', 'Status']],
        body: operationalData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });

      // Selling Costs Table
      const sellingY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(14);
      doc.text('SELLING COSTS & MARGINS', 20, sellingY);

      const sellingData = state.sellingCosts.map(cost => [
        cost.description || 'N/A',
        cost.customerName || 'N/A',
        formatCurrency(cost.amount, cost.currency),
        `${cost.markup || 0}%`,
        formatCurrency(cost.margin, cost.currency),
        cost.status || 'N/A'
      ]);

      doc.autoTable({
        startY: sellingY + 10,
        head: [['Description', 'Customer', 'Base Amount', 'Markup', 'Margin', 'Status']],
        body: sellingData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [39, 174, 96] }
      });

      // Redline Requests Table
      const redlineY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(14);
      doc.text('REDLINE REQUESTS', 20, redlineY);

      const redlineData = state.redlineRequests.map(redline => [
        redline.redlineNumber || 'N/A',
        redline.customerName || 'N/A',
        redline.urgencyLevel || 'N/A',
        redline.status || 'N/A',
        redline.requestedBy || 'N/A'
      ]);

      doc.autoTable({
        startY: redlineY + 10,
        head: [['Redline #', 'Customer', 'Urgency', 'Status', 'Requested By']],
        body: redlineData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [230, 126, 34] }
      });

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.text('This report is generated automatically from the Cost Management system.', 20, pageHeight - 20);

      doc.save(`Cost_Management_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      notificationService.showSuccess('PDF report exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      notificationService.showError('Failed to export PDF report');
    }
  }, [state.operationalCosts, state.sellingCosts, state.redlineRequests, calculations, formatCurrency]);

  const exportToExcel = useCallback(() => {
    try {
      const workbook = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [{
        'Report Date': new Date().toLocaleDateString(),
        'Total Operational Costs': calculations.totalOperational,
        'Total Selling Margin': calculations.totalSelling,
        'Pending Redlines': calculations.pendingRedlines,
        'Approved Redlines': calculations.approvedRedlines,
        'Overall Margin %': calculations.totalCosts > 0 ? ((calculations.totalSelling / calculations.totalCosts) * 100).toFixed(2) + '%' : '0%'
      }];

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Operational Costs sheet
      if (state.operationalCosts.length > 0) {
        const operationalData = state.operationalCosts.map(cost => ({
          'Description': cost.description || 'N/A',
          'Vendor': cost.vendorName || 'N/A',
          'Cost Type': cost.costType || 'N/A',
          'Amount': cost.amount || 0,
          'Currency': cost.currency || 'IDR',
          'Sales Order': cost.salesOrderId || 'General',
          'Status': cost.status || 'N/A',
          'Created Date': cost.createdAt ? new Date(cost.createdAt).toLocaleDateString() : 'N/A'
        }));

        const operationalSheet = XLSX.utils.json_to_sheet(operationalData);
        XLSX.utils.book_append_sheet(workbook, operationalSheet, 'Operational Costs');
      }

      // Selling Costs sheet
      if (state.sellingCosts.length > 0) {
        const sellingData = state.sellingCosts.map(cost => ({
          'Description': cost.description || 'N/A',
          'Customer': cost.customerName || 'N/A',
          'Base Amount': cost.amount || 0,
          'Currency': cost.currency || 'IDR',
          'Markup %': cost.markup || 0,
          'Margin': cost.margin || 0,
          'Status': cost.status || 'N/A',
          'Created Date': cost.createdAt ? new Date(cost.createdAt).toLocaleDateString() : 'N/A'
        }));

        const sellingSheet = XLSX.utils.json_to_sheet(sellingData);
        XLSX.utils.book_append_sheet(workbook, sellingSheet, 'Selling Costs');
      }

      // Redline Requests sheet
      if (state.redlineRequests.length > 0) {
        const redlineData = state.redlineRequests.map(redline => ({
          'Redline Number': redline.redlineNumber || 'N/A',
          'Customer': redline.customerName || 'N/A',
          'Urgency Level': redline.urgencyLevel || 'N/A',
          'Status': redline.status || 'N/A',
          'Requested By': redline.requestedBy || 'N/A',
          'Justification': redline.justification || 'N/A',
          'Created Date': redline.createdAt ? new Date(redline.createdAt).toLocaleDateString() : 'N/A'
        }));

        const redlineSheet = XLSX.utils.json_to_sheet(redlineData);
        XLSX.utils.book_append_sheet(workbook, redlineSheet, 'Redline Requests');
      }

      XLSX.writeFile(workbook, `Cost_Management_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      notificationService.showSuccess('Excel report exported successfully!');
    } catch (error) {
      console.error('Excel export error:', error);
      notificationService.showError('Failed to export Excel report');
    }
  }, [state.operationalCosts, state.sellingCosts, state.redlineRequests, calculations]);

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
    <CostManagementErrorBoundary>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4">Cost Management</Typography>
            {dataSource !== 'fresh' && (
              <Typography variant="caption" color={dataSource === 'cached' ? 'warning.main' : 'info.main'}>
                Data source: {dataSource === 'cached' ? 'Cached' : 'Partial'} •
                Last updated: {new Date(lastRefresh).toLocaleTimeString()}
              </Typography>
            )}
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<PdfIcon />}
              onClick={exportToPDF}
              color="error"
              disabled={loading}
            >
              Export PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExcelIcon />}
              onClick={exportToExcel}
              color="success"
              disabled={loading}
            >
              Export Excel
            </Button>
            <Button
              variant="outlined"
              onClick={handleRefresh}
              disabled={loading || saving}
            >
              Refresh Data
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} /> : <AddIcon />}
              onClick={() => setOpen(true)}
              disabled={saving}
            >
              Add Cost
            </Button>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {formatCurrency(calculations.totalOperational)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Operational Costs
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {formatCurrency(calculations.totalSelling)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Selling Margin
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {calculations.pendingRedlines}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Pending Redline Approvals
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {calculations.totalCosts > 0 ?
                    ((calculations.totalSelling / calculations.totalCosts) * 100).toFixed(1) + '%' : '0%'
                  }
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Overall Margin %
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Cost Management Tabs */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Overview" />
              <Tab label="Operational Costs" />
              <Tab label="Selling Costs" />
              <Tab label="Redline Approvals" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  {/* Operational Costs Summary */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Operational Costs</Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Description</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {state.operationalCosts.slice(0, 5).map((cost) => (
                            <TableRow key={cost.id}>
                              <TableCell>{cost.description}</TableCell>
                              <TableCell align="right">{formatCurrency(cost.amount, cost.currency)}</TableCell>
                              <TableCell>
                                <Chip label={cost.status} size="small" variant="outlined" />
                              </TableCell>
                            </TableRow>
                          ))}
                          {state.operationalCosts.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={3} align="center">
                                No operational costs
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>

                  {/* Selling Costs Summary */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Selling Costs & Margins</Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Description</TableCell>
                            <TableCell align="right">Margin</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {state.sellingCosts.slice(0, 5).map((cost) => (
                            <TableRow key={cost.id}>
                              <TableCell>{cost.description}</TableCell>
                              <TableCell align="right">{formatCurrency(cost.margin, cost.currency)}</TableCell>
                              <TableCell>
                                <Chip label={cost.status} size="small" color={getStatusColor(cost.status)} />
                              </TableCell>
                            </TableRow>
                          ))}
                          {state.sellingCosts.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={3} align="center">
                                No selling costs
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>

                  {/* Redline Requests Summary */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Redline Requests</Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Redline #</TableCell>
                            <TableCell>Customer</TableCell>
                            <TableCell>Urgency</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Requested By</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {state.redlineRequests.slice(0, 5).map((redline) => (
                            <TableRow key={redline.id}>
                              <TableCell>{redline.redlineNumber}</TableCell>
                              <TableCell>{redline.customerName}</TableCell>
                              <TableCell>
                                <Chip
                                  label={redline.urgencyLevel}
                                  size="small"
                                  color={redline.urgencyLevel === 'critical' ? 'error' : 'warning'}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip label={redline.status} color={getStatusColor(redline.status)} size="small" />
                              </TableCell>
                              <TableCell>{redline.requestedBy}</TableCell>
                            </TableRow>
                          ))}
                          {state.redlineRequests.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                No redline requests
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              )}

              {activeTab === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Operational Costs Management</Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Description</TableCell>
                          <TableCell>Vendor</TableCell>
                          <TableCell>Cost Type</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Sales Order</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {state.operationalCosts.map((cost) => (
                          <TableRow key={cost.id} hover>
                            <TableCell>{cost.description}</TableCell>
                            <TableCell>{cost.vendorName}</TableCell>
                            <TableCell>
                              <Chip label={cost.costType} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell align="right">{formatCurrency(cost.amount, cost.currency)}</TableCell>
                            <TableCell>{cost.salesOrderId || 'General'}</TableCell>
                            <TableCell>
                              <Chip label={cost.status} color={getStatusColor(cost.status)} size="small" />
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Edit Cost">
                                <IconButton size="small">
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Selling Costs & Pricing</Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Description</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell align="right">Base Amount</TableCell>
                          <TableCell align="right">Markup</TableCell>
                          <TableCell align="right">Margin</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {state.sellingCosts.map((cost) => (
                          <TableRow key={cost.id} hover>
                            <TableCell>{cost.description}</TableCell>
                            <TableCell>{cost.customerName || 'General'}</TableCell>
                            <TableCell align="right">{formatCurrency(cost.amount, cost.currency)}</TableCell>
                            <TableCell align="right">{cost.markup}%</TableCell>
                            <TableCell align="right" sx={{ color: 'success.main' }}>
                              {formatCurrency(cost.margin, cost.currency)}
                            </TableCell>
                            <TableCell>
                              <Chip label={cost.status} color={getStatusColor(cost.status)} size="small" />
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Edit Cost">
                                <IconButton size="small">
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {activeTab === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Redline Approvals</Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Redline #</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell>Change Type</TableCell>
                          <TableCell>Urgency</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Requested By</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {state.redlineRequests.map((redline) => (
                          <TableRow key={redline.id} hover>
                            <TableCell>{redline.redlineNumber}</TableCell>
                            <TableCell>{redline.customerName}</TableCell>
                            <TableCell>
                              {redline.changes?.map((change, index) => (
                                <Chip
                                  key={change.id}
                                  label={`${change.field} Change`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              )) || <Chip label="No Changes" size="small" variant="outlined" />}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={redline.urgencyLevel}
                                size="small"
                                color={redline.urgencyLevel === 'critical' ? 'error' : 'warning'}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip label={redline.status} color={getStatusColor(redline.status)} size="small" />
                            </TableCell>
                            <TableCell>{redline.requestedBy}</TableCell>
                            <TableCell align="right">
                              {redline.status === 'Pending' && (
                                <>
                                  <Tooltip title="Approve Redline">
                                    <IconButton size="small" color="success">
                                      <ApproveIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Reject Redline">
                                    <IconButton size="small" color="error">
                                      <RejectIcon />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Add Cost Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Add {state.selectedCostType === 'operational' ? 'Operational Cost' :
                  state.selectedCostType === 'selling' ? 'Selling Cost' : 'Redline Request'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Cost Type</InputLabel>
                  <Select
                    value={state.selectedCostType}
                    onChange={(e) => dispatch({ type: COST_ACTIONS.SET_SELECTED_COST_TYPE, payload: e.target.value })}
                    label="Cost Type"
                  >
                    <MenuItem value="operational">Operational Cost</MenuItem>
                    <MenuItem value="selling">Selling Cost</MenuItem>
                    <MenuItem value="redline">Redline Request</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={state.formData.description}
                  onChange={handleInputChange('description')}
                  error={!!state.formData.errors?.description}
                  helperText={state.formData.errors?.description}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={salesOrders}
                  getOptionLabel={(option) => `${option.orderNumber} - ${option.customerName}`}
                  value={salesOrders.find(so => so.id === state.formData.salesOrderId) || null}
                  onChange={handleSalesOrderChange}
                  renderInput={(params) => (
                    <TextField {...params} label="Related Sales Order" fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Vendor/Customer Name"
                  value={state.formData.vendorName}
                  onChange={handleInputChange('vendorName')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  step="0.01"
                  value={state.formData.amount}
                  onChange={handleInputChange('amount')}
                  error={!!state.formData.errors?.amount}
                  helperText={state.formData.errors?.amount}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={state.formData.currency}
                    onChange={handleInputChange('currency')}
                    label="Currency"
                  >
                    <MenuItem value="IDR">Indonesian Rupiah (IDR)</MenuItem>
                    <MenuItem value="USD">US Dollar (USD)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {state.selectedCostType === 'selling' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Markup (%)"
                    type="number"
                    step="0.01"
                    value={state.formData.markup || ''}
                    onChange={handleInputChange('markup')}
                  />
                </Grid>
              )}

              {state.selectedCostType === 'redline' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Urgency Level</InputLabel>
                      <Select
                        value={state.formData.urgencyLevel}
                        onChange={handleInputChange('urgencyLevel')}
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
                      value={state.formData.requestedBy}
                      onChange={handleInputChange('requestedBy')}
                      error={!!state.formData.errors?.requestedBy}
                      helperText={state.formData.errors?.requestedBy}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Justification"
                      multiline
                      rows={3}
                      value={state.formData.justification}
                      onChange={handleInputChange('justification')}
                      error={!!state.formData.errors?.justification}
                      helperText={state.formData.errors?.justification}
                      required
                    />
                  </Grid>
                </>
              )}

              {/* Cost Preview */}
              {state.formData.amount && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Cost Preview:</strong><br />
                      Amount: {formatCurrency(state.formData.amount, state.formData.currency)}<br />
                      {state.selectedCostType === 'selling' && state.formData.markup && (
                        <>
                          Markup ({state.formData.markup}%): {formatCurrency(calculateMargin(state.formData.amount, state.formData.markup), state.formData.currency)}<br />
                        </>
                      )}
                      {state.selectedCostType === 'redline' && state.formData.urgencyLevel && (
                        <>
                          Urgency Multiplier: {state.formData.urgencyLevel === 'normal' ? '1x' :
                                           state.formData.urgencyLevel === 'urgent' ? '1.5x' :
                                           state.formData.urgencyLevel === 'express' ? '2x' : '3x'}<br />
                        </>
                      )}
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              Add {state.selectedCostType === 'operational' ? 'Operational Cost' :
                    state.selectedCostType === 'selling' ? 'Selling Cost' : 'Redline Request'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </CostManagementErrorBoundary>
  );
};

export default CostManagement;