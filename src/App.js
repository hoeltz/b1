import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { initializeSampleData } from './services/localStorage';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '1px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#fff5f5',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#d63031', marginBottom: '16px' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#636e72', marginBottom: '16px' }}>
            The application encountered an unexpected error. Please refresh the page to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0984e3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary style={{ color: '#d63031', cursor: 'pointer' }}>
                Error Details (Development Only)
              </summary>
              <pre style={{
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px',
                marginTop: '10px'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  LocalShipping as ShippingIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  AccountBalance as FinanceIcon,
  Analytics as AnalyticsIcon,
  ShoppingCart as PurchaseIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';

// Components
import Dashboard from './components/Dashboard';
import CustomerManagement from './components/CustomerManagement';
import Quotation from './components/Quotation';
import ShippingManagement from './components/ShippingManagement';
import VendorManagement from './components/VendorManagement';
import PurchaseOrder from './components/PurchaseOrder';
import InvoiceManagement from './components/InvoiceManagement';
import FinanceReporting from './components/FinanceReporting';
import Analytics from './components/Analytics';
import HSCodeManagement from './components/HSCodeManagement';

const drawerWidth = 280;

const menuItems = [
  // Main Operational Menu
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/', category: 'main' },
  { text: 'Quotations', icon: <ReceiptIcon />, path: '/quotations', category: 'main' },
  { text: 'Purchase Orders', icon: <PurchaseIcon />, path: '/purchase-orders', category: 'main' },

  // Customer & Vendor Management
  { text: 'Customer Management', icon: <PeopleIcon />, path: '/customers', category: 'management' },
  { text: 'Vendor Management', icon: <BusinessIcon />, path: '/vendors', category: 'management' },

  // Operational Details
  { text: 'Shipping Management', icon: <ShippingIcon />, path: '/shipping', category: 'operations' },
  { text: 'HS Code Management', icon: <CategoryIcon />, path: '/hs-codes', category: 'operations' },

  // Internal Cost Management (Management Only)

  // Financial Management
  { text: 'Invoices', icon: <ReceiptIcon />, path: '/invoices', category: 'finance' },
  { text: 'Finance Reports', icon: <FinanceIcon />, path: '/finance-reports', category: 'finance' },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics', category: 'finance' },
];

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let initialized = false;

    // Initialize sample data on app start with delay to prevent blocking
    const initTimer = setTimeout(() => {
      if (!initialized) {
        try {
          initialized = true;
          initializeSampleData();
        } catch (error) {
          console.error('Error initializing sample data:', error);
          // Continue with the app even if sample data initialization fails
        }
      }
    }, 100);

    return () => {
      clearTimeout(initTimer);
    };
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          Bakhtera One
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item, index) => {
          const prevCategory = index > 0 ? menuItems[index - 1].category : null;
          const showDivider = prevCategory && prevCategory !== item.category;

          return (
            <React.Fragment key={item.text}>
              {showDivider && <Divider sx={{ my: 1, backgroundColor: 'rgba(255, 255, 255, 0.3)' }} />}
              <ListItem disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleMenuClick(item.path)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'white' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            </React.Fragment>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Bakhtera One - Freight Forwarding Management System
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="navigation menu"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<CustomerManagement />} />
          <Route path="/quotations" element={<Quotation />} />
          <Route path="/purchase-orders" element={<PurchaseOrder />} />
          <Route path="/hs-codes" element={<HSCodeManagement />} />
          <Route path="/shipping" element={<ShippingManagement />} />
          <Route path="/vendors" element={<VendorManagement />} />
          <Route path="/invoices" element={<InvoiceManagement />} />
          <Route path="/finance-reports" element={<FinanceReporting />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </Box>
    </Box>
  );
}

// Wrap App with Error Boundary
const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithErrorBoundary;