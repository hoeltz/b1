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
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { handleError } from '../services/errorHandler';
import dataSyncService from '../services/dataSync';
import { formatCurrency } from '../services/currencyUtils';
// Basic form validation utilities (replacement for deleted errorHandler)
const FIELD_STATES = {
  IDLE: 'idle',
  VALIDATING: 'validating',
  VALID: 'valid',
  INVALID: 'invalid'
};

const getFieldStateColor = (state) => {
  switch (state) {
    case FIELD_STATES.VALID: return 'success';
    case FIELD_STATES.INVALID: return 'error';
    case FIELD_STATES.VALIDATING: return 'warning';
    default: return 'primary';
  }
};

const getFieldStateIcon = (state) => {
  switch (state) {
    case FIELD_STATES.VALID: return '✓';
    case FIELD_STATES.INVALID: return '⚠';
    case FIELD_STATES.VALIDATING: return '⟳';
    default: return '';
  }
};

// Error handling utility function
const withErrorHandling = (fn, context) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const freightFlowError = handleError(error, context);
      console.error(`Error in ${context}:`, freightFlowError);
      throw freightFlowError;
    }
  };
};

const extendedValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  indonesianPhone: /^(?:\+?62|0)[8-9][0-9]{7,11}$/,
  indonesianTaxId: /^\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}$/
};

const freightValidationRules = {
  cargoValue: {
    min: 0,
    max: 1000000000
  }
};

// Simple form validation hook replacement
const useFormValidation = (initialValues, rules) => {
  const [values, setValues] = React.useState(initialValues || {});
  const [errors, setErrors] = React.useState({});
  const [fieldStates, setFieldStates] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validateField = (name, value) => {
    const rule = rules[name];
    if (!rule) return true;

    if (rule.required && !value) {
      return rule.patternMessage || 'This field is required';
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.patternMessage || 'Invalid format';
    }

    if (rule.custom) {
      const customResult = rule.custom(value);
      if (customResult !== true) {
        return customResult;
      }
    }

    return true;
  };

  const handleFieldChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setFieldStates(prev => ({ ...prev, [name]: FIELD_STATES.VALIDATING }));

    const validation = validateField(name, value);
    if (validation === true) {
      setErrors(prev => ({ ...prev, [name]: null }));
      setFieldStates(prev => ({ ...prev, [name]: FIELD_STATES.VALID }));
    } else {
      setErrors(prev => ({ ...prev, [name]: validation }));
      setFieldStates(prev => ({ ...prev, [name]: FIELD_STATES.INVALID }));
    }
  };

  const handleSubmit = async (onSubmit) => {
    setIsSubmitting(true);
    try {
      const formErrors = {};
      Object.keys(rules).forEach(name => {
        const validation = validateField(name, values[name]);
        if (validation !== true) {
          formErrors[name] = validation;
        }
      });

      if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors);
        Object.keys(formErrors).forEach(name => {
          setFieldStates(prev => ({ ...prev, [name]: FIELD_STATES.INVALID }));
        });
        return { success: false, errors: formErrors };
      }

      const result = await onSubmit(values);
      return { success: true, data: result };
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setValues(initialValues || {});
    setErrors({});
    setFieldStates({});
    setIsSubmitting(false);
  };

  const getFieldProps = (name) => ({
    name,
    value: values[name] || '',
    onChange: (e) => handleFieldChange(name, e.target.value),
    onBlur: () => handleFieldBlur(name),
    error: !!errors[name],
    helperText: errors[name]
  });

  const handleFieldBlur = (name) => {
    // Optional: Add blur handling logic here if needed
    console.log(`Field ${name} blurred`);
  };

  return {
    values,
    errors,
    fieldStates,
    isSubmitting,
    handleFieldChange,
    handleFieldBlur,
    handleSubmit,
    reset,
    setValues,
    getFieldProps
  };
};

const CustomerForm = ({ open, onClose, customer, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Corporation',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    creditLimit: '',
    paymentTerms: 'Net 30',
    contactPerson: '',
    contactPersonPhone: '',
    contactPersonEmail: '',
    industry: '',
    website: '',
    notes: '',
  });

  // Enhanced validation rules with real-time validation
  const validationRules = {
    name: {
      required: true,
      minLength: 2,
      patternMessage: 'Company name must be at least 2 characters'
    },
    email: {
      required: true,
      pattern: extendedValidationPatterns.email,
      patternMessage: 'Please enter a valid email address'
    },
    phone: {
      required: true,
      pattern: extendedValidationPatterns.indonesianPhone,
      patternMessage: 'Format nomor telepon: 08123456789, 628123456789, atau +628123456789',
      custom: (value) => {
        if (!value) return true; // Required validation handled separately
        const digitsOnly = value.replace(/\D/g, '');
        if (digitsOnly.length < 10) {
          return 'Nomor telepon minimal 10 digit';
        }
        if (digitsOnly.length > 13) {
          return 'Nomor telepon maksimal 13 digit';
        }
        if (!extendedValidationPatterns.indonesianPhone.test(value)) {
          return 'Format nomor tidak valid. Gunakan: 08123456789, 628123456789, atau +628123456789';
        }
        return true;
      }
    },
    address: {
      required: true,
      minLength: 10,
      patternMessage: 'Address must be at least 10 characters'
    },
    taxId: {
      pattern: extendedValidationPatterns.indonesianTaxId,
      patternMessage: 'Format NPWP harus: XX.XXX.XXX.X-XXX.XXX (15 digit dengan titik dan strip)',
      required: false,
      custom: (value) => {
        if (!value) return true; // Optional field
        const digitsOnly = value.replace(/\D/g, '');
        if (digitsOnly.length !== 15) {
          return `NPWP harus terdiri dari 15 digit (saat ini: ${digitsOnly.length} digit)`;
        }
        if (!extendedValidationPatterns.indonesianTaxId.test(value)) {
          return 'Format NPWP tidak sesuai. Gunakan format: XX.XXX.XXX.X-XXX.XXX';
        }
        return true;
      }
    },
    creditLimit: {
      pattern: /^\d+(\.\d{1,2})?$/,
      patternMessage: 'Credit limit must be a valid amount (optional)',
      required: false,
      custom: (value) => {
        if (!value) return true; // Optional field
        const num = parseFloat(value);
        if (num < 0) return 'Credit limit cannot be negative';
        if (num > 10000000000) return 'Credit limit cannot exceed 10 billion IDR';
        return true;
      }
    },
    contactPersonEmail: {
      pattern: extendedValidationPatterns.email,
      patternMessage: 'Please enter a valid email address for contact person (optional)',
      required: false
    },
    contactPersonPhone: {
      pattern: extendedValidationPatterns.indonesianPhone,
      patternMessage: 'Please enter a valid Indonesian phone number for contact person (optional)',
      required: false
    }
  };

  const formValidation = useFormValidation(
    formData,
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
    handleSubmit,
    reset,
    getFieldProps
  } = formValidation;

  useEffect(() => {
    if (customer) {
      setFormData(customer);
      formValidation.setValues(customer);
    } else {
      resetForm();
    }
  }, [customer]); // Depend on entire customer object to avoid stale data issues

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'Corporation',
      email: '',
      phone: '',
      address: '',
      taxId: '',
      creditLimit: '',
      paymentTerms: 'Net 30',
      contactPerson: '',
      contactPersonPhone: '',
      contactPersonEmail: '',
      industry: '',
      website: '',
      notes: '',
    });
    reset();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    let processedValue = value;

    // Auto-format NPWP input
    if (name === 'taxId') {
      processedValue = formatNPWPInput(value);
    }

    // Update form data first
    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));
    // Update form validation state directly without setTimeout
    handleFieldChange(name, processedValue);
  };

  // Auto-format NPWP input as user types
  const formatNPWPInput = (value) => {
    // Remove all non-digits
    const digitsOnly = value.replace(/\D/g, '');

    // Limit to 15 digits
    const limitedDigits = digitsOnly.slice(0, 15);

    // Apply formatting: XX.XXX.XXX.X-XXX.XXX
    let formatted = '';
    if (limitedDigits.length > 0) {
      formatted += limitedDigits.slice(0, 2); // XX
      if (limitedDigits.length > 2) {
        formatted += '.' + limitedDigits.slice(2, 5); // .XXX
        if (limitedDigits.length > 5) {
          formatted += '.' + limitedDigits.slice(5, 8); // .XXX
          if (limitedDigits.length > 8) {
            formatted += '.' + limitedDigits.slice(8, 9); // .X
            if (limitedDigits.length > 9) {
              formatted += '-' + limitedDigits.slice(9, 12); // -XXX
              if (limitedDigits.length > 12) {
                formatted += '.' + limitedDigits.slice(12, 15); // .XXX
              }
            }
          }
        }
      }
    }

    return formatted;
  };

  const onSubmit = async () => {
    console.log('Form submission started...');
    console.log('Current form data:', formData);
    console.log('Current errors:', errors);
    console.log('Current field states:', fieldStates);

    const result = await handleSubmit(async (formData) => {
      console.log('Calling onSave with formData:', formData);
      await onSave(formData);
    });

    console.log('Form submission result:', result);

    if (result.success) {
      console.log('Form submitted successfully');
      onClose();
      resetForm();
    } else {
      console.log('Form submission failed with errors:', result.errors);
      // Show specific error messages to user
      if (result.errors) {
        const errorMessages = Object.values(result.errors).filter(Boolean);
        if (errorMessages.length > 0) {
          console.log('Validation errors found:', errorMessages);
          // The errors are already set in the form validation, so they should be visible
        }
      }
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {customer ? 'Edit Customer' : 'Add New Customer'}
      </DialogTitle>
      <DialogContent>
        {/* Validation Error Summary */}
        {Object.keys(errors).length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Please fix the following errors:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>
                  <Typography variant="body2">
                    {error}
                  </Typography>
                </li>
              ))}
            </ul>
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Company Name"
              {...getFieldProps('name')}
              color={getFieldStateColor(fieldStates.name)}
              InputProps={{
                endAdornment: fieldStates.name && fieldStates.name !== FIELD_STATES.IDLE ? (
                  <Box component="span" sx={{ color: getFieldStateColor(fieldStates.name) + '.main', fontSize: '20px' }}>
                    {getFieldStateIcon(fieldStates.name)}
                  </Box>
                ) : null
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Company Type</InputLabel>
              <Select
                name="type"
                value={formData.type || 'Corporation'}
                onChange={handleChange}
                label="Company Type"
              >
                <MenuItem value="Corporation">Corporation (PT)</MenuItem>
                <MenuItem value="Private Company">Private Company (CV)</MenuItem>
                <MenuItem value="Individual">Individual</MenuItem>
                <MenuItem value="Government">Government Agency</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              {...getFieldProps('email')}
              color={getFieldStateColor(fieldStates.email)}
              InputProps={{
                endAdornment: fieldStates.email && fieldStates.email !== FIELD_STATES.IDLE ? (
                  <Box component="span" sx={{ color: getFieldStateColor(fieldStates.email) + '.main', fontSize: '20px' }}>
                    {getFieldStateIcon(fieldStates.email)}
                  </Box>
                ) : null
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone"
              {...getFieldProps('phone')}
              color={getFieldStateColor(fieldStates.phone)}
              placeholder="08123456789"
              helperText="Format: 08123456789, 628123456789, atau +628123456789"
              InputProps={{
                endAdornment: fieldStates.phone && fieldStates.phone !== FIELD_STATES.IDLE ? (
                  <Box component="span" sx={{ color: getFieldStateColor(fieldStates.phone) + '.main', fontSize: '20px' }}>
                    {getFieldStateIcon(fieldStates.phone)}
                  </Box>
                ) : null
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              {...getFieldProps('address')}
              color={getFieldStateColor(fieldStates.address)}
              multiline
              rows={2}
              InputProps={{
                endAdornment: fieldStates.address && fieldStates.address !== FIELD_STATES.IDLE ? (
                  <Box component="span" sx={{ color: getFieldStateColor(fieldStates.address) + '.main', fontSize: '20px' }}>
                    {getFieldStateIcon(fieldStates.address)}
                  </Box>
                ) : null
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Tax ID (NPWP)"
              {...getFieldProps('taxId')}
              color={getFieldStateColor(fieldStates.taxId)}
              placeholder="01.234.567.8-901.000 (otomatis terformat)"
              helperText="Format: XX.XXX.XXX.X-XXX.XXX (15 digit)"
              InputProps={{
                endAdornment: fieldStates.taxId && fieldStates.taxId !== FIELD_STATES.IDLE ? (
                  <Box component="span" sx={{ color: getFieldStateColor(fieldStates.taxId) + '.main', fontSize: '20px' }}>
                    {getFieldStateIcon(fieldStates.taxId)}
                  </Box>
                ) : null
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Credit Limit (IDR)"
              type="number"
              {...getFieldProps('creditLimit')}
              color={getFieldStateColor(fieldStates.creditLimit)}
              placeholder="Enter credit limit amount (optional)"
              InputProps={{
                endAdornment: fieldStates.creditLimit && fieldStates.creditLimit !== FIELD_STATES.IDLE ? (
                  <Box component="span" sx={{ color: getFieldStateColor(fieldStates.creditLimit) + '.main', fontSize: '20px' }}>
                    {getFieldStateIcon(fieldStates.creditLimit)}
                  </Box>
                ) : null
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Payment Terms</InputLabel>
              <Select
                name="paymentTerms"
                value={formData.paymentTerms || 'Net 30'}
                onChange={handleChange}
                label="Payment Terms"
              >
                <MenuItem value="COD">Cash on Delivery</MenuItem>
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
              label="Contact Person"
              name="contactPerson"
              value={formData.contactPerson || ''}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Person Phone"
              name="contactPersonPhone"
              value={formData.contactPersonPhone || ''}
              onChange={handleChange}
              placeholder="e.g., 08123456789, 628123456789, or +628123456789"
              error={!!errors.contactPersonPhone}
              helperText={errors.contactPersonPhone || ''}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Person Email"
              name="contactPersonEmail"
              type="email"
              value={formData.contactPersonEmail || ''}
              onChange={handleChange}
              placeholder="contact.person@company.com"
              error={!!errors.contactPersonEmail}
              helperText={errors.contactPersonEmail || ''}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Industry"
              name="industry"
              value={formData.industry || ''}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Website"
              name="website"
              value={formData.website || ''}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={isSubmitting || Object.values(fieldStates).some(state => state === FIELD_STATES.VALIDATING)}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
        >
          {isSubmitting ? 'Saving...' : (customer ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuCustomerId, setMenuCustomerId] = useState(null);

  // Error handling state for general operations
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = withErrorHandling(async () => {
    setLoading(true);
    setSubmitError('');

    try {
      const data = await dataSyncService.getCustomers();
      if (!data) {
        throw new Error('No customer data available');
      }
      setCustomers(data);
    } catch (error) {
      const freightFlowError = handleError(error, 'CustomerManagement.loadCustomers');
      setSubmitError(freightFlowError.message);
      console.error('Error loading customers:', freightFlowError);
    } finally {
      setLoading(false);
    }
  }, 'CustomerManagement.loadCustomers');

  const handleAdd = () => {
    setSelectedCustomer(null);
    setDialogOpen(true);
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
    setAnchorEl(null);
  };

  const handleDelete = withErrorHandling(async (id) => {
    setSubmitError('');
    setSubmitSuccess('');

    const customer = customers.find(c => c.id === id);
    const confirmMessage = `Are you sure you want to delete customer "${customer?.name}"? This action cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      try {
        await dataSyncService.deleteCustomer(id);
        setSubmitSuccess('Customer deleted successfully!');
        await loadCustomers();

        // Clear success message after 3 seconds
        setTimeout(() => setSubmitSuccess(''), 3000);

      } catch (error) {
        const freightFlowError = handleError(error, 'CustomerManagement.handleDelete');
        setSubmitError(freightFlowError.message);
        throw freightFlowError;
      }
    }
    setAnchorEl(null);
  }, 'CustomerManagement.handleDelete');

  const handleSave = withErrorHandling(async (customerData) => {
    setSubmitError('');
    setSubmitSuccess('');

    try {
      if (selectedCustomer) {
        // Update existing customer
        await dataSyncService.updateCustomer(selectedCustomer.id, customerData);
        setSubmitSuccess('Customer updated successfully!');
      } else {
        // Create new customer
        const newCustomer = await dataSyncService.createCustomer(customerData);
        if (!newCustomer) {
          throw new Error('Failed to create customer');
        }
        setSubmitSuccess('Customer created successfully!');
      }

      // Reload customers list
      await loadCustomers();

      // Clear success message after 3 seconds
      setTimeout(() => setSubmitSuccess(''), 3000);

    } catch (error) {
      const freightFlowError = handleError(error, 'CustomerManagement.handleSave');
      setSubmitError(freightFlowError.message);
      throw freightFlowError;
    }
  }, 'CustomerManagement.handleSave');

  const handleMenuOpen = (event, customerId) => {
    setAnchorEl(event.currentTarget);
    setMenuCustomerId(customerId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuCustomerId(null);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Customer Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disabled={loading}
        >
          Add Customer
        </Button>
      </Box>

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}

      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {submitSuccess}
        </Alert>
      )}

      {loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Loading customers...
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            label="Search customers..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Company Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Credit Limit</TableCell>
              <TableCell>Payment Terms</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id} hover>
                <TableCell>
                  <Typography variant="subtitle1">{customer.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {customer.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={customer.type}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{customer.contactPerson}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {customer.phone}
                  </Typography>
                  {customer.contactPersonPhone && (
                    <Typography variant="body2" color="primary">
                      📱 {customer.contactPersonPhone}
                    </Typography>
                  )}
                  {customer.contactPersonEmail && (
                    <Typography variant="body2" color="primary">
                      ✉️ {customer.contactPersonEmail}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {customer.creditLimit ? formatCurrency(customer.creditLimit) : '-'}
                </TableCell>
                <TableCell>{customer.paymentTerms}</TableCell>
                <TableCell>
                  <Chip label="Active" color="success" size="small" />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, customer.id)}
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
        <MenuItem onClick={() => handleEdit(customers.find(c => c.id === menuCustomerId))}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleDelete(menuCustomerId)}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      <CustomerForm
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedCustomer(null);
          formValidation.reset();
          setSubmitError('');
          setSubmitSuccess('');
        }}
        customer={selectedCustomer}
        onSave={handleSave}
      />
    </Box>
  );
};

export default CustomerManagement;