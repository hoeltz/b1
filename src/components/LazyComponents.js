import React, { Suspense, lazy } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Card,
  CardContent
} from '@mui/material';

/**
 * Loading Component for Suspense fallbacks
 */
const LoadingSpinner = ({ message = 'Loading...', size = 40 }) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    p={3}
    minHeight="200px"
  >
    <CircularProgress size={size} sx={{ mb: 2 }} />
    <Typography variant="body2" color="textSecondary">
      {message}
    </Typography>
  </Box>
);

/**
 * Error Fallback for Lazy Loading
 */
const LazyLoadError = ({ error, retry }) => (
  <Card sx={{ m: 2, border: '1px solid', borderColor: 'error.main' }}>
    <CardContent>
      <Typography variant="h6" color="error" gutterBottom>
        Failed to Load Component
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {error?.message || 'An error occurred while loading this component.'}
      </Typography>
      {retry && (
        <Button variant="contained" onClick={retry} sx={{ mt: 2 }}>
          Retry
        </Button>
      )}
    </CardContent>
  </Card>
);

/**
 * Lazy Loaded Components with Error Boundaries
 */

// Lazy load heavy components
const SalesOrderOptimized = lazy(() =>
  import('./SalesOrderOptimized').catch(error => {
    console.error('Failed to load SalesOrderOptimized:', error);
    throw error;
  })
);

const OperationalCost = lazy(() =>
  import('./OperationalCost').catch(error => {
    console.error('Failed to load OperationalCost:', error);
    throw error;
  })
);

const CostManagement = lazy(() =>
  import('./CostManagement').catch(error => {
    console.error('Failed to load CostManagement:', error);
    throw error;
  })
);

const FinanceReporting = lazy(() =>
  import('./FinanceReporting').catch(error => {
    console.error('Failed to load FinanceReporting:', error);
    throw error;
  })
);

const Analytics = lazy(() =>
  import('./Analytics').catch(error => {
    console.error('Failed to load Analytics:', error);
    throw error;
  })
);

/**
 * Wrapped Lazy Components with Error Boundaries and Loading States
 */

// Sales Order with lazy loading
export const LazySalesOrder = React.forwardRef((props, ref) => {
  const [retryCount, setRetryCount] = React.useState(0);

  const handleRetry = React.useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  return (
    <ErrorBoundary
      title="Sales Order Error"
      message="Failed to load the Sales Order component."
      fallback={(error) => (
        <LazyLoadError error={error} retry={handleRetry} />
      )}
    >
      <Suspense
        key={retryCount} // Force reload on retry
        fallback={<LoadingSpinner message="Loading Sales Order..." />}
      >
        <SalesOrderOptimized {...props} ref={ref} />
      </Suspense>
    </ErrorBoundary>
  );
});

LazySalesOrder.displayName = 'LazySalesOrder';

// Operational Cost with lazy loading
export const LazyOperationalCost = React.forwardRef((props, ref) => {
  return (
    <ErrorBoundary
      title="Operational Cost Error"
      message="Failed to load the Operational Cost component."
    >
      <Suspense fallback={<LoadingSpinner message="Loading Operational Costs..." />}>
        <OperationalCost {...props} ref={ref} />
      </Suspense>
    </ErrorBoundary>
  );
});

LazyOperationalCost.displayName = 'LazyOperationalCost';

// Cost Management with lazy loading
export const LazyCostManagement = React.forwardRef((props, ref) => {
  return (
    <ErrorBoundary
      title="Cost Management Error"
      message="Failed to load the Cost Management component."
    >
      <Suspense fallback={<LoadingSpinner message="Loading Cost Management..." />}>
        <CostManagement {...props} ref={ref} />
      </Suspense>
    </ErrorBoundary>
  );
});

LazyCostManagement.displayName = 'LazyCostManagement';

// Finance Reporting with lazy loading
export const LazyFinanceReporting = React.forwardRef((props, ref) => {
  return (
    <ErrorBoundary
      title="Finance Reporting Error"
      message="Failed to load the Finance Reporting component."
    >
      <Suspense fallback={<LoadingSpinner message="Loading Finance Reports..." />}>
        <FinanceReporting {...props} ref={ref} />
      </Suspense>
    </ErrorBoundary>
  );
});

