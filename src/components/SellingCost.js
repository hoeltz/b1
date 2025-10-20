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
  TableFooter,
  IconButton,
  Tooltip,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  GetApp as ExportIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import dataSyncService from '../services/dataSync';
import notificationService from '../services/notificationService';
import * as XLSX from 'xlsx';

const SellingCost = () => {
  const [costs, setCosts] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'detail'
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rollbackData, setRollbackData] = useState(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingCost, setEditingCost] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    costType: '',
    amount: '',
    markup: '',
    currency: 'IDR',
    customerId: '',
    customerName: '',
    salesOrderId: '',
    serviceType: '',
    validFrom: '',
    validUntil: '',
    status: 'Draft'
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSalesOrder || selectedCustomer) {
      loadCosts();
    }
  }, [selectedSalesOrder, selectedCustomer]);

  const loadData = async () => {
    await Promise.all([
      loadSalesOrders(),
      loadCustomers(),
      loadCosts()
    ]);
  };

  const loadSalesOrders = async () => {
    try {
      const data = await dataSyncService.getSalesOrders();
      setSalesOrders(data || []);
    } catch (error) {
      console.error('Error loading sales orders:', error);
      setSalesOrders([]);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await dataSyncService.getCustomers();
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
    }
  };

  const loadCosts = async () => {
    setLoading(true);
    try {
      const allCosts = await dataSyncService.getSellingCosts();
      let filteredCosts = allCosts || [];

      // Filter by selected sales order if one is selected
      if (selectedSalesOrder) {
        filteredCosts = filteredCosts.filter(cost => cost.salesOrderId === selectedSalesOrder);
      }

      // Filter by selected customer if one is selected
      if (selectedCustomer) {
        filtered = filteredCosts.filter(cost => cost.customerId === selectedCustomer);
      }

      setCosts(filteredCosts);
    } catch (error) {
      console.error('Error loading selling costs:', error);
      setCosts([]);
      notificationService.showError('Failed to load selling costs');
    } finally {
      setLoading(false);
    }
  };

  // Auto-validate sales order data when creating costs
  const validateSalesOrderData = async (salesOrderId) => {
    if (!salesOrderId) return { valid: true };

    try {
      const salesOrder = await dataSyncService.getSalesOrderById(salesOrderId);
      if (!salesOrder) {
        throw new Error('Sales order not found');
      }

      // Check if sales order is in valid status for cost creation
      if (salesOrder.status === 'Delivered' || salesOrder.status === 'Cancelled') {
        throw new Error(`Cannot add costs to ${salesOrder.status} sales order`);
      }

      return {
        valid: true,
        salesOrder: salesOrder,
        canAddCosts: ['Draft', 'Confirmed', 'In Transit'].includes(salesOrder.status)
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  };

  // Enhanced cost creation with SO validation
  const handleSubmitWithValidation = async () => {
    setSubmitError('');
    setSubmitSuccess('');

    if (!validateForm()) {
      return;
    }

    // Validate sales order if provided
    if (formData.salesOrderId) {
      const validation = await validateSalesOrderData(formData.salesOrderId);
      if (!validation.valid) {
        setSubmitError(validation.error);
        return;
      }

      if (!validation.canAddCosts) {
        setSubmitError('Cannot add costs to this sales order status');
        return;
      }
    }

    try {
      const amount = parseFloat(formData.amount);
      const markup = parseFloat(formData.markup);
      const margin = calculateMargin(amount, markup);

      const newCost = {
        ...formData,
        amount: amount,
        markup: markup,
        margin: margin,
        createdAt: new Date().toISOString()
      };

      // Store rollback data before creation
      setRollbackData({
        action: 'create',
        data: newCost
      });

      const createdCost = await dataSyncService.createSellingCost(newCost);

      if (createdCost) {
        setCosts(prev => [...prev, createdCost]);
        setSubmitSuccess('Selling cost added successfully!');

        // Reset form
        setFormData({
          description: '',
          costType: '',
          amount: '',
          markup: '',
          currency: 'IDR',
          customerId: '',
          customerName: '',
          salesOrderId: '',
          serviceType: '',
          validFrom: '',
          validUntil: '',
          status: 'Draft'
        });
        setOpen(false);

        setTimeout(() => setSubmitSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error adding selling cost:', error);
      setSubmitError(error.message || 'Failed to add selling cost. Please try again.');
    }
  };

  // Enhanced cost update with rollback
  const handleUpdateCostWithRollback = async () => {
    setSubmitError('');
    setSubmitSuccess('');

    if (!validateForm()) {
      return;
    }

    try {
      const amount = parseFloat(formData.amount);
      const markup = parseFloat(formData.markup);
      const margin = calculateMargin(amount, markup);

      const updatedCost = {
        ...editingCost,
        ...formData,
        amount: amount,
        markup: markup,
        margin: margin,
        updatedAt: new Date().toISOString()
      };

      // Store rollback data before update
      setRollbackData({
        action: 'update',
        oldData: editingCost,
        newData: updatedCost
      });

      await dataSyncService.updateSellingCost(editingCost.id, updatedCost);

      setCosts(prev => prev.map(cost =>
        cost.id === editingCost.id ? updatedCost : cost
      ));
      setSubmitSuccess('Selling cost updated successfully!');
      setEditOpen(false);
      setEditingCost(null);

      setTimeout(() => setSubmitSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating selling cost:', error);
      setSubmitError(error.message || 'Failed to update selling cost. Please try again.');
    }
  };

  // Rollback mechanism for data conflicts
  const handleRollback = async () => {
    if (!rollbackData) return;

    try {
      if (rollbackData.action === 'create') {
        await dataSyncService.deleteSellingCost(rollbackData.data.id);
        setCosts(prev => prev.filter(cost => cost.id !== rollbackData.data.id));
      } else if (rollbackData.action === 'update') {
        await dataSyncService.updateSellingCost(rollbackData.newData.id, rollbackData.oldData);
        setCosts(prev => prev.map(cost =>
          cost.id === rollbackData.oldData.id ? rollbackData.oldData : cost
        ));
      }

      setRollbackData(null);
      notificationService.showSuccess('Changes rolled back successfully');
    } catch (error) {
      notificationService.showError('Failed to rollback changes');
    }
  };

  // Real-time cost calculation when sales order changes
  const handleSalesOrderChangeWithValidation = async (event, newValue) => {
    const salesOrderId = newValue?.id || '';
    const salesOrderNumber = newValue?.orderNumber || '';

    // Validate sales order before allowing selection
    if (salesOrderId) {
      const validation = await validateSalesOrderData(salesOrderId);
      if (!validation.valid) {
        notificationService.showError(`Invalid sales order: ${validation.error}`);
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      salesOrderId,
      customerId: newValue?.customerId || '',
      customerName: newValue?.customerName || '',
      serviceType: newValue?.serviceType || ''
    }));
  };

  // Auto-populate form when sales order is selected
  const autoPopulateFromSalesOrder = (salesOrder) => {
    if (!salesOrder) return;

    setFormData(prev => ({
      ...prev,
      customerId: salesOrder.customerId,
      customerName: salesOrder.customerName,
      serviceType: salesOrder.serviceType,
      // Set default markup based on service type
      markup: getDefaultMarkup(salesOrder.serviceType)
    }));
  };

  // Get default markup based on service type
  const getDefaultMarkup = (serviceType) => {
    const markups = {
      'Sea Freight': 40,
      'Air Freight': 35,
      'Land Freight': 30,
      'Express': 50,
      'Documentation': 25,
      'Insurance': 20,
      'Customs Clearance': 15
    };
    return markups[serviceType] || 25;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.costType) {
      newErrors.costType = 'Cost type is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.markup || parseFloat(formData.markup) < 0) {
      newErrors.markup = 'Markup must be 0 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field) => (event) => {
    let value = event.target.value;

    // Special handling for amount field
    if (field === 'amount') {
      const numericValue = value.toString().replace(/[^\d.-]/g, '');
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
  };

  const handleCustomerChange = (event, newValue) => {
    const customerId = newValue?.id || '';
    const customerName = newValue?.name || '';

    setFormData(prev => ({
      ...prev,
      customerId,
      customerName
    }));

    if (errors.customerId) {
      setErrors(prev => ({
        ...prev,
        customerId: ''
      }));
    }
  };

  const handleSalesOrderChange = (event, newValue) => {
    const salesOrderId = newValue?.id || '';
    const salesOrderNumber = newValue?.orderNumber || '';

    setFormData(prev => ({
      ...prev,
      salesOrderId,
      customerId: newValue?.customerId || '',
      customerName: newValue?.customerName || '',
      serviceType: newValue?.serviceType || ''
    }));
  };

  const calculateMargin = (amount, markup) => {
    const baseAmount = parseFloat(amount) || 0;
    const markupPercent = parseFloat(markup) || 0;
    return baseAmount * (markupPercent / 100);
  };

  const calculateTotals = () => {
    const totals = costs.reduce((acc, cost) => {
      const margin = calculateMargin(cost.amount, cost.markup);
      if (cost.currency === 'USD') {
        acc.usd += margin;
        acc.idr += margin * 15000;
      } else {
        acc.idr += margin;
      }
      return acc;
    }, { idr: 0, usd: 0 });

    return totals;
  };

  const handleViewSalesOrderDetail = (salesOrder) => {
    setSelectedOrderForDetail(salesOrder);
    setSelectedSalesOrder(salesOrder.id);
    setViewMode('detail');
  };

  const handleBackToSummary = () => {
    setViewMode('summary');
    setSelectedOrderForDetail(null);
    setSelectedSalesOrder('');
    setSelectedCustomer('');
  };

  const handleEditCost = (cost) => {
    setEditingCost(cost);
    setFormData({
      description: cost.description,
      costType: cost.costType,
      amount: cost.amount.toString(),
      markup: cost.markup.toString(),
      currency: cost.currency || 'IDR',
      customerId: cost.customerId || '',
      customerName: cost.customerName || '',
      salesOrderId: cost.salesOrderId || '',
      serviceType: cost.serviceType || '',
      validFrom: cost.validFrom || '',
      validUntil: cost.validUntil || '',
      status: cost.status || 'Draft'
    });
    setEditOpen(true);
  };

  const handleUpdateCost = handleUpdateCostWithRollback;

  const handleDeleteCost = async (costId) => {
    if (window.confirm('Are you sure you want to delete this selling cost?')) {
      try {
        await dataSyncService.deleteSellingCost(costId);
        setCosts(prev => prev.filter(cost => cost.id !== costId));
        notificationService.showSuccess('Selling cost deleted successfully');
      } catch (error) {
        notificationService.showError('Failed to delete selling cost');
      }
    }
  };

  const handleSubmit = handleSubmitWithValidation;

  const handleClose = () => {
    setOpen(false);
    setFormData({
      description: '',
      costType: '',
      amount: '',
      markup: '',
      currency: 'IDR',
      customerId: '',
      customerName: '',
      salesOrderId: '',
      serviceType: '',
      validFrom: '',
      validUntil: '',
      status: 'Draft'
    });
    setErrors({});
    setSubmitError('');
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditingCost(null);
    setFormData({
      description: '',
      costType: '',
      amount: '',
      markup: '',
      currency: 'IDR',
      customerId: '',
      customerName: '',
      salesOrderId: '',
      serviceType: '',
      validFrom: '',
      validUntil: '',
      status: 'Draft'
    });
    setErrors({});
    setSubmitError('');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Draft': return 'info';
      case 'Rejected': return 'error';
      default: return 'default';
    }
  };

  const handleExportExcel = () => {
    try {
      const currentDate = new Date().toLocaleDateString('id-ID');

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Main data sheet
      const wsData = [];

      // Header section
      wsData.push(['PT. FreightFlow Logistics']);
      wsData.push(['Selling Costs & Pricing Report']);
      wsData.push([`Generated on: ${currentDate}`]);
      wsData.push(['']);

      // Table Headers
      wsData.push([
        'No',
        'Description',
        'Customer',
        'Sales Order',
        'Service Type',
        'Cost Type',
        'Base Amount',
        'Markup (%)',
        'Final Price',
        'Margin',
        'Currency',
        'Status',
        'Valid From',
        'Valid Until'
      ]);

      // Table Data
      costs.forEach((cost, index) => {
        wsData.push([
          index + 1,
          cost.description,
          cost.customerName || 'General',
          cost.salesOrderId || 'No Order',
          cost.serviceType || 'General',
          cost.costType,
          cost.amount,
          cost.markup,
          cost.amount * (1 + cost.markup / 100),
          cost.margin,
          cost.currency,
          cost.status,
          cost.validFrom || '-',
          cost.validUntil || '-'
        ]);
      });

      // Summary section
      wsData.push(['']);
      const totals = calculateTotals();
      wsData.push(['SUMMARY:']);
      wsData.push(['Total Margin (IDR)', formatCurrency(totals.idr, 'IDR')]);
      wsData.push(['Total Margin (USD)', formatCurrency(totals.usd, 'USD')]);
      wsData.push(['Total Items', costs.length]);

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths
      const colWidths = [
        { wch: 5 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
        { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Selling Costs');

      // Generate filename
      const fileName = `Selling_Costs_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Write file
      XLSX.writeFile(wb, fileName);

      notificationService.showSuccess('Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      notificationService.showError('Failed to export Excel file');
    }
  };

  const handlePrintPDF = () => {
    try {
      const printWindow = window.open('', '_blank');
      const currentDate = new Date().toLocaleDateString('id-ID');

      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Selling Costs Report</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: Arial, sans-serif; font-size: 12px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; color: #2c3e50; }
            .header h2 { margin: 5px 0; font-size: 16px; color: #7f8c8d; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #7f8c8d; }
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PT. FreightFlow Logistics</h1>
            <h2>Selling Costs & Pricing Report</h2>
            <p>Generated on: ${currentDate}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Description</th>
                <th>Customer</th>
                <th>Cost Type</th>
                <th class="text-right">Amount</th>
                <th class="text-center">Markup</th>
                <th class="text-right">Margin</th>
                <th class="text-center">Currency</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${costs.map((cost, index) => `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td>${cost.description}</td>
                  <td>${cost.customerName || 'General'}</td>
                  <td>${cost.costType}</td>
                  <td class="text-right">${formatCurrency(cost.amount, cost.currency)}</td>
                  <td class="text-center">${cost.markup}%</td>
                  <td class="text-right">${formatCurrency(cost.margin, cost.currency)}</td>
                  <td class="text-center">${cost.currency}</td>
                  <td class="text-center">${cost.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Generated by FreightFlow - Freight Forwarding Management System</p>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(pdfContent);
      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      };

      notificationService.showSuccess('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      notificationService.showError('Failed to generate PDF');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {viewMode === 'summary' ? 'Selling Costs Summary' : `Selling Cost Breakdown - ${selectedOrderForDetail?.orderNumber}`}
        </Typography>
        <Box display="flex" gap={1}>
          {viewMode === 'detail' && (
            <Button
              variant="outlined"
              onClick={handleBackToSummary}
            >
              Back to Summary
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
          >
            Add Selling Cost
          </Button>
        </Box>
      </Box>

      {viewMode === 'summary' ? (
        // Sales Order Summary Table
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sales Orders with Selling Costs ({salesOrders.length})
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Sales Order #</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Route</TableCell>
                        <TableCell>Service Type</TableCell>
                        <TableCell>Total Margin (IDR)</TableCell>
                        <TableCell>Total Margin (USD)</TableCell>
                        <TableCell>Cost Count</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salesOrders.map((order) => {
                        const orderCosts = costs.filter(cost => cost.salesOrderId === order.id);
                        const totals = orderCosts.reduce((acc, cost) => {
                          const margin = calculateMargin(cost.amount, cost.markup);
                          if (cost.currency === 'USD') {
                            acc.usd += margin;
                            acc.idr += margin * 15000;
                          } else {
                            acc.idr += margin;
                          }
                          return acc;
                        }, { idr: 0, usd: 0 });

                        return (
                          <TableRow key={order.id} hover>
                            <TableCell>
                              <Typography variant="subtitle2" sx={{ cursor: 'pointer', color: 'primary.main' }}>
                                {order.orderNumber}
                              </Typography>
                            </TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell>{order.origin} → {order.destination}</TableCell>
                            <TableCell>{order.serviceType}</TableCell>
                            <TableCell>{formatCurrency(totals.idr, 'IDR')}</TableCell>
                            <TableCell>{formatCurrency(totals.usd, 'USD')}</TableCell>
                            <TableCell>
                              <Chip label={orderCosts.length} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="View Selling Cost Breakdown">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewSalesOrderDetail(order)}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        // Detailed Selling Cost Breakdown View
        <>
          {/* Filter and Export Controls */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <FormControl sx={{ minWidth: 400 }}>
                <InputLabel>Sales Order</InputLabel>
                <Select
                  value={selectedSalesOrder}
                  onChange={(e) => setSelectedSalesOrder(e.target.value)}
                  label="Sales Order"
                >
                  {salesOrders.map((order) => (
                    <MenuItem key={order.id} value={order.id}>
                      {order.orderNumber} - {order.customerName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                onClick={handleExportExcel}
              >
                Export Excel
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrintPDF}
              >
                Print PDF
              </Button>
            </Box>
          </Box>

          {submitSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {submitSuccess}
            </Alert>
          )}

          {/* Selling Cost Breakdown Table */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Selling Cost Breakdown ({costs.length} items)
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Description</TableCell>
                          <TableCell>Cost Type</TableCell>
                          <TableCell align="right">Base Amount</TableCell>
                          <TableCell align="right">Markup</TableCell>
                          <TableCell align="right">Margin</TableCell>
                          <TableCell>Currency</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {costs.map((cost) => (
                          <TableRow key={cost.id} hover>
                            <TableCell>{cost.description}</TableCell>
                            <TableCell>
                              <Chip label={cost.costType} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell align="right">{formatCurrency(cost.amount, cost.currency)}</TableCell>
                            <TableCell align="right">{cost.markup}%</TableCell>
                            <TableCell align="right" sx={{ color: 'success.main' }}>
                              {formatCurrency(cost.margin, cost.currency)}
                            </TableCell>
                            <TableCell>
                              <Chip label={cost.currency} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>
                              <Chip label={cost.status} color={getStatusColor(cost.status)} size="small" />
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Edit Cost">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditCost(cost)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <Typography variant="h6">Total Margin:</Typography>
                          </TableCell>
                          <TableCell colSpan={2} align="right">
                            <Typography variant="h6">
                              {formatCurrency(calculateTotals().idr, 'IDR')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="h6">
                              {formatCurrency(calculateTotals().usd, 'USD')}
                            </Typography>
                          </TableCell>
                          <TableCell colSpan={2} align="right">
                            <Typography variant="body2" color="textSecondary">
                              {costs.length} items
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {submitSuccess}
        </Alert>
      )}

      {/* Add Pricing Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Add Selling Cost & Pricing</DialogTitle>
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
                value={formData.description}
                onChange={handleInputChange('description')}
                error={!!errors.description}
                helperText={errors.description}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => option.name}
                value={customers.find(c => c.id === formData.customerId) || null}
                onChange={handleCustomerChange}
                renderInput={(params) => (
                  <TextField {...params} label="Customer (Optional)" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={salesOrders}
                getOptionLabel={(option) => `${option.orderNumber} - ${option.customerName}`}
                value={salesOrders.find(so => so.id === formData.salesOrderId) || null}
                onChange={handleSalesOrderChange}
                renderInput={(params) => (
                  <TextField {...params} label="Sales Order (Optional)" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors.costType}>
                <InputLabel>Cost Type</InputLabel>
                <Select
                  value={formData.costType}
                  onChange={handleInputChange('costType')}
                  label="Cost Type"
                >
                  <MenuItem value="Base Freight Rate">Base Freight Rate</MenuItem>
                  <MenuItem value="Fuel Surcharge">Fuel Surcharge</MenuItem>
                  <MenuItem value="Security Surcharge">Security Surcharge</MenuItem>
                  <MenuItem value="Documentation Fee">Documentation Fee</MenuItem>
                  <MenuItem value="Customs Clearance">Customs Clearance</MenuItem>
                  <MenuItem value="Insurance Premium">Insurance Premium</MenuItem>
                  <MenuItem value="Handling Fee">Handling Fee</MenuItem>
                  <MenuItem value="Storage Fee">Storage Fee</MenuItem>
                  <MenuItem value="Rush Order Premium">Rush Order Premium</MenuItem>
                  <MenuItem value="Weekend Surcharge">Weekend/Holiday Surcharge</MenuItem>
                  <MenuItem value="Special Handling">Special Handling</MenuItem>
                  <MenuItem value="Overweight Surcharge">Overweight Surcharge</MenuItem>
                  <MenuItem value="Oversize Surcharge">Oversize Surcharge</MenuItem>
                  <MenuItem value="Dangerous Goods Fee">Dangerous Goods Fee</MenuItem>
                  <MenuItem value="Export/Import Duty">Export/Import Duty</MenuItem>
                  <MenuItem value="Terminal Handling">Terminal Handling</MenuItem>
                  <MenuItem value="Agency Fee">Agency Fee</MenuItem>
                  <MenuItem value="Bank Charges">Bank Charges</MenuItem>
                  <MenuItem value="Marketing Commission">Marketing Commission</MenuItem>
                  <MenuItem value="Sales Commission">Sales Commission</MenuItem>
                </Select>
                {errors.costType && <Typography variant="caption" color="error" sx={{ ml: 2 }}>{errors.costType}</Typography>}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={`Base Amount (${formData.currency})`}
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={handleInputChange('amount')}
                error={!!errors.amount}
                helperText={errors.amount}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Markup (%)"
                type="number"
                step="0.01"
                value={formData.markup}
                onChange={handleInputChange('markup')}
                error={!!errors.markup}
                helperText={errors.markup || 'Percentage markup to be added to the base amount'}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Valid From"
                type="date"
                value={formData.validFrom}
                onChange={handleInputChange('validFrom')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Valid Until"
                type="date"
                value={formData.validUntil}
                onChange={handleInputChange('validUntil')}
                InputLabelProps={{ shrink: true }}
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
                  <MenuItem value="Draft">Draft</MenuItem>
                  <MenuItem value="Pending">Pending Approval</MenuItem>
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {(formData.amount && formData.markup) && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Calculation:</strong><br />
                    Base Amount: {formatCurrency(parseFloat(formData.amount), formData.currency)}<br />
                    Markup ({formData.markup}%): {formatCurrency(calculateMargin(formData.amount, formData.markup), formData.currency)}<br />
                    <strong>Final Price: {formatCurrency(parseFloat(formData.amount) * (1 + parseFloat(formData.markup) / 100), formData.currency)}</strong>
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Add Pricing
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Cost Dialog */}
      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="md" fullWidth>
        <DialogTitle>Edit Selling Cost & Pricing</DialogTitle>
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
                value={formData.description}
                onChange={handleInputChange('description')}
                error={!!errors.description}
                helperText={errors.description}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => option.name}
                value={customers.find(c => c.id === formData.customerId) || null}
                onChange={handleCustomerChange}
                renderInput={(params) => (
                  <TextField {...params} label="Customer (Optional)" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors.costType}>
                <InputLabel>Cost Type</InputLabel>
                <Select
                  value={formData.costType}
                  onChange={handleInputChange('costType')}
                  label="Cost Type"
                >
                  <MenuItem value="Base Freight Rate">Base Freight Rate</MenuItem>
                  <MenuItem value="Fuel Surcharge">Fuel Surcharge</MenuItem>
                  <MenuItem value="Security Surcharge">Security Surcharge</MenuItem>
                  <MenuItem value="Documentation Fee">Documentation Fee</MenuItem>
                  <MenuItem value="Customs Clearance">Customs Clearance</MenuItem>
                  <MenuItem value="Insurance Premium">Insurance Premium</MenuItem>
                  <MenuItem value="Handling Fee">Handling Fee</MenuItem>
                  <MenuItem value="Storage Fee">Storage Fee</MenuItem>
                  <MenuItem value="Rush Order Premium">Rush Order Premium</MenuItem>
                  <MenuItem value="Weekend Surcharge">Weekend/Holiday Surcharge</MenuItem>
                  <MenuItem value="Special Handling">Special Handling</MenuItem>
                  <MenuItem value="Overweight Surcharge">Overweight Surcharge</MenuItem>
                  <MenuItem value="Oversize Surcharge">Oversize Surcharge</MenuItem>
                  <MenuItem value="Dangerous Goods Fee">Dangerous Goods Fee</MenuItem>
                  <MenuItem value="Export/Import Duty">Export/Import Duty</MenuItem>
                  <MenuItem value="Terminal Handling">Terminal Handling</MenuItem>
                  <MenuItem value="Agency Fee">Agency Fee</MenuItem>
                  <MenuItem value="Bank Charges">Bank Charges</MenuItem>
                  <MenuItem value="Marketing Commission">Marketing Commission</MenuItem>
                  <MenuItem value="Sales Commission">Sales Commission</MenuItem>
                </Select>
                {errors.costType && <Typography variant="caption" color="error" sx={{ ml: 2 }}>{errors.costType}</Typography>}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={`Base Amount (${formData.currency})`}
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={handleInputChange('amount')}
                error={!!errors.amount}
                helperText={errors.amount}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Markup (%)"
                type="number"
                step="0.01"
                value={formData.markup}
                onChange={handleInputChange('markup')}
                error={!!errors.markup}
                helperText={errors.markup || 'Percentage markup to be added to the base amount'}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Valid From"
                type="date"
                value={formData.validFrom}
                onChange={handleInputChange('validFrom')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Valid Until"
                type="date"
                value={formData.validUntil}
                onChange={handleInputChange('validUntil')}
                InputLabelProps={{ shrink: true }}
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
                  <MenuItem value="Draft">Draft</MenuItem>
                  <MenuItem value="Pending">Pending Approval</MenuItem>
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {(formData.amount && formData.markup) && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Calculation:</strong><br />
                    Base Amount: {formatCurrency(parseFloat(formData.amount), formData.currency)}<br />
                    Markup ({formData.markup}%): {formatCurrency(calculateMargin(formData.amount, formData.markup), formData.currency)}<br />
                    <strong>Final Price: {formatCurrency(parseFloat(formData.amount) * (1 + parseFloat(formData.markup) / 100), formData.currency)}</strong>
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleUpdateCost} variant="contained">
            Update Pricing
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SellingCost;