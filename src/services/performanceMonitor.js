/**
 * Performance Monitoring and Optimization Utilities
 * Provides tools for measuring and improving application performance
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.enabled = process.env.NODE_ENV === 'development';
  }

  // Component render time tracking
  startRender(componentName) {
    if (!this.enabled) return null;

    const startTime = performance.now();
    return {
      end: () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;

        this.recordMetric(`${componentName}_render_time`, renderTime);

        if (renderTime > 16.67) { // More than one frame at 60fps
          console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }

        return renderTime;
      }
    };
  }

  // API call performance tracking
  startAPICall(endpoint) {
    if (!this.enabled) return null;

    const startTime = performance.now();
    return {
      end: (success = true) => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.recordMetric(`api_${endpoint}_${success ? 'success' : 'error'}_time`, duration);

        if (duration > 1000) {
          console.warn(`Slow API call to ${endpoint}: ${duration.toFixed(2)}ms`);
        }

        return duration;
      }
    };
  }

  // Memory usage tracking
  recordMemoryUsage(componentName) {
    if (!this.enabled || !performance.memory) return;

    const memoryInfo = performance.memory;
    const memoryMB = memoryInfo.usedJSHeapSize / (1024 * 1024);

    this.recordMetric(`${componentName}_memory_usage`, memoryMB);

    if (memoryMB > 50) { // More than 50MB
      console.warn(`High memory usage in ${componentName}: ${memoryMB.toFixed(2)}MB`);
    }
  }

  // Generic metric recording
  recordMetric(name, value) {
    if (!this.enabled) return;

    const existing = this.metrics.get(name) || [];
    existing.push({
      value,
      timestamp: Date.now()
    });

    // Keep only last 100 measurements
    if (existing.length > 100) {
      existing.shift();
    }

    this.metrics.set(name, existing);
  }

  // Get metrics summary
  getMetrics() {
    if (!this.enabled) return {};

    const summary = {};

    for (const [name, measurements] of this.metrics.entries()) {
      if (measurements.length === 0) continue;

      const values = measurements.map(m => m.value);
      summary[name] = {
        count: values.length,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        latest: values[values.length - 1],
        trend: this.calculateTrend(values)
      };
    }

    return summary;
  }

  // Calculate performance trend
  calculateTrend(values) {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > 10) return 'degrading';
    if (change < -10) return 'improving';
    return 'stable';
  }

  // Performance reporting
  generateReport() {
    if (!this.enabled) return null;

    const metrics = this.getMetrics();
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalMetrics: Object.keys(metrics).length,
        degradingComponents: [],
        highMemoryComponents: []
      },
      details: metrics
    };

    // Identify problematic components
    for (const [name, data] of Object.entries(metrics)) {
      if (data.trend === 'degrading') {
        report.summary.degradingComponents.push(name);
      }

      if (name.includes('_memory_usage') && data.average > 50) {
        report.summary.highMemoryComponents.push(name);
      }
    }

    return report;
  }

  // Export metrics for external analysis
  exportMetrics() {
    if (!this.enabled) return null;

    return {
      timestamp: new Date().toISOString(),
      metrics: Object.fromEntries(this.metrics),
      summary: this.getMetrics()
    };
  }

  // Clear old metrics
  clear() {
    this.metrics.clear();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance monitoring
export const usePerformanceMonitor = (componentName) => {
  const renderTimerRef = useRef(null);

  useEffect(() => {
    // Start timing when component mounts
    renderTimerRef.current = performanceMonitor.startRender(componentName);

    return () => {
      // End timing when component unmounts
      if (renderTimerRef.current) {
        renderTimerRef.current.end();
      }
    };
  });

  const recordMemoryUsage = useCallback(() => {
    performanceMonitor.recordMemoryUsage(componentName);
  }, [componentName]);

  const recordCustomMetric = useCallback((name, value) => {
    performanceMonitor.recordMetric(`${componentName}_${name}`, value);
  }, [componentName]);

  return {
    recordMemoryUsage,
    recordCustomMetric
  };
};

// Higher-order component for performance monitoring
export const withPerformanceMonitoring = (Component, componentName) => {
  return React.forwardRef((props, ref) => {
    const monitor = usePerformanceMonitor(componentName);

    return (
      <ErrorBoundary>
        <Component {...props} ref={ref} performanceMonitor={monitor} />
      </ErrorBoundary>
    );
  });
};

// Bundle size monitoring
export const monitorBundleSize = () => {
  if (typeof window !== 'undefined' && window.performance) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
          performanceMonitor.recordMetric('page_load_time', loadTime);

          // Estimate bundle size based on load time and connection
          const connection = navigator.connection;
          if (connection) {
            const estimatedSize = (loadTime / 1000) * (connection.downlink || 1) * 1000000; // Rough estimate
            performanceMonitor.recordMetric('estimated_bundle_size', estimatedSize);
          }
        }
      }, 0);
    });
  }
};

// React DevTools Profiler integration
export const withProfiler = (Component, profilerId) => {
  if (process.env.NODE_ENV === 'development') {
    return (props) => (
      <React.Profiler
        id={profilerId}
        onRender={(id, phase, actualDuration, baseDuration, startTime, commitTime) => {
          performanceMonitor.recordMetric(`${id}_${phase}_duration`, actualDuration);
          performanceMonitor.recordMetric(`${id}_base_duration`, baseDuration);
        }}
      >
        <Component {...props} />
      </React.Profiler>
    );
  }

  return Component;
};

// Performance optimization suggestions
export const generateOptimizationSuggestions = () => {
  const metrics = performanceMonitor.getMetrics();
  const suggestions = [];

  for (const [name, data] of Object.entries(metrics)) {
    if (name.includes('_render_time') && data.average > 16.67) {
      suggestions.push({
        component: name.replace('_render_time', ''),
        issue: 'Slow render time',
        suggestion: 'Consider using React.memo, useMemo, or useCallback to optimize re-renders',
        severity: data.average > 50 ? 'high' : 'medium'
      });
    }

    if (name.includes('_memory_usage') && data.average > 50) {
      suggestions.push({
        component: name.replace('_memory_usage', ''),
        issue: 'High memory usage',
        suggestion: 'Review component for memory leaks or excessive state',
        severity: 'high'
      });
    }

    if (name.includes('api') && name.includes('success_time') && data.average > 1000) {
      suggestions.push({
        component: name.replace('_success_time', ''),
        issue: 'Slow API response',
        suggestion: 'Implement caching, pagination, or optimize API calls',
        severity: 'medium'
      });
    }
  }

  return suggestions;
};

// Export performance data for external monitoring tools
export const exportPerformanceData = () => {
  return {
    timestamp: new Date().toISOString(),
    metrics: performanceMonitor.getMetrics(),
    suggestions: generateOptimizationSuggestions(),
    report: performanceMonitor.generateReport()
  };
};

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  monitorBundleSize();

  // Log performance metrics every 30 seconds in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const report = performanceMonitor.generateReport();
      if (report && (report.summary.degradingComponents.length > 0 || report.summary.highMemoryComponents.length > 0)) {
        console.group('🚀 Performance Report');
        console.log('Degrading components:', report.summary.degradingComponents);
        console.log('High memory components:', report.summary.highMemoryComponents);
        console.log('Full report:', report);
        console.groupEnd();
      }
    }, 30000);
  }
}

export default performanceMonitor;