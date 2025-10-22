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
  Divider,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormLabel,
  Switch,
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
  Email as EmailIcon,
  Sms as SmsIcon,
} from '@mui/icons-material';
import {
  customerService,
  vendorService,
  quotationService,
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
  INDONESIAN_CAPITALS_LIST,
  INTERNATIONAL_COUNTRIES_LIST,
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
import {
  formatCurrency,
  formatCurrencyInput,
  parseCurrencyInput,
  getCurrencySymbol,
  formatNumber
} from '../services/currencyUtils';


// Import optimized components and hooks
import ErrorBoundary, { FormErrorBoundary } from './ErrorBoundary';

/**
 * Custom hook for Quotation form management
 */
const useQuotationForm = (initialValues = {}, validationRules = {}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Memoized initial form values
  const defaultValues = useMemo(() => ({
    customerId: '',
    customerName: '',
    customerType: 'Corporate',
    customerAddress: '',
    customerPhone: '',
    customerEmail: '',
    // Route type selection
    routeType: 'Domestic', // Domestic or International
    orderType: 'REG',
    packageType: 'Domestic',
    origin: '',
    originCountry: 'Indonesia',
    destination: '',
    destinationCountry: '',
    serviceType: 'Sea Freight',
    priority: 'Normal',
    transitTime: '',
    freeTime: '',
    estimatedCost: '',
    sellingPrice: '',
    margin: '',
    specialInstructions: '',
    paymentMethod: 'Bank Transfer',
    paymentTerms: 'Net 30',
    currency: 'IDR',
    exchangeRate: 15000, // Default USD to IDR rate
    // Tax & Duty calculations
    importDuty: 0,
    vat: 11,
    excise: 0,
    // Cargo value for tax calculation (will be calculated from cargo items)
    cargoValueForTax: 0,
    // Additional service costs with dual currency
    customsClearanceFee: 0,
    customsClearanceFeeUSD: 0,
    customsClearanceCurrency: 'IDR',
    documentationFee: 0,
    documentationFeeUSD: 0,
    documentationCurrency: 'IDR',
    thcFee: 0,
    thcFeeUSD: 0,
    thcCurrency: 'IDR',
    otherFees: 0,
    otherFeesUSD: 0,
    otherFeesCurrency: 'IDR',
    // Insurance settings
    insuranceCoverage: 110,
    insuranceType: 'All Risk',
    // Terms & Conditions
    liabilityTerms: 'PT. Bakhtera 6 MGN liability is limited to the freight charges only. We act as agents only and are not responsible for any loss or damage to cargo unless caused by our negligence.',
    forceMajeureTerms: 'Neither party shall be liable for any failure or delay in performance under this agreement which is due to fire, flood, earthquake, elements of nature or acts of God, acts of war, terrorism, riots, civil disorders, rebellions or revolutions, or any other cause beyond the reasonable control of such party.',
    additionalTerms: '',
    includeStandardTerms: true,
    // Cargo items array - updated structure
    cargoItems: [],
    // Status tracking
    status: 'Draft',
    quotationNumber: '',
    validUntil: '',
    notes: '',
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

  // Generate quotation number automatically
  const generateQuotationNumber = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    // Get quotation type code
    const typeCode = values.orderType === 'REG' ? 'R' : values.orderType === 'PAM' ? 'P' : 'J';

    // Get current quotations for this month to determine next number
    const quotations = quotationService.getAll() || [];
    const currentMonthQuotations = quotations.filter(q => {
      if (!q.createdAt) return false;
      const createdDate = new Date(q.createdAt);
      return createdDate.getFullYear() === now.getFullYear() &&
             (createdDate.getMonth() + 1) === (now.getMonth() + 1);
    });

    const nextNumber = (currentMonthQuotations.length + 1).toString().padStart(5, '0');
    const quotationNumber = `Q${typeCode}${year}${month}${nextNumber}`;

    setValues(prev => ({
      ...prev,
      quotationNumber,
      validUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }));
  }, [values.orderType, setValues]);

  // Auto-generate quotation number when form opens
  useEffect(() => {
    if (!values.quotationNumber) {
      generateQuotationNumber();
    }
  }, [generateQuotationNumber, values.quotationNumber]);

  // Cargo items management functions
  const addCargoItem = useCallback(() => {
    const newItem = {
      id: Date.now().toString(),
      description: '',
      weight: 0,
      volume: 0,
      value: 0,
      currency: 'IDR',
      hsCode: '',
      hsCodeDescription: '',
      importDuty: 0,
      vat: 11,
      excise: 0,

      // Origin costs
      pickupCharge: 0,
      pickupChargeUSD: 0,
      exportDocumentationFee: 0,
      exportDocumentationFeeUSD: 0,
      originTHC: 0,
      originTHCUSD: 0,
      vgmFee: 0,
      vgmFeeUSD: 0,

      // Freight costs
      basicFreight: 0,
      basicFreightUSD: 0,
      bunkerSurcharge: 0,
      bunkerSurchargeUSD: 0,
      securitySurcharge: 0,
      securitySurchargeUSD: 0,
      warRiskSurcharge: 0,
      warRiskSurchargeUSD: 0,

      // Destination costs
      importDocumentationFee: 0,
      importDocumentationFeeUSD: 0,
      destinationTHC: 0,
      destinationTHCUSD: 0,
      deliveryCharge: 0,
      deliveryChargeUSD: 0,

      // Additional costs
      storageFee: 0,
      storageFeeUSD: 0,
      detentionFee: 0,
      detentionFeeUSD: 0,
      specialHandlingFee: 0,
      specialHandlingFeeUSD: 0,

      // Insurance
      insuranceCost: 0,
      insuranceCostUSD: 0,

      // Container details
      containerType: '20DC',
      containerNumber: '',
      sealNumber: '',

      // Regulatory
      certificateRequired: false,
      inspectionRequired: false,
      quarantineRequired: false,

      // Other
      hazardous: false,
      createdAt: new Date().toISOString()
    };

    setValues(prev => ({
      ...prev,
      cargoItems: [...(prev.cargoItems || []), newItem]
    }));
  }, [setValues]);

  const updateCargoItem = useCallback((itemId, field, value) => {
    setValues(prev => ({
      ...prev,
      cargoItems: (prev.cargoItems || []).map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    }));
  }, [setValues]);

  const removeCargoItem = useCallback((itemId) => {
    setValues(prev => ({
      ...prev,
      cargoItems: (prev.cargoItems || []).filter(item => item.id !== itemId)
    }));
  }, [setValues]);


  // Calculate totals
  const calculateTotals = useCallback(() => {
    // Calculate additional service costs with dual currency
    const customsClearanceFee = values.customsClearanceCurrency === 'USD' ?
      ((values.customsClearanceFeeUSD || 0)) * (values.exchangeRate || 15000) :
      (values.customsClearanceFee || 0);

    const documentationFee = values.documentationCurrency === 'USD' ?
      (values.documentationFeeUSD || 0) * (values.exchangeRate || 15000) :
      (values.documentationFee || 0);

    const thcFee = values.thcCurrency === 'USD' ?
      (values.thcFeeUSD || 0) * (values.exchangeRate || 15000) :
      (values.thcFee || 0);

    const otherFees = values.otherFeesCurrency === 'USD' ?
      (values.otherFeesUSD || 0) * (values.exchangeRate || 15000) :
      (values.otherFees || 0);

    const subtotal = (customsClearanceFee || 0) + (documentationFee || 0) + (thcFee || 0) + (otherFees || 0);

    // Calculate cargo value for tax calculation from actual cargo items
    const cargoValueForTax = values.cargoItems?.reduce((total, item) => {
      const itemValue = item.currency === 'USD' ?
        (item.value || 0) * (values.exchangeRate || 15000) :
        (item.value || 0);
      return total + (itemValue || 0);
    }, 0) || 0;

    // Use actual cargo value for tax calculation, fallback to manual input or default
    const taxBaseValue = cargoValueForTax || values.cargoValueForTax || 100000000;

    const importDuty = (taxBaseValue || 0) * ((values.importDuty || 0) / 100);
    const vatBase = (taxBaseValue || 0) + (importDuty || 0);
    const vat = (vatBase || 0) * ((values.vat || 0) / 100);
    const excise = (taxBaseValue || 0) * ((values.excise || 0) / 100);

    const totalTax = (importDuty || 0) + (vat || 0) + (excise || 0);
    const grandTotal = (subtotal || 0) + (totalTax || 0);

    return {
      customsClearanceFee: customsClearanceFee || 0,
      documentationFee: documentationFee || 0,
      thcFee: thcFee || 0,
      otherFees: otherFees || 0,
      subtotal: subtotal || 0,
      importDuty: importDuty || 0,
      vat: vat || 0,
      excise: excise || 0,
      totalTax: totalTax || 0,
      grandTotal: grandTotal || 0,
      cargoValueForTax: taxBaseValue || 0
    };
  }, [values]);

  const totals = useMemo(() => calculateTotals(), [calculateTotals]);

  // Auto-calculate margin when selling price or estimated cost changes
  useEffect(() => {
    if (values.sellingPrice && (values.estimatedCost || totals.grandTotal > 0)) {
      const cost = parseFloat(values.estimatedCost) || totals.grandTotal;
      const price = parseFloat(values.sellingPrice) || 0;
      const margin = price - cost;

      if (Math.abs(parseFloat(values.margin || 0) - margin) > 0.01) {
        setValues(prev => ({
          ...prev,
          margin: margin.toString(),
        }));
      }
    }
  }, [values.sellingPrice, values.estimatedCost, totals.grandTotal, values.margin, setValues]);

  // Optimized form submission
  const handleSubmit = useCallback(async (onSave) => {
    if (isSubmitting) return;

    try {
      const result = await validateAndSubmit(async (formData) => {
        const quotationData = {
          ...formData,
          ...totals,
          status: formData.status || 'Draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        return await onSave(quotationData);
      });

      if (result) {
        setSnackbar({ open: true, message: `Quotation ${values.quotationNumber} ${values.id ? 'updated' : 'created'} successfully!`, severity: 'success' });
        return { success: true, data: result };
      } else {
        setSnackbar({ open: true, message: 'Please correct the validation errors', severity: 'error' });
        return { success: false };
      }
    } catch (error) {
      setSnackbar({ open: true, message: `Error saving quotation: ${error.message}`, severity: 'error' });
      throw error;
    }
  }, [isSubmitting, validateAndSubmit, totals, values.id, values.quotationNumber, setSnackbar]);

  return {
    // Form state
    values,
    errors,
    touched,
    fieldStates,
    isSubmitting,
    activeTab,
    snackbar,
    totals,

    // Form actions
    setActiveTab,
    setSnackbar,
    setValues,
    handleFieldChange,
    handleFieldBlur,
    getFieldProps,

    // Cargo items management
    addCargoItem,
    updateCargoItem,
    removeCargoItem,

    // Actions
    handleSubmit,
    generateQuotationNumber,

    // Utilities
    formValidation
  };
};

/**
 * Customer Information Tab Component
 */
const CustomerInfoTab = memo(({
  values,
  fieldStates,
  getFieldProps,
  getFieldStateColor,
  getFieldStateIcon,
  FIELD_STATES,
  handleFieldChange,
  customers
}) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Autocomplete
          options={customers}
          getOptionLabel={(option) => `${option.name} (${option.type})`}
          value={customers.find(c => c.id === values.customerId) || null}
          onChange={(event, newValue) => {
            handleFieldChange('customerId', newValue?.id || '');
            handleFieldChange('customerName', newValue?.name || '');
            handleFieldChange('customerType', newValue?.type || 'Corporate');
            handleFieldChange('customerAddress', newValue?.address || '');
            handleFieldChange('customerPhone', newValue?.phone || '');
            handleFieldChange('customerEmail', newValue?.email || '');
          }}
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
        <TextField
          fullWidth
          label="Customer Name"
          value={values.customerName || ''}
          onChange={(e) => handleFieldChange('customerName', e.target.value)}
          {...getFieldProps('customerName')}
          color={getFieldStateColor(fieldStates.customerName)}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Customer Type</InputLabel>
          <Select
            name="customerType"
            value={values.customerType || 'Corporate'}
            onChange={(e) => handleFieldChange('customerType', e.target.value)}
            label="Customer Type"
          >
            <MenuItem value="Corporate">Corporate</MenuItem>
            <MenuItem value="Individual">Individual</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Phone Number"
          value={values.customerPhone || ''}
          onChange={(e) => handleFieldChange('customerPhone', e.target.value)}
          {...getFieldProps('customerPhone')}
          color={getFieldStateColor(fieldStates.customerPhone)}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Email Address"
          type="email"
          value={values.customerEmail || ''}
          onChange={(e) => handleFieldChange('customerEmail', e.target.value)}
          {...getFieldProps('customerEmail')}
          color={getFieldStateColor(fieldStates.customerEmail)}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Address"
          multiline
          rows={3}
          value={values.customerAddress || ''}
          onChange={(e) => handleFieldChange('customerAddress', e.target.value)}
          {...getFieldProps('customerAddress')}
          color={getFieldStateColor(fieldStates.customerAddress)}
        />
      </Grid>
    </Grid>
  );
});

CustomerInfoTab.displayName = 'CustomerInfoTab';

/**
 * Route & Service Details Tab Component
 */
const RouteServiceTab = memo(({
  values,
  fieldStates,
  getFieldProps,
  getFieldStateColor,
  getFieldStateIcon,
  FIELD_STATES,
  handleFieldChange
}) => {
  // Get location options based on route type
  const getLocationOptions = () => {
    if (values.routeType === 'International') {
      return INTERNATIONAL_COUNTRIES_LIST;
    }
    return INDONESIAN_CAPITALS_LIST;
  };

  const locationOptions = getLocationOptions();

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Route Type</InputLabel>
          <Select
            name="routeType"
            value={values.routeType || 'Domestic'}
            onChange={(e) => {
              handleFieldChange('routeType', e.target.value);
              // Clear origin and destination when route type changes
              handleFieldChange('origin', '');
              handleFieldChange('destination', '');
            }}
            label="Route Type"
          >
            <MenuItem value="Domestic">Domestic</MenuItem>
            <MenuItem value="International">International</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <Autocomplete
          freeSolo
          options={locationOptions}
          value={values.origin || ''}
          onChange={(event, newValue) => {
            handleFieldChange('origin', newValue || '');
          }}
          onInputChange={(event, newInputValue) => {
            handleFieldChange('origin', newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              label={values.routeType === 'International' ? 'Origin Country' : 'Origin City'}
              {...getFieldProps('origin')}
              color={getFieldStateColor(fieldStates.origin)}
            />
          )}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <Autocomplete
          freeSolo
          options={locationOptions}
          value={values.destination || ''}
          onChange={(event, newValue) => {
            handleFieldChange('destination', newValue || '');
          }}
          onInputChange={(event, newInputValue) => {
            handleFieldChange('destination', newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              label={values.routeType === 'International' ? 'Destination Country' : 'Destination City'}
              {...getFieldProps('destination')}
              color={getFieldStateColor(fieldStates.destination)}
            />
          )}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Service Type</InputLabel>
          <Select
            name="serviceType"
            value={values.serviceType || 'Sea Freight'}
            onChange={(e) => handleFieldChange('serviceType', e.target.value)}
            label="Service Type"
          >
            <MenuItem value="Sea Freight">Sea Freight</MenuItem>
            <MenuItem value="Air Freight">Air Freight</MenuItem>
            <MenuItem value="Land Transport">Land Transport</MenuItem>
            <MenuItem value="Rail Transport">Rail Transport</MenuItem>
            <MenuItem value="Courier">Courier</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Package Type</InputLabel>
          <Select
            name="packageType"
            value={values.packageType || 'Domestic'}
            onChange={(e) => handleFieldChange('packageType', e.target.value)}
            label="Package Type"
          >
            <MenuItem value="FCL">FCL (Full Container Load)</MenuItem>
            <MenuItem value="LCL">LCL (Less than Container Load)</MenuItem>
            <MenuItem value="Breakbulk">Breakbulk</MenuItem>
            <MenuItem value="Bulk">Bulk Cargo</MenuItem>
            <MenuItem value="Container">Container</MenuItem>
            <MenuItem value="Pallet">Pallet</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Priority</InputLabel>
          <Select
            name="priority"
            value={values.priority || 'Normal'}
            onChange={(e) => handleFieldChange('priority', e.target.value)}
            label="Priority"
          >
            <MenuItem value="Express">Express</MenuItem>
            <MenuItem value="Urgent">Urgent</MenuItem>
            <MenuItem value="Normal">Normal</MenuItem>
            <MenuItem value="Economy">Economy</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Order Type</InputLabel>
          <Select
            name="orderType"
            value={values.orderType || 'REG'}
            onChange={(e) => handleFieldChange('orderType', e.target.value)}
            label="Order Type"
          >
            <MenuItem value="REG">Regular</MenuItem>
            <MenuItem value="PAM">PAM (Project Cargo)</MenuItem>
            <MenuItem value="JUM">Jumbo Cargo</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Transit Time (days)"
          type="number"
          value={values.transitTime || ''}
          onChange={(e) => handleFieldChange('transitTime', parseInt(e.target.value) || '')}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Free Time (days)"
          type="number"
          value={values.freeTime || ''}
          onChange={(e) => handleFieldChange('freeTime', parseInt(e.target.value) || '')}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Special Instructions"
          multiline
          rows={3}
          value={values.specialInstructions || ''}
          onChange={(e) => handleFieldChange('specialInstructions', e.target.value)}
          {...getFieldProps('specialInstructions')}
          color={getFieldStateColor(fieldStates.specialInstructions)}
        />
      </Grid>
    </Grid>
  );
});

RouteServiceTab.displayName = 'RouteServiceTab';

/**
 * Enhanced Cargo Details Tab Component with Comprehensive Cost Fields
 */
const CargoDetailsTab = memo(({
  values,
  fieldStates,
  getFieldProps,
  getFieldStateColor,
  getFieldStateIcon,
  FIELD_STATES,
  handleFieldChange,
  cargoItems,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  hsCodes
}) => {
  // Container type options
  const containerTypes = [
    { value: '20DC', label: '20\' Dry Container' },
    { value: '40DC', label: '40\' Dry Container' },
    { value: '40HC', label: '40\' High Cube' },
    { value: '20RF', label: '20\' Reefer' },
    { value: '40RF', label: '40\' Reefer' },
    { value: '20OT', label: '20\' Open Top' },
    { value: '40OT', label: '40\' Open Top' },
    { value: '20FR', label: '20\' Flat Rack' },
    { value: '40FR', label: '40\' Flat Rack' }
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Cargo Items</Typography>
        <Button startIcon={<AddIcon />} onClick={onAddItem} variant="contained">
          Add Cargo Item
        </Button>
      </Box>

      {cargoItems.map((item, index) => (
        <Card key={item.id} sx={{ mb: 3 }}>
          <CardContent>
            {/* Basic Information Section */}
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Basic Information
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Description"
                  value={item.description || ''}
                  onChange={(e) => onUpdateItem(item.id, 'description', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Weight (kg)"
                  type="number"
                  value={item.weight || 0}
                  onChange={(e) => onUpdateItem(item.id, 'weight', parseFloat(e.target.value) || 0)}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Volume (cbm)"
                  type="number"
                  value={item.volume || 0}
                  onChange={(e) => onUpdateItem(item.id, 'volume', parseFloat(e.target.value) || 0)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={`Value (${getCurrencySymbol(item.currency)})`}
                  value={formatNumber(item.value || 0)}
                  onChange={(e) => {
                    const cleanedValue = formatCurrencyInput(e.target.value);
                    const numericValue = parseFloat(cleanedValue) || 0;
                    onUpdateItem(item.id, 'value', numericValue);
                  }}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>{getCurrencySymbol(item.currency)}</Typography>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={item.currency || 'IDR'}
                    onChange={(e) => onUpdateItem(item.id, 'currency', e.target.value)}
                    label="Currency"
                  >
                    {CURRENCIES.map(currency => (
                      <MenuItem key={currency.code} value={currency.code}>
                        {currency.flag} {currency.code} - {currency.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Container Details Section */}
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Container Details
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Container Type</InputLabel>
                  <Select
                    value={item.containerType || '20DC'}
                    onChange={(e) => onUpdateItem(item.id, 'containerType', e.target.value)}
                    label="Container Type"
                  >
                    {containerTypes.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Container Number"
                  value={item.containerNumber || ''}
                  onChange={(e) => onUpdateItem(item.id, 'containerNumber', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Seal Number"
                  value={item.sealNumber || ''}
                  onChange={(e) => onUpdateItem(item.id, 'sealNumber', e.target.value)}
                />
              </Grid>
            </Grid>

            {/* Cost Breakdown Sections */}
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Cost Breakdown
            </Typography>

            {/* Origin Costs */}
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, color: 'secondary.main' }}>
              Origin Costs
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={`Pickup Charge (${getCurrencySymbol(item.currency)})`}
                  value={formatNumber(item.pickupCharge || 0)}
                  onChange={(e) => {
                    const cleanedValue = formatCurrencyInput(e.target.value);
                    const numericValue = parseFloat(cleanedValue) || 0;
                    onUpdateItem(item.id, 'pickupCharge', numericValue);
                  }}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>{getCurrencySymbol(item.currency)}</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Pickup Charge (USD)"
                  value={formatNumber(item.pickupChargeUSD || 0)}
                  onChange={(e) => {
                    const cleanedValue = formatCurrencyInput(e.target.value);
                    const numericValue = parseFloat(cleanedValue) || 0;
                    onUpdateItem(item.id, 'pickupChargeUSD', numericValue);
                  }}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>$</Typography>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={`Export Doc Fee (${getCurrencySymbol(item.currency)})`}
                  value={formatNumber(item.exportDocumentationFee || 0)}
                  onChange={(e) => {
                    const cleanedValue = formatCurrencyInput(e.target.value);
                    const numericValue = parseFloat(cleanedValue) || 0;
                    onUpdateItem(item.id, 'exportDocumentationFee', numericValue);
                  }}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>{getCurrencySymbol(item.currency)}</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Export Doc Fee (USD)"
                  value={formatNumber(item.exportDocumentationFeeUSD || 0)}
                  onChange={(e) => {
                    const cleanedValue = formatCurrencyInput(e.target.value);
                    const numericValue = parseFloat(cleanedValue) || 0;
                    onUpdateItem(item.id, 'exportDocumentationFeeUSD', numericValue);
                  }}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>$</Typography>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={`Origin THC (${getCurrencySymbol(item.currency)})`}
                  value={formatNumber(item.originTHC || 0)}
                  onChange={(e) => {
                    const cleanedValue = formatCurrencyInput(e.target.value);
                    const numericValue = parseFloat(cleanedValue) || 0;
                    onUpdateItem(item.id, 'originTHC', numericValue);
                  }}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>{getCurrencySymbol(item.currency)}</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Origin THC (USD)"
                  value={formatNumber(item.originTHCUSD || 0)}
                  onChange={(e) => {
                    const cleanedValue = formatCurrencyInput(e.target.value);
                    const numericValue = parseFloat(cleanedValue) || 0;
                    onUpdateItem(item.id, 'originTHCUSD', numericValue);
                  }}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>$</Typography>
                  }}
                />
              </Grid>
            </Grid>

            {/* Freight Costs */}
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'secondary.main' }}>
              Freight Costs
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={`Basic Freight (${getCurrencySymbol(item.currency)})`}
                  value={formatNumber(item.basicFreight || 0)}
                  onChange={(e) => {
                    const cleanedValue = formatCurrencyInput(e.target.value);
                    const numericValue = parseFloat(cleanedValue) || 0;
                    onUpdateItem(item.id, 'basicFreight', numericValue);
                  }}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>{getCurrencySymbol(item.currency)}</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Basic Freight (USD)"
                  value={formatNumber(item.basicFreightUSD || 0)}
                  onChange={(e) => {
                    const cleanedValue = formatCurrencyInput(e.target.value);
                    const numericValue = parseFloat(cleanedValue) || 0;
                    onUpdateItem(item.id, 'basicFreightUSD', numericValue);
                  }}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>$</Typography>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={`Bunker Surcharge (${getCurrencySymbol(item.currency)})`}
                  value={formatNumber(item.bunkerSurcharge || 0)}
                  onChange={(e) => {
                    const cleanedValue = formatCurrencyInput(e.target.value);
                    const numericValue = parseFloat(cleanedValue) || 0;
                    onUpdateItem(item.id, 'bunkerSurcharge', numericValue);
                  }}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>{getCurrencySymbol(item.currency)}</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Bunker Surcharge (USD)"
                  value={formatNumber(item.bunkerSurchargeUSD || 0)}
                  onChange={(e) => {
                    const cleanedValue = formatCurrencyInput(e.target.value);
                    const numericValue = parseFloat(cleanedValue) || 0;
                    onUpdateItem(item.id, 'bunkerSurchargeUSD', numericValue);
                  }}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>$</Typography>
                  }}
                />
              </Grid>
            </Grid>

            {/* Destination Costs */}
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'secondary.main' }}>
              Destination Costs
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={`Import Doc Fee (${getCurrencySymbol(item.currency)})`}
                  value={formatNumber(item.importDocumentationFee || 0)}
                  onChange={(e) => {
                    const cleanedValue = formatCurrencyInput(e.target.value);
                    const numericValue = parseFloat(cleanedValue) || 0;
                    onUpdateItem(item.id, 'importDocumentationFee', numericValue);
                  }}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>{getCurrencySymbol(item.currency)}</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Import Doc Fee (USD)"
                  value={formatNumber(item.importDocumentationFeeUSD || 0)}
                  onChange={(e) => {
                    const cleanedValue = formatCurrencyInput(e.target.value);
                    const numericValue = parseFloat(cleanedValue) || 0;
                    onUpdateItem(item.id, 'importDocumentationFeeUSD', numericValue);
                  }}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>$</Typography>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={`Destination THC (${getCurrencySymbol(item.currency)})`}
                  value={formatNumber(item.destinationTHC || 0)}
                  onChange={(e) => {
                    const cleanedValue = formatCurrencyInput(e.target.value);
                    const numericValue = parseFloat(cleanedValue) || 0;
                    onUpdateItem(item.id, 'destinationTHC', numericValue);
                  }}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>{getCurrencySymbol(item.currency)}</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Destination THC (USD)"
                  value={formatNumber(item.destinationTHCUSD || 0)}
                  onChange={(e) => {
                    const cleanedValue = formatCurrencyInput(e.target.value);
                    const numericValue = parseFloat(cleanedValue) || 0;
                    onUpdateItem(item.id, 'destinationTHCUSD', numericValue);
                  }}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>$</Typography>
                  }}
                />
              </Grid>
            </Grid>

            {/* Insurance and Additional Costs */}
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'secondary.main' }}>
              Insurance & Additional Costs
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={`Insurance (${getCurrencySymbol(item.currency)})`}
                  value={formatNumber(item.insuranceCost || 0)}
                  onChange={(e) => {
                    const cleanedValue = formatCurrencyInput(e.target.value);
                    const numericValue = parseFloat(cleanedValue) || 0;
                    onUpdateItem(item.id, 'insuranceCost', numericValue);
                  }}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>{getCurrencySymbol(item.currency)}</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Insurance (USD)"
                  value={formatNumber(item.insuranceCostUSD || 0)}
                  onChange={(e) => {
                    const cleanedValue = formatCurrencyInput(e.target.value);
                    const numericValue = parseFloat(cleanedValue) || 0;
                    onUpdateItem(item.id, 'insuranceCostUSD', numericValue);
                  }}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>$</Typography>
                  }}
                />
              </Grid>
            </Grid>

            {/* HS Code and Regulatory */}
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'secondary.main' }}>
              HS Code & Regulatory
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={hsCodes}
                  getOptionLabel={(option) => `${option.code} - ${option.description}`}
                  value={hsCodes.find(hs => hs.code === item.hsCode) || null}
                  onChange={(event, newValue) => {
                    onUpdateItem(item.id, 'hsCode', newValue?.code || '');
                    onUpdateItem(item.id, 'hsCodeDescription', newValue?.description || '');
                    onUpdateItem(item.id, 'importDuty', newValue?.importDuty || 0);
                    onUpdateItem(item.id, 'vat', newValue?.vat || 11);
                    onUpdateItem(item.id, 'excise', newValue?.excise || 0);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="HS Code" fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={item.hazardous}
                        onChange={(e) => onUpdateItem(item.id, 'hazardous', e.target.checked)}
                      />
                    }
                    label="Hazardous"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={item.certificateRequired}
                        onChange={(e) => onUpdateItem(item.id, 'certificateRequired', e.target.checked)}
                      />
                    }
                    label="Certificate Required"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={item.inspectionRequired}
                        onChange={(e) => onUpdateItem(item.id, 'inspectionRequired', e.target.checked)}
                      />
                    }
                    label="Inspection Required"
                  />
                </Box>
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <IconButton onClick={() => onRemoveItem(item.id)} color="error">
                <DeleteIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
});

