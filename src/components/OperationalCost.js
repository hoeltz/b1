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
  GetApp as ExportIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import dataSyncService from '../services/dataSync';
import notificationService from '../services/notificationService';
import * as XLSX from 'xlsx';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput, formatCurrencyInputLive } from '../services/currencyUtils';

const OperationalCost = () => {
  const [costs, setCosts] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [redlineOrders, setRedlineOrders] = useState([]);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState('');
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'detail'
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingCost, setEditingCost] = useState(null);
  const [redlineOpen, setRedlineOpen] = useState(false);
  const [selectedRedlineOrder, setSelectedRedlineOrder] = useState(null);
  const [redlineFormData, setRedlineFormData] = useState({
    salesOrderId: '',
    urgencyLevel: 'urgent',
    justification: '',
    requestedBy: '',
    additionalCosts: 0
  });
  const [formData, setFormData] = useState({
    description: '',
    vendorName: '',
    costType: '',
    amount: '',
    currency: 'IDR',
    status: 'Pending',
    salesOrderId: ''
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    loadSalesOrders();
    loadCosts();
  }, []);

  useEffect(() => {
    loadCosts();
  }, [selectedSalesOrder]);

  const loadSalesOrders = async () => {
    try {
      const data = await dataSyncService.getSalesOrders();
      setSalesOrders(data || []);
    } catch (error) {
      console.error('Error loading sales orders:', error);
      setSalesOrders([]);
    }
  };

  const loadCosts = async () => {
    try {
      const allCosts = await dataSyncService.getOperationalCosts();
      let filteredCosts = allCosts || [];

      // Filter by selected sales order if one is selected
      if (selectedSalesOrder) {
        filteredCosts = filteredCosts.filter(cost => cost.salesOrderId === selectedSalesOrder);
      }

      setCosts(filteredCosts);
    } catch (error) {
      console.error('Error loading costs:', error);
      setCosts([]);
    }
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
  };

  // Redline functionality in OperationalCost
  const handleCreateRedlineOrder = (salesOrder) => {
    setSelectedRedlineOrder(salesOrder);
    setRedlineFormData({
      salesOrderId: salesOrder.id,
      urgencyLevel: 'urgent',
      justification: '',
      requestedBy: '',
      additionalCosts: 0
    });
    setRedlineOpen(true);
  };

  const handleRedlineSubmit = async () => {
    try {
      const redlineData = {
        id: `redline_op_${Date.now()}`,
        ...redlineFormData,
        redlineNumber: `RED-OP-${Date.now().toString().slice(-6)}`,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        source: 'operational_cost'
      };

      await dataSyncService.createRedline?.(redlineData);
      notificationService.showSuccess('Redline request created from operational cost');
      setRedlineOpen(false);
    } catch (error) {
      notificationService.showError('Failed to create redline request');
    }
  };

  const handleEditCost = (cost) => {
    setEditingCost(cost);
    setFormData({
      description: cost.description,
      vendorName: cost.vendorName,
      costType: cost.costType,
      amount: cost.amount.toString(),
      currency: cost.currency || 'IDR',
      status: cost.status,
      salesOrderId: cost.salesOrderId || ''
    });
    setEditOpen(true);
  };

  const handleUpdateCost = async () => {
    setSubmitError('');
    setSubmitSuccess('');

    if (!validateForm()) {
      return;
    }

    try {
      const updatedCost = {
        ...editingCost,
        ...formData,
        amount: parseFloat(formData.amount.replace(/[^\d.-]/g, '')),
      };

      await dataSyncService.updateOperationalCost(editingCost.id, updatedCost);

      setCosts(prev => prev.map(cost =>
        cost.id === editingCost.id ? updatedCost : cost
      ));
      setSubmitSuccess('Operational cost updated successfully!');
      setEditOpen(false);
      setEditingCost(null);

      setTimeout(() => setSubmitSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating operational cost:', error);
      setSubmitError(error.message || 'Failed to update operational cost. Please try again.');
    }
  };

  const calculateTotals = () => {
    const totals = costs.reduce((acc, cost) => {
      if (cost.currency === 'USD') {
        acc.usd += cost.amount;
        acc.idr += cost.amount * 15000; // Assuming 1 USD = 15,000 IDR
      } else {
        acc.idr += cost.amount;
      }
      return acc;
    }, { idr: 0, usd: 0 });

    return totals;
  };

  const handleExportExcel = () => {
    try {
      const currentDate = new Date().toLocaleDateString('id-ID');
      const currentDateTime = new Date().toLocaleString('id-ID');

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Prepare data for Excel sheets
      const reportTitle = viewMode === 'detail' && selectedOrderForDetail
        ? `Operational Costs - ${selectedOrderForDetail.orderNumber}`
        : 'Operational Costs Summary';

      // Main data sheet
      const wsData = [];

      // Header section - Company info
      wsData.push(['PT. FreightFlow Logistics']);
      wsData.push(['Freight Forwarding Management System']);
      wsData.push([reportTitle]);
      wsData.push([`Generated on: ${currentDate}`]);
      wsData.push(['']); // Empty row

      // Report Information section (if in detail mode)
      if (viewMode === 'detail' && selectedOrderForDetail) {
        wsData.push(['Report Information']);
        wsData.push(['----------------------------------------']);
        wsData.push(['Sales Order Number', selectedOrderForDetail.orderNumber]);
        wsData.push(['Customer Name', selectedOrderForDetail.customerName]);
        wsData.push(['Route', `${selectedOrderForDetail.origin} → ${selectedOrderForDetail.destination}`]);
        wsData.push(['Service Type', selectedOrderForDetail.serviceType]);
        wsData.push(['Package Type', selectedOrderForDetail.packageType]);
        wsData.push(['Priority', selectedOrderForDetail.priority]);
        wsData.push(['Cargo Value', selectedOrderForDetail.value]);
        wsData.push(['Selling Price', selectedOrderForDetail.sellingPrice]);
        wsData.push(['Margin', selectedOrderForDetail.margin]);
        wsData.push(['']); // Empty row
      }

      // Cost Breakdown Table Header
      wsData.push(['COST BREAKDOWN DETAILS']);
      wsData.push(['----------------------------------------']);

      // Table Headers
      wsData.push([
        'No',
        'Description',
        'Vendor',
        'Cost Type',
        'Amount',
        'Currency',
        'Sales Order',
        'Status'
      ]);

      // Table Data
      costs.forEach((cost, index) => {
        const relatedOrder = salesOrders.find(order => order.id === cost.salesOrderId);
        wsData.push([
          index + 1,
          cost.description,
          cost.vendorName,
          cost.costType,
          cost.amount,
          cost.currency,
          relatedOrder ? relatedOrder.orderNumber : 'No Order',
          cost.status
        ]);
      });

      // Add empty row
      wsData.push(['']);

      // Summary section
      const totals = calculateTotals();
      wsData.push(['TOTAL COSTS:']);
      wsData.push(['', '', '', '', formatCurrencyDisplay(totals.idr, 'IDR'), formatCurrencyDisplay(totals.usd, 'USD'), `${costs.length} items`]);

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths for better Excel display
      const colWidths = [
        { wch: 5 },  // No
        { wch: 40 }, // Description
        { wch: 25 }, // Vendor
        { wch: 15 }, // Cost Type
        { wch: 15 }, // Amount
        { wch: 10 }, // Currency
        { wch: 15 }, // Sales Order
        { wch: 10 }  // Status
      ];
      ws['!cols'] = colWidths;

      // Merge cells for header
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push(
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Company name
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }, // Report title
        { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } }  // Report subtitle
      );

      // Style the header
      const headerStyle = {
        font: { bold: true, sz: 14, color: { rgb: '2c3e50' } },
        alignment: { horizontal: 'center' }
      };

      // Apply basic styling to header cells
      for (let i = 0; i < 3; i++) {
        const cellAddress = XLSX.utils.encode_cell({ r: i, c: 0 });
        if (ws[cellAddress]) {
          ws[cellAddress].s = headerStyle;
        }
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Operational Costs');

      // Generate filename
      const fileName = `Operational_Costs_${selectedOrderForDetail?.orderNumber || 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`;

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
      // Create a new window for PDF content
      const printWindow = window.open('', '_blank');
      const currentDate = new Date().toLocaleDateString('id-ID');

      // Generate PDF content with A4 formatting
      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Operational Costs Report</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }

            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #333;
            }

            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }

            .header h1 {
              margin: 0;
              font-size: 24px;
              color: #2c3e50;
            }

            .header h2 {
              margin: 5px 0;
              font-size: 16px;
              color: #7f8c8d;
            }

            .info-section {
              margin-bottom: 20px;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 5px;
            }

            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 15px;
            }

            .info-item {
              display: flex;
              margin-bottom: 5px;
            }

            .info-label {
              font-weight: bold;
              min-width: 120px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }

            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }

            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }

            .text-right {
              text-align: right;
            }

            .text-center {
              text-align: center;
            }

            .total-row {
              background-color: #e8f4f8;
              font-weight: bold;
            }

            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #7f8c8d;
            }

            @media print {
              body { -webkit-print-color-adjust: exact; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PT. Bakhtera One</h1>
            <h2>Operational Costs Report</h2>
            <p>Generated on: ${currentDate}</p>
          </div>

          <div class="info-section">
            <h3>Report Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Report Type:</span>
                <span>Operational Costs ${viewMode === 'detail' ? 'Breakdown' : 'Summary'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Generated By:</span>
                <span>FreightFlow System</span>
              </div>
              ${viewMode === 'detail' && selectedOrderForDetail ? `
              <div class="info-item">
                <span class="info-label">Sales Order:</span>
                <span>${selectedOrderForDetail.orderNumber}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Customer:</span>
                <span>${selectedOrderForDetail.customerName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Route:</span>
                <span>${selectedOrderForDetail.origin} → ${selectedOrderForDetail.destination}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Service Type:</span>
                <span>${selectedOrderForDetail.serviceType}</span>
              </div>
              ` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Description</th>
                <th>Vendor</th>
                <th>Cost Type</th>
                <th class="text-right">Amount</th>
                <th>Currency</th>
                <th>Sales Order</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${costs.map((cost, index) => {
                const relatedOrder = salesOrders.find(order => order.id === cost.salesOrderId);
                return `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td>${cost.description}</td>
                  <td>${cost.vendorName}</td>
                  <td>${cost.costType}</td>
                  <td class="text-right">${formatCurrency(cost.amount, cost.currency)}</td>
                  <td class="text-center">${cost.currency}</td>
                  <td>${relatedOrder ? relatedOrder.orderNumber : 'No Order'}</td>
                  <td class="text-center">${cost.status}</td>
                </tr>
                `;
              }).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="4" class="text-right"><strong>TOTAL COSTS:</strong></td>
                <td class="text-right"><strong>${formatCurrency(calculateTotals().idr, 'IDR')}</strong></td>
                <td class="text-right"><strong>${formatCurrency(calculateTotals().usd, 'USD')}</strong></td>
                <td colspan="2" class="text-center"><strong>${costs.length} items</strong></td>
              </tr>
            </tfoot>
          </table>

          <div class="footer">
            <p>Generated by Bakhtera One - Advanced Freight Forwarding Management System</p>
            <p>Confidential Document - For Internal Use Only</p>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(pdfContent);
      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      };

      notificationService.showSuccess('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      notificationService.showError('Failed to generate PDF');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.vendorName.trim()) {
      newErrors.vendorName = 'Vendor name is required';
    }

    if (!formData.costType) {
      newErrors.costType = 'Cost type is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field) => (event) => {
    let value = event.target.value;

    // Special handling for amount field to show formatted currency
    if (field === 'amount') {
      // Remove any non-numeric characters except decimal point
      const numericValue = value.toString().replace(/[^\d.]/g, '');
      // Format the display value but keep raw numeric value for calculations
      const formattedValue = formatCurrencyInput(numericValue, formData.currency);
      value = numericValue; // Keep raw value for state
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

  const handleSubmit = async () => {
    setSubmitError('');
    setSubmitSuccess('');

    if (!validateForm()) {
      return;
    }

    try {
      const newCost = {
        ...formData,
        amount: parseFloat(formData.amount.replace(/[^\d.-]/g, '')),
      };

      const createdCost = await dataSyncService.createOperationalCost(newCost);

      if (createdCost) {
        setCosts(prev => [...prev, createdCost]);
        setSubmitSuccess('Operational cost added successfully!');

        setFormData({
          description: '',
          vendorName: '',
          costType: '',
          amount: '',
          currency: 'IDR',
          status: 'Pending',
          salesOrderId: selectedSalesOrder || ''
        });
        setOpen(false);

        setTimeout(() => setSubmitSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error adding operational cost:', error);
      setSubmitError(error.message || 'Failed to add operational cost. Please try again.');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      description: '',
      vendorName: '',
      costType: '',
      amount: '',
      currency: 'IDR',
      status: 'Pending',
      salesOrderId: selectedSalesOrder || ''
    });
    setErrors({});
    setSubmitError('');
  };

  // Using standardized currency formatting
  const formatCurrencyDisplay = (amount, currency = 'IDR') => {
    return formatCurrency(amount, currency);
  };

  const formatCurrencyInputDisplay = (value, currency = 'IDR') => {
    return formatCurrencyInput(value, currency);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {viewMode === 'summary' ? 'Operational Costs Summary' : `Cost Breakdown - ${selectedOrderForDetail?.orderNumber}`}
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
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<WarningIcon />}
              onClick={() => setRedlineOpen(true)}
            >
              Request Redline
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpen(true)}
            >
              Add Cost
            </Button>
          </Box>
        </Box>
      </Box>

      {viewMode === 'summary' ? (
        // Sales Order Summary Table
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sales Orders with Operational Costs ({salesOrders.length})
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Sales Order #</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Route</TableCell>
                        <TableCell>Service Type</TableCell>
                        <TableCell>Total Costs (IDR)</TableCell>
                        <TableCell>Total Costs (USD)</TableCell>
                        <TableCell>Cost Count</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salesOrders.map((order) => {
                        const orderCosts = costs.filter(cost => cost.salesOrderId === order.id);
                        const totals = orderCosts.reduce((acc, cost) => {
                          if (cost.currency === 'USD') {
                            acc.usd += cost.amount;
                            acc.idr += cost.amount * 15000;
                          } else {
                            acc.idr += cost.amount;
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
                              <Tooltip title="View Cost Breakdown">
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
        // Detailed Cost Breakdown View
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

          {/* Cost Breakdown Table */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cost Breakdown ({costs.length} items)
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Description</TableCell>
                          <TableCell>Vendor</TableCell>
                          <TableCell>Cost Type</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Currency</TableCell>
                          <TableCell>Sales Order</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {costs.map((cost) => {
                          const relatedOrder = salesOrders.find(order => order.id === cost.salesOrderId);
                          return (
                            <TableRow key={cost.id} hover>
                              <TableCell>{cost.description}</TableCell>
                              <TableCell>{cost.vendorName}</TableCell>
                              <TableCell>
                                <Chip label={cost.costType} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>{formatCurrency(cost.amount, cost.currency)}</TableCell>
                              <TableCell>
                                <Chip label={cost.currency} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>
                                {relatedOrder ? (
                                  <Typography variant="body2">
                                    {relatedOrder.orderNumber}
                                  </Typography>
                                ) : (
                                  <Typography variant="body2" color="textSecondary">
                                    No order
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip label={cost.status} color={cost.status === 'Paid' ? 'success' : 'warning'} size="small" />
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
                          );
                        })}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <Typography variant="h6">Total Costs:</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="h6">
                              {formatCurrency(calculateTotals().idr, 'IDR')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="h6">
                              {formatCurrency(calculateTotals().usd, 'USD')}
                            </Typography>
                          </TableCell>
                          <TableCell colSpan={3} align="right">
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

      {/* Edit Cost Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Operational Cost</DialogTitle>
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vendor Name"
                value={formData.vendorName}
                onChange={handleInputChange('vendorName')}
                error={!!errors.vendorName}
                helperText={errors.vendorName}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.costType}>
                <InputLabel>Cost Type</InputLabel>
                <Select
                  value={formData.costType}
                  onChange={handleInputChange('costType')}
                  label="Cost Type"
                >
                  <MenuItem value="Ocean Freight">Ocean Freight</MenuItem>
                  <MenuItem value="Air Freight">Air Freight</MenuItem>
                  <MenuItem value="Trucking">Trucking</MenuItem>
                  <MenuItem value="Rail Freight">Rail Freight</MenuItem>
                  <MenuItem value="Terminal Handling">Terminal Handling</MenuItem>
                  <MenuItem value="Loading/Unloading">Loading/Unloading</MenuItem>
                  <MenuItem value="Storage/Warehousing">Storage/Warehousing</MenuItem>
                  <MenuItem value="Demurrage/Detention">Demurrage/Detention</MenuItem>
                  <MenuItem value="Customs Clearance">Customs Clearance</MenuItem>
                  <MenuItem value="Documentation">Documentation</MenuItem>
                  <MenuItem value="Insurance">Insurance</MenuItem>
                  <MenuItem value="Fuel Surcharge">Fuel Surcharge</MenuItem>
                  <MenuItem value="Agency Fees">Agency Fees</MenuItem>
                  <MenuItem value="Survey/Inspection">Survey/Inspection</MenuItem>
                  <MenuItem value="Equipment Rental">Equipment Rental</MenuItem>
                  <MenuItem value="Communication">Communication</MenuItem>
                  <MenuItem value="Office Overhead">Office Overhead</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
                {errors.costType && <Typography variant="caption" color="error" sx={{ ml: 2 }}>{errors.costType}</Typography>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={`Amount (${formData.currency})`}
                type="text"
                value={formData.amount ? formatCurrencyInput(formData.amount, formData.currency) : ''}
                onChange={handleInputChange('amount')}
                error={!!errors.amount}
                helperText={errors.amount}
                required
                placeholder={formatCurrencyInput(0, formData.currency)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Sales Order (Optional)</InputLabel>
                <Select
                  value={formData.salesOrderId}
                  onChange={handleInputChange('salesOrderId')}
                  label="Sales Order (Optional)"
                >
                  <MenuItem value="">
                    <em>No specific sales order</em>
                  </MenuItem>
                  {salesOrders.map((order) => (
                    <MenuItem key={order.id} value={order.id}>
                      {order.orderNumber} - {order.customerName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={handleInputChange('status')}
                  label="Status"
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateCost} variant="contained">
            Update Cost
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Cost Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Operational Cost</DialogTitle>
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vendor Name"
                value={formData.vendorName}
                onChange={handleInputChange('vendorName')}
                error={!!errors.vendorName}
                helperText={errors.vendorName}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.costType}>
                <InputLabel>Cost Type</InputLabel>
                <Select
                  value={formData.costType}
                  onChange={handleInputChange('costType')}
                  label="Cost Type"
                >
                  <MenuItem value="Ocean Freight">Ocean Freight</MenuItem>
                  <MenuItem value="Air Freight">Air Freight</MenuItem>
                  <MenuItem value="Trucking">Trucking</MenuItem>
                  <MenuItem value="Rail Freight">Rail Freight</MenuItem>
                  <MenuItem value="Terminal Handling">Terminal Handling</MenuItem>
                  <MenuItem value="Loading/Unloading">Loading/Unloading</MenuItem>
                  <MenuItem value="Storage/Warehousing">Storage/Warehousing</MenuItem>
                  <MenuItem value="Demurrage/Detention">Demurrage/Detention</MenuItem>
                  <MenuItem value="Customs Clearance">Customs Clearance</MenuItem>
                  <MenuItem value="Documentation">Documentation</MenuItem>
                  <MenuItem value="Insurance">Insurance</MenuItem>
                  <MenuItem value="Fuel Surcharge">Fuel Surcharge</MenuItem>
                  <MenuItem value="Agency Fees">Agency Fees</MenuItem>
                  <MenuItem value="Survey/Inspection">Survey/Inspection</MenuItem>
                  <MenuItem value="Equipment Rental">Equipment Rental</MenuItem>
                  <MenuItem value="Communication">Communication</MenuItem>
                  <MenuItem value="Office Overhead">Office Overhead</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
                {errors.costType && <Typography variant="caption" color="error" sx={{ ml: 2 }}>{errors.costType}</Typography>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={`Amount (${formData.currency})`}
                type="text"
                value={formData.amount ? formatCurrencyInput(formData.amount, formData.currency) : ''}
                onChange={handleInputChange('amount')}
                error={!!errors.amount}
                helperText={errors.amount}
                required
                placeholder={formatCurrencyInput(0, formData.currency)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Sales Order (Optional)</InputLabel>
                <Select
                  value={formData.salesOrderId}
                  onChange={handleInputChange('salesOrderId')}
                  label="Sales Order (Optional)"
                >
                  <MenuItem value="">
                    <em>No specific sales order</em>
                  </MenuItem>
                  {salesOrders.map((order) => (
                    <MenuItem key={order.id} value={order.id}>
                      {order.orderNumber} - {order.customerName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={handleInputChange('status')}
                  label="Status"
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Add Cost
          </Button>
        </DialogActions>
      </Dialog>

      {/* Redline Request Dialog */}
      <Dialog open={redlineOpen} onClose={() => setRedlineOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Redline Order</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={salesOrders}
                getOptionLabel={(option) => `${option.orderNumber} - ${option.customerName}`}
                value={salesOrders.find(so => so.id === redlineFormData.salesOrderId) || null}
                onChange={(event, newValue) => {
                  setRedlineFormData(prev => ({
                    ...prev,
                    salesOrderId: newValue?.id || '',
                    customerName: newValue?.customerName || ''
                  }));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Select Sales Order" fullWidth required />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Urgency Level</InputLabel>
                <Select
                  value={redlineFormData.urgencyLevel}
                  onChange={(e) => setRedlineFormData(prev => ({ ...prev, urgencyLevel: e.target.value }))}
                  label="Urgency Level"
                >
                  <MenuItem value="normal">Normal (1x)</MenuItem>
                  <MenuItem value="urgent">Urgent (1.5x)</MenuItem>
                  <MenuItem value="express">Express (2x)</MenuItem>
                  <MenuItem value="critical">Critical (3x)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Requested By"
                value={redlineFormData.requestedBy}
                onChange={(e) => setRedlineFormData(prev => ({ ...prev, requestedBy: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Justification"
                multiline
                rows={3}
                value={redlineFormData.justification}
                onChange={(e) => setRedlineFormData(prev => ({ ...prev, justification: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Estimated Additional Costs"
                type="number"
                step="0.01"
                value={redlineFormData.additionalCosts}
                onChange={(e) => setRedlineFormData(prev => ({ ...prev, additionalCosts: parseFloat(e.target.value) || 0 }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Redline Request Impact:</strong><br />
                  • This will create an urgent request for faster processing<br />
                  • Additional costs may apply based on urgency level<br />
                  • Requires approval from management before execution<br />
                  • Will be tracked separately in cost management system
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRedlineOpen(false)}>Cancel</Button>
          <Button onClick={handleRedlineSubmit} variant="contained" color="warning">
            Submit Redline Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OperationalCost;