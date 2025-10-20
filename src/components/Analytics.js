import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Analytics as AnalyticsIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';

const Analytics = () => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const analyticsData = [
    { metric: 'Average Order Value', value: formatCurrency(8500000), change: '+12%' },
    { metric: 'Cost per Shipment', value: formatCurrency(6800000), change: '-5%' },
    { metric: 'Customer Satisfaction', value: '4.8/5.0', change: '+0.2' },
    { metric: 'On-time Delivery', value: '94.5%', change: '+2.1%' },
  ];

  const topCustomers = [
    { name: 'PT. Global Trade Indonesia', orders: 15, revenue: 125000000 },
    { name: 'CV. Makmur Jaya', orders: 8, revenue: 68000000 },
    { name: 'PT. Berkat Abadi', orders: 5, revenue: 38000000 },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analytics Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Key Performance Indicators
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>Change</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.map((item, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{item.metric}</TableCell>
                        <TableCell>{item.value}</TableCell>
                        <TableCell sx={{ color: 'success.main' }}>
                          {item.change}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Customers
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell>Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topCustomers.map((customer, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant="body2">{customer.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {customer.orders} orders
                          </Typography>
                        </TableCell>
                        <TableCell>{formatCurrency(customer.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AnalyticsIcon color="primary" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Advanced Analytics
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Detailed analytics and reporting features will be available in the full version.
                This includes trend analysis, forecasting, and comprehensive business intelligence dashboards.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;