CargoDetailsTab.displayName = 'CargoDetailsTab';

/**
 * Cost Calculation Tab Component
 */
const CostCalculationTab = memo(({
  values,
  fieldStates,
  getFieldProps,
  getFieldStateColor,
  getFieldStateIcon,
  FIELD_STATES,
  handleFieldChange,
  totals
}) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Cost Breakdown</Typography>

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
                  {(values.cargoItems || []).map((item, index) => {
                    const freightCost = item.currency === 'USD' ? (item.freightCostUSD || 0) : (item.freightCost || 0);
                    const insuranceCost = item.currency === 'USD' ? (item.insuranceCostUSD || 0) : (item.insuranceCost || 0);
                    const totalCost = freightCost + insuranceCost;
                    const currencySymbol = item.currency === 'USD' ? '$' : 'IDR';

                    return (
                      <TableRow key={item.id || index}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {item.description || `Item ${index + 1}`}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {currencySymbol}{(freightCost || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {currencySymbol}{(insuranceCost || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {currencySymbol}{(totalCost || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>TOTAL</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      IDR {(totals.totalFreightCost || 0).toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      IDR {(totals.totalInsuranceCost || 0).toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      IDR {(totals.subtotal || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Tax & Duty Calculation</Typography>

            <TextField
              fullWidth
              label="Import Duty (%)"
              type="number"
              value={values.importDuty || 0}
              onChange={(e) => handleFieldChange('importDuty', parseFloat(e.target.value) || 0)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="VAT (%)"
              type="number"
              value={values.vat || 11}
              onChange={(e) => handleFieldChange('vat', parseFloat(e.target.value) || 0)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Excise (%)"
              type="number"
              value={values.excise || 0}
              onChange={(e) => handleFieldChange('excise', parseFloat(e.target.value) || 0)}
              sx={{ mb: 2 }}
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" gutterBottom>Tax Calculation:</Typography>
            <Typography variant="body2">
              Import Duty: IDR {(totals.importDuty || 0).toLocaleString()}
            </Typography>
            <Typography variant="body2">
              VAT: IDR {(totals.vat || 0).toLocaleString()}
            </Typography>
            <Typography variant="body2">
              Excise: IDR {(totals.excise || 0).toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
              Total Tax: IDR {(totals.totalTax || 0).toLocaleString()}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" gutterBottom>Additional Service Costs:</Typography>
            <Typography variant="body2">
              Customs Clearance: IDR {(totals.customsClearanceFee || 0).toLocaleString()}
            </Typography>
            <Typography variant="body2">
              Documentation: IDR {(totals.documentationFee || 0).toLocaleString()}
            </Typography>
            <Typography variant="body2">
              THC: IDR {(totals.thcFee || 0).toLocaleString()}
            </Typography>
            <Typography variant="body2">
              Other Fees: IDR {(totals.otherFees || 0).toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Additional Service Costs</Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Customs Clearance Fee (IDR)"
                  type="number"
                  value={values.customsClearanceFee || 0}
                  onChange={(e) => handleFieldChange('customsClearanceFee', parseFloat(e.target.value) || 0)}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Customs Clearance Fee (USD)"
                  type="number"
                  value={values.customsClearanceFeeUSD || 0}
                  onChange={(e) => handleFieldChange('customsClearanceFeeUSD', parseFloat(e.target.value) || 0)}
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Customs Clearance Currency</InputLabel>
              <Select
                value={values.customsClearanceCurrency || 'IDR'}
                onChange={(e) => handleFieldChange('customsClearanceCurrency', e.target.value)}
                label="Customs Clearance Currency"
              >
                <MenuItem value="IDR">IDR (Rupiah)</MenuItem>
                <MenuItem value="USD">USD (Dollar)</MenuItem>
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Documentation Fee (IDR)"
                  type="number"
                  value={values.documentationFee || 0}
                  onChange={(e) => handleFieldChange('documentationFee', parseFloat(e.target.value) || 0)}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Documentation Fee (USD)"
                  type="number"
                  value={values.documentationFeeUSD || 0}
                  onChange={(e) => handleFieldChange('documentationFeeUSD', parseFloat(e.target.value) || 0)}
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Documentation Currency</InputLabel>
              <Select
                value={values.documentationCurrency || 'IDR'}
                onChange={(e) => handleFieldChange('documentationCurrency', e.target.value)}
                label="Documentation Currency"
              >
                <MenuItem value="IDR">IDR (Rupiah)</MenuItem>
                <MenuItem value="USD">USD (Dollar)</MenuItem>
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="THC Fee (IDR)"
                  type="number"
                  value={values.thcFee || 0}
                  onChange={(e) => handleFieldChange('thcFee', parseFloat(e.target.value) || 0)}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="THC Fee (USD)"
                  type="number"
                  value={values.thcFeeUSD || 0}
                  onChange={(e) => handleFieldChange('thcFeeUSD', parseFloat(e.target.value) || 0)}
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>THC Currency</InputLabel>
              <Select
                value={values.thcCurrency || 'IDR'}
                onChange={(e) => handleFieldChange('thcCurrency', e.target.value)}
                label="THC Currency"
              >
                <MenuItem value="IDR">IDR (Rupiah)</MenuItem>
                <MenuItem value="USD">USD (Dollar)</MenuItem>
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Other Fees (IDR)"
                  type="number"
                  value={values.otherFees || 0}
                  onChange={(e) => handleFieldChange('otherFees', parseFloat(e.target.value) || 0)}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Other Fees (USD)"
                  type="number"
                  value={values.otherFeesUSD || 0}
                  onChange={(e) => handleFieldChange('otherFeesUSD', parseFloat(e.target.value) || 0)}
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Other Fees Currency</InputLabel>
              <Select
                value={values.otherFeesCurrency || 'IDR'}
                onChange={(e) => handleFieldChange('otherFeesCurrency', e.target.value)}
                label="Other Fees Currency"
              >
                <MenuItem value="IDR">IDR (Rupiah)</MenuItem>
                <MenuItem value="USD">USD (Dollar)</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Financial Summary</Typography>

            <TextField
              fullWidth
              label="Estimated Cost (IDR)"
              type="number"
              value={values.estimatedCost || totals.grandTotal}
              onChange={(e) => handleFieldChange('estimatedCost', e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Selling Price (IDR)"
              type="number"
              value={values.sellingPrice || 0}
              onChange={(e) => {
                handleFieldChange('sellingPrice', e.target.value);
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Margin (IDR)"
              type="number"
              value={values.margin || 0}
              disabled
              helperText="Auto-calculated when selling price or estimated cost changes"
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" gutterBottom>Grand Total:</Typography>
            <Typography variant="h6" color="primary">
              IDR {(totals.grandTotal || 0).toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
});

CostCalculationTab.displayName = 'CostCalculationTab';

/**
 * Terms & Conditions Tab Component
 */
const TermsConditionsTab = memo(({
  values,
  fieldStates,
  getFieldProps,
  getFieldStateColor,
  getFieldStateIcon,
  FIELD_STATES,
  handleFieldChange
}) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Payment Method</InputLabel>
          <Select
            name="paymentMethod"
            value={values.paymentMethod || 'Bank Transfer'}
            onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
            label="Payment Method"
          >
            <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
            <MenuItem value="Cash">Cash</MenuItem>
            <MenuItem value="Check">Check</MenuItem>
            <MenuItem value="Letter of Credit">Letter of Credit (L/C)</MenuItem>
            <MenuItem value="Credit Card">Credit Card</MenuItem>
            <MenuItem value="COD">Cash on Delivery (COD)</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Payment Terms</InputLabel>
          <Select
            name="paymentTerms"
            value={values.paymentTerms || 'Net 30'}
            onChange={(e) => handleFieldChange('paymentTerms', e.target.value)}
            label="Payment Terms"
          >
            <MenuItem value="COD">Cash on Delivery (COD)</MenuItem>
            <MenuItem value="Net 7">Net 7 Days</MenuItem>
            <MenuItem value="Net 15">Net 15 Days</MenuItem>
            <MenuItem value="Net 30">Net 30 Days</MenuItem>
            <MenuItem value="Net 45">Net 45 Days</MenuItem>
            <MenuItem value="Net 60">Net 60 Days</MenuItem>
            <MenuItem value="Net 90">Net 90 Days</MenuItem>
            <MenuItem value="2/10 Net 30">2/10 Net 30</MenuItem>
            <MenuItem value="Advance Payment">Advance Payment</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Insurance Coverage (%)"
          type="number"
          value={values.insuranceCoverage || 110}
          onChange={(e) => handleFieldChange('insuranceCoverage', parseFloat(e.target.value) || 110)}
          helperText="Percentage of cargo value to be insured (default: 110%)"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Insurance Type</InputLabel>
          <Select
            name="insuranceType"
            value={values.insuranceType || 'All Risk'}
            onChange={(e) => handleFieldChange('insuranceType', e.target.value)}
            label="Insurance Type"
          >
            <MenuItem value="All Risk">All Risk</MenuItem>
            <MenuItem value="Total Loss">Total Loss Only</MenuItem>
            <MenuItem value="Named Perils">Named Perils</MenuItem>
            <MenuItem value="Free of Particular Average">Free of Particular Average (FPA)</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Liability Terms"
          multiline
          rows={3}
          value={values.liabilityTerms || 'PT. Bakhtera 6 MGN liability is limited to the freight charges only. We act as agents only and are not responsible for any loss or damage to cargo unless caused by our negligence.'}
          onChange={(e) => handleFieldChange('liabilityTerms', e.target.value)}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Force Majeure Terms"
          multiline
          rows={3}
          value={values.forceMajeureTerms || 'Neither party shall be liable for any failure or delay in performance under this agreement which is due to fire, flood, earthquake, elements of nature or acts of God, acts of war, terrorism, riots, civil disorders, rebellions or revolutions, or any other cause beyond the reasonable control of such party.'}
          onChange={(e) => handleFieldChange('forceMajeureTerms', e.target.value)}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Additional Terms & Conditions"
          multiline
          rows={4}
          value={values.additionalTerms || ''}
          onChange={(e) => handleFieldChange('additionalTerms', e.target.value)}
          placeholder="Enter any additional terms and conditions..."
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={values.includeStandardTerms || true}
              onChange={(e) => handleFieldChange('includeStandardTerms', e.target.checked)}
            />
          }
          label="Include Standard Trading Terms & Conditions"
        />
      </Grid>
    </Grid>
  );
});

TermsConditionsTab.displayName = 'TermsConditionsTab';

/**
 * Main Quotation Component
 */
const Quotation = () => {
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [hsCodes, setHSCodes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Use quotation form hook
  const formHook = useQuotationForm(selectedQuotation);

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
    handleSubmit,
    generateQuotationNumber,
    totals
  } = formHook;

  // Load data effect
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load customers
        if (customerService?.getAll) {
          const customersData = customerService.getAll();
          setCustomers(customersData || []);
        }

        // Load HS Codes
        if (dataSyncService?.getHSCodes) {
          const hsCodesData = await dataSyncService.getHSCodes() || [];
          setHSCodes(hsCodesData);
        }

        // Load quotations
        if (quotationService?.getAll) {
          const quotationsData = quotationService.getAll() || [];
          setQuotations(quotationsData);
        }

      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Optimized event handlers
  const handleAdd = useCallback(() => {
    setSelectedQuotation(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((quotation) => {
    setSelectedQuotation(quotation);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(async (quotationData) => {
    try {
      if (selectedQuotation) {
        // Update existing quotation
        const updatedQuotation = await quotationService.update(selectedQuotation.id, quotationData);
        if (updatedQuotation) {
          const quotationsData = quotationService.getAll() || [];
          setQuotations(quotationsData);
          notificationService.showSuccess('Quotation updated successfully');
          return updatedQuotation;
        }
      } else {
        // Create new quotation
        const newQuotation = await quotationService.create(quotationData);
        if (newQuotation) {
          const quotationsData = quotationService.getAll() || [];
          setQuotations(quotationsData);
          notificationService.showSuccess(`Quotation ${newQuotation.quotationNumber} created successfully`);
          return newQuotation;
        }
      }
    } catch (error) {
      notificationService.showError(`Failed to save quotation: ${error.message}`);
      throw error;
    }
  }, [selectedQuotation]);

  // Export functions
  const exportToPDF = useCallback(() => {
    try {
      const doc = new jsPDF();

      // Header with company branding
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('PT. BAKHTERA 6 MGN', 105, 25, { align: 'center' });

      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('QUOTATION', 105, 40, { align: 'center' });

      // Quotation details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('QUOTATION DETAILS', 20, 60);

      doc.setFont('helvetica', 'normal');
      doc.text(`Quotation Number: ${values.quotationNumber}`, 20, 75);
      doc.text(`Date: ${new Date().toLocaleDateString('id-ID')}`, 20, 85);
      doc.text(`Valid Until: ${values.validUntil}`, 20, 95);
      doc.text(`Order Type: ${ORDER_TYPES.find(t => t.value === values.orderType)?.label || values.orderType}`, 20, 105);

      // Customer information
      doc.setFont('helvetica', 'bold');
      doc.text('CUSTOMER INFORMATION', 20, 125);

      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${values.customerName || 'Not specified'}`, 20, 140);
      doc.text(`Type: ${values.customerType || 'N/A'}`, 20, 150);
      doc.text(`Phone: ${values.customerPhone || 'N/A'}`, 20, 160);
      doc.text(`Email: ${values.customerEmail || 'N/A'}`, 20, 170);

      // Route information
      doc.setFont('helvetica', 'bold');
      doc.text('ROUTE & SERVICE', 20, 190);

      doc.setFont('helvetica', 'normal');
      doc.text(`Route Type: ${values.routeType || 'Domestic'}`, 20, 205);
      doc.text(`Service Type: ${values.serviceType || 'N/A'}`, 20, 215);
      doc.text(`Package Type: ${values.packageType || 'N/A'}`, 20, 225);
      doc.text(`Priority: ${values.priority || 'Normal'}`, 20, 235);

      // Service details
      doc.setFont('helvetica', 'bold');
      doc.text('SERVICE DETAILS', 20, 255);

      doc.setFont('helvetica', 'normal');
      doc.text(`Route Type: ${values.routeType || 'Domestic'}`, 20, 270);
      doc.text(`Service Type: ${values.serviceType || 'N/A'}`, 20, 285);
      doc.text(`Package Type: ${values.packageType || 'N/A'}`, 20, 300);
      doc.text(`Priority: ${values.priority || 'Normal'}`, 20, 315);

      // Cost breakdown
      let finalY = 335;

      // Additional service costs
      if (values.customsClearanceFee || values.documentationFee || values.thcFee || values.otherFees) {
        doc.setFont('helvetica', 'bold');
        doc.text('ADDITIONAL SERVICE COSTS', 20, finalY);

        const serviceCostData = [];

        if (values.customsClearanceFee || values.customsClearanceFeeUSD) {
          const customsFee = values.customsClearanceCurrency === 'USD' ?
            (values.customsClearanceFeeUSD || 0) * (values.exchangeRate || 15000) :
            (values.customsClearanceFee || 0);
          serviceCostData.push(['Customs Clearance', `IDR ${customsFee.toLocaleString()}`]);
        }

        if (values.documentationFee || values.documentationFeeUSD) {
          const docFee = values.documentationCurrency === 'USD' ?
            (values.documentationFeeUSD || 0) * (values.exchangeRate || 15000) :
            (values.documentationFee || 0);
          serviceCostData.push(['Documentation', `IDR ${docFee.toLocaleString()}`]);
        }

        if (values.thcFee || values.thcFeeUSD) {
          const thcFee = values.thcCurrency === 'USD' ?
            (values.thcFeeUSD || 0) * (values.exchangeRate || 15000) :
            (values.thcFee || 0);
          serviceCostData.push(['THC', `IDR ${thcFee.toLocaleString()}`]);
        }

        if (values.otherFees || values.otherFeesUSD) {
          const otherFee = values.otherFeesCurrency === 'USD' ?
            (values.otherFeesUSD || 0) * (values.exchangeRate || 15000) :
            (values.otherFees || 0);
          serviceCostData.push(['Other Fees', `IDR ${otherFee.toLocaleString()}`]);
        }

        if (serviceCostData.length > 0) {
          doc.autoTable({
            startY: finalY + 10,
            head: [['Service', 'Amount']],
            body: serviceCostData,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [155, 89, 182], textColor: 255 },
            columnStyles: {
              0: { cellWidth: 50 },
              1: { cellWidth: 40 }
            }
          });
          finalY = doc.lastAutoTable.finalY + 20;
        }
      }

      // Financial summary
      doc.setFont('helvetica', 'bold');
      doc.text('FINANCIAL SUMMARY', 20, finalY);

      doc.setFont('helvetica', 'normal');
      doc.text(`Subtotal: IDR ${totals.subtotal.toLocaleString()}`, 20, finalY + 15);
      doc.text(`Import Duty: IDR ${totals.importDuty.toLocaleString()}`, 20, finalY + 25);
      doc.text(`VAT: IDR ${totals.vat.toLocaleString()}`, 20, finalY + 35);
      doc.text(`Excise: IDR ${totals.excise.toLocaleString()}`, 20, finalY + 45);
      doc.text(`Total Tax: IDR ${totals.totalTax.toLocaleString()}`, 20, finalY + 55);
      doc.text(`Grand Total: IDR ${(totals.grandTotal || 0).toLocaleString()}`, 20, finalY + 70);
      doc.text(`Selling Price: IDR ${(values.sellingPrice || 0).toLocaleString()}`, 20, finalY + 85);
      doc.text(`Margin: IDR ${(values.margin || 0).toLocaleString()}`, 20, finalY + 100);

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('This quotation is valid for 30 days from the date of issue.', 20, pageHeight - 30);
      doc.text('PT. BAKHTERA 6 MGN - Professional Logistics Solutions', 20, pageHeight - 20);

      // Add page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${pageCount}`, 180, pageHeight - 10);
      }

      doc.save(`Quotation_${values.quotationNumber}.pdf`);
      setSnackbar({ open: true, message: 'PDF exported successfully!', severity: 'success' });
    } catch (error) {
      console.error('PDF export error:', error);
      setSnackbar({ open: true, message: 'Failed to export PDF', severity: 'error' });
    }
  }, [values, totals, setSnackbar]);

  const exportToExcel = useCallback(() => {
    try {
      const workbook = XLSX.utils.book_new();

      // Main quotation data
      const quotationData = [{
        'Quotation Number': values.quotationNumber,
        'Customer': values.customerName || 'Not specified',
        'Customer Type': values.customerType || 'Corporate',
        'Origin': values.origin || 'N/A',
        'Destination': values.destination || 'N/A',
        'Service Type': values.serviceType || 'N/A',
        'Package Type': values.packageType || 'N/A',
        'Order Type': ORDER_TYPES.find(t => t.value === values.orderType)?.label || values.orderType,
        'Estimated Cost': values.estimatedCost || 0,
        'Selling Price': values.sellingPrice || 0,
        'Margin': values.margin || 0,
        'Status': values.status || 'Draft',
        'Created Date': new Date().toLocaleDateString()
      }];

      const quotationSheet = XLSX.utils.json_to_sheet(quotationData);
      XLSX.utils.book_append_sheet(workbook, quotationSheet, 'Quotation Summary');

      // Cargo items
      if (values.cargoItems && values.cargoItems.length > 0) {
        const cargoData = values.cargoItems.map(item => ({
          'Description': item.description || 'N/A',
          'Weight (kg)': item.weight || 0,
          'Volume (cbm)': item.volume || 0,
          'Value': item.value || 0,
          'Currency': item.currency || 'IDR',
          'HS Code': item.hsCode || 'N/A',
          'Freight Cost (IDR)': item.freightCost || 0,
          'Freight Cost (USD)': item.freightCostUSD || 0,
          'Insurance Cost (IDR)': item.insuranceCost || 0,
          'Insurance Cost (USD)': item.insuranceCostUSD || 0,
          'Hazardous': item.hazardous ? 'Yes' : 'No'
        }));

        const cargoSheet = XLSX.utils.json_to_sheet(cargoData);
        XLSX.utils.book_append_sheet(workbook, cargoSheet, 'Cargo Details');
      }

      XLSX.writeFile(workbook, `Quotation_${values.quotationNumber}.xlsx`);
      setSnackbar({ open: true, message: 'Excel exported successfully!', severity: 'success' });
    } catch (error) {
      console.error('Excel export error:', error);
      setSnackbar({ open: true, message: 'Failed to export Excel', severity: 'error' });
    }
  }, [values, setSnackbar]);

  // Optimized filtering
  const filteredQuotations = useMemo(() => {
    return quotations.filter(quotation =>
      quotation.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.destination?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [quotations, searchTerm]);

  // Helper functions
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Sent': return 'primary';
      case 'Rejected': return 'error';
      case 'Draft': return 'warning';
      default: return 'info';
    }
  }, []);

  const steps = ['Customer Info', 'Route & Service', 'Cargo Details', 'Cost Calculation', 'Terms & Conditions', 'Review & Submit'];

  return (
    <ErrorBoundary>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Quotations</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            New Quotation
          </Button>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <TextField
              fullWidth
              label="Search quotations..."
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
                <TableCell>Quotation #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Route</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Financial</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredQuotations.map((quotation) => (
                <TableRow key={quotation.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{quotation.quotationNumber}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {new Date(quotation.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">{quotation.customerName}</Typography>
                    <Chip
                      label={quotation.customerType}
                      size="small"
                      color={quotation.customerType === 'Corporate' ? 'primary' : 'secondary'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{quotation.origin}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      → {quotation.destination}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={quotation.serviceType}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatCurrency(quotation.sellingPrice)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Cost: {formatCurrency(quotation.estimatedCost)}
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      Margin: {formatCurrency(quotation.margin)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={quotation.status || 'Draft'}
                      color={getStatusColor(quotation.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" gap={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(quotation)}
                        color="primary"
                        title="Edit Quotation"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
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

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            {selectedQuotation ? 'Edit Quotation' : 'Create New Quotation'}
          </DialogTitle>

          <DialogContent>
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
                  <CustomerInfoTab
                    values={values}
                    fieldStates={fieldStates}
                    getFieldProps={getFieldProps}
                    getFieldStateColor={getFieldStateColor}
                    getFieldStateIcon={getFieldStateIcon}
                    FIELD_STATES={FIELD_STATES}
                    handleFieldChange={handleFieldChange}
                    customers={customers || []}
                  />
                )}

                {activeTab === 1 && (
                  <RouteServiceTab
                    values={values}
                    fieldStates={fieldStates}
                    getFieldProps={getFieldProps}
                    getFieldStateColor={getFieldStateColor}
                    getFieldStateIcon={getFieldStateIcon}
                    FIELD_STATES={FIELD_STATES}
                    handleFieldChange={handleFieldChange}
                  />
                )}

                {activeTab === 2 && (
                  <CargoDetailsTab
                    values={values}
                    fieldStates={fieldStates}
                    getFieldProps={getFieldProps}
                    getFieldStateColor={getFieldStateColor}
                    getFieldStateIcon={getFieldStateIcon}
                    FIELD_STATES={FIELD_STATES}
                    handleFieldChange={handleFieldChange}
                    cargoItems={values.cargoItems || []}
                    onAddItem={addCargoItem}
                    onUpdateItem={updateCargoItem}
                    onRemoveItem={removeCargoItem}
                    hsCodes={hsCodes}
                  />
                )}

                {activeTab === 3 && (
                  <CostCalculationTab
                    values={values}
                    fieldStates={fieldStates}
                    getFieldProps={getFieldProps}
                    getFieldStateColor={getFieldStateColor}
                    getFieldStateIcon={getFieldStateIcon}
                    FIELD_STATES={FIELD_STATES}
                    handleFieldChange={handleFieldChange}
                    totals={totals}
                  />
                )}

                {activeTab === 4 && (
                  <TermsConditionsTab
                    values={values}
                    fieldStates={fieldStates}
                    getFieldProps={getFieldProps}
                    getFieldStateColor={getFieldStateColor}
                    getFieldStateIcon={getFieldStateIcon}
                    FIELD_STATES={FIELD_STATES}
                    handleFieldChange={handleFieldChange}
                  />
                )}

                {activeTab === 5 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>Review & Submit</Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Card>
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>Quotation Summary</Typography>
                            <Typography>Quotation #: {values.quotationNumber}</Typography>
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
                            <Typography variant="subtitle1" gutterBottom>Payment & Terms</Typography>
                            <Typography>Payment Method: {values.paymentMethod}</Typography>
                            <Typography>Payment Terms: {values.paymentTerms}</Typography>
                            <Typography>Insurance: {values.insuranceCoverage}% ({values.insuranceType})</Typography>
                            <Typography>Cargo Items: {values.cargoItems?.length || 0} items</Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Card>
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>Financial Summary</Typography>
                            <Typography>Subtotal: IDR {(totals.subtotal || 0).toLocaleString()}</Typography>
                            <Typography>Total Tax: IDR {(totals.totalTax || 0).toLocaleString()}</Typography>
                            <Typography variant="h6" color="primary">
                              Grand Total: IDR {(totals.grandTotal || 0).toLocaleString()}
                            </Typography>
                            <Typography>Selling Price: IDR {(values.sellingPrice || 0).toLocaleString()}</Typography>
                            <Typography color="success.main">
                              Margin: IDR {(values.margin || 0).toLocaleString()}
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="body2" gutterBottom>Cost Breakdown:</Typography>
                            <Typography variant="body2">
                              Customs Clearance: IDR {(totals.customsClearanceFee || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="body2">
                              Documentation: IDR {(totals.documentationFee || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="body2">
                              THC: IDR {(totals.thcFee || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="body2">
                              Other Fees: IDR {(totals.otherFees || 0).toLocaleString()}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Card>
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>Cargo Summary</Typography>
                            {values.cargoItems?.map((item, index) => (
                              <Box key={item.id} sx={{ mb: 1 }}>
                                <Typography variant="body2">
                                  {item.description || `Item ${index + 1}`}: {item.weight}kg, {item.volume}cbm
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  Value: {item.currency} {formatCurrency(item.value || 0, item.currency)}
                                </Typography>
                              </Box>
                            )) || (
                              <Typography variant="body2" color="textSecondary">No cargo items added</Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
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
                  disabled={!values.customerId || !values.origin || !values.destination}
                >
                  Export PDF
                </Button>
                <Button
                  onClick={exportToExcel}
                  variant="outlined"
                  startIcon={<ExcelIcon />}
                  color="success"
                  disabled={!values.customerId || !values.origin || !values.destination}
                >
                  Export Excel
                </Button>
                <Button
                  onClick={() => handleSubmit(handleSave)}
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : (selectedQuotation ? 'Update' : 'Create') + ' Quotation'}
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
      </Box>
    </ErrorBoundary>
  );
};

export default Quotation;