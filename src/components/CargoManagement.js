import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  IconButton,
  Menu,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import { Add as AddIcon, LocalShipping as ShippingIcon } from '@mui/icons-material';
import dataSyncService from '../services/dataSync';
import { useDataSync } from '../hooks/useDataSync';
import {
  useFormValidation,
  getFieldStateColor,
  getFieldStateIcon,
  FIELD_STATES,
  extendedValidationPatterns,
  freightValidationRules
} from '../services/errorHandler';

const CargoManagement = () => {
  // Use real-time data sync for cargo and sales orders
  const { data: cargo, loading: cargoLoading } = useDataSync('cargo');
  const { data: salesOrders, loading: ordersLoading } = useDataSync('salesOrders');

  const [salesOrderCargo, setSalesOrderCargo] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [selectedSalesOrder, setSelectedSalesOrder] = useState(null);

  // Enhanced validation rules for cargo form
  const validationRules = {
    description: {
      required: true,
      minLength: 3,
      patternMessage: 'Description must be at least 3 characters'
    },
    hsCode: {
      required: true,
      pattern: extendedValidationPatterns.hsCode,
      patternMessage: 'HS Code must be in format: 1234.56.7890'
    },
    quantity: {
      required: true,
      pattern: /^\d+$/,
      patternMessage: 'Quantity must be a whole number',
      custom: (value) => {
        const num = parseInt(value);
        if (num <= 0) return 'Quantity must be greater than 0';
        if (num > 100000) return 'Quantity cannot exceed 100,000';
        return true;
      }
    },
    weight: {
      ...freightValidationRules.weight,
      required: true
    },
    value: {
      ...freightValidationRules.cargoValue,
      required: true
    }
  };

  const formValidation = useFormValidation({
    description: '',
    hsCode: '',
    quantity: '',
    weight: '',
    value: ''
  }, validationRules);

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
    getFieldProps
  } = formValidation;

  // Process sales order cargo data whenever sales orders change - optimized to prevent loops
  useEffect(() => {
    if (salesOrders && salesOrders.length > 0) {
      const orderCargoItems = [];

      salesOrders.forEach(order => {
        if (order.cargoItems && order.cargoItems.length > 0) {
          order.cargoItems.forEach(item => {
            orderCargoItems.push({
              ...item,
              salesOrderId: order.id,
              salesOrderNumber: order.orderNumber,
              trackingNumber: order.shipmentDetails?.trackingNumber || 'Not booked yet',
              customerName: order.customerName,
              status: order.status,
              origin: order.origin,
              destination: order.destination,
              source: 'salesOrder'
            });
          });
        }
      });

      setSalesOrderCargo(orderCargoItems);
    }
  }, [salesOrders?.length]); // Only depend on length, not the full object

  // Initialize cargo sync only once on mount
  useEffect(() => {
    let initialized = false;

    const initializeCargoSync = async () => {
      if (!initialized) {
        try {
          await dataSyncService.syncCargoFromSalesOrders();
          initialized = true;
        } catch (error) {
          console.error('Error initializing cargo sync:', error);
        }
      }
    };

    initializeCargoSync();
  }, []); // Only run once on mount

  const handleSubmit = async () => {
    setSubmitError('');
    setSubmitSuccess('');

    const result = await validateAndSubmit(async (formData) => {
      try {
        const newCargo = {
          id: Date.now().toString(),
          ...formData,
          quantity: parseInt(formData.quantity),
          weight: parseFloat(formData.weight),
          value: parseFloat(formData.value),
          status: 'Active',
          createdAt: new Date().toISOString()
        };

        const createdCargo = await dataSyncService.createCargo(newCargo);
        setCargo(prev => [...prev, createdCargo]);
        return createdCargo;
      } catch (error) {
        console.error('Error creating cargo:', error);
        throw new Error('Failed to create cargo item. Please try again.');
      }
    });

    if (result.success) {
      setSubmitSuccess('Cargo item added successfully!');
      reset();
      setOpen(false);
      setTimeout(() => setSubmitSuccess(''), 3000);
    } else {
      setSubmitError(result.error?.message || 'Please correct the validation errors');
    }
  };

  const handleCreateFromSalesOrder = (salesOrder) => {
    setSelectedSalesOrder(salesOrder);
    // Pre-populate form with first cargo item from sales order
    if (salesOrder.cargoItems && salesOrder.cargoItems.length > 0) {
      const firstItem = salesOrder.cargoItems[0];
      formValidation.setValues({
        description: firstItem.description || `${salesOrder.cargoType} - ${salesOrder.origin} to ${salesOrder.destination}`,
        hsCode: firstItem.hsCode || '0000.00.0000',
        quantity: firstItem.quantity?.toString() || '1',
        weight: firstItem.weight?.toString() || '0',
        value: firstItem.value?.toString() || '0'
      });
    }
    setOpen(true);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleClose = (event, reason) => {
    // Don't close if clicking backdrop or escape key
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return;
    }

    setOpen(false);
    reset();
    setSubmitError('');
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Cargo Management</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<ShippingIcon />}
            onClick={() => setActiveTab(1)}
          >
            From Sales Orders ({salesOrderCargo.length})
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
          >
            Add Cargo
          </Button>
        </Box>
      </Box>

      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {submitSuccess}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label={`Standalone Cargo (${cargo.length})`} />
            <Tab label={`From Sales Orders (${salesOrderCargo.length})`} />
          </Tabs>

          {activeTab === 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell>HS Code</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Weight</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cargoLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <CircularProgress size={24} />
                        <Typography variant="body2" sx={{ mt: 1 }}>Loading cargo data...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : cargo.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="textSecondary">No standalone cargo items found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    cargo.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.hsCode}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.weight} kg</TableCell>
                      <TableCell>IDR {item.value?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip label="Active" color="success" size="small" />
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {activeTab === 1 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sales Order</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>HS Code</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Weight</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Tracking #</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ordersLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        <CircularProgress size={24} />
                        <Typography variant="body2" sx={{ mt: 1 }}>Loading sales order cargo...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : salesOrderCargo.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="textSecondary">No cargo items from sales orders found</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          Create a sales order with cargo items to see them here
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesOrderCargo.map((item, index) => (
                    <TableRow key={`${item.salesOrderId}-${index}`} hover>
                      <TableCell>
                        <Typography variant="subtitle2">{item.salesOrderNumber}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {item.customerName}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.hsCode || 'N/A'}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.weight} kg</TableCell>
                      <TableCell>IDR {item.value?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color={item.trackingNumber !== 'Not booked yet' ? 'primary' : 'textSecondary'}>
                          {item.trackingNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.status || 'Draft'}
                          color={item.status === 'Confirmed' ? 'success' : item.status === 'In Transit' ? 'primary' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add Cargo Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth disableEscapeKeyDown>
        <DialogTitle>Add New Cargo</DialogTitle>
        <DialogContent>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                {...getFieldProps('description')}
                color={getFieldStateColor(fieldStates.description)}
                InputProps={{
                  endAdornment: fieldStates.description && fieldStates.description !== FIELD_STATES.IDLE ? (
                    <Box component="span" sx={{ color: getFieldStateColor(fieldStates.description) + '.main', fontSize: '20px' }}>
                      {getFieldStateIcon(fieldStates.description)}
                    </Box>
                  ) : null
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="HS Code"
                {...getFieldProps('hsCode')}
                color={getFieldStateColor(fieldStates.hsCode)}
                placeholder="1234.56.7890"
                InputProps={{
                  endAdornment: fieldStates.hsCode && fieldStates.hsCode !== FIELD_STATES.IDLE ? (
                    <Box component="span" sx={{ color: getFieldStateColor(fieldStates.hsCode) + '.main', fontSize: '20px' }}>
                      {getFieldStateIcon(fieldStates.hsCode)}
                    </Box>
                  ) : null
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                {...getFieldProps('quantity')}
                color={getFieldStateColor(fieldStates.quantity)}
                InputProps={{
                  endAdornment: fieldStates.quantity && fieldStates.quantity !== FIELD_STATES.IDLE ? (
                    <Box component="span" sx={{ color: getFieldStateColor(fieldStates.quantity) + '.main', fontSize: '20px' }}>
                      {getFieldStateIcon(fieldStates.quantity)}
                    </Box>
                  ) : null
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Weight (kg)"
                type="number"
                step="0.01"
                {...getFieldProps('weight')}
                color={getFieldStateColor(fieldStates.weight)}
                InputProps={{
                  endAdornment: fieldStates.weight && fieldStates.weight !== FIELD_STATES.IDLE ? (
                    <Box component="span" sx={{ color: getFieldStateColor(fieldStates.weight) + '.main', fontSize: '20px' }}>
                      {getFieldStateIcon(fieldStates.weight)}
                    </Box>
                  ) : null
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Value (IDR)"
                type="number"
                step="0.01"
                {...getFieldProps('value')}
                color={getFieldStateColor(fieldStates.value)}
                InputProps={{
                  endAdornment: fieldStates.value && fieldStates.value !== FIELD_STATES.IDLE ? (
                    <Box component="span" sx={{ color: getFieldStateColor(fieldStates.value) + '.main', fontSize: '20px' }}>
                      {getFieldStateIcon(fieldStates.value)}
                    </Box>
                  ) : null
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting || Object.values(fieldStates).some(state => state === FIELD_STATES.VALIDATING)}
          >
            {isSubmitting ? 'Adding...' : 'Add Cargo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CargoManagement;