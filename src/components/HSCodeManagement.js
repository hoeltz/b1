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
  IconButton,
  Tooltip,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Calculate as CalculateIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  Category as CategoryIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import dataSyncService from '../services/dataSync';
import notificationService from '../services/notificationService';
import {
  useFormValidation,
  getFieldStateColor,
  getFieldStateIcon,
  FIELD_STATES,
  extendedValidationPatterns
} from '../services/errorHandler';
import * as XLSX from 'xlsx';

const HSCodeForm = ({ open, onClose, hsCode, onSave }) => {
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    category: '',
    importDuty: '',
    vat: '11',
    excise: '0',
    restrictions: '',
    requiredPermits: '',
    notes: '',
  });

  const validationRules = {
    code: {
      required: true,
      pattern: /^\d{4}\.\d{2}\.\d{4}$/,
      patternMessage: 'HS Code must be in format: 1234.56.7890'
    },
    description: {
      required: true,
      minLength: 10,
      patternMessage: 'Description must be at least 10 characters'
    },
    category: {
      required: true,
      patternMessage: 'Please select a category'
    },
    importDuty: {
      required: true,
      pattern: /^\d+(\.\d{1,2})?$/,
      patternMessage: 'Import duty must be a valid percentage',
      custom: (value) => {
        const num = parseFloat(value);
        if (num < 0) return 'Import duty cannot be negative';
        if (num > 100) return 'Import duty cannot exceed 100%';
        return true;
      }
    },
    vat: {
      required: true,
      pattern: /^\d+(\.\d{1,2})?$/,
      patternMessage: 'VAT must be a valid percentage'
    }
  };

  const formValidation = useFormValidation(formData, validationRules);

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
    if (hsCode) {
      setFormData({
        code: hsCode.code,
        description: hsCode.description,
        category: hsCode.category,
        importDuty: hsCode.importDuty.toString(),
        vat: hsCode.vat.toString(),
        excise: hsCode.excise.toString(),
        restrictions: hsCode.restrictions?.join(', ') || '',
        requiredPermits: hsCode.requiredPermits?.join(', ') || '',
        notes: hsCode.notes || '',
      });
      formValidation.setValues(hsCode);
    } else {
      resetForm();
    }
  }, [hsCode]);

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      category: '',
      importDuty: '',
      vat: '11',
      excise: '0',
      restrictions: '',
      requiredPermits: '',
      notes: '',
    });
    reset();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    handleFieldChange(name, value);
  };

  const onSubmit = async () => {
    const result = await handleSubmit(async (formData) => {
      const hsCodeData = {
        ...formData,
        importDuty: parseFloat(formData.importDuty),
        vat: parseFloat(formData.vat),
        excise: parseFloat(formData.excise),
        restrictions: formData.restrictions ? formData.restrictions.split(',').map(item => item.trim()) : [],
        requiredPermits: formData.requiredPermits ? formData.requiredPermits.split(',').map(item => item.trim()) : [],
      };
      await onSave(hsCodeData);
    });

    if (result.success) {
      onClose();
      resetForm();
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {hsCode ? 'Edit HS Code' : 'Add New HS Code'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="HS Code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              onBlur={() => handleFieldBlur('code')}
              error={touched.code && !!errors.code}
              helperText={touched.code ? errors.code : 'Format: 1234.56.7890'}
              placeholder="1234.56.7890"
              {...getFieldProps('code')}
              color={getFieldStateColor(fieldStates.code)}
              InputProps={{
                endAdornment: fieldStates.code && fieldStates.code !== FIELD_STATES.IDLE ? (
                  <Box component="span" sx={{ color: getFieldStateColor(fieldStates.code) + '.main', fontSize: '20px' }}>
                    {getFieldStateIcon(fieldStates.code)}
                  </Box>
                ) : null
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={touched.category && !!errors.category}>
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                label="Category"
              >
                <MenuItem value="Electronics">Electronics</MenuItem>
                <MenuItem value="Automotive">Automotive</MenuItem>
                <MenuItem value="Textile">Textile & Garment</MenuItem>
                <MenuItem value="Machinery">Machinery</MenuItem>
                <MenuItem value="Chemical">Chemical Products</MenuItem>
                <MenuItem value="Food">Food & Beverage</MenuItem>
                <MenuItem value="Mineral">Mineral Products</MenuItem>
                <MenuItem value="Metal">Metal Products</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
              {touched.category && errors.category && (
                <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                  {errors.category}
                </Typography>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              onBlur={() => handleFieldBlur('description')}
              error={touched.description && !!errors.description}
              helperText={touched.description ? errors.description : 'Detailed product description'}
              multiline
              rows={2}
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
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Import Duty (%)"
              name="importDuty"
              type="number"
              value={formData.importDuty}
              onChange={handleChange}
              onBlur={() => handleFieldBlur('importDuty')}
              error={touched.importDuty && !!errors.importDuty}
              helperText={touched.importDuty ? errors.importDuty : 'Percentage (0-100)'}
              {...getFieldProps('importDuty')}
              color={getFieldStateColor(fieldStates.importDuty)}
              InputProps={{
                endAdornment: fieldStates.importDuty && fieldStates.importDuty !== FIELD_STATES.IDLE ? (
                  <Box component="span" sx={{ color: getFieldStateColor(fieldStates.importDuty) + '.main', fontSize: '20px' }}>
                    {getFieldStateIcon(fieldStates.importDuty)}
                  </Box>
                ) : null
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="VAT (%)"
              name="vat"
              type="number"
              value={formData.vat}
              onChange={handleChange}
              onBlur={() => handleFieldBlur('vat')}
              error={touched.vat && !!errors.vat}
              helperText={touched.vat ? errors.vat : 'VAT percentage'}
              {...getFieldProps('vat')}
              color={getFieldStateColor(fieldStates.vat)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Excise (%)"
              name="excise"
              type="number"
              value={formData.excise}
              onChange={handleChange}
              helperText="Excise duty percentage (optional)"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Restrictions"
              name="restrictions"
              value={formData.restrictions}
              onChange={handleChange}
              helperText="Import restrictions (comma separated)"
              placeholder="Lartas, API, etc."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Required Permits"
              name="requiredPermits"
              value={formData.requiredPermits}
              onChange={handleChange}
              helperText="Required permits (comma separated)"
              placeholder="SNI, BPOM, etc."
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={2}
              helperText="Additional notes or special conditions"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={isSubmitting || Object.values(fieldStates).some(state => state === FIELD_STATES.VALIDATING)}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
        >
          {isSubmitting ? 'Saving...' : (hsCode ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const HSCodeCalculator = ({ open, onClose, onCalculate }) => {
  const [cifValue, setCifValue] = useState('');
  const [selectedHSCode, setSelectedHSCode] = useState(null);
  const [hsCodes, setHSCodes] = useState([]);
  const [calculation, setCalculation] = useState(null);

  useEffect(() => {
    loadHSCodes();
  }, []);

  const loadHSCodes = async () => {
    try {
      const data = await dataSyncService.getHSCodes?.() || [];
      setHSCodes(data);
    } catch (error) {
      console.error('Error loading HS Codes:', error);
    }
  };

  const calculateCost = () => {
    if (!cifValue || !selectedHSCode) return;

    const cif = parseFloat(cifValue);
    const duty = cif * (selectedHSCode.importDuty / 100);
    const vatBase = cif + duty;
    const vat = vatBase * (selectedHSCode.vat / 100);
    const excise = cif * (selectedHSCode.excise / 100);
    const total = cif + duty + vat + excise;

    const result = {
      cifValue: cif,
      importDuty: duty,
      vat,
      excise,
      totalCost: total,
      hsCode: selectedHSCode,
      breakdown: {
        cif: cif,
        duty: `${selectedHSCode.importDuty}%`,
        vat: `${selectedHSCode.vat}%`,
        excise: `${selectedHSCode.excise}%`,
      }
    };

    setCalculation(result);
    onCalculate(result);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>HS Code Cost Calculator</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="CIF Value (IDR)"
              type="number"
              value={cifValue}
              onChange={(e) => setCifValue(e.target.value)}
              placeholder="Enter CIF value in Rupiah"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={hsCodes}
              getOptionLabel={(option) => `${option.code} - ${option.description}`}
              value={selectedHSCode}
              onChange={(event, newValue) => setSelectedHSCode(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Select HS Code" fullWidth />
              )}
            />
          </Grid>

          {calculation && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Cost Breakdown</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">CIF Value</Typography>
                      <Typography variant="body1">{formatCurrency(calculation.cifValue)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Import Duty ({calculation.breakdown.duty})</Typography>
                      <Typography variant="body1" color="error.main">{formatCurrency(calculation.importDuty)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">VAT ({calculation.breakdown.vat})</Typography>
                      <Typography variant="body1" color="warning.main">{formatCurrency(calculation.vat)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Excise ({calculation.breakdown.excise})</Typography>
                      <Typography variant="body1" color="info.main">{formatCurrency(calculation.excise)}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="h6" color="success.main">
                        Total Cost: {formatCurrency(calculation.totalCost)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          onClick={calculateCost}
          variant="contained"
          disabled={!cifValue || !selectedHSCode}
          startIcon={<CalculateIcon />}
        >
          Calculate
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const HSCodeManagement = () => {
  const [hsCodes, setHSCodes] = useState([]);
  const [filteredHSCodes, setFilteredHSCodes] = useState([]);
  const [selectedHSCode, setSelectedHSCode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHSCodes();
  }, []);

  useEffect(() => {
    filterHSCodes();
  }, [hsCodes, searchTerm, categoryFilter]);

  const loadHSCodes = async () => {
    setLoading(true);
    try {
      const data = await dataSyncService.getHSCodes?.() || [];
      setHSCodes(data);
    } catch (error) {
      console.error('Error loading HS Codes:', error);
      notificationService.showError('Failed to load HS Codes');
    } finally {
      setLoading(false);
    }
  };

  const filterHSCodes = () => {
    let filtered = hsCodes;

    if (searchTerm) {
      filtered = filtered.filter(hs =>
        hs.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hs.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(hs => hs.category === categoryFilter);
    }

    setFilteredHSCodes(filtered);
  };

  const handleAdd = () => {
    setSelectedHSCode(null);
    setDialogOpen(true);
  };

  const handleEdit = (hsCode) => {
    setSelectedHSCode(hsCode);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this HS Code?')) {
      try {
        await dataSyncService.deleteHSCode?.(id);
        setHSCodes(prev => prev.filter(hs => hs.id !== id));
        notificationService.showSuccess('HS Code deleted successfully');
      } catch (error) {
        notificationService.showError('Failed to delete HS Code');
      }
    }
  };

  const handleSave = async (hsCodeData) => {
    try {
      if (selectedHSCode) {
        const updatedHSCode = await dataSyncService.updateHSCode?.(selectedHSCode.id, hsCodeData);
        setHSCodes(prev => prev.map(hs => hs.id === selectedHSCode.id ? updatedHSCode : hs));
        notificationService.showSuccess('HS Code updated successfully');
      } else {
        const newHSCode = await dataSyncService.createHSCode?.(hsCodeData);
        setHSCodes(prev => [...prev, newHSCode]);
        notificationService.showSuccess('HS Code created successfully');
      }
    } catch (error) {
      notificationService.showError('Failed to save HS Code');
      throw error;
    }
  };

  const handleCalculate = (calculation) => {
    console.log('Cost calculation:', calculation);
    notificationService.showSuccess(`Total cost calculated: ${formatCurrency(calculation.totalCost)}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Electronics': 'primary',
      'Automotive': 'secondary',
      'Textile': 'success',
      'Machinery': 'info',
      'Chemical': 'warning',
      'Food': 'error',
      'Mineral': 'default',
      'Metal': 'secondary',
      'Other': 'default'
    };
    return colors[category] || 'default';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">HS Code Management</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<CalculateIcon />}
            onClick={() => setCalculatorOpen(true)}
          >
            Cost Calculator
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Add HS Code
          </Button>
        </Box>
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

      <Grid container spacing={3}>
        {/* Filters */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Search HS Code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by code or description..."
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      label="Category"
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      <MenuItem value="Electronics">Electronics</MenuItem>
                      <MenuItem value="Automotive">Automotive</MenuItem>
                      <MenuItem value="Textile">Textile & Garment</MenuItem>
                      <MenuItem value="Machinery">Machinery</MenuItem>
                      <MenuItem value="Chemical">Chemical Products</MenuItem>
                      <MenuItem value="Food">Food & Beverage</MenuItem>
                      <MenuItem value="Mineral">Mineral Products</MenuItem>
                      <MenuItem value="Metal">Metal Products</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* HS Code Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                HS Codes ({filteredHSCodes.length} of {hsCodes.length})
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>HS Code</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Import Duty</TableCell>
                      <TableCell align="right">VAT</TableCell>
                      <TableCell align="right">Excise</TableCell>
                      <TableCell>Restrictions</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredHSCodes.map((hsCode) => (
                      <TableRow key={hsCode.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
                            {hsCode.code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{hsCode.description}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={hsCode.category}
                            size="small"
                            color={getCategoryColor(hsCode.category)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="error.main">
                            {hsCode.importDuty}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="warning.main">
                            {hsCode.vat}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="info.main">
                            {hsCode.excise}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {hsCode.restrictions?.length > 0 ? (
                            <Box>
                              {hsCode.restrictions.slice(0, 2).map((restriction, index) => (
                                <Chip
                                  key={index}
                                  label={restriction}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                              {hsCode.restrictions.length > 2 && (
                                <Chip
                                  label={`+${hsCode.restrictions.length - 2}`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="textSecondary">None</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEdit(hsCode)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(hsCode.id)}>
                              <DeleteIcon />
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

      <HSCodeForm
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        hsCode={selectedHSCode}
        onSave={handleSave}
      />

      <HSCodeCalculator
        open={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
        onCalculate={handleCalculate}
      />
    </Box>
  );
};

export default HSCodeManagement;