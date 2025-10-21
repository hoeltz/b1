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
  TrendingUp as TrendingUpIcon,
  GetApp as ExportIcon,
  Print as PrintIcon,
  DateRange as DateIcon,
  Assessment as AssessmentIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import financialService from '../services/financialService';
import { formatCurrency } from '../services/currencyUtils';

const ProfitLossReport = () => {
  const [plData, setPlData] = useState(null);
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

  // Load PL data when date range changes
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      loadPLData();
    }
  }, [dateRange.startDate, dateRange.endDate]);

  const loadPLData = async () => {
    setLoading(true);
    setError(null);

    try {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);

      const data = await financialService.calculatePL(startDate, endDate);
      setPlData(data);
    } catch (err) {
      setError(err.message || 'Failed to load PL data');
      console.error('Error loading PL data:', err);
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
    if (!plData) return;

    const exportData = [
      { category: 'REVENUE', account: 'Freight Revenue', amount: plData.revenue.freightRevenue },
      { category: 'REVENUE', account: 'Handling Fee', amount: plData.revenue.handlingFee },
      { category: 'REVENUE', account: 'Documentation Fee', amount: plData.revenue.documentationFee },
      { category: 'REVENUE', account: 'Storage Fee', amount: plData.revenue.storageFee },
      { category: 'REVENUE', account: 'Insurance Revenue', amount: plData.revenue.insuranceRevenue },
      { category: 'REVENUE', account: 'TOTAL REVENUE', amount: plData.revenue.totalRevenue },
      { category: 'COGS', account: 'Direct Costs', amount: plData.cogs.directCosts },
      { category: 'COGS', account: 'Fuel Costs', amount: plData.cogs.fuelCosts },
      { category: 'COGS', account: 'Driver Costs', amount: plData.cogs.driverCosts },
      { category: 'COGS', account: 'Maintenance Costs', amount: plData.cogs.maintenanceCosts },
      { category: 'COGS', account: 'TOTAL COGS', amount: plData.cogs.totalCOGS },
      { category: 'GROSS_PROFIT', account: 'GROSS PROFIT', amount: plData.grossProfit },
      { category: 'OPERATING_EXPENSES', account: 'Salaries & Wages', amount: plData.operatingExpenses.salaries },
      { category: 'OPERATING_EXPENSES', account: 'Office Rent', amount: plData.operatingExpenses.rent },
      { category: 'OPERATING_EXPENSES', account: 'Utilities', amount: plData.operatingExpenses.utilities },
      { category: 'OPERATING_EXPENSES', account: 'Marketing', amount: plData.operatingExpenses.marketing },
      { category: 'OPERATING_EXPENSES', account: 'Insurance', amount: plData.operatingExpenses.insurance },
      { category: 'OPERATING_EXPENSES', account: 'Administration', amount: plData.operatingExpenses.admin },
      { category: 'NET_PROFIT', account: 'NET PROFIT', amount: plData.netProfit }
    ];

    financialService.exportToCSV(exportData, `PL_Report_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
  };

  const formatCurrencyDisplay = (amount) => {
    return formatCurrency(amount, 'IDR');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading PL Report...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography variant="h6">Error Loading PL Report</Typography>
        <Typography variant="body2">{error}</Typography>
        <Button sx={{ mt: 2 }} onClick={loadPLData} variant="outlined">
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
            Profit & Loss Statement (Laporan Laba Rugi)
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Period: {new Date(dateRange.startDate).toLocaleDateString('id-ID')} - {new Date(dateRange.endDate).toLocaleDateString('id-ID')}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportCSV}
            disabled={!plData}
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
                onClick={loadPLData}
                disabled={loading}
              >
                Load
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {plData && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: '#e3f2fd', border: '1px solid #2196f3' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingUpIcon sx={{ fontSize: 48, color: '#2196f3', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: '#2196f3' }}>
                    {formatCurrencyDisplay(plData.revenue.totalRevenue)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Revenue
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: '#fff3e0', border: '1px solid #ff9800' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <AssessmentIcon sx={{ fontSize: 48, color: '#ff9800', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: '#ff9800' }}>
                    {formatCurrencyDisplay(plData.cogs.totalCOGS)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total COGS
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: '#e8f5e8', border: '1px solid #4caf50' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <MoneyIcon sx={{ fontSize: 48, color: '#4caf50', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: '#4caf50' }}>
                    {formatCurrencyDisplay(plData.grossProfit)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Gross Profit
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                bgcolor: plData.netProfit >= 0 ? '#f3e5f5' : '#ffebee',
                border: `1px solid ${plData.netProfit >= 0 ? '#9c27b0' : '#f44336'}`
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Net Profit/Loss
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: plData.netProfit >= 0 ? '#9c27b0' : '#f44336'
                    }}
                  >
                    {formatCurrencyDisplay(plData.netProfit)}
                  </Typography>
                  <Chip
                    label={`${(plData.margins.netMargin * 100).toFixed(1)}% Margin`}
                    color={plData.netProfit >= 0 ? 'secondary' : 'error'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Detailed PL Statement */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detailed Profit & Loss Statement
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell><strong>Category</strong></TableCell>
                      <TableCell><strong>Account</strong></TableCell>
                      <TableCell align="right"><strong>Amount (IDR)</strong></TableCell>
                      <TableCell align="right"><strong>% of Revenue</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Revenue Section */}
                    <TableRow>
                      <TableCell colSpan={4} sx={{ bgcolor: '#e3f2fd', fontWeight: 'bold' }}>
                        REVENUE
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Freight Revenue</TableCell>
                      <TableCell align="right">{formatCurrencyDisplay(plData.revenue.freightRevenue)}</TableCell>
                      <TableCell align="right">{((plData.revenue.freightRevenue / plData.revenue.totalRevenue) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Handling Fee</TableCell>
                      <TableCell align="right">{formatCurrencyDisplay(plData.revenue.handlingFee)}</TableCell>
                      <TableCell align="right">{((plData.revenue.handlingFee / plData.revenue.totalRevenue) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Documentation Fee</TableCell>
                      <TableCell align="right">{formatCurrencyDisplay(plData.revenue.documentationFee)}</TableCell>
                      <TableCell align="right">{((plData.revenue.documentationFee / plData.revenue.totalRevenue) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Storage Fee</TableCell>
                      <TableCell align="right">{formatCurrencyDisplay(plData.revenue.storageFee)}</TableCell>
                      <TableCell align="right">{((plData.revenue.storageFee / plData.revenue.totalRevenue) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Insurance Revenue</TableCell>
                      <TableCell align="right">{formatCurrencyDisplay(plData.revenue.insuranceRevenue)}</TableCell>
                      <TableCell align="right">{((plData.revenue.insuranceRevenue / plData.revenue.totalRevenue) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                      <TableCell><strong></strong></TableCell>
                      <TableCell><strong>TOTAL REVENUE</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrencyDisplay(plData.revenue.totalRevenue)}</strong></TableCell>
                      <TableCell align="right"><strong>100.0%</strong></TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={4}>&nbsp;</TableCell>
                    </TableRow>

                    {/* COGS Section */}
                    <TableRow>
                      <TableCell colSpan={4} sx={{ bgcolor: '#fff3e0', fontWeight: 'bold' }}>
                        COST OF GOODS SOLD
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Direct Costs</TableCell>
                      <TableCell align="right">{formatCurrencyDisplay(plData.cogs.directCosts)}</TableCell>
                      <TableCell align="right">{((plData.cogs.directCosts / plData.revenue.totalRevenue) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Fuel Costs</TableCell>
                      <TableCell align="right">{formatCurrencyDisplay(plData.cogs.fuelCosts)}</TableCell>
                      <TableCell align="right">{((plData.cogs.fuelCosts / plData.revenue.totalRevenue) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Driver/Operator Costs</TableCell>
                      <TableCell align="right">{formatCurrencyDisplay(plData.cogs.driverCosts)}</TableCell>
                      <TableCell align="right">{((plData.cogs.driverCosts / plData.revenue.totalRevenue) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Maintenance Costs</TableCell>
                      <TableCell align="right">{formatCurrencyDisplay(plData.cogs.maintenanceCosts)}</TableCell>
                      <TableCell align="right">{((plData.cogs.maintenanceCosts / plData.revenue.totalRevenue) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                      <TableCell></TableCell>
                      <TableCell><strong>TOTAL COGS</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrencyDisplay(plData.cogs.totalCOGS)}</strong></TableCell>
                      <TableCell align="right"><strong>{((plData.cogs.totalCOGS / plData.revenue.totalRevenue) * 100).toFixed(1)}%</strong></TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={4}>&nbsp;</TableCell>
                    </TableRow>

                    {/* Gross Profit */}
                    <TableRow sx={{ bgcolor: '#e8f5e8' }}>
                      <TableCell></TableCell>
                      <TableCell><strong>GROSS PROFIT</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrencyDisplay(plData.grossProfit)}</strong></TableCell>
                      <TableCell align="right"><strong>{(plData.margins.grossMargin * 100).toFixed(1)}%</strong></TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={4}>&nbsp;</TableCell>
                    </TableRow>

                    {/* Operating Expenses */}
                    <TableRow>
                      <TableCell colSpan={4} sx={{ bgcolor: '#fce4ec', fontWeight: 'bold' }}>
                        OPERATING EXPENSES
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Salaries & Wages</TableCell>
                      <TableCell align="right">{formatCurrencyDisplay(plData.operatingExpenses.salaries)}</TableCell>
                      <TableCell align="right">{((plData.operatingExpenses.salaries / plData.revenue.totalRevenue) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Office Rent</TableCell>
                      <TableCell align="right">{formatCurrencyDisplay(plData.operatingExpenses.rent)}</TableCell>
                      <TableCell align="right">{((plData.operatingExpenses.rent / plData.revenue.totalRevenue) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Utilities</TableCell>
                      <TableCell align="right">{formatCurrencyDisplay(plData.operatingExpenses.utilities)}</TableCell>
                      <TableCell align="right">{((plData.operatingExpenses.utilities / plData.revenue.totalRevenue) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Marketing</TableCell>
                      <TableCell align="right">{formatCurrencyDisplay(plData.operatingExpenses.marketing)}</TableCell>
                      <TableCell align="right">{((plData.operatingExpenses.marketing / plData.revenue.totalRevenue) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Insurance</TableCell>
                      <TableCell align="right">{formatCurrencyDisplay(plData.operatingExpenses.insurance)}</TableCell>
                      <TableCell align="right">{((plData.operatingExpenses.insurance / plData.revenue.totalRevenue) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Administration</TableCell>
                      <TableCell align="right">{formatCurrencyDisplay(plData.operatingExpenses.admin)}</TableCell>
                      <TableCell align="right">{((plData.operatingExpenses.admin / plData.revenue.totalRevenue) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                      <TableCell></TableCell>
                      <TableCell><strong>TOTAL OPERATING EXPENSES</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrencyDisplay(Object.values(plData.operatingExpenses).reduce((sum, exp) => sum + exp, 0))}</strong></TableCell>
                      <TableCell align="right"><strong>{((Object.values(plData.operatingExpenses).reduce((sum, exp) => sum + exp, 0) / plData.revenue.totalRevenue) * 100).toFixed(1)}%</strong></TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={4}>&nbsp;</TableCell>
                    </TableRow>

                    {/* Net Profit */}
                    <TableRow sx={{
                      bgcolor: plData.netProfit >= 0 ? '#f3e5f5' : '#ffebee',
                      border: '2px solid',
                      borderColor: plData.netProfit >= 0 ? '#9c27b0' : '#f44336'
                    }}>
                      <TableCell></TableCell>
                      <TableCell><strong>NET PROFIT/LOSS</strong></TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" sx={{
                          color: plData.netProfit >= 0 ? '#9c27b0' : '#f44336',
                          fontWeight: 'bold'
                        }}>
                          {formatCurrencyDisplay(plData.netProfit)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" sx={{
                          color: plData.netProfit >= 0 ? '#9c27b0' : '#f44336',
                          fontWeight: 'bold'
                        }}>
                          {(plData.margins.netMargin * 100).toFixed(1)}%
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Margin Analysis */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Margin Analysis
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="success.main">
                          {(plData.margins.grossMargin * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Gross Margin
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color={plData.netProfit >= 0 ? 'secondary.main' : 'error.main'}>
                          {(plData.margins.netMargin * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Net Margin
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="info.main">
                          {formatCurrencyDisplay(plData.revenue.totalRevenue / 30)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Avg Daily Revenue
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="warning.main">
                          {formatCurrencyDisplay(plData.netProfit / 30)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Avg Daily Profit
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

export default ProfitLossReport;