import React, { useState, useEffect, memo, useCallback } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  GetApp as ExportIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  Calculate as CalculateIcon,
  TrendingUp as TrendingIcon,
  Warning as WarningIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';
import dataSyncService from '../services/dataSync';
import notificationService from '../services/notificationService';
import * as XLSX from 'xlsx';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput, formatCurrencyInputLive } from '../services/currencyUtils';
import { useCostManagement } from '../hooks/useCostManagement';
import ErrorBoundary from './ErrorBoundary';

/**
 * Cost Form Component
 * Reusable form for adding/editing costs
 */
const CostForm = memo(({
  open,
  onClose,
  onSubmit,
  initialData = {},
  salesOrders = [],
  mode = 'add' // 'add' or 'edit'
}) => {
  const [formData, setFormData] = useState({
    description: '',
    vendorName: '',
    costType: '',
    amount: '',
    currency: 'IDR',
    status: 'Pending',
    salesOrderId: '',
    ...initialData
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        description: initialData.description || '',
        vendorName: initialData.vendorName || '',
        costType: initialData.costType || '',
        amount: initialData.amount?.toString() || '',
        currency: initialData.currency || 'IDR',
        status: initialData.status || 'Pending',
        salesOrderId: initialData.salesOrderId || '',
        ...initialData
      });
    } else if (mode === 'add') {
      setFormData({
        description: '',
        vendorName: '',
        costType: '',
        amount: '',
        currency: 'IDR',
        status: 'Pending',
        salesOrderId: ''
      });
    }
  }, [mode, initialData, open]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.vendorName.trim()) {
      newErrors.vendorName = 'Vendor name is required';
    }

    if (!formData.costType) {
      newErrors.costType = 'Cost type is required';
    }

    if (!formData.amount || parseFloat(formData.amount.replace(/[^\d.-]/g, '')) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((field) => (event) => {
    let value = event.target.value;

    // Special handling for amount field
    if (field === 'amount') {
      const numericValue = value.toString().replace(/[^\d.]/g, '');
      value = numericValue;
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const costData = {
        ...formData,
        amount: parseFloat(formData.amount.replace(/[^\d.-]/g, '')),
      };

      await onSubmit(costData);
      onClose();
    } catch (error) {
      console.error('Error saving cost:', error);
    } finally {
      setSaving(false);
    }
  }, [formData, validateForm, onSubmit, onClose]);

  const handleClose = useCallback(() => {
    setFormData({
      description: '',
      vendorName: '',
      costType: '',
      amount: '',
      currency: 'IDR',
      status: 'Pending',
      salesOrderId: ''
    });
    setErrors({});
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'edit' ? 'Edit Cost' : 'Add New Cost'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={handleInputChange('description')}
              error={!!errors.description}
              helperText={errors.description}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Vendor Name"
              value={formData.vendorName}
              onChange={handleInputChange('vendorName')}
              error={!!errors.vendorName}
              helperText={errors.vendorName}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!!errors.costType}>
              <InputLabel>Cost Type</InputLabel>
              <Select
                value={formData.costType}
                onChange={handleInputChange('costType')}
                label="Cost Type"
              >
                <MenuItem value="Ocean Freight">Ocean Freight</MenuItem>
                <MenuItem value="Air Freight">Air Freight</MenuItem>
                <MenuItem value="Trucking">Trucking</MenuItem>
                <MenuItem value="Terminal Handling">Terminal Handling</MenuItem>
                <MenuItem value="Customs Clearance">Customs Clearance</MenuItem>
                <MenuItem value="Documentation">Documentation</MenuItem>
                <MenuItem value="Insurance">Insurance</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={`Amount (${formData.currency})`}
              type="text"
              value={formData.amount ? formatCurrencyInputLive(formData.amount, formData.currency) : ''}
              onChange={handleInputChange('amount')}
              error={!!errors.amount}
              helperText={errors.amount}
              required
              placeholder={formatCurrencyInputLive(0, formData.currency)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Currency</InputLabel>
              <Select
                value={formData.currency}
                onChange={handleInputChange('currency')}
                label="Currency"
              >
                <MenuItem value="IDR">Indonesian Rupiah (IDR)</MenuItem>
                <MenuItem value="USD">US Dollar (USD)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              options={salesOrders}
              getOptionLabel={(option) => `${option.orderNumber} - ${option.customerName}`}
              value={salesOrders.find(so => so.id === formData.salesOrderId) || null}
              onChange={(event, newValue) => {
                setFormData(prev => ({
                  ...prev,
                  salesOrderId: newValue?.id || ''
                }));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Related Sales Order (Optional)" fullWidth />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={handleInputChange('status')}
                label="Status"
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Paid">Paid</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {saving ? 'Saving...' : (mode === 'edit' ? 'Update' : 'Add')} Cost
        </Button>
      </DialogActions>
    </Dialog>
  );
});

CostForm.displayName = 'CostForm';

/**
 * Cost Table Component
 * Displays costs in a table format with actions
 */
const CostTable = memo(({
  costs,
  salesOrders,
  onEdit,
  onDelete,
  title,
  type = 'operational'
}) => {
  const formatCurrencyDisplay = useCallback((amount, currency) => {
    return formatCurrency(amount, currency);
  }, []);

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Pending': return 'warning';
      case 'Draft': return 'info';
      case 'Rejected': return 'error';
      default: return 'default';
    }
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title} ({costs.length} items)
        </Typography>
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
              {costs.map((cost) => {
                const relatedOrder = salesOrders.find(order => order.id === cost.salesOrderId);
                return (
                  <TableRow key={cost.id} hover>
                    <TableCell>{cost.description}</TableCell>
                    <TableCell>{cost.vendorName}</TableCell>
                    <TableCell>
                      <Chip label={cost.costType} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrencyDisplay(cost.amount, cost.currency)}
                    </TableCell>
                    <TableCell>
                      {relatedOrder ? (
                        <Typography variant="body2">
                          {relatedOrder.orderNumber}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          General
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cost.status}
                        color={getStatusColor(cost.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit Cost">
                        <IconButton size="small" onClick={() => onEdit(cost)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Cost">
                        <IconButton size="small" onClick={() => onDelete(cost.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {costs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No costs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
});

CostTable.displayName = 'CostTable';

/**
 * Main Internal Cost Management Component
 * Consolidated component for all internal cost operations
 */
const InternalCostManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [costFormOpen, setCostFormOpen] = useState(false);
  const [editingCost, setEditingCost] = useState(null);
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use the cost management hook
  const {
    costs,
    loading: costsLoading,
    error,
    addCost,
    updateCost,
    deleteCost,
    formatCurrency: formatCurrencyUtil
  } = useCostManagement([]);

  // Load sales orders for reference
  useEffect(() => {
    const loadSalesOrders = async () => {
      try {
        const data = await dataSyncService.getSalesOrders();
        setSalesOrders(data || []);
      } catch (error) {
        console.error('Error loading sales orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSalesOrders();
  }, []);

  // Handle cost operations
  const handleAddCost = useCallback(async (costData) => {
    try {
      await addCost(costData, dataSyncService);
      notificationService.showSuccess('Cost added successfully');
    } catch (error) {
      notificationService.showError('Failed to add cost');
      throw error;
    }
  }, [addCost]);

  const handleEditCost = useCallback((cost) => {
    setEditingCost(cost);
    setCostFormOpen(true);
  }, []);

  const handleUpdateCost = useCallback(async (costData) => {
    try {
      await updateCost(editingCost.id, costData, dataSyncService);
      notificationService.showSuccess('Cost updated successfully');
      setEditingCost(null);
    } catch (error) {
      notificationService.showError('Failed to update cost');
      throw error;
    }
  }, [editingCost, updateCost]);

  const handleDeleteCost = useCallback(async (costId) => {
    if (window.confirm('Are you sure you want to delete this cost?')) {
      try {
        await deleteCost(costId, dataSyncService);
        notificationService.showSuccess('Cost deleted successfully');
      } catch (error) {
        notificationService.showError('Failed to delete cost');
      }
    }
  }, [deleteCost]);

  // Export functionality
  const handleExportExcel = useCallback(() => {
    try {
      const exportData = costs.map(cost => ({
        Description: cost.description,
        Vendor: cost.vendorName,
        'Cost Type': cost.costType,
        Amount: cost.amount,
        Currency: cost.currency,
        'Sales Order': salesOrders.find(so => so.id === cost.salesOrderId)?.orderNumber || 'General',
        Status: cost.status,
        'Created At': new Date(cost.createdAt).toLocaleDateString('id-ID')
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Internal Costs');
      XLSX.writeFile(wb, `Internal_Costs_${new Date().toISOString().split('T')[0]}.xlsx`);

      notificationService.showSuccess('Excel file exported successfully');
    } catch (error) {
      notificationService.showError('Failed to export Excel file');
    }
  }, [costs, salesOrders]);

  if (loading || costsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading cost management...</Typography>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Internal Cost Management</Typography>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={handleExportExcel}
            >
              Export Excel
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCostFormOpen(true)}
            >
              Add Cost
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {formatCurrencyUtil(costs.reduce((sum, cost) => sum + cost.amount, 0))}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Costs
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info">
                  {costs.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Cost Items
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning">
                  {costs.filter(cost => cost.status === 'Pending').length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Pending Approvals
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success">
                  {costs.filter(cost => cost.status === 'Paid').length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Paid Costs
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Cost Management Table */}
        <CostTable
          costs={costs}
          salesOrders={salesOrders}
          onEdit={handleEditCost}
          onDelete={handleDeleteCost}
          title="All Internal Costs"
        />

        {/* Cost Form Dialog */}
        <CostForm
          open={costFormOpen}
          onClose={() => {
            setCostFormOpen(false);
            setEditingCost(null);
          }}
          onSubmit={editingCost ? handleUpdateCost : handleAddCost}
          initialData={editingCost}
          salesOrders={salesOrders}
          mode={editingCost ? 'edit' : 'add'}
        />
      </Box>
    </ErrorBoundary>
  );
};

export default InternalCostManagement;