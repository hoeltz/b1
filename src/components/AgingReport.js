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
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  GetApp as ExportIcon,
  Print as PrintIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import financialService from '../services/financialService';
import { formatCurrency } from '../services/currencyUtils';

const AgingReport = () => {
  const [arData, setArData] = useState(null);
  const [apData, setApData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadAgingData();
  }, []);

  const loadAgingData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [arResult, apResult] = await Promise.all([
        financialService.calculateARAging(),
        financialService.calculateAPAging()
      ]);

      setArData(arResult);
      setApData(apResult);
    } catch (err) {
      setError(err.message || 'Failed to load aging data');
      console.error('Error loading aging data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!arData || !apData) return;

    const exportData = [
      // AR Data
      { type: 'AR', category: 'Current (0-30 days)', amount: arData.aging.current.amount, count: arData.aging.current.count },
      { type: 'AR', category: '31-60 days', amount: arData.aging.thirtyDays.amount, count: arData.aging.thirtyDays.count },
      { type: 'AR', category: '61-90 days', amount: arData.aging.sixtyDays.amount, count: arData.aging.sixtyDays.count },
      { type: 'AR', category: '90+ days', amount: arData.aging.ninetyDays.amount, count: arData.aging.ninetyDays.count },
      { type: 'AR', category: 'TOTAL AR', amount: arData.totalReceivables, count: arData.aging.current.count + arData.aging.thirtyDays.count + arData.aging.sixtyDays.count + arData.aging.ninetyDays.count },

      // AP Data
      { type: 'AP', category: 'Current (0-30 days)', amount: apData.aging.current.amount, count: apData.aging.current.count },
      { type: 'AP', category: '31-60 days', amount: apData.aging.thirtyDays.amount, count: apData.aging.thirtyDays.count },
      { type: 'AP', category: '60+ days', amount: apData.aging.sixtyDays.amount, count: apData.aging.sixtyDays.count },
      { type: 'AP', category: 'TOTAL AP', amount: apData.totalPayables, count: apData.aging.current.count + apData.aging.thirtyDays.count + apData.aging.sixtyDays.count }
    ];

    financialService.exportToCSV(exportData, `AR_AP_Aging_Report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const formatCurrencyDisplay = (amount) => {
    return formatCurrency(amount, 'IDR');
  };

  const getAgingStatusColor = (days, type) => {
    if (type === 'AR') {
      // For AR, older = worse (red)
      if (days > 90) return 'error';
      if (days > 60) return 'warning';
      if (days > 30) return 'info';
      return 'success';
    } else {
      // For AP, current = good (green), older = warning (orange)
      if (days === 0) return 'success';
      if (days <= 30) return 'info';
      if (days <= 60) return 'warning';
      return 'error';
    }
  };

  const getAgingStatusIcon = (days, type) => {
    if (type === 'AR') {
      if (days > 90) return <ErrorIcon />;
      if (days > 60) return <WarningIcon />;
      if (days > 30) return <ScheduleIcon />;
      return <CheckCircleIcon />;
    } else {
      if (days === 0) return <CheckCircleIcon />;
      if (days <= 30) return <ScheduleIcon />;
      if (days <= 60) return <WarningIcon />;
      return <ErrorIcon />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Aging Report...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography variant="h6">Error Loading Aging Report</Typography>
        <Typography variant="body2">{error}</Typography>
        <Button sx={{ mt: 2 }} onClick={loadAgingData} variant="outlined">
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
            AR/AP Aging Report
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Accounts Receivable and Payable Aging Analysis
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportCSV}
            disabled={!arData || !apData}
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

      {/* Summary Cards */}
      {arData && apData && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#e3f2fd', border: '1px solid #2196f3' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUpIcon sx={{ fontSize: 48, color: '#2196f3', mb: 1 }} />
                <Typography variant="h4" sx={{ color: '#2196f3' }}>
                  {formatCurrencyDisplay(arData.totalReceivables)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Receivables
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#ffebee', border: '1px solid #f44336' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingDownIcon sx={{ fontSize: 48, color: '#f44336', mb: 1 }} />
                <Typography variant="h4" sx={{ color: '#f44336' }}>
                  {formatCurrencyDisplay(apData.totalPayables)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Payables
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              bgcolor: arData.collectionRate > 0.8 ? '#e8f5e8' : '#fff3e0',
              border: `1px solid ${arData.collectionRate > 0.8 ? '#4caf50' : '#ff9800'}`
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Collection Metrics
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: arData.collectionRate > 0.8 ? '#4caf50' : '#ff9800'
                  }}
                >
                  {(arData.collectionRate * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Collection Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              bgcolor: apData.paymentRate > 0.8 ? '#e8f5e8' : '#fff3e0',
              border: `1px solid ${apData.paymentRate > 0.8 ? '#4caf50' : '#ff9800'}`
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Payment Metrics
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: apData.paymentRate > 0.8 ? '#4caf50' : '#ff9800'
                  }}
                >
                  {(apData.paymentRate * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  On-Time Payment Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs for AR and AP */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<TrendingUpIcon />} label="Accounts Receivable (AR)" />
          <Tab icon={<TrendingDownIcon />} label="Accounts Payable (AP)" />
        </Tabs>
      </Paper>

      {/* AR Aging Tab */}
      {activeTab === 0 && arData && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Accounts Receivable Aging
                </Typography>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell><strong>Aging Period</strong></TableCell>
                        <TableCell align="center"><strong>Invoice Count</strong></TableCell>
                        <TableCell align="right"><strong>Amount (IDR)</strong></TableCell>
                        <TableCell align="right"><strong>% of Total</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <CheckCircleIcon sx={{ color: '#4caf50' }} />
                            <Typography>Current (0-30 days)</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">{arData.aging.current.count}</TableCell>
                        <TableCell align="right">{formatCurrencyDisplay(arData.aging.current.amount)}</TableCell>
                        <TableCell align="right">{((arData.aging.current.amount / arData.totalReceivables) * 100).toFixed(1)}%</TableCell>
                        <TableCell>
                          <Chip label="Good" color="success" size="small" />
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <ScheduleIcon sx={{ color: '#2196f3' }} />
                            <Typography>31-60 days</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">{arData.aging.thirtyDays.count}</TableCell>
                        <TableCell align="right">{formatCurrencyDisplay(arData.aging.thirtyDays.amount)}</TableCell>
                        <TableCell align="right">{((arData.aging.thirtyDays.amount / arData.totalReceivables) * 100).toFixed(1)}%</TableCell>
                        <TableCell>
                          <Chip label="Monitor" color="info" size="small" />
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <WarningIcon sx={{ color: '#ff9800' }} />
                            <Typography>61-90 days</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">{arData.aging.sixtyDays.count}</TableCell>
                        <TableCell align="right">{formatCurrencyDisplay(arData.aging.sixtyDays.amount)}</TableCell>
                        <TableCell align="right">{((arData.aging.sixtyDays.amount / arData.totalReceivables) * 100).toFixed(1)}%</TableCell>
                        <TableCell>
                          <Chip label="Action Needed" color="warning" size="small" />
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <ErrorIcon sx={{ color: '#f44336' }} />
                            <Typography>90+ days</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">{arData.aging.ninetyDays.count}</TableCell>
                        <TableCell align="right">{formatCurrencyDisplay(arData.aging.ninetyDays.amount)}</TableCell>
                        <TableCell align="right">{((arData.aging.ninetyDays.amount / arData.totalReceivables) * 100).toFixed(1)}%</TableCell>
                        <TableCell>
                          <Chip label="Critical" color="error" size="small" />
                        </TableCell>
                      </TableRow>

                      <TableRow sx={{ bgcolor: '#f0f0f0', border: '2px solid #2196f3' }}>
                        <TableCell><strong>TOTAL RECEIVABLES</strong></TableCell>
                        <TableCell align="center"><strong>{arData.aging.current.count + arData.aging.thirtyDays.count + arData.aging.sixtyDays.count + arData.aging.ninetyDays.count}</strong></TableCell>
                        <TableCell align="right"><strong>{formatCurrencyDisplay(arData.totalReceivables)}</strong></TableCell>
                        <TableCell align="right"><strong>100.0%</strong></TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  AR Collection Metrics
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">Collection Rate</Typography>
                    <Typography variant="h6" color="primary">
                      {(arData.collectionRate * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box sx={{
                    width: '100%',
                    height: 8,
                    bgcolor: '#e0e0e0',
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{
                      width: `${arData.collectionRate * 100}%`,
                      height: '100%',
                      bgcolor: arData.collectionRate > 0.8 ? '#4caf50' : arData.collectionRate > 0.6 ? '#ff9800' : '#f44336'
                    }} />
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">Average Collection Period</Typography>
                    <Typography variant="h6" color="secondary">
                      {arData.averageCollectionPeriod} days
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Collection Strategy:
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {arData.collectionRate > 0.8
                    ? "• Excellent collection performance"
                    : arData.collectionRate > 0.6
                    ? "• Good performance, monitor aging"
                    : "• Needs improvement in collection process"
                  }
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {arData.averageCollectionPeriod < 30
                    ? "• Fast collection cycle"
                    : arData.averageCollectionPeriod < 45
                    ? "• Standard collection cycle"
                    : "• Slow collection cycle, needs attention"
                  }
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* AP Aging Tab */}
      {activeTab === 1 && apData && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Accounts Payable Aging
                </Typography>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell><strong>Aging Period</strong></TableCell>
                        <TableCell align="center"><strong>Invoice Count</strong></TableCell>
                        <TableCell align="right"><strong>Amount (IDR)</strong></TableCell>
                        <TableCell align="right"><strong>% of Total</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <CheckCircleIcon sx={{ color: '#4caf50' }} />
                            <Typography>Current (0-30 days)</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">{apData.aging.current.count}</TableCell>
                        <TableCell align="right">{formatCurrencyDisplay(apData.aging.current.amount)}</TableCell>
                        <TableCell align="right">{((apData.aging.current.amount / apData.totalPayables) * 100).toFixed(1)}%</TableCell>
                        <TableCell>
                          <Chip label="On Time" color="success" size="small" />
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <ScheduleIcon sx={{ color: '#2196f3' }} />
                            <Typography>31-60 days</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">{apData.aging.thirtyDays.count}</TableCell>
                        <TableCell align="right">{formatCurrencyDisplay(apData.aging.thirtyDays.amount)}</TableCell>
                        <TableCell align="right">{((apData.aging.thirtyDays.amount / apData.totalPayables) * 100).toFixed(1)}%</TableCell>
                        <TableCell>
                          <Chip label="Due Soon" color="info" size="small" />
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <WarningIcon sx={{ color: '#ff9800' }} />
                            <Typography>60+ days</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">{apData.aging.sixtyDays.count}</TableCell>
                        <TableCell align="right">{formatCurrencyDisplay(apData.aging.sixtyDays.amount)}</TableCell>
                        <TableCell align="right">{((apData.aging.sixtyDays.amount / apData.totalPayables) * 100).toFixed(1)}%</TableCell>
                        <TableCell>
                          <Chip label="Overdue" color="warning" size="small" />
                        </TableCell>
                      </TableRow>

                      <TableRow sx={{ bgcolor: '#f0f0f0', border: '2px solid #f44336' }}>
                        <TableCell><strong>TOTAL PAYABLES</strong></TableCell>
                        <TableCell align="center"><strong>{apData.aging.current.count + apData.aging.thirtyDays.count + apData.aging.sixtyDays.count}</strong></TableCell>
                        <TableCell align="right"><strong>{formatCurrencyDisplay(apData.totalPayables)}</strong></TableCell>
                        <TableCell align="right"><strong>100.0%</strong></TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  AP Payment Metrics
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">On-Time Payment Rate</Typography>
                    <Typography variant="h6" color="primary">
                      {(apData.paymentRate * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box sx={{
                    width: '100%',
                    height: 8,
                    bgcolor: '#e0e0e0',
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{
                      width: `${apData.paymentRate * 100}%`,
                      height: '100%',
                      bgcolor: apData.paymentRate > 0.8 ? '#4caf50' : apData.paymentRate > 0.6 ? '#ff9800' : '#f44336'
                    }} />
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">Average Payment Period</Typography>
                    <Typography variant="h6" color="secondary">
                      {apData.averagePaymentPeriod} days
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Payment Strategy:
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {apData.paymentRate > 0.8
                    ? "• Excellent payment discipline"
                    : apData.paymentRate > 0.6
                    ? "• Good payment performance"
                    : "• Needs improvement in payment management"
                  }
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {apData.averagePaymentPeriod < 30
                    ? "• Fast payment cycle - good for vendor relations"
                    : apData.averagePaymentPeriod < 45
                    ? "• Standard payment terms"
                    : "• Extended payment terms - may affect vendor relationships"
                  }
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Overall Summary */}
      {arData && apData && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Overall AR/AP Analysis
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                  <Typography variant="h6" color="primary">
                    {formatCurrencyDisplay(arData.totalReceivables - apData.totalPayables)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Net Position (AR - AP)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f3e5f5', borderRadius: 1 }}>
                  <Typography variant="h6" color="secondary">
                    {((arData.totalReceivables / apData.totalPayables)).toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    AR/AP Ratio
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e8f5e8', borderRadius: 1 }}>
                  <Typography variant="h6" color="success.main">
                    {arData.collectionRate > apData.paymentRate ? 'AR Better' : 'AP Better'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Collection vs Payment
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                  <Typography variant="h6" color="warning.main">
                    {Math.abs(arData.averageCollectionPeriod - apData.averagePaymentPeriod)} days
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Collection Gap
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AgingReport;