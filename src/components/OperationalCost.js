import React, { useState, useEffect, memo, useCallback } from 'react';
import {
  Box,
  Button,
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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { operationalCostService } from '../services/localStorage';
import { formatCurrency, formatNumber } from '../services/currencyUtils';

/**
 * Operational Cost Management Component
 */
const OperationalCost = () => {
  const [operationalCosts, setOperationalCosts] = useState([]);
  const [selectedCost, setSelectedCost] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load operational costs on component mount
  useEffect(() => {
    loadOperationalCosts();
  }, []);

  const loadOperationalCosts = useCallback(() => {
    try {
      const costs = operationalCostService.getAll() || [];
      setOperationalCosts(costs);
    } catch (error) {
      console.error('Error loading operational costs:', error);
      setSnackbar({ open: true, message: 'Error loading operational costs', severity: 'error' });
    }
  }, []);

  const handleAdd = useCallback(() => {
    setSelectedCost(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((cost) => {
    setSelectedCost(cost);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(async (costData) => {
    try {
      if (selectedCost) {
        // Update existing cost
        const updatedCost = await operationalCostService.update(selectedCost.id, costData);
        if (updatedCost) {
          loadOperationalCosts();
          setSnackbar({ open: true, message: 'Operational cost updated successfully', severity: 'success' });
        }
      } else {
        // Create new cost
        const newCost = await operationalCostService.create(costData);
        if (newCost) {
          loadOperationalCosts();
          setSnackbar({ open: true, message: 'Operational cost created successfully', severity: 'success' });
        }
      }
      setDialogOpen(false);
    } catch (error) {
      setSnackbar({ open: true, message: `Error saving operational cost: ${error.message}`, severity: 'error' });
    }
  }, [selectedCost, loadOperationalCosts]);

  const handleDelete = useCallback(async (costId) => {
    if (window.confirm('Are you sure you want to delete this operational cost?')) {
      try {
        await operationalCostService.delete(costId);
        loadOperationalCosts();
        setSnackbar({ open: true, message: 'Operational cost deleted successfully', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: `Error deleting operational cost: ${error.message}`, severity: 'error' });
      }
    }
  }, [loadOperationalCosts]);

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Completed': return 'primary';
      case 'Cancelled': return 'error';
      default: return 'info';
    }
  }, []);

  const getProfitabilityColor = useCallback((profitability) => {
    switch (profitability) {
      case 'Profit': return 'success';
      case 'Loss': return 'error';
      case 'Break-even': return 'warning';
      default: return 'info';
    }
  }, []);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Operational Cost Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Operational Cost
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Costs
              </Typography>
              <Typography variant="h4" color="primary">
                {formatCurrency(operationalCosts.reduce((sum, cost) => sum + (cost.totalOperationalCost || 0), 0), 'IDR')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4" color="success.main">
                {formatCurrency(operationalCosts.reduce((sum, cost) => sum + (cost.totalQuotationValue || 0), 0), 'IDR')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Margin
              </Typography>
              <Typography variant="h4" color="info.main">
                {formatCurrency(operationalCosts.reduce((sum, cost) => sum + (cost.totalMargin || 0), 0), 'IDR')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Costs
              </Typography>
              <Typography variant="h4" color="warning.main">
                {operationalCosts.filter(cost => cost.status === 'Active').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Operational Costs Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Quotation #</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Revenue</TableCell>
              <TableCell>Cost</TableCell>
              <TableCell>Margin</TableCell>
              <TableCell>Margin %</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Profitability</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {operationalCosts.map((cost) => (
              <TableRow key={cost.id} hover>
                <TableCell>
                  <Typography variant="subtitle2">{cost.quotationNumber}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {new Date(cost.createdAt).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{cost.customerName}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatCurrency(cost.totalQuotationValue || 0, 'IDR')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatCurrency(cost.totalOperationalCost || 0, 'IDR')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      color: (cost.totalMargin || 0) >= 0 ? 'success.main' : 'error.main',
                      fontWeight: 'bold'
                    }}
                  >
                    {formatCurrency(cost.totalMargin || 0, 'IDR')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatNumber(cost.marginPercentage || 0, 2)}%
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={cost.status || 'Active'}
                    color={getStatusColor(cost.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={cost.overallProfitability || 'Normal'}
                    color={getProfitabilityColor(cost.overallProfitability)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Box display="flex" gap={1}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(cost)}
                      color="primary"
                      title="Edit Operational Cost"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(cost.id)}
                      color="error"
                      title="Delete Operational Cost"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Operational Cost Dialog */}
      <OperationalCostDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        operationalCost={selectedCost}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

/**
 * Operational Cost Dialog Component
 */
const OperationalCostDialog = memo(({ open, onClose, onSave, operationalCost }) => {
  const [formData, setFormData] = useState({
    quotationId: '',
    quotationNumber: '',
    customerName: '',
    status: 'Active',
    operationalItems: [],
    additionalOperationalCosts: [],
    totalQuotationValue: 0,
    totalOperationalCost: 0,
    totalMargin: 0,
    overallProfitability: 'Normal',
  });

  useEffect(() => {
    if (operationalCost) {
      setFormData(operationalCost);
    } else {
      // Reset form for new cost
      setFormData({
        quotationId: '',
        quotationNumber: '',
        customerName: '',
        status: 'Active',
        operationalItems: [],
        additionalOperationalCosts: [],
        totalQuotationValue: 0,
        totalOperationalCost: 0,
        totalMargin: 0,
        overallProfitability: 'Normal',
      });
    }
  }, [operationalCost]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    const dataToSave = {
      ...formData,
      updatedAt: new Date().toISOString()
    };
    onSave(dataToSave);
  }, [formData, onSave]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {operationalCost ? 'Edit Operational Cost' : 'Add Operational Cost'}
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Quotation Number"
              value={formData.quotationNumber || ''}
              onChange={(e) => handleChange('quotationNumber', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Customer Name"
              value={formData.customerName || ''}
              onChange={(e) => handleChange('customerName', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status || 'Active'}
                onChange={(e) => handleChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Profitability</InputLabel>
              <Select
                value={formData.overallProfitability || 'Normal'}
                onChange={(e) => handleChange('overallProfitability', e.target.value)}
                label="Profitability"
              >
                <MenuItem value="Profit">Profit</MenuItem>
                <MenuItem value="Loss">Loss</MenuItem>
                <MenuItem value="Break-even">Break-even</MenuItem>
                <MenuItem value="Normal">Normal</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Total Quotation Value"
              type="number"
              value={formData.totalQuotationValue || 0}
              onChange={(e) => handleChange('totalQuotationValue', parseFloat(e.target.value) || 0)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Total Operational Cost"
              type="number"
              value={formData.totalOperationalCost || 0}
              onChange={(e) => handleChange('totalOperationalCost', parseFloat(e.target.value) || 0)}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {operationalCost ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

OperationalCostDialog.displayName = 'OperationalCostDialog';

export default OperationalCost;