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
import { AttachMoney as MoneyIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';

const FinanceReporting = () => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const reportData = [
    { period: 'Jan 2024', revenue: 45000000, costs: 32000000, margin: 13000000 },
    { period: 'Feb 2024', revenue: 52000000, costs: 38000000, margin: 14000000 },
    { period: 'Mar 2024', revenue: 48000000, costs: 35000000, margin: 13000000 },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Finance Reports
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6">{formatCurrency(145000000)}</Typography>
              <Typography color="textSecondary">Total Revenue</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon color="error" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6">{formatCurrency(105000000)}</Typography>
              <Typography color="textSecondary">Total Costs</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6">{formatCurrency(40000000)}</Typography>
              <Typography color="textSecondary">Total Margin</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Performance
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Period</TableCell>
                      <TableCell>Revenue</TableCell>
                      <TableCell>Costs</TableCell>
                      <TableCell>Margin</TableCell>
                      <TableCell>Margin %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{row.period}</TableCell>
                        <TableCell>{formatCurrency(row.revenue)}</TableCell>
                        <TableCell>{formatCurrency(row.costs)}</TableCell>
                        <TableCell sx={{ color: 'success.main' }}>
                          {formatCurrency(row.margin)}
                        </TableCell>
                        <TableCell>
                          {((row.margin / row.revenue) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FinanceReporting;