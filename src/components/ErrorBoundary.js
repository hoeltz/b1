import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Collapse
} from '@mui/material';
import { Error as ErrorIcon, ExpandMore as ExpandIcon } from '@mui/icons-material';

/**
 * Error Boundary Component
 * Provides graceful error handling for React components
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    });
  };

  handleReset = () => {
    // Force a complete reset by reloading the component tree
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallback, showDetails = true } = this.props;

      // Use custom fallback if provided
      if (fallback) {
        return fallback(this.state.error, this.handleRetry);
      }

      return (
        <Card sx={{ m: 2, border: '1px solid', borderColor: 'error.main' }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <ErrorIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="h6" color="error">
                {this.props.title || 'Something went wrong'}
              </Typography>
            </Box>

            <Typography variant="body2" color="textSecondary" gutterBottom>
              {this.props.message || 'An unexpected error occurred in this component.'}
            </Typography>

            <Box display="flex" gap={1} mt={2}>
              <Button
                variant="contained"
                size="small"
                onClick={this.handleRetry}
              >
                Try Again
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={this.handleReset}
              >
                Reload Page
              </Button>

              {showDetails && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                  endIcon={<ExpandIcon />}
                >
                  {this.state.showDetails ? 'Hide' : 'Show'} Details
                </Button>
              )}
            </Box>

            {showDetails && this.state.showDetails && (
              <Collapse in={this.state.showDetails}>
                <Alert severity="error" sx={{ mt: 2 }}>
                  <Typography variant="caption" component="div">
                    <strong>Error:</strong> {this.state.error?.message}
                  </Typography>
                  {this.state.errorInfo && (
                    <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                      <strong>Component Stack:</strong>
                      <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '200px' }}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </Typography>
                  )}
                </Alert>
              </Collapse>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based Error Boundary for functional components
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error) => {
    setError(error);
    console.error('Error caught by useErrorHandler:', error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
};

/**
 * Higher-order component for wrapping components with error boundary
 */
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

/**
 * Error boundary specifically for form components
 */
export const FormErrorBoundary = ({ children, onError }) => (
  <ErrorBoundary
    title="Form Error"
    message="There was an error loading the form. Please refresh and try again."
    onError={onError}
    fallback={(error, retry) => (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Form Error
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {error?.message || 'An error occurred while loading the form.'}
        </Typography>
        <Button variant="contained" onClick={retry} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    )}
  >
    {children}
  </ErrorBoundary>
);

/**
 * Error boundary for async operations
 */
export const AsyncErrorBoundary = ({ children, fallback = null }) => (
  <ErrorBoundary
    fallback={(error, retry) => (
      <Alert severity="error" sx={{ m: 2 }}>
        <Typography variant="body2">
          Failed to load data: {error?.message}
        </Typography>
        <Button size="small" onClick={retry} sx={{ mt: 1 }}>
          Retry
        </Button>
      </Alert>
    )}
  >
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;