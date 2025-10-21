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
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Stepper,
  Step,
  StepLabel,
  Rating,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  LocalShipping as CourierIcon,
  TrackChanges as TrackingIcon,
  Schedule as ScheduleIcon,
  CheckCircle as DeliveredIcon,
  Warning as PendingIcon,
  Person as DriverIcon,
  Star as RatingIcon,
} from '@mui/icons-material';
import dataSyncService from '../services/dataSync';
import notificationService from '../services/notificationService';

const CourierForm = ({ open, onClose, courier, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'Standard',
    serviceArea: '',
    contactPerson: '',
    contactNumber: '',
    email: '',
    vehicleType: 'Truck',
    capacity: '',
    baseRate: '',
    perKmRate: '',
    status: 'Active',
    rating: 0
  });

  useEffect(() => {
    if (courier) {
      setFormData(courier);
    } else {
      setFormData({
        name: '',
        code: '',
        type: 'Standard',
        serviceArea: '',
        contactPerson: '',
        contactNumber: '',
        email: '',
        vehicleType: 'Truck',
        capacity: '',
        baseRate: '',
        perKmRate: '',
        status: 'Active',
        rating: 0
      });
    }
  }, [courier]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving courier:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {courier ? 'Edit Courier Service' : 'Add New Courier Service'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Courier Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Courier Code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Service Type</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleChange}
                label="Service Type"
              >
                <MenuItem value="Standard">Standard Delivery</MenuItem>
                <MenuItem value="Express">Express Delivery</MenuItem>
                <MenuItem value="Same Day">Same Day Delivery</MenuItem>
                <MenuItem value="Overnight">Overnight</MenuItem>
                <MenuItem value="International">International</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Service Area"
              name="serviceArea"
              value={formData.serviceArea}
              onChange={handleChange}
              placeholder="e.g., Jakarta, Bogor, Depok, Tangerang, Bekasi"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Person"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Number"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Vehicle Type</InputLabel>
              <Select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                label="Vehicle Type"
              >
                <MenuItem value="Truck">Truck</MenuItem>
                <MenuItem value="Van">Van</MenuItem>
                <MenuItem value="Motorcycle">Motorcycle</MenuItem>
                <MenuItem value="Bicycle">Bicycle</MenuItem>
                <MenuItem value="Air Freight">Air Freight</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Capacity (kg)"
              name="capacity"
              type="number"
              value={formData.capacity}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Base Rate (IDR)"
              name="baseRate"
              type="number"
              value={formData.baseRate}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Per Km Rate (IDR)"
              name="perKmRate"
              type="number"
              value={formData.perKmRate}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {courier ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ShipmentForm = ({ open, onClose, shipment, onSave }) => {
  const [formData, setFormData] = useState({
    trackingNumber: '',
    courierId: '',
    origin: '',
    destination: '',
    recipientName: '',
    recipientPhone: '',
    recipientAddress: '',
    packageType: 'Document',
    weight: '',
    dimensions: '',
    value: '',
    serviceType: 'Standard',
    status: 'Picked Up',
    pickupDate: '',
    deliveryDate: '',
    specialInstructions: ''
  });

  useEffect(() => {
    if (shipment) {
      setFormData(shipment);
    } else {
      setFormData({
        trackingNumber: `TRK-${Date.now()}`,
        courierId: '',
        origin: '',
        destination: '',
        recipientName: '',
        recipientPhone: '',
        recipientAddress: '',
        packageType: 'Document',
        weight: '',
        dimensions: '',
        value: '',
        serviceType: 'Standard',
        status: 'Picked Up',
        pickupDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        specialInstructions: ''
      });
    }
  }, [shipment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving shipment:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {shipment ? 'Edit Shipment' : 'Create New Shipment'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Tracking Number"
              name="trackingNumber"
              value={formData.trackingNumber}
              onChange={handleChange}
              disabled
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Courier Service"
              name="courierId"
              value={formData.courierId}
              onChange={handleChange}
              select
            >
              <MenuItem value="courier1">JNE Express</MenuItem>
              <MenuItem value="courier2">TIKI</MenuItem>
              <MenuItem value="courier3">POS Indonesia</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Origin"
              name="origin"
              value={formData.origin}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Destination"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Recipient Name"
              name="recipientName"
              value={formData.recipientName}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Recipient Phone"
              name="recipientPhone"
              value={formData.recipientPhone}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Recipient Address"
              name="recipientAddress"
              value={formData.recipientAddress}
              onChange={handleChange}
              multiline
              rows={2}
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Package Type</InputLabel>
              <Select
                name="packageType"
                value={formData.packageType}
                onChange={handleChange}
                label="Package Type"
              >
                <MenuItem value="Document">Document</MenuItem>
                <MenuItem value="Package">Package</MenuItem>
                <MenuItem value="Electronics">Electronics</MenuItem>
                <MenuItem value="Food">Food</MenuItem>
                <MenuItem value="Medicine">Medicine</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Weight (kg)"
              name="weight"
              type="number"
              value={formData.weight}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Dimensions (LxWxH)"
              name="dimensions"
              value={formData.dimensions}
              onChange={handleChange}
              placeholder="e.g., 20x15x10"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Declared Value (IDR)"
              name="value"
              type="number"
              value={formData.value}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Service Type</InputLabel>
              <Select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                label="Service Type"
              >
                <MenuItem value="Standard">Standard</MenuItem>
                <MenuItem value="Express">Express</MenuItem>
                <MenuItem value="Same Day">Same Day</MenuItem>
                <MenuItem value="Overnight">Overnight</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Pickup Date"
              name="pickupDate"
              type="date"
              value={formData.pickupDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Estimated Delivery Date"
              name="deliveryDate"
              type="date"
              value={formData.deliveryDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Special Instructions"
              name="specialInstructions"
              value={formData.specialInstructions}
              onChange={handleChange}
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {shipment ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const CourierManagement = () => {
  const [couriers, setCouriers] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [courierDialog, setCourierDialog] = useState(false);
  const [shipmentDialog, setShipmentDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuType, setMenuType] = useState('');
  const [menuId, setMenuId] = useState(null);

  useEffect(() => {
    loadCouriers();
    loadShipments();
  }, []);

  const loadCouriers = async () => {
    try {
      // Mock data for couriers
      const mockCouriers = [
        {
          id: '1',
          name: 'JNE Express',
          code: 'JNE-001',
          type: 'Express',
          serviceArea: 'Jakarta, Bogor, Depok, Tangerang, Bekasi',
          contactPerson: 'Ahmad Fauzi',
          contactNumber: '08123456789',
          email: 'contact@jne.co.id',
          vehicleType: 'Truck',
          capacity: 1000,
          baseRate: 15000,
          perKmRate: 5000,
          status: 'Active',
          rating: 4.5
        },
        {
          id: '2',
          name: 'TIKI Delivery',
          code: 'TIKI-001',
          type: 'Standard',
          serviceArea: 'All Indonesia',
          contactPerson: 'Sari Dewi',
          contactNumber: '08198765432',
          email: 'info@tiki.id',
          vehicleType: 'Van',
          capacity: 500,
          baseRate: 12000,
          perKmRate: 4000,
          status: 'Active',
          rating: 4.2
        }
      ];
      setCouriers(mockCouriers);
    } catch (error) {
      console.error('Error loading couriers:', error);
    }
  };

  const loadShipments = async () => {
    try {
      // Mock data for shipments
      const mockShipments = [
        {
          id: '1',
          trackingNumber: 'TRK-001',
          courierId: '1',
          origin: 'Jakarta',
          destination: 'Bandung',
          recipientName: 'John Doe',
          recipientPhone: '08123456789',
          recipientAddress: 'Jl. Asia Afrika No. 123, Bandung',
          packageType: 'Electronics',
          weight: 2.5,
          dimensions: '30x20x15',
          value: 5000000,
          serviceType: 'Express',
          status: 'In Transit',
          pickupDate: '2024-01-15',
          deliveryDate: '2024-01-16',
          specialInstructions: 'Handle with care - fragile items'
        },
        {
          id: '2',
          trackingNumber: 'TRK-002',
          courierId: '2',
          origin: 'Surabaya',
          destination: 'Jakarta',
          recipientName: 'Jane Smith',
          recipientPhone: '08198765432',
          recipientAddress: 'Jl. Sudirman No. 456, Jakarta',
          packageType: 'Document',
          weight: 0.5,
          dimensions: '35x25x5',
          value: 100000,
          serviceType: 'Standard',
          status: 'Delivered',
          pickupDate: '2024-01-14',
          deliveryDate: '2024-01-15',
          specialInstructions: ''
        }
      ];
      setShipments(mockShipments);
    } catch (error) {
      console.error('Error loading shipments:', error);
    }
  };

  const handleCourierSave = async (courierData) => {
    try {
      if (selectedCourier) {
        setCouriers(prev => prev.map(c => c.id === selectedCourier.id ? { ...courierData, id: selectedCourier.id } : c));
        notificationService.showSuccess('Courier service updated successfully');
      } else {
        const newCourier = { ...courierData, id: Date.now().toString() };
        setCouriers(prev => [...prev, newCourier]);
        notificationService.showSuccess('Courier service created successfully');
      }
    } catch (error) {
      notificationService.showError('Failed to save courier service');
    }
  };

  const handleShipmentSave = async (shipmentData) => {
    try {
      if (selectedShipment) {
        setShipments(prev => prev.map(s => s.id === selectedShipment.id ? { ...shipmentData, id: selectedShipment.id } : s));
        notificationService.showSuccess('Shipment updated successfully');
      } else {
        const newShipment = { ...shipmentData, id: Date.now().toString() };
        setShipments(prev => [...prev, newShipment]);
        notificationService.showSuccess('Shipment created successfully');
      }
    } catch (error) {
      notificationService.showError('Failed to save shipment');
    }
  };

  const handleDeleteCourier = async (id) => {
    try {
      setCouriers(prev => prev.filter(c => c.id !== id));
      notificationService.showSuccess('Courier service deleted successfully');
    } catch (error) {
      notificationService.showError('Failed to delete courier service');
    }
  };

  const handleDeleteShipment = async (id) => {
    try {
      setShipments(prev => prev.filter(s => s.id !== id));
      notificationService.showSuccess('Shipment deleted successfully');
    } catch (error) {
      notificationService.showError('Failed to delete shipment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return 'success';
      case 'In Transit': return 'primary';
      case 'Picked Up': return 'info';
      case 'Pending': return 'warning';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered': return <DeliveredIcon />;
      case 'In Transit': return <TrackingIcon />;
      case 'Picked Up': return <ScheduleIcon />;
      case 'Pending': return <PendingIcon />;
      default: return <ScheduleIcon />;
    }
  };

  const filteredCouriers = couriers.filter(courier =>
    courier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    courier.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredShipments = shipments.filter(shipment =>
    shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Courier Management</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<CourierIcon />}
            onClick={() => {
              setSelectedCourier(null);
              setCourierDialog(true);
            }}
          >
            Add Courier Service
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedShipment(null);
              setShipmentDialog(true);
            }}
          >
            New Shipment
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            label="Search couriers and shipments..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </CardContent>
      </Card>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<CourierIcon />} label="Courier Services" />
          <Tab icon={<TrackingIcon />} label="Shipments" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Courier Info</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Service Area</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCouriers.map((courier) => (
                <TableRow key={courier.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{courier.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {courier.code}
                    </Typography>
                    <Typography variant="body2" color="primary">
                      {courier.contactPerson} - {courier.contactNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={courier.type}
                      color={courier.type === 'Express' ? 'error' : 'primary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {courier.serviceArea}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {courier.vehicleType}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {courier.capacity} kg
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      Base: Rp {courier.baseRate.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Per Km: Rp {courier.perKmRate.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Rating value={courier.rating} readOnly size="small" />
                      <Typography variant="body2">
                        ({courier.rating})
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={courier.status}
                      color={courier.status === 'Active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setAnchorEl(e.currentTarget);
                        setMenuType('courier');
                        setMenuId(courier.id);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {activeTab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Shipment Details</TableCell>
                <TableCell>Route</TableCell>
                <TableCell>Recipient</TableCell>
                <TableCell>Package Info</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Dates</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredShipments.map((shipment) => {
                const courier = couriers.find(c => c.id === shipment.courierId);
                return (
                  <TableRow key={shipment.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
                        {shipment.trackingNumber}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {shipment.packageType}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {shipment.origin}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        → {shipment.destination}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {shipment.recipientName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {shipment.recipientPhone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {shipment.weight} kg
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {shipment.dimensions} cm
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        Rp {shipment.value.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={shipment.serviceType}
                        color={shipment.serviceType === 'Express' ? 'error' : 'primary'}
                        size="small"
                      />
                      <Typography variant="caption" display="block">
                        {courier?.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        {getStatusIcon(shipment.status)}
                        <Chip
                          label={shipment.status}
                          color={getStatusColor(shipment.status)}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Pickup: {shipment.pickupDate}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Delivery: {shipment.deliveryDate || 'TBD'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setAnchorEl(e.currentTarget);
                          setMenuType('shipment');
                          setMenuId(shipment.id);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {menuType === 'courier' && (
          <>
            <MenuItem onClick={() => {
              setSelectedCourier(couriers.find(c => c.id === menuId));
              setCourierDialog(true);
              setAnchorEl(null);
            }}>
              <EditIcon sx={{ mr: 1 }} />
              Edit
            </MenuItem>
            <MenuItem onClick={() => {
              handleDeleteCourier(menuId);
              setAnchorEl(null);
            }}>
              <DeleteIcon sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          </>
        )}
        {menuType === 'shipment' && (
          <>
            <MenuItem onClick={() => {
              setSelectedShipment(shipments.find(s => s.id === menuId));
              setShipmentDialog(true);
              setAnchorEl(null);
            }}>
              <EditIcon sx={{ mr: 1 }} />
              Edit
            </MenuItem>
            <MenuItem onClick={() => {
              handleDeleteShipment(menuId);
              setAnchorEl(null);
            }}>
              <DeleteIcon sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          </>
        )}
      </Menu>

      <CourierForm
        open={courierDialog}
        onClose={() => {
          setCourierDialog(false);
          setSelectedCourier(null);
        }}
        courier={selectedCourier}
        onSave={handleCourierSave}
      />

      <ShipmentForm
        open={shipmentDialog}
        onClose={() => {
          setShipmentDialog(false);
          setSelectedShipment(null);
        }}
        shipment={selectedShipment}
        onSave={handleShipmentSave}
      />
    </Box>
  );
};

export default CourierManagement;