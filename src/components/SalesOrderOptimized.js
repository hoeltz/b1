import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Snackbar,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon,
  LocalShipping as ShippingIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  Send as SendIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  Menu as MenuIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
} from '@mui/icons-material';
import {
  customerService,
  vendorService,
} from '../services/localStorage';
import dataSyncService from '../services/dataSync';
import {
  INDONESIAN_CITIES,
  COUNTRIES,
  CURRENCIES,
  PACKAGE_TYPES,
  SERVICE_TYPES,
  STANDARD_COSTS,
  ORDER_TYPES,
} from '../data/locationData';
import {
  handleError,
  showSuccessToast,
  showErrorToast,
  useFormValidation,
  getFieldStateColor,
  getFieldStateIcon,
  FIELD_STATES,
  freightValidationRules
} from '../services/errorHandler';
import notificationService from '../services/notificationService';
import { formatCurrency } from '../services/currencyUtils';

// Import optimized components and hooks
import { useSalesOrderForm } from '../hooks/useSalesOrderForm';
import CargoItemsManager from './CargoItemsManager';
import ErrorBoundary, { FormErrorBoundary } from './ErrorBoundary';

/**
 * Basic Information Tab Component
 * Handles customer selection, route, and service type
 */
const BasicInfoTab = memo(({
  values,
  fieldStates,
  getFieldProps,
  getFieldStateColor,
  getFieldStateIcon,
  FIELD_STATES,
  handleFieldChange,
  onCustomerChange,
  onVendorChange,
  onPackageTypeChange,
  customers,
  vendors
}) => {
  const getLocationOptions = useCallback(() => {
    return values.packageType === 'Domestic' ? INDONESIAN_CITIES : COUNTRIES;
  }, [values.packageType]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Order Type</InputLabel>
          <Select
            name="orderType"
            value={values.orderType || 'REG'}
            onChange={(e) => handleFieldChange('orderType', e.target.value)}
            label="Order Type"
          >
            {ORDER_TYPES.map((type) => (
              <MenuItem key={`order-type-${type.value}`} value={type.value}>
                <Box>
                  <Typography variant="body2" fontWeight="bold">{type.label}</Typography>
                  <Typography variant="caption" color="textSecondary">{type.description}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <Autocomplete
          options={customers}
          getOptionLabel={(option) => `${option.name} (${option.type})`}
          value={customers.find(c => c.id === values.customerId) || null}
          onChange={onCustomerChange}
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
            onChange={onPackageTypeChange}
            label="Package Type"
          >
            {PACKAGE_TYPES.map((type, index) => (
              <MenuItem key={`package-${index}`} value={type.value}>
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
          onChange={(e, value) => {
            if (handleFieldChange) {
              handleFieldChange('origin', value || '');
            }
          }}
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
          onChange={(e, value) => {
            if (handleFieldChange) {
              handleFieldChange('destination', value || '');
            }
          }}
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
            onChange={handleFieldChange}
            label="Service Type"
          >
            {SERVICE_TYPES.map((type, index) => (
              <MenuItem key={`service-${index}`} value={type}>
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
            onChange={handleFieldChange}
            label="Priority"
          >
            <MenuItem key="priority-low" value="Low">Low</MenuItem>
            <MenuItem key="priority-normal" value="Normal">Normal</MenuItem>
            <MenuItem key="priority-high" value="High">High</MenuItem>
            <MenuItem key="priority-urgent" value="Urgent">Urgent</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
});

BasicInfoTab.displayName = 'BasicInfoTab';

/**
 * Vendor and Shipment Tab Component
 */
const VendorShipmentTab = memo(({
  values,
  onVendorChange,
  vendors,
  onBookShipment,
  shipmentDetails,
  setValues
}) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Autocomplete
          options={vendors}
          getOptionLabel={(option) => `${option.name} (${option.serviceType})`}
          value={vendors.find(v => v.id === values.vendorId) || null}
          onChange={onVendorChange}
          renderInput={(params) => (
            <TextField {...params} label="Select Vendor/Provider" fullWidth />
          )}
        />
      </Grid>

      {shipmentDetails && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Shipment Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tracking Number"
                    value={shipmentDetails.trackingNumber}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Status"
                    value={shipmentDetails.status}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Estimated Departure"
                    type="date"
                    value={shipmentDetails?.estimatedDeparture || ''}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      if (setValues) {
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
                      }
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Estimated Arrival"
                    type="date"
                    value={shipmentDetails?.estimatedArrival || ''}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      if (setValues) {
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
                      }
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
              <Box mt={2}>
                <Button
                  variant="contained"
                  startIcon={<ShippingIcon />}
                  onClick={onBookShipment}
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
  );
});

VendorShipmentTab.displayName = 'VendorShipmentTab';

/**
 * Review and Submit Tab Component
 */
const ReviewSubmitTab = memo(({
  values,
  fieldStates,
  getFieldProps,
  getFieldStateColor,
  getFieldStateIcon,
  FIELD_STATES,
  onStatusChange,
  onGenerateInvoice,
  isSubmitting,
  onRedlineRequest,
  bookShipment
}) => {
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'Confirmed': return 'success';
      case 'In Transit': return 'primary';
      case 'Delivered': return 'default';
      case 'Cancelled': return 'error';
      case 'Draft': return 'warning';
      default: return 'info';
    }
  }, []);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Review & Submit</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Order Summary</Typography>
              <Typography>Customer: {values.customerName || 'Not specified'}</Typography>
              <Typography>Route: {values.origin || 'N/A'} → {values.destination || 'N/A'}</Typography>
              <Typography>Service: {values.serviceType || 'Not specified'}</Typography>
              <Typography>Package Type: {values.packageType || 'Not specified'}</Typography>
              <Typography>Priority: {values.priority || 'Normal'}</Typography>
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
                      onClick={() => onStatusChange('Confirmed')}
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
                      onClick={() => onStatusChange('In Transit')}
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
                      onClick={onRedlineRequest}
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
                    onClick={() => onStatusChange('Delivered')}
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
               <Typography variant="subtitle1" gutterBottom>Cost Breakdown</Typography>
               {values.cargoItems && values.cargoItems.length > 0 ? (
                 <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                   <Table size="small">
                     <TableHead>
                       <TableRow>
                         <TableCell>Item</TableCell>
                         <TableCell align="right">Freight Cost</TableCell>
                         <TableCell align="right">Insurance Cost</TableCell>
                         <TableCell align="right">Total Cost</TableCell>
                       </TableRow>
                     </TableHead>
                     <TableBody>
                       {values.cargoItems.map((item, index) => {
                         const freightCost = item.currency === 'USD' ? (item.freightCostUSD || 0) : (item.freightCost || 0);
                         const insuranceCost = item.currency === 'USD' ? (item.insuranceCostUSD || 0) : (item.insuranceCost || 0);
                         const totalCost = freightCost + insuranceCost;
                         const currencySymbol = item.currency === 'USD' ? '$' : 'IDR';

                         return (
                           <TableRow key={index}>
                             <TableCell>
                               <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                 {item.description || `Item ${index + 1}`}
                               </Typography>
                             </TableCell>
                             <TableCell align="right">
                               <Typography variant="body2">
                                 {currencySymbol}{freightCost.toLocaleString()}
                               </Typography>
                             </TableCell>
                             <TableCell align="right">
                               <Typography variant="body2">
                                 {currencySymbol}{insuranceCost.toLocaleString()}
                               </Typography>
                             </TableCell>
                             <TableCell align="right">
                               <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                 {currencySymbol}{totalCost.toLocaleString()}
                               </Typography>
                             </TableCell>
                           </TableRow>
                         );
                       })}
                       <TableRow>
                         <TableCell sx={{ fontWeight: 'bold' }}>TOTAL</TableCell>
                         <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                           {values.cargoItems.reduce((sum, item) => {
                             const cost = item.currency === 'USD' ? (item.freightCostUSD || 0) : (item.freightCost || 0);
                             return sum + cost;
                           }, 0).toLocaleString()}
                         </TableCell>
                         <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                           {values.cargoItems.reduce((sum, item) => {
                             const cost = item.currency === 'USD' ? (item.insuranceCostUSD || 0) : (item.insuranceCost || 0);
                             return sum + cost;
                           }, 0).toLocaleString()}
                         </TableCell>
                         <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                           {values.cargoItems.reduce((sum, item) => {
                             const freight = item.currency === 'USD' ? (item.freightCostUSD || 0) : (item.freightCost || 0);
                             const insurance = item.currency === 'USD' ? (item.insuranceCostUSD || 0) : (item.insuranceCost || 0);
                             return sum + freight + insurance;
                           }, 0).toLocaleString()}
                         </TableCell>
                       </TableRow>
                     </TableBody>
                   </Table>
                 </TableContainer>
               ) : (
                 <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                   No cargo items added yet. Add items in the Cargo Details tab to see cost breakdown.
                 </Typography>
               )}
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
              if (setValues) {
                setValues(prev => {
                  if (prev.specialInstructions !== newValue) {
                    return { ...prev, specialInstructions: newValue };
                  }
                  return prev;
                });
              }
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
});

ReviewSubmitTab.displayName = 'ReviewSubmitTab';

/**
 * Optimized Sales Order Form Component
 */
const SalesOrderFormOptimized = memo(({
  open,
  onClose,
  salesOrder,
  onSave
}) => {
  // Load supporting data
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [hsCodes, setHSCodes] = useState([]);

  // Use optimized form hook
  const formHook = useSalesOrderForm(salesOrder);

  const {
    values,
    errors,
    fieldStates,
    isSubmitting,
    activeTab,
    snackbar,
    setActiveTab,
    setSnackbar,
    setValues,
    handleFieldChange,
    getFieldProps,
    addCargoItem,
    updateCargoItem,
    removeCargoItem,
    bookShipment,
    generateInvoice,
    handleSubmit
  } = formHook;

  // Load data effect with retry mechanism
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000;

    const loadData = async () => {
      try {
        console.log('Loading form data, attempt:', retryCount + 1);

        // Check if services are available
        if (!customerService || !vendorService || !dataSyncService) {
          console.warn('Services not yet available, retrying...');
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(() => loadData(), retryDelay);
            return;
          } else {
            console.error('Services still not available after retries');
            setCustomers([]);
            setVendors([]);
            setHSCodes([]);
            return;
          }
        }

        // Load customers with error handling
        try {
          if (customerService?.getAll) {
            const customersData = customerService.getAll();
            console.log('Loaded customers:', customersData?.length || 0);
            setCustomers(customersData || []);
          } else {
            console.warn('customerService.getAll method not available');
            setCustomers([]);
          }
        } catch (customerError) {
          console.error('Error loading customers:', customerError);
          setCustomers([]);
        }

        // Load vendors with error handling
        try {
          if (vendorService?.getAll) {
            const vendorsData = vendorService.getAll();
            console.log('Loaded vendors:', vendorsData?.length || 0);
            setVendors(vendorsData || []);
          } else {
            console.warn('vendorService.getAll method not available');
            setVendors([]);
          }
        } catch (vendorError) {
          console.error('Error loading vendors:', vendorError);
          setVendors([]);
        }

        // Load HS Codes with error handling
        try {
          if (dataSyncService?.getHSCodes) {
            const hsCodesData = await dataSyncService.getHSCodes() || [];
            console.log('Loaded HS Codes:', hsCodesData?.length || 0);
            setHSCodes(hsCodesData);
          } else {
            console.warn('dataSyncService.getHSCodes method not available');
            setHSCodes([]);
          }
        } catch (hsError) {
          console.error('Error loading HS Codes:', hsError);
          setHSCodes([]);
        }

        console.log('Form data loaded successfully');
      } catch (error) {
        console.error('Error loading form data:', error);
        // Set empty arrays as fallback
        setCustomers([]);
        setVendors([]);
        setHSCodes([]);
      }
    };

    if (open) {
      // Small delay to allow services to initialize
      const timeoutId = setTimeout(() => {
        retryCount = 0;
        loadData();
      }, 100);

      // Cleanup timeout on unmount or when open changes
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [open]);

  // Optimized event handlers
  const handleCustomerChange = useCallback((event, newValue) => {
    const customerId = newValue?.id || '';
    const customerName = newValue?.name || '';

    setValues(prev => {
      if (prev.customerId !== customerId || prev.customerName !== customerName) {
        return {
          ...prev,
          customerId,
          customerName,
        };
      }
      return prev;
    });
  }, [setValues]);

  const handleVendorChange = useCallback((event, newValue) => {
    const vendorId = newValue?.id || '';
    const vendorName = newValue?.name || '';

    setValues(prev => {
      if (prev.vendorId !== vendorId || prev.vendorName !== vendorName) {
        return {
          ...prev,
          vendorId,
          vendorName,
        };
      }
      return prev;
    });
  }, [setValues]);

  const handlePackageTypeChange = useCallback((e) => {
    const packageType = e.target.value;

    setValues(prev => {
      if (prev.packageType !== packageType) {
        return {
          ...prev,
          packageType,
          origin: '',
          destination: '',
          originCountry: packageType === 'Domestic' ? 'Indonesia' : '',
          destinationCountry: packageType === 'Domestic' ? 'Indonesia' : '',
        };
      }
      return prev;
    });
  }, [setValues]);

  const handleStatusChange = useCallback(async (newStatus) => {
    try {
      const updatedOrder = await dataSyncService.changeSalesOrderStatus(values.id || 'new', newStatus, {
        includeShipment: true,
        updateDashboard: true,
        sendNotifications: true
      });

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
  }, [values.id, setValues, setSnackbar]);

  const handleRedlineRequest = useCallback(() => {
    // For now, just show a notification - redline functionality can be added later
    notificationService.showInfo('Redline request functionality will be available soon');
  }, []);

  // Export functions
  const exportToPDF = useCallback(() => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text('SALES ORDER QUOTATION', 105, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.text(`Order Number: ${values.orderNumber || 'Draft'}`, 20, 35);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 42);
      doc.text(`Order Type: ${ORDER_TYPES.find(t => t.value === values.orderType)?.label || values.orderType}`, 20, 49);

      // Customer Info
      doc.text('CUSTOMER INFORMATION', 20, 65);
      doc.setFontSize(10);
      doc.text(`Name: ${values.customerName || 'Not specified'}`, 20, 75);
      doc.text(`Route: ${values.origin || 'N/A'} → ${values.destination || 'N/A'}`, 20, 82);
      doc.text(`Service: ${values.serviceType || 'N/A'}`, 20, 89);
      doc.text(`Package Type: ${values.packageType || 'N/A'}`, 20, 96);

      // Cargo Details
      doc.setFontSize(12);
      doc.text('CARGO DETAILS', 20, 115);

      const cargoData = values.cargoItems.map(item => [
        item.description || 'N/A',
        `${item.weight || 0} kg`,
        `${item.volume || 0} cbm`,
        `${item.value || 0}`,
        item.hsCode || 'N/A'
      ]);

      doc.autoTable({
        startY: 125,
        head: [['Description', 'Weight', 'Volume', 'Value', 'HS Code']],
        body: cargoData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });

      // Financial Summary
      const finalY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.text('FINANCIAL SUMMARY', 20, finalY);

      doc.setFontSize(10);
      doc.text(`Estimated Cost: ${formatCurrency(values.estimatedCost)}`, 20, finalY + 10);
      doc.text(`Selling Price: ${formatCurrency(values.sellingPrice)}`, 20, finalY + 17);
      doc.text(`Margin: ${formatCurrency(values.margin)}`, 20, finalY + 24);

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.text('This quotation is valid for 30 days from the date of issue.', 20, pageHeight - 20);

      doc.save(`Sales_Order_${values.orderNumber || 'Draft'}.pdf`);
      setSnackbar({ open: true, message: 'PDF exported successfully!', severity: 'success' });
    } catch (error) {
      console.error('PDF export error:', error);
      setSnackbar({ open: true, message: 'Failed to export PDF', severity: 'error' });
    }
  }, [values, setSnackbar]);

  const exportToExcel = useCallback(() => {
    try {
      const workbook = XLSX.utils.book_new();

      // Main order data
      const orderData = [{
        'Order Number': values.orderNumber || 'Draft',
        'Order Type': ORDER_TYPES.find(t => t.value === values.orderType)?.label || values.orderType,
        'Customer': values.customerName || 'Not specified',
        'Origin': values.origin || 'N/A',
        'Destination': values.destination || 'N/A',
        'Service Type': values.serviceType || 'N/A',
        'Package Type': values.packageType || 'N/A',
        'Priority': values.priority || 'Normal',
        'Estimated Cost': values.estimatedCost || 0,
        'Selling Price': values.sellingPrice || 0,
        'Margin': values.margin || 0,
        'Status': values.status || 'Draft',
        'Created Date': new Date().toLocaleDateString()
      }];

      const orderSheet = XLSX.utils.json_to_sheet(orderData);
      XLSX.utils.book_append_sheet(workbook, orderSheet, 'Order Summary');

      // Cargo items
      if (values.cargoItems && values.cargoItems.length > 0) {
        const cargoData = values.cargoItems.map(item => ({
          'Description': item.description || 'N/A',
          'Weight (kg)': item.weight || 0,
          'Volume (cbm)': item.volume || 0,
          'Value': item.value || 0,
          'HS Code': item.hsCode || 'N/A',
          'Container Type': item.containerType || 'N/A',
          'Container Size': item.containerSize || 'N/A',
          'Hazardous': item.hazardous ? 'Yes' : 'No'
        }));

        const cargoSheet = XLSX.utils.json_to_sheet(cargoData);
        XLSX.utils.book_append_sheet(workbook, cargoSheet, 'Cargo Details');
      }

      XLSX.writeFile(workbook, `Sales_Order_${values.orderNumber || 'Draft'}.xlsx`);
      setSnackbar({ open: true, message: 'Excel exported successfully!', severity: 'success' });
    } catch (error) {
      console.error('Excel export error:', error);
      setSnackbar({ open: true, message: 'Failed to export Excel', severity: 'error' });
    }
  }, [values, setSnackbar]);


  const steps = ['Basic Info', 'Cargo Details', 'Vendor & Shipment', 'Review & Submit'];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {salesOrder ? 'Edit Sales Order' : 'Create New Sales Order'}
      </DialogTitle>

      <DialogContent>
        <FormErrorBoundary>
          <Box sx={{ width: '100%', mt: 2 }}>
            <Stepper activeStep={activeTab} alternativeLabel>
              {steps.map((label, index) => (
                <Step key={`step-${index}`}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ mt: 3 }}>
              {activeTab === 0 && (
                <BasicInfoTab
                  values={values}
                  fieldStates={fieldStates}
                  getFieldProps={getFieldProps}
                  getFieldStateColor={getFieldStateColor}
                  getFieldStateIcon={getFieldStateIcon}
                  FIELD_STATES={FIELD_STATES}
                  handleFieldChange={handleFieldChange}
                  onCustomerChange={handleCustomerChange}
                  onVendorChange={handleVendorChange}
                  onPackageTypeChange={handlePackageTypeChange}
                  customers={customers || []}
                  vendors={vendors || []}
                />
              )}

              {activeTab === 1 && (
                <CargoItemsManager
                  cargoItems={values.cargoItems || []}
                  onAddItem={addCargoItem}
                  onUpdateItem={updateCargoItem}
                  onRemoveItem={removeCargoItem}
                  hsCodes={hsCodes || []}
                  getFieldProps={getFieldProps}
                  getFieldStateColor={getFieldStateColor}
                  getFieldStateIcon={getFieldStateIcon}
                  FIELD_STATES={FIELD_STATES}
                />
              )}


              {activeTab === 2 && (
                <VendorShipmentTab
                  values={values}
                  onVendorChange={handleVendorChange}
                  vendors={vendors || []}
                  onBookShipment={bookShipment}
                  shipmentDetails={values.shipmentDetails || {}}
                  setValues={setValues}
                />
              )}

              {activeTab === 3 && (
                <ReviewSubmitTab
                  values={values}
                  fieldStates={fieldStates}
                  getFieldProps={getFieldProps}
                  getFieldStateColor={getFieldStateColor}
                  getFieldStateIcon={getFieldStateIcon}
                  FIELD_STATES={FIELD_STATES}
                  onStatusChange={handleStatusChange}
                  onGenerateInvoice={generateInvoice}
                  isSubmitting={isSubmitting}
                  onRedlineRequest={handleRedlineRequest}
                  bookShipment={bookShipment}
                />
              )}
            </Box>
          </Box>
        </FormErrorBoundary>
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
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              onClick={exportToPDF}
              variant="outlined"
              startIcon={<PdfIcon />}
              color="error"
              disabled={!values.customerId || isSubmitting}
            >
              Export PDF
            </Button>
            <Button
              onClick={exportToExcel}
              variant="outlined"
              startIcon={<ExcelIcon />}
              color="success"
              disabled={!values.customerId || isSubmitting}
            >
              Export Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<PdfIcon />}
              color="primary"
              disabled={!values.customerId || isSubmitting}
              onClick={() => {
                // Preview functionality will be implemented
                setSnackbar({ open: true, message: 'Preview functionality coming soon!', severity: 'info' });
              }}
            >
              Preview
            </Button>
            <Button
              onClick={() => generateInvoice(dataSyncService)}
              variant="outlined"
              startIcon={<ReceiptIcon />}
              disabled={!values.customerId || values.status !== 'Delivered' || isSubmitting}
            >
              Generate Invoice
            </Button>
            <Button
              onClick={() => handleSubmit(onSave)}
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={isSubmitting || Object.values(fieldStates).some(state => state === FIELD_STATES.VALIDATING)}
            >
              {isSubmitting ? 'Saving...' : (salesOrder ? 'Update' : 'Create') + ' Order'}
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
    </Dialog>
  );
});

SalesOrderFormOptimized.displayName = 'SalesOrderFormOptimized';

/**
 * Optimized Sales Order Component
 */
const SalesOrderOptimized = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Optimized data loading
  const loadOrders = useCallback(async () => {
    try {
      const data = await dataSyncService.getSalesOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading sales orders:', error);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Optimized event handlers
  const handleAdd = useCallback(() => {
    setSelectedOrder(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(async (orderData) => {
    try {
      if (selectedOrder) {
        const result = await dataSyncService.updateSalesOrder(selectedOrder.id, orderData);
        notificationService.showSuccess('Sales order updated successfully');
        return result;
      } else {
        const newOrder = await dataSyncService.createSalesOrder(orderData);
        notificationService.showSuccess(`Sales order ${newOrder.orderNumber} created successfully`);
        return newOrder;
      }
    } catch (error) {
      notificationService.showError(`Failed to save sales order: ${error.message}`);
      throw error;
    }
  }, [selectedOrder]);

  // Menu handlers
  const handleMenuOpen = useCallback((event, orderId) => {
    // For now, just a placeholder - can be extended for context menu
    console.log('Menu opened for order:', orderId);
  }, []);

  // Optimized filtering
  const filteredOrders = useMemo(() => {
    return orders.filter(order =>
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.origin?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  // Helper functions
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'Confirmed': return 'success';
      case 'In Transit': return 'primary';
      case 'Delivered': return 'default';
      case 'Cancelled': return 'error';
      case 'Draft': return 'warning';
      default: return 'info';
    }
  }, []);

  const getPriorityColor = useCallback((priority) => {
    switch (priority) {
      case 'Urgent': return 'error';
      case 'High': return 'warning';
      case 'Normal': return 'info';
      case 'Low': return 'default';
      default: return 'default';
    }
  }, []);

  return (
    <ErrorBoundary>
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
                    <Box display="flex" gap={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(order)}
                        color="primary"
                        title="Edit Order"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, order.id)}
                        title="More Options"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <SalesOrderFormOptimized
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          salesOrder={selectedOrder}
          onSave={handleSave}
        />
      </Box>
    </ErrorBoundary>
  );
};

export default SalesOrderOptimized;