import React, { useState, useEffect } from 'react';
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
  Rating,
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
  TableFooter,
  IconButton,
  Tooltip,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  GetApp as ExportIcon,
  Print as PrintIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
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

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const [activeTab, setActiveTab] = useState(0);

  // Form states
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');

  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Enhanced validation rules for comprehensive vendor form
  const validationRules = {
    name: {
      required: true,
      minLength: 2,
      patternMessage: 'Company name must be at least 2 characters'
    },
    type: {
      required: true,
      minLength: 2,
      patternMessage: 'Company type is required'
    },
    serviceType: {
      required: true,
      patternMessage: 'Please select a service type'
    },
    contactPerson: {
      required: true,
      minLength: 2,
      patternMessage: 'Contact person name must be at least 2 characters'
    },
    phone: {
      required: true,
      pattern: extendedValidationPatterns.indonesianPhone,
      patternMessage: 'Please enter a valid Indonesian phone number'
    },
    email: {
      pattern: extendedValidationPatterns.email,
      patternMessage: 'Please enter a valid email address',
      required: false
    },
    registrationNumber: {
      required: false,
      patternMessage: 'Please enter a valid registration number'
    },
    taxId: {
      required: false,
      patternMessage: 'Please enter a valid tax ID'
    }
  };

  const formValidation = useFormValidation({
    name: '',
    type: '',
    serviceType: '',
    contactPerson: '',
    position: '',
    phone: '',
    email: '',
    registrationNumber: '',
    taxId: '',
    licenseNumber: '',
    establishedDate: '',
    companySize: 'Medium',
    website: '',
    address: '',
    billingAddress: '',
    paymentTerms: 'Net 30',
    creditLimit: '',
    currency: 'IDR',
    rating: 3,
    serviceAreas: [],
    equipment: [],
    capacity: {},
    certifications: [],
    insurance: {},
    compliance: {},
    notes: '',
    tags: []
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

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    filterVendors();
  }, [vendors, searchTerm, serviceFilter, ratingFilter, statusFilter]);

  const loadVendors = async () => {
    try {
      const data = await dataSyncService.getVendors();
      setVendors(data || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
      notificationService.showError('Failed to load vendors');
    }
  };

  const filterVendors = () => {
    let filtered = vendors;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(vendor =>
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vendor.email && vendor.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by service type
    if (serviceFilter) {
      filtered = filtered.filter(vendor => vendor.serviceType === serviceFilter);
    }

    // Filter by rating
    if (ratingFilter) {
      filtered = filtered.filter(vendor => vendor.rating >= parseInt(ratingFilter));
    }

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter(vendor => vendor.status === statusFilter);
    }

    setFilteredVendors(filtered);
  };

  const handleViewDetail = (vendor) => {
    setSelectedVendor(vendor);
    setViewMode('detail');
  };

  const handleEditVendor = (vendor) => {
    setEditingVendor(vendor);
    reset({
      name: vendor.name,
      type: vendor.type,
      serviceType: vendor.serviceType,
      contactPerson: vendor.contactPerson,
      position: vendor.position || '',
      phone: vendor.phone,
      email: vendor.email,
      registrationNumber: vendor.registrationNumber || '',
      taxId: vendor.taxId || '',
      licenseNumber: vendor.licenseNumber || '',
      establishedDate: vendor.establishedDate || '',
      companySize: vendor.companySize || 'Medium',
      website: vendor.website || '',
      address: vendor.address || '',
      billingAddress: vendor.billingAddress || '',
      paymentTerms: vendor.paymentTerms || 'Net 30',
      creditLimit: vendor.creditLimit || '',
      currency: vendor.currency || 'IDR',
      rating: vendor.rating,
      serviceAreas: vendor.serviceAreas || [],
      equipment: vendor.equipment || [],
      capacity: vendor.capacity || {},
      certifications: vendor.certifications || [],
      insurance: vendor.insurance || {},
      compliance: vendor.compliance || {},
      notes: vendor.notes || '',
      tags: vendor.tags || []
    });
    setEditOpen(true);
  };

  const handleDeleteVendor = async (vendorId) => {
    if (window.confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      try {
        await dataSyncService.deleteVendor(vendorId);
        setVendors(prev => prev.filter(v => v.id !== vendorId));
        notificationService.showSuccess('Vendor deleted successfully');
      } catch (error) {
        notificationService.showError(error.message || 'Failed to delete vendor');
      }
    }
  };

  const handleSubmit = async () => {
    setSubmitError('');
    setSubmitSuccess('');

    const result = await validateAndSubmit(async (formData) => {
      const newVendor = {
        ...formData,
        rating: parseInt(formData.rating),
        creditLimit: parseFloat(formData.creditLimit) || 0,
        status: 'Active'
      };

      const createdVendor = await dataSyncService.createVendor(newVendor);
      setVendors(prev => [...prev, createdVendor]);
    });

    if (result.success) {
      setSubmitSuccess('Vendor added successfully!');
      reset();
      setOpen(false);
      setTimeout(() => setSubmitSuccess(''), 3000);
    } else {
      setSubmitError('Please correct the validation errors');
    }
  };

  const handleUpdateVendor = async () => {
    setSubmitError('');
    setSubmitSuccess('');

    const result = await validateAndSubmit(async (formData) => {
      const updatedVendor = {
        ...editingVendor,
        ...formData,
        rating: parseInt(formData.rating),
        creditLimit: parseFloat(formData.creditLimit) || 0
      };

      const savedVendor = await dataSyncService.updateVendor(editingVendor.id, updatedVendor);
      setVendors(prev => prev.map(v => v.id === editingVendor.id ? savedVendor : v));
    });

    if (result.success) {
      setSubmitSuccess('Vendor updated successfully!');
      setEditOpen(false);
      setEditingVendor(null);
      setTimeout(() => setSubmitSuccess(''), 3000);
    } else {
      setSubmitError('Please correct the validation errors');
    }
  };

  const handleClose = () => {
    setOpen(false);
    reset();
    setSubmitError('');
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditingVendor(null);
    reset();
    setSubmitError('');
  };

  const handleExportExcel = () => {
    try {
      const exportData = vendors.map(vendor => ({
        'Vendor Code': vendor.vendorCode,
        'Company Name': vendor.name,
        'Type': vendor.type,
        'Service Type': vendor.serviceType,
        'Contact Person': vendor.contactPerson,
        'Position': vendor.position,
        'Phone': vendor.phone,
        'Email': vendor.email,
        'Rating': vendor.rating,
        'Status': vendor.status,
        'Registration Number': vendor.registrationNumber,
        'Tax ID': vendor.taxId,
        'Established Date': vendor.establishedDate,
        'Company Size': vendor.companySize,
        'Credit Limit': vendor.creditLimit,
        'Payment Terms': vendor.paymentTerms,
        'Website': vendor.website,
        'Address': vendor.address,
        'Certifications': vendor.certifications?.join(', ') || '',
        'Service Areas': vendor.serviceAreas?.join(', ') || '',
        'Equipment': vendor.equipment?.join(', ') || '',
        'Notes': vendor.notes
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Vendors');

      const colWidths = [
        { wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 20 },
        { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 8 }, { wch: 10 },
        { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
        { wch: 15 }, { wch: 30 }, { wch: 40 }, { wch: 30 }, { wch: 30 }, { wch: 50 }
      ];
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `Vendors_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      notificationService.showSuccess('Vendor report exported successfully!');
    } catch (error) {
      console.error('Error exporting vendors:', error);
      notificationService.showError('Failed to export vendor report');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'default';
      case 'Suspended': return 'error';
      default: return 'info';
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'success';
    if (rating >= 3.5) return 'warning';
    return 'error';
  };

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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {viewMode === 'list' ? 'Vendor Management' : `Vendor Details - ${selectedVendor?.name}`}
        </Typography>
        <Box display="flex" gap={1}>
          {viewMode === 'detail' && (
            <Button
              variant="outlined"
              onClick={() => setViewMode('list')}
            >
              Back to List
            </Button>
          )}
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
            onClick={() => setOpen(true)}
          >
            Add Vendor
          </Button>
        </Box>
      </Box>

      {viewMode === 'list' ? (
        // Vendor List View
        <Grid container spacing={3}>
          {/* Filters */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Filters</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Search vendors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Name, contact person, email..."
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Service Type</InputLabel>
                      <Select
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                        label="Service Type"
                      >
                        <MenuItem value="">All Services</MenuItem>
                        <MenuItem value="Sea Freight">Sea Freight</MenuItem>
                        <MenuItem value="Air Freight">Air Freight</MenuItem>
                        <MenuItem value="Trucking">Trucking</MenuItem>
                        <MenuItem value="Warehousing">Warehousing</MenuItem>
                        <MenuItem value="Customs">Customs Broker</MenuItem>
                        <MenuItem value="Insurance">Insurance</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Min Rating</InputLabel>
                      <Select
                        value={ratingFilter}
                        onChange={(e) => setRatingFilter(e.target.value)}
                        label="Min Rating"
                      >
                        <MenuItem value="">All Ratings</MenuItem>
                        <MenuItem value="5">5 Stars</MenuItem>
                        <MenuItem value="4">4+ Stars</MenuItem>
                        <MenuItem value="3">3+ Stars</MenuItem>
                        <MenuItem value="2">2+ Stars</MenuItem>
                        <MenuItem value="1">1+ Stars</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        label="Status"
                      >
                        <MenuItem value="">All Status</MenuItem>
                        <MenuItem value="Active">Active</MenuItem>
                        <MenuItem value="Inactive">Inactive</MenuItem>
                        <MenuItem value="Suspended">Suspended</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Vendor List */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Service Providers ({filteredVendors.length} of {vendors.length})
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Vendor Code</TableCell>
                        <TableCell>Company</TableCell>
                        <TableCell>Service Type</TableCell>
                        <TableCell>Contact</TableCell>
                        <TableCell>Performance</TableCell>
                        <TableCell>Financial</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredVendors.map((vendor) => (
                        <TableRow key={vendor.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
                              {vendor.vendorCode}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">{vendor.name}</Typography>
                            <Typography variant="body2" color="textSecondary">
                              {vendor.type} • Est. {vendor.establishedDate}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={vendor.serviceType} size="small" color="primary" />
                            {vendor.serviceAreas?.length > 0 && (
                              <Typography variant="caption" display="block" color="textSecondary">
                                {vendor.serviceAreas.slice(0, 2).join(', ')}
                                {vendor.serviceAreas.length > 2 && ` +${vendor.serviceAreas.length - 2} more`}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">{vendor.contactPerson}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                {vendor.position}
                              </Typography>
                              <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                                {vendor.phone}
                              </Typography>
                              {vendor.email && (
                                <Typography variant="body2" color="textSecondary">
                                  {vendor.email}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Rating value={vendor.rating} readOnly size="small" />
                              <Typography variant="body2" color="textSecondary">
                                {vendor.rating}/5
                              </Typography>
                              {vendor.certifications?.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  {vendor.certifications.slice(0, 2).map((cert, index) => (
                                    <Chip
                                      key={index}
                                      label={cert}
                                      size="small"
                                      variant="outlined"
                                      sx={{ mr: 0.5, mb: 0.5 }}
                                    />
                                  ))}
                                  {vendor.certifications.length > 2 && (
                                    <Chip
                                      label={`+${vendor.certifications.length - 2}`}
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              Credit: {formatCurrency(vendor.creditLimit, vendor.currency)}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Terms: {vendor.paymentTerms}
                            </Typography>
                            {vendor.contracts?.length > 0 && (
                              <Typography variant="caption" color="success.main">
                                {vendor.contracts.length} active contract{vendor.contracts.length > 1 ? 's' : ''}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip label={vendor.status} color={getStatusColor(vendor.status)} size="small" />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="View Details">
                              <IconButton size="small" onClick={() => handleViewDetail(vendor)}>
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleEditVendor(vendor)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => handleDeleteVendor(vendor.id)}>
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
      ) : (
        // Vendor Detail View
        <Grid container spacing={3}>
          {selectedVendor && (
            <>
              {/* Vendor Header */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h5">{selectedVendor.name}</Typography>
                        <Typography variant="subtitle1" color="textSecondary">
                          {selectedVendor.type} • {selectedVendor.serviceType}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Code: {selectedVendor.vendorCode} • Rating: {selectedVendor.rating}/5
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditVendor(selectedVendor)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<ExportIcon />}
                          onClick={handleExportExcel}
                        >
                          Export
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Detailed Information Tabs */}
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ p: 0 }}>
                    <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                      <Tab label="Basic Information" />
                      <Tab label="Services & Capacity" />
                      <Tab label="Financial & Contracts" />
                      <Tab label="Compliance & Insurance" />
                      <Tab label="Performance Metrics" />
                    </Tabs>

                    <Box sx={{ p: 3 }}>
                      {activeTab === 0 && (
                        // Basic Information
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Company Details</Typography>
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" color="textSecondary">Company Name</Typography>
                              <Typography variant="body1" gutterBottom>{selectedVendor.name}</Typography>

                              <Typography variant="body2" color="textSecondary">Company Type</Typography>
                              <Typography variant="body1" gutterBottom>{selectedVendor.type}</Typography>

                              <Typography variant="body2" color="textSecondary">Established Date</Typography>
                              <Typography variant="body1" gutterBottom>{selectedVendor.establishedDate || 'Not specified'}</Typography>

                              <Typography variant="body2" color="textSecondary">Company Size</Typography>
                              <Typography variant="body1" gutterBottom>{selectedVendor.companySize}</Typography>

                              <Typography variant="body2" color="textSecondary">Website</Typography>
                              <Typography variant="body1" gutterBottom>
                                {selectedVendor.website ? (
                                  <a href={selectedVendor.website} target="_blank" rel="noopener noreferrer">
                                    {selectedVendor.website}
                                  </a>
                                ) : 'Not specified'}
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Contact Information</Typography>
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" color="textSecondary">Primary Contact</Typography>
                              <Typography variant="body1" gutterBottom>
                                {selectedVendor.contactPerson} - {selectedVendor.position}
                              </Typography>

                              <Typography variant="body2" color="textSecondary">Phone</Typography>
                              <Typography variant="body1" gutterBottom>{selectedVendor.phone}</Typography>

                              {selectedVendor.email && (
                                <>
                                  <Typography variant="body2" color="textSecondary">Email</Typography>
                                  <Typography variant="body1" gutterBottom>{selectedVendor.email}</Typography>
                                </>
                              )}

                              <Typography variant="body2" color="textSecondary">Address</Typography>
                              <Typography variant="body1" gutterBottom>{selectedVendor.address}</Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      )}

                      {activeTab === 1 && (
                        // Services & Capacity
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Service Information</Typography>
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" color="textSecondary">Service Type</Typography>
                              <Typography variant="body1" gutterBottom>{selectedVendor.serviceType}</Typography>

                              <Typography variant="body2" color="textSecondary">Service Areas</Typography>
                              <Box sx={{ mt: 1 }}>
                                {selectedVendor.serviceAreas?.map((area, index) => (
                                  <Chip key={index} label={area} sx={{ mr: 1, mb: 1 }} />
                                )) || <Typography variant="body2">No service areas specified</Typography>}
                              </Box>

                              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>Equipment</Typography>
                              <Box sx={{ mt: 1 }}>
                                {selectedVendor.equipment?.map((item, index) => (
                                  <Chip key={index} label={item} variant="outlined" sx={{ mr: 1, mb: 1 }} />
                                )) || <Typography variant="body2">No equipment specified</Typography>}
                              </Box>
                            </Box>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Capacity Information</Typography>
                            <Box sx={{ mt: 2 }}>
                              {selectedVendor.capacity?.teu && (
                                <>
                                  <Typography variant="body2" color="textSecondary">TEU Capacity</Typography>
                                  <Typography variant="body1" gutterBottom>{selectedVendor.capacity.teu.toLocaleString()} TEU</Typography>
                                </>
                              )}

                              {selectedVendor.capacity?.containers && (
                                <>
                                  <Typography variant="body2" color="textSecondary">Container Capacity</Typography>
                                  <Typography variant="body1" gutterBottom>{selectedVendor.capacity.containers.toLocaleString()} containers</Typography>
                                </>
                              )}

                              {selectedVendor.capacity?.tonnage && (
                                <>
                                  <Typography variant="body2" color="textSecondary">Tonnage Capacity</Typography>
                                  <Typography variant="body1" gutterBottom>{selectedVendor.capacity.tonnage.toLocaleString()} tons</Typography>
                                </>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      )}

                      {activeTab === 2 && (
                        // Financial & Contracts
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Financial Information</Typography>
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" color="textSecondary">Credit Limit</Typography>
                              <Typography variant="body1" gutterBottom>
                                {formatCurrency(selectedVendor.creditLimit, selectedVendor.currency)}
                              </Typography>

                              <Typography variant="body2" color="textSecondary">Payment Terms</Typography>
                              <Typography variant="body1" gutterBottom>{selectedVendor.paymentTerms}</Typography>

                              <Typography variant="body2" color="textSecondary">Currency Preference</Typography>
                              <Typography variant="body1" gutterBottom>{selectedVendor.currency}</Typography>
                            </Box>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Active Contracts</Typography>
                            <Box sx={{ mt: 2 }}>
                              {selectedVendor.contracts?.length > 0 ? (
                                selectedVendor.contracts.map((contract, index) => (
                                  <Card key={index} sx={{ mb: 2, bgcolor: 'grey.50' }}>
                                    <CardContent sx={{ py: 2 }}>
                                      <Typography variant="subtitle2">{contract.contractNumber}</Typography>
                                      <Typography variant="body2" color="textSecondary">
                                        {contract.type} • {formatCurrency(contract.value, contract.currency)}
                                      </Typography>
                                      <Typography variant="body2" color="textSecondary">
                                        {contract.startDate} to {contract.endDate}
                                      </Typography>
                                    </CardContent>
                                  </Card>
                                ))
                              ) : (
                                <Typography variant="body2" color="textSecondary">No active contracts</Typography>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      )}

                      {activeTab === 3 && (
                        // Compliance & Insurance
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Certifications</Typography>
                            <Box sx={{ mt: 2 }}>
                              {selectedVendor.certifications?.length > 0 ? (
                                selectedVendor.certifications.map((cert, index) => (
                                  <Chip key={index} label={cert} color="success" variant="outlined" sx={{ mr: 1, mb: 1 }} />
                                ))
                              ) : (
                                <Typography variant="body2" color="textSecondary">No certifications listed</Typography>
                              )}
                            </Box>

                            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Compliance Status</Typography>
                            <Box sx={{ mt: 2 }}>
                              {selectedVendor.compliance?.businessLicense && (
                                <>
                                  <Typography variant="body2" color="textSecondary">Business License</Typography>
                                  <Typography variant="body1" gutterBottom>{selectedVendor.compliance.businessLicense}</Typography>
                                </>
                              )}

                              {selectedVendor.compliance?.safetyCertification && (
                                <>
                                  <Typography variant="body2" color="textSecondary">Safety Certification</Typography>
                                  <Typography variant="body1" gutterBottom>{selectedVendor.compliance.safetyCertification}</Typography>
                                </>
                              )}

                              {selectedVendor.compliance?.environmentalCompliance && (
                                <>
                                  <Typography variant="body2" color="textSecondary">Environmental Compliance</Typography>
                                  <Typography variant="body1" gutterBottom>{selectedVendor.compliance.environmentalCompliance}</Typography>
                                </>
                              )}
                            </Box>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Insurance Coverage</Typography>
                            <Box sx={{ mt: 2 }}>
                              {selectedVendor.insurance?.publicLiability && (
                                <>
                                  <Typography variant="body2" color="textSecondary">Public Liability</Typography>
                                  <Typography variant="body1" gutterBottom>{selectedVendor.insurance.publicLiability}</Typography>
                                </>
                              )}

                              {selectedVendor.insurance?.cargoInsurance && (
                                <>
                                  <Typography variant="body2" color="textSecondary">Cargo Insurance</Typography>
                                  <Typography variant="body1" gutterBottom>{selectedVendor.insurance.cargoInsurance}</Typography>
                                </>
                              )}

                              {selectedVendor.insurance?.professionalIndemnity && (
                                <>
                                  <Typography variant="body2" color="textSecondary">Professional Indemnity</Typography>
                                  <Typography variant="body1" gutterBottom>{selectedVendor.insurance.professionalIndemnity}</Typography>
                                </>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      )}

                      {activeTab === 4 && (
                        // Performance Metrics
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" color="textSecondary">Overall Rating</Typography>
                              <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
                                <Rating value={selectedVendor.rating} readOnly size="large" />
                                <Typography variant="h4">{selectedVendor.rating}/5</Typography>
                              </Box>

                              <Typography variant="body2" color="textSecondary">Last Rating Update</Typography>
                              <Typography variant="body1" gutterBottom>
                                {selectedVendor.lastRatingUpdate ?
                                  new Date(selectedVendor.lastRatingUpdate).toLocaleDateString('id-ID') :
                                  'Never updated'
                                }
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Activity Summary</Typography>
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" color="textSecondary">Total Orders</Typography>
                              <Typography variant="body1" gutterBottom>
                                {selectedVendor.totalOrders || 0} orders
                              </Typography>

                              <Typography variant="body2" color="textSecondary">Total Cost Value</Typography>
                              <Typography variant="body1" gutterBottom>
                                {formatCurrency(selectedVendor.totalCostValue || 0, selectedVendor.currency)}
                              </Typography>

                              <Typography variant="body2" color="textSecondary">Average Order Value</Typography>
                              <Typography variant="body1" gutterBottom>
                                {formatCurrency(selectedVendor.averageOrderValue || 0, selectedVendor.currency)}
                              </Typography>

                              <Typography variant="body2" color="textSecondary">Last Activity</Typography>
                              <Typography variant="body1" gutterBottom>
                                {selectedVendor.lastActivity ?
                                  new Date(selectedVendor.lastActivity).toLocaleDateString('id-ID') :
                                  'No recent activity'
                                }
                              </Typography>
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

      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {submitSuccess}
        </Alert>
      )}

      {/* Add Vendor Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Add New Vendor</DialogTitle>
        <DialogContent>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <Tabs value={0} sx={{ mt: 2 }}>
            <Tab label="Basic Information" />
            <Tab label="Contact & Service" />
            <Tab label="Financial & Legal" />
          </Tabs>

          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {/* Basic Information */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  {...getFieldProps('name')}
                  color={getFieldStateColor(fieldStates.name)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Type"
                  {...getFieldProps('type')}
                  color={getFieldStateColor(fieldStates.type)}
                  placeholder="e.g., PT, CV, Ltd"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Registration Number"
                  value={values.registrationNumber}
                  onChange={(e) => handleFieldChange('registrationNumber', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tax ID (NPWP)"
                  value={values.taxId}
                  onChange={(e) => handleFieldChange('taxId', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Business License"
                  value={values.licenseNumber}
                  onChange={(e) => handleFieldChange('licenseNumber', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Established Date"
                  type="date"
                  value={values.establishedDate}
                  onChange={(e) => handleFieldChange('establishedDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Company Size</InputLabel>
                  <Select
                    value={values.companySize}
                    onChange={(e) => handleFieldChange('companySize', e.target.value)}
                    label="Company Size"
                  >
                    <MenuItem value="Small">Small (1-50 employees)</MenuItem>
                    <MenuItem value="Medium">Medium (51-200 employees)</MenuItem>
                    <MenuItem value="Large">Large (201-500 employees)</MenuItem>
                    <MenuItem value="Enterprise">Enterprise (500+ employees)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Website"
                  value={values.website}
                  onChange={(e) => handleFieldChange('website', e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
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
            {isSubmitting ? 'Adding...' : 'Add Vendor'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="md" fullWidth>
        <DialogTitle>Edit Vendor</DialogTitle>
        <DialogContent>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <Tabs value={0} sx={{ mt: 2 }}>
            <Tab label="Basic Information" />
            <Tab label="Contact & Service" />
            <Tab label="Financial & Legal" />
          </Tabs>

          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {/* Basic Information Tab */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={values.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Type"
                  value={values.type}
                  onChange={(e) => handleFieldChange('type', e.target.value)}
                  error={!!errors.type}
                  helperText={errors.type}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Registration Number"
                  value={values.registrationNumber}
                  onChange={(e) => handleFieldChange('registrationNumber', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tax ID (NPWP)"
                  value={values.taxId}
                  onChange={(e) => handleFieldChange('taxId', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Business License"
                  value={values.licenseNumber}
                  onChange={(e) => handleFieldChange('licenseNumber', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Established Date"
                  type="date"
                  value={values.establishedDate}
                  onChange={(e) => handleFieldChange('establishedDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Company Size</InputLabel>
                  <Select
                    value={values.companySize}
                    onChange={(e) => handleFieldChange('companySize', e.target.value)}
                    label="Company Size"
                  >
                    <MenuItem value="Small">Small (1-50 employees)</MenuItem>
                    <MenuItem value="Medium">Medium (51-200 employees)</MenuItem>
                    <MenuItem value="Large">Large (201-500 employees)</MenuItem>
                    <MenuItem value="Enterprise">Enterprise (500+ employees)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Website"
                  value={values.website}
                  onChange={(e) => handleFieldChange('website', e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateVendor}
            variant="contained"
            disabled={isSubmitting || Object.values(fieldStates).some(state => state === FIELD_STATES.VALIDATING)}
          >
            {isSubmitting ? 'Updating...' : 'Update Vendor'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorManagement;