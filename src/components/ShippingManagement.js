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
} from '@mui/material';
import { Add as AddIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { CircularProgress } from '@mui/material';
import dataSyncService from '../services/dataSync';
import { useDataSync } from '../hooks/useDataSync';

const ShippingManagement = () => {
  // Use real-time data sync for shipments and sales orders
  const { data: shipments, loading: shipmentsLoading } = useDataSync('shipments');
  const { data: salesOrders, loading: ordersLoading } = useDataSync('salesOrders');

  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [formData, setFormData] = useState({
    trackingNumber: '',
    origin: '',
    destination: '',
    carrier: '',
    estimatedDeparture: '',
    estimatedArrival: '',
    status: 'Booked'
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Sync shipment data with sales orders - prevent infinite loops
  useEffect(() => {
    if (salesOrders && salesOrders.length > 0 && shipments) {
      const syncShipmentsWithOrders = async () => {
        let hasChanges = false;

        for (const order of salesOrders) {
          if (order.shipmentDetails && order.shipmentDetails.trackingNumber) {
            try {
              const existingShipment = shipments.find(s => s.salesOrderId === order.id);

              if (!existingShipment) {
                // Create new shipment only if it doesn't exist
                await dataSyncService.createShipment({
                  salesOrderId: order.id,
                  trackingNumber: order.shipmentDetails.trackingNumber,
                  origin: order.origin,
                  destination: order.destination,
                  estimatedDeparture: order.shipmentDetails.estimatedDeparture,
                  estimatedArrival: order.shipmentDetails.estimatedArrival,
                  status: order.shipmentDetails.status || 'Booked'
                });
                hasChanges = true;
              } else if (existingShipment.trackingNumber !== order.shipmentDetails.trackingNumber) {
                // Update existing shipment only if tracking number changed
                await dataSyncService.updateShipment(existingShipment.id, {
                  trackingNumber: order.shipmentDetails.trackingNumber,
                  status: order.shipmentDetails.status,
                  estimatedDeparture: order.shipmentDetails.estimatedDeparture,
                  estimatedArrival: order.shipmentDetails.estimatedArrival,
                  origin: order.origin,
                  destination: order.destination
                });
                hasChanges = true;
              }
            } catch (error) {
              console.error('Error syncing shipment:', error);
            }
          }
        }

        // Only trigger refresh if there were actual changes
        if (hasChanges) {
          // The useDataSync hooks will automatically refresh the data
        }
      };

      // Debounce the sync to prevent excessive calls
      const timeoutId = setTimeout(syncShipmentsWithOrders, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [salesOrders?.length, shipments?.length]); // Only depend on length, not the full objects

  const validateForm = () => {
    const newErrors = {};

    if (!formData.trackingNumber.trim()) {
      newErrors.trackingNumber = 'Tracking number is required';
    }

    if (!formData.origin.trim()) {
      newErrors.origin = 'Origin is required';
    }

    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required';
    }

    if (!formData.estimatedDeparture) {
      newErrors.estimatedDeparture = 'Estimated departure date is required';
    }

    if (!formData.estimatedArrival) {
      newErrors.estimatedArrival = 'Estimated arrival date is required';
    }

    if (formData.estimatedDeparture && formData.estimatedArrival &&
        new Date(formData.estimatedDeparture) >= new Date(formData.estimatedArrival)) {
      newErrors.estimatedArrival = 'Arrival date must be after departure date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
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
  };

  const handleSubmit = async () => {
    setSubmitError('');
    setSubmitSuccess('');

    if (!validateForm()) {
      return;
    }

    try {
      const newShipment = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString()
      };

      const createdShipment = await dataSyncService.createShipment(newShipment);
      setSubmitSuccess('Shipment booked successfully!');

      setFormData({
        trackingNumber: '',
        origin: '',
        destination: '',
        carrier: '',
        estimatedDeparture: '',
        estimatedArrival: '',
        status: 'Booked'
      });
      setOpen(false);

      setTimeout(() => setSubmitSuccess(''), 3000);
    } catch (error) {
      console.error('Error booking shipment:', error);
      setSubmitError('Failed to book shipment. Please try again.');
    }
  };

  const handleCreateFromSalesOrder = (salesOrder) => {
    setFormData({
      trackingNumber: salesOrder.shipmentDetails?.trackingNumber || `TRK-${Date.now()}`,
      origin: salesOrder.origin,
      destination: salesOrder.destination,
      carrier: '',
      estimatedDeparture: salesOrder.shipmentDetails?.estimatedDeparture || '',
      estimatedArrival: salesOrder.shipmentDetails?.estimatedArrival || '',
      status: salesOrder.shipmentDetails?.status || 'Booked'
    });
    setOpen(true);
  };

  const handleViewDetails = (shipment) => {
    setSelectedShipment(shipment);
    setDetailOpen(true);
  };

  const handleClose = (event, reason) => {
    // Don't close if clicking backdrop or escape key
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return;
    }

    setOpen(false);
    setFormData({
      trackingNumber: '',
      origin: '',
      destination: '',
      carrier: '',
      estimatedDeparture: '',
      estimatedArrival: '',
      status: 'Booked'
    });
    setErrors({});
    setSubmitError('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return 'success';
      case 'In Transit': return 'primary';
      case 'Booked': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Shipping Management</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            onClick={() => {
              // Find sales orders that need shipments
              const ordersNeedingShipment = salesOrders?.filter(order =>
                order.status === 'Confirmed' && !order.shipmentDetails?.trackingNumber
              ) || [];
              if (ordersNeedingShipment.length > 0) {
                handleCreateFromSalesOrder(ordersNeedingShipment[0]);
              }
            }}
          >
            From Sales Orders ({salesOrders?.filter(order => order.status === 'Confirmed' && !order.shipmentDetails?.trackingNumber).length || 0})
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
          >
            Book Shipment
          </Button>
        </Box>
      </Box>

      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {submitSuccess}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Shipments ({shipments.length})
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tracking #</TableCell>
                      <TableCell>Route</TableCell>
                      <TableCell>Carrier</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>ETD</TableCell>
                      <TableCell>ETA</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shipmentsLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                          <CircularProgress size={24} />
                          <Typography variant="body2" sx={{ mt: 1 }}>Loading shipment data...</Typography>
                        </TableCell>
                      </TableRow>
                    ) : shipments?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" color="textSecondary">No shipments found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      shipments?.map((shipment) => (
                      <TableRow
                        key={shipment.id}
                        hover
                        onClick={() => handleViewDetails(shipment)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Typography variant="subtitle2">{shipment.trackingNumber}</Typography>
                          {shipment.salesOrderNumber && (
                            <Typography variant="caption" color="textSecondary">
                              Order: {shipment.salesOrderNumber}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{shipment.origin} → {shipment.destination}</TableCell>
                        <TableCell>{shipment.carrier || 'TBD'}</TableCell>
                        <TableCell>
                          <Chip label={shipment.status} color={getStatusColor(shipment.status)} size="small" />
                        </TableCell>
                        <TableCell>{shipment.estimatedDeparture || '-'}</TableCell>
                        <TableCell>{shipment.estimatedArrival || '-'}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(shipment);
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Book Shipment Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth disableEscapeKeyDown>
        <DialogTitle>Book New Shipment</DialogTitle>
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
                label="Tracking Number"
                value={formData.trackingNumber}
                onChange={handleInputChange('trackingNumber')}
                error={!!errors.trackingNumber}
                helperText={errors.trackingNumber}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Origin"
                value={formData.origin}
                onChange={handleInputChange('origin')}
                error={!!errors.origin}
                helperText={errors.origin}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Destination"
                value={formData.destination}
                onChange={handleInputChange('destination')}
                error={!!errors.destination}
                helperText={errors.destination}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Carrier"
                value={formData.carrier}
                onChange={handleInputChange('carrier')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Departure"
                type="datetime-local"
                value={formData.estimatedDeparture}
                onChange={handleInputChange('estimatedDeparture')}
                error={!!errors.estimatedDeparture}
                helperText={errors.estimatedDeparture}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Arrival"
                type="datetime-local"
                value={formData.estimatedArrival}
                onChange={handleInputChange('estimatedArrival')}
                error={!!errors.estimatedArrival}
                helperText={errors.estimatedArrival}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Book Shipment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Shipment Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Shipment Details - {selectedShipment?.trackingNumber}
        </DialogTitle>
        <DialogContent>
          {selectedShipment && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Shipment Information</Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="textSecondary">Tracking Number</Typography>
                      <Typography variant="body1" gutterBottom>{selectedShipment.trackingNumber}</Typography>

                      <Typography variant="body2" color="textSecondary">Status</Typography>
                      <Chip
                        label={selectedShipment.status}
                        color={getStatusColor(selectedShipment.status)}
                        size="small"
                        sx={{ mb: 2 }}
                      />

                      <Typography variant="body2" color="textSecondary">Carrier</Typography>
                      <Typography variant="body1" gutterBottom>{selectedShipment.carrier || 'TBD'}</Typography>

                      <Typography variant="body2" color="textSecondary">Created At</Typography>
                      <Typography variant="body1" gutterBottom>
                        {new Date(selectedShipment.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Route & Schedule</Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="textSecondary">Route</Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedShipment.origin} → {selectedShipment.destination}
                      </Typography>

                      <Typography variant="body2" color="textSecondary">Estimated Departure</Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedShipment.estimatedDeparture ?
                          new Date(selectedShipment.estimatedDeparture).toLocaleDateString() : '-'}
                      </Typography>

                      <Typography variant="body2" color="textSecondary">Estimated Arrival</Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedShipment.estimatedArrival ?
                          new Date(selectedShipment.estimatedArrival).toLocaleDateString() : '-'}
                      </Typography>

                      {selectedShipment.actualArrival && (
                        <>
                          <Typography variant="body2" color="textSecondary">Actual Arrival</Typography>
                          <Typography variant="body1" gutterBottom>
                            {new Date(selectedShipment.actualArrival).toLocaleDateString()}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {selectedShipment.salesOrderId && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Related Sales Order</Typography>
                      <Typography variant="body2" color="textSecondary">Sales Order ID</Typography>
                      <Typography variant="body1" gutterBottom>{selectedShipment.salesOrderId}</Typography>

                      {(() => {
                        const relatedOrder = salesOrders?.find(order => order.id === selectedShipment.salesOrderId);
                        if (relatedOrder) {
                          return (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" color="textSecondary">Customer</Typography>
                              <Typography variant="body1" gutterBottom>{relatedOrder.customerName}</Typography>

                              <Typography variant="body2" color="textSecondary">Service Type</Typography>
                              <Typography variant="body1" gutterBottom>{relatedOrder.serviceType}</Typography>

                              <Typography variant="body2" color="textSecondary">Cargo Value</Typography>
                              <Typography variant="body1" gutterBottom>
                                IDR {relatedOrder.value?.toLocaleString()}
                              </Typography>
                            </Box>
                          );
                        }
                        return (
                          <Typography variant="body2" color="textSecondary">
                            Sales order details not available
                          </Typography>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShippingManagement;