import React, { useState, useEffect } from 'react';
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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Money as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  GetApp as ExportIcon,
  Print as PrintIcon,
  DateRange as DateIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import financialService from '../services/financialService';
import { formatCurrency } from '../services/currencyUtils';

const CashFlowReport = () => {
  const [cfData, setCfData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    period: 'thisMonth',
    startDate: '',
    endDate: ''
  });

  // Set default date range to current month
  useEffect(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setDateRange({
      period: 'thisMonth',
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0]
    });
  }, []);

  // Load Cash Flow data when date range changes
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      loadCFData();
    }
  }, [dateRange.startDate, dateRange.endDate]);

  const loadCFData = async () => {
    setLoading(true);
    setError(null);

    try {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);

      const data = await financialService.calculateCashFlow(startDate, endDate);
      setCfData(data);
    } catch (err) {
      setError(err.message || 'Failed to load Cash Flow data');
      console.error('Error loading Cash Flow data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (period) => {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisQuarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        return;
    }

    setDateRange({
      period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  const handleExportCSV = () => {
    if (!cfData) return;

    const exportData = [
      { category: 'BEGINNING_CASH', account: 'Beginning Cash Balance', amount: cfData.beginningCash },
      { category: 'OPERATING', account: 'Cash from Operations', amount: cfData.operating.cashReceived },
      { category: 'OPERATING', account: 'Cash for Operations', amount: -cfData.operating.cashPaid },
      { category: 'OPERATING', account: 'Net Cash from Operating Activities', amount: cfData.operating.netOperating },
      { category: 'INVESTING', account: 'Equipment Purchases', amount: cfData.investing.equipmentPurchases },
      { category: 'INVESTING', account: 'Net Cash from Investing Activities', amount: cfData.investing.netInvesting },
      { category: 'FINANCING', account: 'Loan Proceeds', amount: cfData.financing.loanProceeds },
      { category: 'FINANCING', account: 'Net Cash from Financing Activities', amount: cfData.financing.netFinancing },
      { category: 'NET_CASH_FLOW', account: 'NET CASH FLOW', amount: cfData.netCashFlow },
      { category: 'ENDING_CASH', account: 'Ending Cash Balance', amount: cfData.endingCash }
    ];

    financialService.exportToCSV(exportData, `Cash_Flow_Report_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
  };

  const formatCurrencyDisplay = (amount) => {
    return formatCurrency(amount, 'IDR');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Cash Flow Report...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography variant="h6">Error Loading Cash Flow Report</Typography>
        <Typography variant="body2">{error}</Typography>
        <Button sx={{ mt: 2 }} onClick={loadCFData} variant="outlined">
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Cash Flow Statement
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Period: {new Date(dateRange.startDate).toLocaleDateString('en-US')} - {new Date(dateRange.endDate).toLocaleDateString('en-US')}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportCSV}
            disabled={!cfData}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </Box>
      </Box>

      {/* Date Range Selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Period</InputLabel>
                <Select
                  value={dateRange.period}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  label="Period"
                >
                  <MenuItem value="thisMonth">This Month</MenuItem>
                  <MenuItem value="lastMonth">Last Month</MenuItem>
                  <MenuItem value="thisQuarter">This Quarter</MenuItem>
                  <MenuItem value="thisYear">This Year</MenuItem>
                  <MenuItem value="lastYear">Last Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={1}>
              <Button
                fullWidth
                variant="contained"
                onClick={loadCFData}
                disabled={loading}
              >
                Load
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {cfData && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: '#e8f5e8', border: '1px solid #4caf50' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingUpIcon sx={{ fontSize: 48, color: '#4caf50', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: '#4caf50' }}>
                    {formatCurrencyDisplay(cfData.operating.cashReceived)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Cash from Operations
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: '#ffebee', border: '1px solid #f44336' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingDownIcon sx={{ fontSize: 48, color: '#f44336', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: '#f44336' }}>
                    {formatCurrencyDisplay(cfData.operating.cashPaid)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Cash for Operations
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                bgcolor: cfData.netCashFlow >= 0 ? '#e8f5e8' : '#ffebee',
                border: `1px solid ${cfData.netCashFlow >= 0 ? '#4caf50' : '#f44336'}`
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Net Cash Flow
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: cfData.netCashFlow >= 0 ? '#4caf50' : '#f44336'
                    }}
                  >
                    {formatCurrencyDisplay(cfData.netCashFlow)}
                  </Typography>
                  <Chip
                    label={cfData.netCashFlow >= 0 ? 'Positive' : 'Negative'}
                    color={cfData.netCashFlow >= 0 ? 'success' : 'error'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: '#e3f2fd', border: '1px solid #2196f3' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <MoneyIcon sx={{ fontSize: 48, color: '#2196f3', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: '#2196f3' }}>
                    {formatCurrencyDisplay(cfData.endingCash)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Ending Cash Balance
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Detailed Cash Flow Statement */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detailed Cash Flow Statement
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell><strong>Category</strong></TableCell>
                      <TableCell><strong>Description</strong></TableCell>
                      <TableCell align="right"><strong>Amount (IDR)</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Beginning Cash */}
                    <TableRow>
                      <TableCell colSpan={3} sx={{ bgcolor: '#e3f2fd', fontWeight: 'bold' }}>
                        BEGINNING CASH BALANCE
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Beginning Cash & Cash Equivalents</TableCell>
                      <TableCell align="right">{formatCurrencyDisplay(cfData.beginningCash)}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={3}>&nbsp;</TableCell>
                    </TableRow>

                    {/* Operating Activities */}
                    <TableRow>
                      <TableCell colSpan={3} sx={{ bgcolor: '#e8f5e8', fontWeight: 'bold' }}>
                        CASH FLOWS FROM OPERATING ACTIVITIES
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Cash Received from Customers</TableCell>
                      <TableCell align="right">{formatCurrencyDisplay(cfData.operating.cashReceived)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Cash Paid to Suppliers and Employees</TableCell>
                      <TableCell align="right">({formatCurrencyDisplay(cfData.operating.cashPaid)})</TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                      <TableCell></TableCell>
                      <TableCell><strong>Net Cash from Operating Activities</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrencyDisplay(cfData.operating.netOperating)}</strong></TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={3}>&nbsp;</TableCell>
                    </TableRow>

                    {/* Investing Activities */}
                    <TableRow>
                      <TableCell colSpan={3} sx={{ bgcolor: '#fff3e0', fontWeight: 'bold' }}>
                        CASH FLOWS FROM INVESTING ACTIVITIES
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Purchase of Equipment</TableCell>
                      <TableCell align="right">({formatCurrencyDisplay(cfData.investing.equipmentPurchases)})</TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                      <TableCell></TableCell>
                      <TableCell><strong>Net Cash from Investing Activities</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrencyDisplay(cfData.investing.netInvesting)}</strong></TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={3}>&nbsp;</TableCell>
                    </TableRow>

                    {/* Financing Activities */}
                    <TableRow>
                      <TableCell colSpan={3} sx={{ bgcolor: '#f3e5f5', fontWeight: 'bold' }}>
                        CASH FLOWS FROM FINANCING ACTIVITIES
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Proceeds from Bank Loans</TableCell>
                      <TableCell align="right">{formatCurrencyDisplay(cfData.financing.loanProceeds)}</TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                      <TableCell></TableCell>
                      <TableCell><strong>Net Cash from Financing Activities</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrencyDisplay(cfData.financing.netFinancing)}</strong></TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={3}>&nbsp;</TableCell>
                    </TableRow>

                    {/* Net Cash Flow */}
                    <TableRow sx={{
                      bgcolor: cfData.netCashFlow >= 0 ? '#e8f5e8' : '#ffebee',
                      border: '2px solid',
                      borderColor: cfData.netCashFlow >= 0 ? '#4caf50' : '#f44336'
                    }}>
                      <TableCell></TableCell>
                      <TableCell><strong>NET CASH FLOW</strong></TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" sx={{
                          color: cfData.netCashFlow >= 0 ? '#4caf50' : '#f44336',
                          fontWeight: 'bold'
                        }}>
                          {formatCurrencyDisplay(cfData.netCashFlow)}
                        </Typography>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={3}>&nbsp;</TableCell>
                    </TableRow>

                    {/* Ending Cash */}
                    <TableRow sx={{ bgcolor: '#e3f2fd', border: '2px solid #2196f3' }}>
                      <TableCell></TableCell>
                      <TableCell><strong>ENDING CASH BALANCE</strong></TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                          {formatCurrencyDisplay(cfData.endingCash)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Cash Flow Analysis */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Cash Flow Analysis
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="success.main">
                          {formatCurrencyDisplay(cfData.operating.netOperating)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Operating Cash Flow
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="warning.main">
                          {formatCurrencyDisplay(cfData.investing.netInvesting)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Investing Cash Flow
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="info.main">
                          {formatCurrencyDisplay(cfData.financing.netFinancing)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Financing Cash Flow
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">
                          {((cfData.endingCash - cfData.beginningCash) / cfData.beginningCash * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Cash Growth Rate
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default CashFlowReport;