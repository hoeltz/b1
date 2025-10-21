import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Avatar,
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  LocalShipping as ShippingIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  Alert,
} from '@mui/material';
import { salesOrderService, customerService, invoiceService } from '../services/localStorage';
import { dashboardStats } from '../data/sampleData';
import notificationService, { useNotifications } from '../services/notificationService';
import { handleError } from '../services/errorHandler';
import { useDashboardStats, useDataSync } from '../hooks/useDataSync';
import { formatCurrency } from '../services/currencyUtils';

const StatCard = ({ title, value, icon, color, subtitle, children }) => (
  <Card sx={{ height: '100%', minHeight: 120 }}>
    <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box flex={1}>
          <Typography color="textSecondary" gutterBottom variant="h6" sx={{ fontSize: '0.875rem' }}>
            {title}
          </Typography>
          <Box sx={{ mt: 1 }}>
            {children || (
              <Typography variant="h4" component="div" sx={{ color, fontSize: '1.5rem', lineHeight: 1.2 }}>
                {value}
              </Typography>
            )}
          </Box>
          {subtitle && (
            <Typography color="textSecondary" variant="body2" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ ml: 2 }}>
          {React.cloneElement(icon, {
            sx: { fontSize: 40, color }
          })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const RecentOrders = ({ orders }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Recent Sales Orders
      </Typography>
      <List>
        {orders.slice(0, 5).map((order) => (
          <ListItem key={order.id} divider>
            <ListItemText
              primary={
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle1">{order.orderNumber}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {order.customerName} • {order.packageType}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Chip
                      label={order.status || 'Draft'}
                      color={order.status === 'Confirmed' ? 'success' : order.status === 'In Transit' ? 'primary' : 'warning'}
                      size="small"
                    />
                    <Chip
                      label={order.priority}
                      color={order.priority === 'High' ? 'error' : order.priority === 'Urgent' ? 'warning' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    {order.origin} → {order.destination} • {order.serviceType}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {order.cargoItems?.length || 0} items • {order.cargoItems?.reduce((sum, item) => sum + (item.weight || 0), 0)}kg • {formatCurrency(order.sellingPrice || 0, 'IDR')}
                  </Typography>
                  {order.shipmentDetails?.trackingNumber && (
                    <Typography variant="body2" color="primary">
                      Tracking: {order.shipmentDetails.trackingNumber}
                    </Typography>
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </CardContent>
  </Card>
);

const QuickActions = () => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Quick Actions
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Box
            sx={{
              p: 2,
              border: '1px dashed #ccc',
              borderRadius: 1,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': { bgcolor: '#f5f5f5' }
            }}
          >
            <AssignmentIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="body2">New Sales Order</Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box
            sx={{
              p: 2,
              border: '1px dashed #ccc',
              borderRadius: 1,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': { bgcolor: '#f5f5f5' }
            }}
          >
            <PeopleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="body2">Add Customer</Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box
            sx={{
              p: 2,
              border: '1px dashed #ccc',
              borderRadius: 1,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': { bgcolor: '#f5f5f5' }
            }}
          >
            <ShippingIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="body2">Book Shipment</Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box
            sx={{
              p: 2,
              border: '1px dashed #ccc',
              borderRadius: 1,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': { bgcolor: '#f5f5f5' }
            }}
          >
            <ReceiptIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="body2">Create Invoice</Typography>
          </Box>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  // Use real-time dashboard statistics
  const { stats, loading: statsLoading } = useDashboardStats();

  // Use real-time data sync for recent orders
  const { data: ordersData, loading: ordersLoading } = useDataSync('salesOrders');

  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Use the notification hook
  const notificationData = useNotifications();

  useEffect(() => {
    if (notificationData) {
      setAlerts(notificationService.alerts || []);
      setNotifications(notificationData.notifications || []);
    }
  }, [notificationData?.notifications?.length]); // Only depend on notifications length

  // Get recent orders from real-time data
  const recentOrders = ordersData?.slice(0, 5) || [];

  // Calculate additional stats that aren't in the real-time stats
  const additionalStats = {
    activeShipments: ordersData?.filter(order =>
      order.shipmentDetails?.status === 'Booked' || order.shipmentDetails?.status === 'In Transit'
    ).length || 0,
    totalOverdueAmount: 0 // This would need to be calculated from invoice data
  };

  // Using standardized currency formatting
  const formatCurrencyDisplay = (amount, currency = 'IDR') => {
    return formatCurrency(amount, currency);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Welcome to Bakhtera1 - Your Advanced Freight Forwarding Management System
          </Typography>
        </Box>
        <Box display="flex" gap={2} alignItems="center">
          {notificationData.unreadCount > 0 && (
            <Chip
              label={`${notificationData.unreadCount} new notifications`}
              color="primary"
              onClick={() => notificationService.markAllAsRead()}
            />
          )}
          {alerts.filter(alert => !alert.acknowledged).length > 0 && (
            <Chip
              label={`${alerts.filter(alert => !alert.acknowledged).length} active alerts`}
              color="warning"
            />
          )}
        </Box>
      </Box>

      {/* Real-time Alerts */}
      {alerts.filter(alert => !alert.acknowledged).length > 0 && (
        <Box mb={3}>
          {alerts.filter(alert => !alert.acknowledged).map(alert => (
            <Alert
              key={alert.id}
              severity={alert.severity === 'critical' ? 'error' : 'warning'}
              sx={{ mb: 1 }}
              onClose={() => notificationService.acknowledgeAlert(alert.id)}
            >
              <Typography variant="subtitle2">{alert.message}</Typography>
              <Typography variant="caption">
                {new Date(alert.timestamp).toLocaleString()}
              </Typography>
            </Alert>
          ))}
        </Box>
      )}

      {/* Financial Stats Cards - Top Priority */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            icon={<MoneyIcon />}
            color="#f57c00"
          >
            <Box>
              <Typography variant="h6" sx={{ color: '#f57c00', fontSize: '1.25rem' }}>
                IDR {formatCurrencyDisplay(stats.totalRevenue, 'IDR')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#1976d2', fontSize: '1rem' }}>
                USD {formatCurrencyDisplay(stats.totalRevenue / 15000, 'USD')}
              </Typography>
            </Box>
          </StatCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Operational Cost"
            icon={<MoneyIcon />}
            color="#388e3c"
          >
            <Box>
              <Typography variant="h6" sx={{ color: '#388e3c', fontSize: '1.25rem' }}>
                IDR {formatCurrencyDisplay(stats.totalOperationalCosts || 0, 'IDR')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#1976d2', fontSize: '1rem' }}>
                USD {formatCurrencyDisplay((stats.totalOperationalCosts || 0) / 15000, 'USD')}
              </Typography>
            </Box>
          </StatCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Profit Margin"
            value={statsLoading ? '...' : formatCurrency(stats.totalMargin)}
            icon={<TrendingUpIcon />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Margin Rate"
            value={statsLoading ? '...' : `${((stats.totalMargin / stats.totalRevenue) * 100).toFixed(1)}%`}
            icon={<AssessmentIcon />}
            color="#7b1fa2"
          />
        </Grid>
      </Grid>

      {/* Activity Stats Cards - Secondary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={statsLoading ? '...' : stats.totalCustomers}
            icon={<PeopleIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Orders"
            value={statsLoading ? '...' : stats.totalOrders}
            icon={<AssignmentIcon />}
            color="#388e3c"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Shipments"
            value={ordersLoading ? '...' : additionalStats.activeShipments}
            icon={<ShippingIcon />}
            color="#7b1fa2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Invoices"
            value={statsLoading ? '...' : stats.pendingInvoices}
            icon={<ReceiptIcon />}
            color="#f57c00"
          />
        </Grid>
      </Grid>

      {/* Additional Activity Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ReceiptIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6">{stats.pendingInvoices}</Typography>
              <Typography color="textSecondary">Pending Invoices</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ScheduleIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6">{stats.overdueInvoices}</Typography>
              <Typography color="textSecondary">Overdue Invoices</Typography>
              {stats.totalOverdueAmount > 0 && (
                <Typography variant="body2" color="error">
                  {formatCurrencyDisplay(stats.totalOverdueAmount)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssessmentIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6">98.5%</Typography>
              <Typography color="textSecondary">On-Time Delivery</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ScheduleIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6">2.3 days</Typography>
              <Typography color="textSecondary">Avg. Processing Time</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content - Full Width without Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {ordersLoading ? (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Sales Orders
                </Typography>
                <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ ml: 2 }}>Loading recent orders...</Typography>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <RecentOrders orders={recentOrders} />
          )}
        </Grid>
      </Grid>

      {/* Additional Stats */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ShippingIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6">{stats.activeShipments}</Typography>
              <Typography color="textSecondary">Active Shipments</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ReceiptIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6">{stats.pendingInvoices}</Typography>
              <Typography color="textSecondary">Pending Invoices</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssessmentIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6">98.5%</Typography>
              <Typography color="textSecondary">On-Time Delivery</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ScheduleIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6">2.3 days</Typography>
              <Typography color="textSecondary">Avg. Processing Time</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;