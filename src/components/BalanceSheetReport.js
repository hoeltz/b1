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
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AccountBalance as BalanceIcon,
  GetApp as ExportIcon,
  Print as PrintIcon,
  DateRange as DateIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import financialService from '../services/financialService';
import { formatCurrency } from '../services/currencyUtils';

const BalanceSheetReport = () => {
  const [bsData, setBsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [asOfDate, setAsOfDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (asOfDate) {
      loadBSData();
    }
  }, [asOfDate]);

  const loadBSData = async () => {
    setLoading(true);
    setError(null);

    try {
      const date = new Date(asOfDate);
      const data = await financialService.calculateBalanceSheet(date);
      setBsData(data);
    } catch (err) {
      setError(err.message || 'Failed to load Balance Sheet data');
      console.error('Error loading Balance Sheet data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!bsData) return;

    const exportData = [
      { category: 'CURRENT ASSETS', account: 'Cash & Bank', amount: bsData.assets.current.cashAndBank },
      { category: 'CURRENT ASSETS', account: 'Accounts Receivable', amount: bsData.assets.current.accountsReceivable },
      { category: 'CURRENT ASSETS', account: 'Inventory', amount: bsData.assets.current.inventory },
      { category: 'CURRENT ASSETS', account: 'Prepaid Expenses', amount: bsData.assets.current.prepaidExpenses },
      { category: 'CURRENT ASSETS', account: 'TOTAL CURRENT ASSETS', amount: Object.values(bsData.assets.current).reduce((sum, asset) => sum + asset, 0) },
      { category: 'FIXED ASSETS', account: 'Vehicles', amount: bsData.assets.fixed.vehicles },
      { category: 'FIXED ASSETS', account: 'Warehouse & Facilities', amount: bsData.assets.fixed.warehouse },
      { category: 'FIXED ASSETS', account: 'Office Equipment', amount: bsData.assets.fixed.officeEquipment },
      { category: 'FIXED ASSETS', account: 'IT Systems', amount: bsData.assets.fixed.itSystems },
      { category: 'FIXED ASSETS', account: 'TOTAL FIXED ASSETS', amount: Object.values(bsData.assets.fixed).reduce((sum, asset) => sum + asset, 0) },
      { category: 'TOTAL ASSETS', account: 'TOTAL ASSETS', amount: bsData.assets.total },
      { category: 'CURRENT LIABILITIES', account: 'Accounts Payable', amount: bsData.liabilities.current.accountsPayable },
      { category: 'CURRENT LIABILITIES', account: 'Short Term Loans', amount: bsData.liabilities.current.shortTermLoans },
      { category: 'CURRENT LIABILITIES', account: 'Accrued Expenses', amount: bsData.liabilities.current.accruedExpenses },
      { category: 'CURRENT LIABILITIES', account: 'TOTAL CURRENT LIABILITIES', amount: Object.values(bsData.liabilities.current).reduce((sum, liability) => sum + liability, 0) },
      { category: 'LONG TERM LIABILITIES', account: 'Long Term Loans', amount: bsData.liabilities.longTerm.longTermLoans },
      { category: 'LONG TERM LIABILITIES', account: 'TOTAL LONG TERM LIABILITIES', amount: bsData.liabilities.longTerm.longTermLoans },
      { category: 'TOTAL LIABILITIES', account: 'TOTAL LIABILITIES', amount: bsData.liabilities.total },
      { category: 'EQUITY', account: 'Paid-in Capital', amount: bsData.equity.paidInCapital },
      { category: 'EQUITY', account: 'Retained Earnings', amount: bsData.equity.retainedEarnings },
      { category: 'EQUITY', account: 'Reserves', amount: bsData.equity.reserves },
      { category: 'EQUITY', account: 'TOTAL EQUITY', amount: bsData.totalEquity }
    ];

    financialService.exportToCSV(exportData, `Balance_Sheet_${asOfDate}.csv`);
  };

  const formatCurrencyDisplay = (amount) => {
    return formatCurrency(amount, 'IDR');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Balance Sheet Report...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography variant="h6">Error Loading Balance Sheet Report</Typography>
        <Typography variant="body2">{error}</Typography>
        <Button sx={{ mt: 2 }} onClick={loadBSData} variant="outlined">
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
            Balance Sheet (Neraca)
          </Typography>
          <Typography variant="body1" color="textSecondary">
            As of: {new Date(asOfDate).toLocaleDateString('id-ID')}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportCSV}
            disabled={!bsData}
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

      {/* Date Selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="As of Date"
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                onClick={loadBSData}
                disabled={loading}
              >
                Load Balance Sheet
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {bsData && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: '#e3f2fd', border: '1px solid #2196f3' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <BalanceIcon sx={{ fontSize: 48, color: '#2196f3', mb: 1 }} />
                  <Typography variant="h4" sx={{ color: '#2196f3' }}>
                    {formatCurrencyDisplay(bsData.assets.total)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Assets
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: '#ffebee', border: '1px solid #f44336' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Liabilities
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#f44336' }}>
                    {formatCurrencyDisplay(bsData.liabilities.total)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Liabilities
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: '#f3e5f5', border: '1px solid #9c27b0' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Equity
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#9c27b0' }}>
                    {formatCurrencyDisplay(bsData.totalEquity)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Equity
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                bgcolor: Math.abs(bsData.balanceCheck) < 1000 ? '#e8f5e8' : '#ffebee',
                border: `1px solid ${Math.abs(bsData.balanceCheck) < 1000 ? '#4caf50' : '#f44336'}`
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Balance Check
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: Math.abs(bsData.balanceCheck) < 1000 ? '#4caf50' : '#f44336'
                    }}
                  >
                    {formatCurrencyDisplay(bsData.balanceCheck)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {Math.abs(bsData.balanceCheck) < 1000 ? 'Balanced' : 'Unbalanced'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Financial Ratios */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {bsData.ratios.currentRatio.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Current Ratio
                  </Typography>
                  <Chip
                    label={bsData.ratios.currentRatio > 1.5 ? 'Good' : bsData.ratios.currentRatio > 1 ? 'Fair' : 'Poor'}
                    color={bsData.ratios.currentRatio > 1.5 ? 'success' : bsData.ratios.currentRatio > 1 ? 'warning' : 'error'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="secondary">
                    {bsData.ratios.debtToEquity.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Debt-to-Equity
                  </Typography>
                  <Chip
                    label={bsData.ratios.debtToEquity < 2 ? 'Good' : bsData.ratios.debtToEquity < 3 ? 'Fair' : 'High'}
                    color={bsData.ratios.debtToEquity < 2 ? 'success' : bsData.ratios.debtToEquity < 3 ? 'warning' : 'error'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="success.main">
                    {(bsData.ratios.returnOnAssets * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    ROA
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="info.main">
                    {(bsData.ratios.returnOnEquity * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    ROE
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Detailed Balance Sheet */}
          <Grid container spacing={3}>
            {/* Assets Section */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                    ASSETS (Aset)
                  </Typography>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell><strong>Account</strong></TableCell>
                          <TableCell align="right"><strong>Amount (IDR)</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {/* Current Assets */}
                        <TableRow>
                          <TableCell colSpan={2} sx={{ bgcolor: '#e3f2fd', fontWeight: 'bold', fontSize: '0.875rem' }}>
                            Current Assets (Aset Lancar)
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Cash & Bank</TableCell>
                          <TableCell align="right">{formatCurrencyDisplay(bsData.assets.current.cashAndBank)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Accounts Receivable</TableCell>
                          <TableCell align="right">{formatCurrencyDisplay(bsData.assets.current.accountsReceivable)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Inventory</TableCell>
                          <TableCell align="right">{formatCurrencyDisplay(bsData.assets.current.inventory)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Prepaid Expenses</TableCell>
                          <TableCell align="right">{formatCurrencyDisplay(bsData.assets.current.prepaidExpenses)}</TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                          <TableCell><strong>TOTAL CURRENT ASSETS</strong></TableCell>
                          <TableCell align="right"><strong>{formatCurrencyDisplay(Object.values(bsData.assets.current).reduce((sum, asset) => sum + asset, 0))}</strong></TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell colSpan={2}>&nbsp;</TableCell>
                        </TableRow>

                        {/* Fixed Assets */}
                        <TableRow>
                          <TableCell colSpan={2} sx={{ bgcolor: '#fff3e0', fontWeight: 'bold', fontSize: '0.875rem' }}>
                            Fixed Assets (Aset Tetap)
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Vehicles (Kendaraan)</TableCell>
                          <TableCell align="right">{formatCurrencyDisplay(bsData.assets.fixed.vehicles)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Warehouse & Facilities</TableCell>
                          <TableCell align="right">{formatCurrencyDisplay(bsData.assets.fixed.warehouse)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Office Equipment</TableCell>
                          <TableCell align="right">{formatCurrencyDisplay(bsData.assets.fixed.officeEquipment)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>IT Systems</TableCell>
                          <TableCell align="right">{formatCurrencyDisplay(bsData.assets.fixed.itSystems)}</TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                          <TableCell><strong>TOTAL FIXED ASSETS</strong></TableCell>
                          <TableCell align="right"><strong>{formatCurrencyDisplay(Object.values(bsData.assets.fixed).reduce((sum, asset) => sum + asset, 0))}</strong></TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell colSpan={2}>&nbsp;</TableCell>
                        </TableRow>

                        {/* Total Assets */}
                        <TableRow sx={{ bgcolor: '#e8f5e8', border: '2px solid #4caf50' }}>
                          <TableCell><strong>TOTAL ASSETS</strong></TableCell>
                          <TableCell align="right">
                            <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                              {formatCurrencyDisplay(bsData.assets.total)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Liabilities & Equity Section */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#f44336', fontWeight: 'bold' }}>
                    LIABILITIES & EQUITY (Liabilitas & Ekuitas)
                  </Typography>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell><strong>Account</strong></TableCell>
                          <TableCell align="right"><strong>Amount (IDR)</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {/* Current Liabilities */}
                        <TableRow>
                          <TableCell colSpan={2} sx={{ bgcolor: '#ffebee', fontWeight: 'bold', fontSize: '0.875rem' }}>
                            Current Liabilities (Liabilitas Lancar)
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Accounts Payable</TableCell>
                          <TableCell align="right">{formatCurrencyDisplay(bsData.liabilities.current.accountsPayable)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Short Term Loans</TableCell>
                          <TableCell align="right">{formatCurrencyDisplay(bsData.liabilities.current.shortTermLoans)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Accrued Expenses</TableCell>
                          <TableCell align="right">{formatCurrencyDisplay(bsData.liabilities.current.accruedExpenses)}</TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                          <TableCell><strong>TOTAL CURRENT LIABILITIES</strong></TableCell>
                          <TableCell align="right"><strong>{formatCurrencyDisplay(Object.values(bsData.liabilities.current).reduce((sum, liability) => sum + liability, 0))}</strong></TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell colSpan={2}>&nbsp;</TableCell>
                        </TableRow>

                        {/* Long Term Liabilities */}
                        <TableRow>
                          <TableCell colSpan={2} sx={{ bgcolor: '#fce4ec', fontWeight: 'bold', fontSize: '0.875rem' }}>
                            Long Term Liabilities (Liabilitas Jangka Panjang)
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Long Term Loans</TableCell>
                          <TableCell align="right">{formatCurrencyDisplay(bsData.liabilities.longTerm.longTermLoans)}</TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                          <TableCell><strong>TOTAL LONG TERM LIABILITIES</strong></TableCell>
                          <TableCell align="right"><strong>{formatCurrencyDisplay(bsData.liabilities.longTerm.longTermLoans)}</strong></TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell colSpan={2}>&nbsp;</TableCell>
                        </TableRow>

                        {/* Total Liabilities */}
                        <TableRow sx={{ bgcolor: '#ffebee' }}>
                          <TableCell><strong>TOTAL LIABILITIES</strong></TableCell>
                          <TableCell align="right">
                            <Typography variant="h6" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                              {formatCurrencyDisplay(bsData.liabilities.total)}
                            </Typography>
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell colSpan={2}>&nbsp;</TableCell>
                        </TableRow>

                        {/* Equity */}
                        <TableRow>
                          <TableCell colSpan={2} sx={{ bgcolor: '#f3e5f5', fontWeight: 'bold', fontSize: '0.875rem' }}>
                            Equity (Ekuitas)
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Paid-in Capital</TableCell>
                          <TableCell align="right">{formatCurrencyDisplay(bsData.equity.paidInCapital)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Retained Earnings</TableCell>
                          <TableCell align="right">{formatCurrencyDisplay(bsData.equity.retainedEarnings)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Reserves</TableCell>
                          <TableCell align="right">{formatCurrencyDisplay(bsData.equity.reserves)}</TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                          <TableCell><strong>TOTAL EQUITY</strong></TableCell>
                          <TableCell align="right"><strong>{formatCurrencyDisplay(bsData.totalEquity)}</strong></TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell colSpan={2}>&nbsp;</TableCell>
                        </TableRow>

                        {/* Total Liabilities + Equity */}
                        <TableRow sx={{
                          bgcolor: '#e8f5e8',
                          border: '2px solid #4caf50'
                        }}>
                          <TableCell><strong>TOTAL LIABILITIES + EQUITY</strong></TableCell>
                          <TableCell align="right">
                            <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                              {formatCurrencyDisplay(bsData.liabilities.total + bsData.totalEquity)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Balance Verification */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Balance Sheet Verification
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                    <Typography variant="h6" color="primary">
                      {formatCurrencyDisplay(bsData.assets.total)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Assets
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
                    <Typography variant="h6" color="error">
                      {formatCurrencyDisplay(bsData.liabilities.total + bsData.totalEquity)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Liabilities + Equity
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{
                    textAlign: 'center',
                    p: 2,
                    bgcolor: Math.abs(bsData.balanceCheck) < 1000 ? '#e8f5e8' : '#ffebee',
                    borderRadius: 1
                  }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: Math.abs(bsData.balanceCheck) < 1000 ? 'success.main' : 'error.main'
                      }}
                    >
                      {formatCurrencyDisplay(bsData.balanceCheck)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Difference {Math.abs(bsData.balanceCheck) < 1000 ? '(Balanced)' : '(Unbalanced)'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default BalanceSheetReport;