LazyFinanceReporting.displayName = 'LazyFinanceReporting';

// Analytics with lazy loading
export const LazyAnalytics = React.forwardRef((props, ref) => {
  return (
    <ErrorBoundary
      title="Analytics Error"
      message="Failed to load the Analytics component."
    >
      <Suspense fallback={<LoadingSpinner message="Loading Analytics..." />}>
        <Analytics {...props} ref={ref} />
      </Suspense>
    </ErrorBoundary>
  );
});

LazyAnalytics.displayName = 'LazyAnalytics';

/**
 * Route-based Code Splitting Components
 * For React Router integration
 */
export const LazyRouteComponents = {
  Dashboard: lazy(() => import('./Dashboard')),
  SalesOrder: lazy(() => import('./SalesOrder')),
  PurchaseOrder: lazy(() => import('./PurchaseOrder')),
  InvoiceManagement: lazy(() => import('./InvoiceManagement')),
  CustomerManagement: lazy(() => import('./CustomerManagement')),
  VendorManagement: lazy(() => import('./VendorManagement')),
  CargoManagement: lazy(() => import('./CargoManagement')),
  ShippingManagement: lazy(() => import('./ShippingManagement')),
  HSCodeManagement: lazy(() => import('./HSCodeManagement')),
  CostManagement: lazy(() => import('./CostManagement')),
  OperationalCost: lazy(() => import('./OperationalCost')),
  SellingCost: lazy(() => import('./SellingCost')),
  FinanceReporting: lazy(() => import('./FinanceReporting')),
  Analytics: lazy(() => import('./Analytics')),
  RedlineManagement: lazy(() => import('./RedlineManagement'))
};

/**
 * Preload Component Function
 * For preloading critical components
 */
export const preloadComponent = (componentName) => {
  const componentMap = {
    SalesOrder: () => import('./SalesOrderOptimized'),
    OperationalCost: () => import('./OperationalCost'),
    CostManagement: () => import('./CostManagement'),
    FinanceReporting: () => import('./FinanceReporting'),
    Analytics: () => import('./Analytics')
  };

  const importFn = componentMap[componentName];
  if (importFn) {
    importFn();
  }
};

/**
 * Smart Preloading based on user behavior
 */
export const useSmartPreloading = () => {
  React.useEffect(() => {
    // Preload likely next components based on current route
    const currentPath = window.location.pathname;

    if (currentPath.includes('sales-order')) {
      // User is on sales order, likely to visit cost management next
      setTimeout(() => preloadComponent('CostManagement'), 2000);
    } else if (currentPath.includes('cost')) {
      // User is on cost pages, likely to visit finance reporting
      setTimeout(() => preloadComponent('FinanceReporting'), 2000);
    }

    // Preload analytics for admin users (you can detect this based on user role)
    setTimeout(() => preloadComponent('Analytics'), 5000);
  }, []);
};

/**
 * Component Size Information for Monitoring
 */
export const COMPONENT_SIZES = {
  SalesOrderOptimized: '~45KB',
  OperationalCost: '~38KB',
  CostManagement: '~32KB',
  FinanceReporting: '~28KB',
  Analytics: '~35KB'
};

/**
 * Lazy Loading with Intersection Observer
 * For components that should load when visible
 */
export const useLazyComponent = (importFn, options = {}) => {
  const [Component, setComponent] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const elementRef = React.useRef(null);

  React.useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !Component && !loading) {
          setLoading(true);
          importFn()
            .then(module => {
              setComponent(() => module.default);
              setLoading(false);
            })
            .catch(err => {
              setError(err);
              setLoading(false);
            });
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(elementRef.current);

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [importFn, Component, loading, options]);

  return { Component, loading, error, elementRef };
};

export default {
  LoadingSpinner,
  LazyLoadError,
  LazySalesOrder,
  LazyOperationalCost,
  LazyCostManagement,
  LazyFinanceReporting,
  LazyAnalytics,
  LazyRouteComponents,
  preloadComponent,
  useSmartPreloading,
  useLazyComponent
};