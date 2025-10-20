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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as VisibilityIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import dataSyncService from '../services/dataSync';
import notificationService from '../services/notificationService';
import * as XLSX from 'xlsx';

// Initial state for redline form
const initialFormState = {
  redlineNumber: '',
  salesOrderId: '',
  customerName: '',
  originalServiceType: '',
  originalRoute: '',
  originalValue: 0,
  originalCurrency: 'IDR',
  requestedServiceType: '',
  requestedRoute: '',
  requestedValue: 0,
  requestedCurrency: 'IDR',
  urgencyLevel: 'normal',
  justification: '',
  requestedBy: '',
  requestedDate: new Date().toISOString().split('T')[0],
  status: 'Draft',
  approverComments: '',
  approvedBy: '',
  approvedDate: '',
  version: 1,
  changes: [],
};

// Action types for redline reducer
const REDLINE_ACTIONS = {
  SET_FIELD: 'SET_FIELD',
  SET_MULTIPLE_FIELDS: 'SET_MULTIPLE_FIELDS',
  ADD_CHANGE: 'ADD_CHANGE',
  UPDATE_CHANGE: 'UPDATE_CHANGE',
  REMOVE_CHANGE: 'REMOVE_CHANGE',
  SET_CHANGES: 'SET_CHANGES',
  APPROVE_REDLINE: 'APPROVE_REDLINE',
  REJECT_REDLINE: 'REJECT_REDLINE',
  RESET_FORM: 'RESET_FORM',
  SET_ERRORS: 'SET_ERRORS',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Redline reducer
const redlineReducer = (state, action) => {
  switch (action.type) {
    case REDLINE_ACTIONS.SET_FIELD:
      return { ...state, [action.field]: action.value };

    case REDLINE_ACTIONS.SET_MULTIPLE_FIELDS:
      return { ...state, ...action.fields };

    case REDLINE_ACTIONS.ADD_CHANGE:
      return {
        ...state,
        changes: [...state.changes, action.change]
      };

    case REDLINE_ACTIONS.UPDATE_CHANGE:
      return {
        ...state,
        changes: state.changes.map(change =>
          change.id === action.id ? { ...change, [action.field]: action.value } : change
        )
      };

    case REDLINE_ACTIONS.REMOVE_CHANGE:
      return {
        ...state,
        changes: state.changes.filter(change => change.id !== action.id)
      };

    case REDLINE_ACTIONS.SET_CHANGES:
      return { ...state, changes: action.changes };

    case REDLINE_ACTIONS.APPROVE_REDLINE:
      return {
        ...state,
        status: 'Approved',
        approvedBy: action.approver,
        approvedDate: new Date().toISOString(),
        approverComments: action.comments
      };

    case REDLINE_ACTIONS.REJECT_REDLINE:
      return {
        ...state,
        status: 'Rejected',
        approvedBy: action.approver,
        approvedDate: new Date().toISOString(),
        approverComments: action.comments
      };

    case REDLINE_ACTIONS.RESET_FORM:
      return initialFormState;

    default:
      return state;
  }
};

// Error Boundary for RedlineManagement
class RedlineErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('RedlineManagement Error:', error, errorInfo);
    notificationService.showError('An unexpected error occurred in Redline Management');
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Something went wrong with Redline Management
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

const RedlineManagement = () => {
  // Core state management
  const [redlines, setRedlines] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [selectedRedline, setSelectedRedline] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Form state with reducer
  const [formData, dispatch] = useReducer(redlineReducer, initialFormState);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Data source tracking
  const [dataSource, setDataSource] = useState('fresh');
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Urgency levels for redline requests
  const urgencyLevels = [
    { value: 'normal', label: 'Normal', multiplier: 1.0, color: 'info' },
    { value: 'urgent', label: 'Urgent', multiplier: 1.5, color: 'warning' },
    { value: 'express', label: 'Express', multiplier: 2.0, color: 'error' },
    { value: 'critical', label: 'Critical', multiplier: 3.0, color: 'error' }
  ];

  // Enhanced data loading with robust persistence
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [redlineData, soData, customerData] = await Promise.allSettled([
        dataSyncService.getRedlines?.() || Promise.resolve([]),
        dataSyncService.getSalesOrders?.() || Promise.resolve([]),
        dataSyncService.getCustomers?.() || Promise.resolve([])
      ]);

      const redlines = redlineData.status === 'fulfilled' ? redlineData.value : [];
      const salesOrders = soData.status === 'fulfilled' ? soData.value : [];
      const customers = customerData.status === 'fulfilled' ? customerData.value : [];

      setRedlines(redlines);
      setSalesOrders(salesOrders);
      setCustomers(customers);

      // Track data source
      let source = 'fresh';
      if (redlineData.status === 'rejected' || soData.status === 'rejected' || customerData.status === 'rejected') {
        source = 'partial';
      }
      setDataSource(source);

      // Persist data to localStorage
      persistDataToStorage({ redlines, salesOrders, customers });

    } catch (error) {
      console.error('Error loading redline data:', error);
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
      if (data.redlines.length > 0) {
        localStorage.setItem('redline_management_redlines', JSON.stringify(data.redlines));
      }
      if (data.salesOrders.length > 0) {
        localStorage.setItem('redline_management_sos', JSON.stringify(data.salesOrders));
      }
      if (data.customers.length > 0) {
        localStorage.setItem('redline_management_customers', JSON.stringify(data.customers));
      }
    } catch (error) {
      console.warn('Failed to persist redline data:', error);
    }
  }, []);

  const loadDataFromStorage = useCallback(() => {
    try {
      const redlineData = localStorage.getItem('redline_management_redlines');
      const soData = localStorage.getItem('redline_management_sos');
      const customerData = localStorage.getItem('redline_management_customers');

      if (redlineData) setRedlines(JSON.parse(redlineData));
      if (soData) setSalesOrders(JSON.parse(soData));
      if (customerData) setCustomers(JSON.parse(customerData));
    } catch (error) {
      console.warn('Failed to load redline data from storage:', error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh mechanism
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key?.includes('redline') || e.key?.includes('sales_order')) {
        console.log('Detected external data change in redlines, refreshing...');
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
    dispatch({ type: REDLINE_ACTIONS.SET_FIELD, field, value });
  }, []);

  const handleSalesOrderChange = useCallback((event, newValue) => {
    if (newValue) {
      const fields = {
        salesOrderId: newValue.id,
        customerName: newValue.customerName,
        originalServiceType: newValue.serviceType,
        originalRoute: `${newValue.origin} → ${newValue.destination}`,
        originalValue: newValue.sellingPrice || 0,
        originalCurrency: 'IDR',
      };
      dispatch({ type: REDLINE_ACTIONS.SET_MULTIPLE_FIELDS, fields });
    }
  }, []);

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.redlineNumber.trim()) {
      newErrors.redlineNumber = 'Redline number is required';
    }

    if (!formData.salesOrderId) {
      newErrors.salesOrderId = 'Sales order is required';
    }

    if (!formData.requestedServiceType) {
      newErrors.requestedServiceType = 'Requested service type is required';
    }

    if (!formData.requestedValue || formData.requestedValue <= 0) {
      newErrors.requestedValue = 'Requested value must be greater than 0';
    }

    if (!formData.justification.trim()) {
      newErrors.justification = 'Justification is required';
    }

    if (!formData.requestedBy.trim()) {
      newErrors.requestedBy = 'Requested by is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Form submission
  const handleSubmit = useCallback(async () => {
    setSubmitError('');
    setSubmitSuccess('');

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const redlineNumber = formData.redlineNumber || generateRedlineNumber();

      const newRedline = {
        id: `redline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...formData,
        redlineNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Calculate changes
        changes: calculateChanges(formData),
      };

      // Save to dataSyncService with fallback
      let createdRedline;
      try {
        createdRedline = await dataSyncService.createRedline?.(newRedline);
      } catch (serviceError) {
        console.warn('Primary service failed, using fallback:', serviceError);
        createdRedline = { ...newRedline, _fallback: true };
      }

      if (createdRedline) {
        setRedlines(prev => [...prev, createdRedline]);

        // Update localStorage immediately
        const currentRedlines = [...redlines, createdRedline];
        persistDataToStorage({
          redlines: currentRedlines,
          salesOrders,
          customers
        });

        setSubmitSuccess('Redline request created successfully!');
        dispatch({ type: REDLINE_ACTIONS.RESET_FORM });
        setErrors({});
        setOpen(false);

        setTimeout(() => setSubmitSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error creating redline:', error);
      setSubmitError(`Failed to create redline: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  }, [formData, validateForm, redlines, salesOrders, customers, persistDataToStorage]);

  // Calculate changes between original and requested
  const calculateChanges = useCallback((data) => {
    const changes = [];

    if (data.originalServiceType !== data.requestedServiceType) {
      changes.push({
        id: `change_${Date.now()}_1`,
        field: 'Service Type',
        original: data.originalServiceType,
        requested: data.requestedServiceType,
        type: 'service_change'
      });
    }

    if (data.originalRoute !== data.requestedRoute) {
      changes.push({
        id: `change_${Date.now()}_2`,
        field: 'Route',
        original: data.originalRoute,
        requested: data.requestedRoute,
        type: 'route_change'
      });
    }

    if (data.originalValue !== data.requestedValue) {
      changes.push({
        id: `change_${Date.now()}_3`,
        field: 'Value',
        original: data.originalValue,
        requested: data.requestedValue,
        type: 'value_change'
      });
    }

    return changes;
  }, []);

  // Utility functions
  const generateRedlineNumber = useCallback(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `RED-${year}${month}-${timestamp}`;
  }, []);

  const handleRefresh = useCallback(async () => {
    setLastRefresh(Date.now());
    await loadData();
    notificationService.showSuccess('Redline data refreshed successfully');
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

  const getUrgencyColor = (urgency) => {
    const level = urgencyLevels.find(l => l.value === urgency);
    return level?.color || 'default';
  };

  // View handlers
  const handleViewDetail = useCallback((redline) => {
    setSelectedRedline(redline);
    setViewMode('detail');
  }, []);

  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedRedline(null);
  }, []);

  const handleApprove = useCallback(async (redlineId, comments) => {
    try {
      const updatedRedline = await dataSyncService.approveRedline?.(redlineId, {
        approver: 'Current User', // Should come from auth context
        comments,
        approvedDate: new Date().toISOString()
      });

      if (updatedRedline) {
        setRedlines(prev => prev.map(r => r.id === redlineId ? updatedRedline : r));
        notificationService.showSuccess('Redline approved successfully');
      }
    } catch (error) {
      notificationService.showError('Failed to approve redline');
    }
  }, []);

  const handleReject = useCallback(async (redlineId, comments) => {
    try {
      const updatedRedline = await dataSyncService.rejectRedline?.(redlineId, {
        approver: 'Current User', // Should come from auth context
        comments,
        approvedDate: new Date().toISOString()
      });

      if (updatedRedline) {
        setRedlines(prev => prev.map(r => r.id === redlineId ? updatedRedline : r));
        notificationService.showSuccess('Redline rejected');
      }
    } catch (error) {
      notificationService.showError('Failed to reject redline');
    }
  }, []);

  // Export functions
  const handleExportExcel = useCallback(() => {
    try {
      const exportData = redlines.map(redline => ({
        'Redline Number': redline.redlineNumber,
        'Sales Order': redline.salesOrderId,
        'Customer': redline.customerName,
        'Original Service': redline.originalServiceType,
        'Requested Service': redline.requestedServiceType,
        'Original Value': redline.originalValue,
        'Requested Value': redline.requestedValue,
        'Urgency Level': redline.urgencyLevel,
        'Status': redline.status,
        'Requested By': redline.requestedBy,
        'Requested Date': redline.requestedDate,
        'Approved By': redline.approvedBy,
        'Approved Date': redline.approvedDate
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Redlines');

      const colWidths = [
        { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 }
      ];
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `Redlines_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      notificationService.showSuccess('Redline report exported successfully!');
    } catch (error) {
      console.error('Error exporting redlines:', error);
      notificationService.showError('Failed to export redline report');
    }
  }, [redlines]);

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
    <RedlineErrorBoundary>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4">
              {viewMode === 'list' ? 'Redline Management' : `Redline Details - ${selectedRedline?.redlineNumber}`}
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
              disabled={saving || redlines.length === 0}
            >
              Export Excel
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
              {saving ? 'Creating...' : 'Create Redline'}
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
          // Redline List View
          <Grid container spacing={3}>
            {/* Summary Cards */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="primary">
                        {redlines.length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Redlines
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="warning.main">
                        {redlines.filter(r => r.status === 'Pending').length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Pending Approval
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="success.main">
                        {redlines.filter(r => r.status === 'Approved').length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Approved
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="error.main">
                        {redlines.filter(r => r.status === 'Rejected').length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Rejected
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            {/* Redline Table */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Redline Requests ({redlines.length})
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Redline #</TableCell>
                          <TableCell>Sales Order</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell>Change Type</TableCell>
                          <TableCell>Urgency</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Requested By</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {redlines.map((redline) => (
                          <TableRow key={redline.id} hover>
                            <TableCell>
                              <Typography variant="subtitle2">{redline.redlineNumber}</Typography>
                            </TableCell>
                            <TableCell>{redline.salesOrderId}</TableCell>
                            <TableCell>{redline.customerName}</TableCell>
                            <TableCell>
                              <Box>
                                {redline.changes?.map((change, index) => (
                                  <Chip
                                    key={change.id}
                                    label={`${change.field} Change`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                  />
                                )) || <Chip label="No Changes" size="small" variant="outlined" />}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={urgencyLevels.find(l => l.value === redline.urgencyLevel)?.label || 'Normal'}
                                color={getUrgencyColor(redline.urgencyLevel)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip label={redline.status} color={getStatusColor(redline.status)} size="small" />
                            </TableCell>
                            <TableCell>{redline.requestedBy}</TableCell>
                            <TableCell align="right">
                              <Tooltip title="View Details">
                                <IconButton size="small" onClick={() => handleViewDetail(redline)}>
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
          // Redline Detail View
          <Grid container spacing={3}>
            {selectedRedline && (
              <>
                {/* Redline Header */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="h5">{selectedRedline.redlineNumber}</Typography>
                          <Typography variant="subtitle1" color="textSecondary">
                            Sales Order: {selectedRedline.salesOrderId}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Customer: {selectedRedline.customerName} • Requested: {new Date(selectedRedline.requestedDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box display="flex" gap={1}>
                          <Chip
                            label={urgencyLevels.find(l => l.value === selectedRedline.urgencyLevel)?.label || 'Normal'}
                            color={getUrgencyColor(selectedRedline.urgencyLevel)}
                          />
                          <Chip label={selectedRedline.status} color={getStatusColor(selectedRedline.status)} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Redline Details Tabs */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent sx={{ p: 0 }}>
                      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                        <Tab label="Change Details" />
                        <Tab label="Approval Workflow" />
                        <Tab label="Version History" />
                      </Tabs>

                      <Box sx={{ p: 3 }}>
                        {activeTab === 0 && (
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                              <Typography variant="h6" gutterBottom>Original Order</Typography>
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" color="textSecondary">Service Type</Typography>
                                <Typography variant="body1" gutterBottom>{selectedRedline.originalServiceType}</Typography>

                                <Typography variant="body2" color="textSecondary">Route</Typography>
                                <Typography variant="body1" gutterBottom>{selectedRedline.originalRoute}</Typography>

                                <Typography variant="body2" color="textSecondary">Original Value</Typography>
                                <Typography variant="body1" gutterBottom>
                                  {formatCurrency(selectedRedline.originalValue, selectedRedline.originalCurrency)}
                                </Typography>
                              </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <Typography variant="h6" gutterBottom>Requested Changes</Typography>
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" color="textSecondary">Requested Service Type</Typography>
                                <Typography variant="body1" gutterBottom>{selectedRedline.requestedServiceType}</Typography>

                                <Typography variant="body2" color="textSecondary">Requested Route</Typography>
                                <Typography variant="body1" gutterBottom>{selectedRedline.requestedRoute}</Typography>

                                <Typography variant="body2" color="textSecondary">Requested Value</Typography>
                                <Typography variant="body1" gutterBottom>
                                  {formatCurrency(selectedRedline.requestedValue, selectedRedline.requestedCurrency)}
                                </Typography>
                              </Box>
                            </Grid>

                            <Grid item xs={12}>
                              <Typography variant="h6" gutterBottom>Justification</Typography>
                              <Typography variant="body1">{selectedRedline.justification}</Typography>
                            </Grid>
                          </Grid>
                        )}

                        {activeTab === 1 && (
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                              <Typography variant="h6" gutterBottom>Approval Information</Typography>
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" color="textSecondary">Status</Typography>
                                <Typography variant="body1" gutterBottom>
                                  <Chip label={selectedRedline.status} color={getStatusColor(selectedRedline.status)} />
                                </Typography>

                                {selectedRedline.approvedBy && (
                                  <>
                                    <Typography variant="body2" color="textSecondary">Approved By</Typography>
                                    <Typography variant="body1" gutterBottom>{selectedRedline.approvedBy}</Typography>

                                    <Typography variant="body2" color="textSecondary">Approved Date</Typography>
                                    <Typography variant="body1" gutterBottom>
                                      {new Date(selectedRedline.approvedDate).toLocaleDateString()}
                                    </Typography>
                                  </>
                                )}
                              </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <Typography variant="h6" gutterBottom>Approval Actions</Typography>
                              <Box sx={{ mt: 2 }}>
                                {selectedRedline.status === 'Pending' && (
                                  <>
                                    <Button
                                      variant="contained"
                                      color="success"
                                      startIcon={<ApproveIcon />}
                                      sx={{ mr: 1 }}
                                      onClick={() => handleApprove(selectedRedline.id, 'Approved via system')}
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      variant="outlined"
                                      color="error"
                                      startIcon={<RejectIcon />}
                                      onClick={() => handleReject(selectedRedline.id, 'Rejected via system')}
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}
                              </Box>
                            </Grid>

                            {selectedRedline.approverComments && (
                              <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>Approver Comments</Typography>
                                <Typography variant="body1">{selectedRedline.approverComments}</Typography>
                              </Grid>
                            )}
                          </Grid>
                        )}

                        {activeTab === 2 && (
                          <Box>
                            <Typography variant="h6" gutterBottom>Change History</Typography>
                            {selectedRedline.changes?.map((change, index) => (
                              <Accordion key={change.id}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                  <Typography variant="subtitle2">
                                    {change.field} Change - Version {index + 1}
                                  </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                      <Typography variant="body2" color="textSecondary">Original</Typography>
                                      <Typography variant="body1">{change.original}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="body2" color="textSecondary">Requested</Typography>
                                      <Typography variant="body1">{change.requested}</Typography>
                                    </Grid>
                                  </Grid>
                                </AccordionDetails>
                              </Accordion>
                            )) || (
                              <Typography variant="body2" color="textSecondary">
                                No change history available
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}
          </Grid>
        )}

        {/* Create Redline Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create Redline Request</DialogTitle>
          <DialogContent>
            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {submitError}
              </Alert>
            )}

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={salesOrders}
                  getOptionLabel={(option) => `${option.orderNumber} - ${option.customerName}`}
                  value={salesOrders.find(so => so.id === formData.salesOrderId) || null}
                  onChange={handleSalesOrderChange}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Sales Order" fullWidth required />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Redline Number"
                  value={formData.redlineNumber}
                  onChange={handleInputChange('redlineNumber')}
                  error={!!errors.redlineNumber}
                  helperText={errors.redlineNumber || 'Leave blank for auto-generation'}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Urgency Level</InputLabel>
                  <Select
                    value={formData.urgencyLevel}
                    onChange={handleInputChange('urgencyLevel')}
                    label="Urgency Level"
                  >
                    {urgencyLevels.map(level => (
                      <MenuItem key={level.value} value={level.value}>
                        {level.label} ({level.multiplier}x cost)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Requested By"
                  value={formData.requestedBy}
                  onChange={handleInputChange('requestedBy')}
                  error={!!errors.requestedBy}
                  helperText={errors.requestedBy}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Original Order Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Original Service Type"
                      value={formData.originalServiceType}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Original Route"
                      value={formData.originalRoute}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Original Value"
                      value={formatCurrency(formData.originalValue, formData.originalCurrency)}
                      disabled
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Requested Changes</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth required error={!!errors.requestedServiceType}>
                      <InputLabel>Requested Service Type</InputLabel>
                      <Select
                        value={formData.requestedServiceType}
                        onChange={handleInputChange('requestedServiceType')}
                        label="Requested Service Type"
                      >
                        <MenuItem value="Sea Freight">Sea Freight</MenuItem>
                        <MenuItem value="Air Freight">Air Freight</MenuItem>
                        <MenuItem value="Land Freight">Land Freight</MenuItem>
                        <MenuItem value="Express">Express</MenuItem>
                      </Select>
                      {errors.requestedServiceType && (
                        <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                          {errors.requestedServiceType}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Requested Route"
                      value={formData.requestedRoute}
                      onChange={handleInputChange('requestedRoute')}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Requested Value"
                      type="number"
                      step="0.01"
                      value={formData.requestedValue}
                      onChange={handleInputChange('requestedValue')}
                      error={!!errors.requestedValue}
                      helperText={errors.requestedValue}
                      required
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Justification"
                  multiline
                  rows={4}
                  value={formData.justification}
                  onChange={handleInputChange('justification')}
                  error={!!errors.justification}
                  helperText={errors.justification}
                  required
                />
              </Grid>

              {/* Cost Impact Preview */}
              {formData.requestedValue && formData.originalValue && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Cost Impact Analysis:</strong><br />
                      Original Value: {formatCurrency(formData.originalValue)}<br />
                      Requested Value: {formatCurrency(formData.requestedValue)}<br />
                      Difference: {formatCurrency(formData.requestedValue - formData.originalValue)}<br />
                      Urgency Multiplier: {urgencyLevels.find(l => l.value === formData.urgencyLevel)?.multiplier || 1}x<br />
                      <strong>Final Impact: {formatCurrency((formData.requestedValue - formData.originalValue) * (urgencyLevels.find(l => l.value === formData.urgencyLevel)?.multiplier || 1))}</strong>
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              Create Redline Request
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </RedlineErrorBoundary>
  );
};

export default RedlineManagement;