// Comprehensive Reporting and Analytics for FreightFlow

import { format, startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval } from 'date-fns';

export const REPORT_TYPES = {
  // Financial Reports
  REVENUE_SUMMARY: 'revenue_summary',
  PROFIT_LOSS: 'profit_loss',
  CASH_FLOW: 'cash_flow',
  INVOICE_AGING: 'invoice_aging',

  // Operational Reports
  SALES_PERFORMANCE: 'sales_performance',
  CUSTOMER_ANALYSIS: 'customer_analysis',
  CARGO_ANALYSIS: 'cargo_analysis',
  SHIPMENT_TRACKING: 'shipment_tracking',

  // Vendor Reports
  VENDOR_PERFORMANCE: 'vendor_performance',
  COST_ANALYSIS: 'cost_analysis',

  // Dashboard Reports
  EXECUTIVE_SUMMARY: 'executive_summary',
  OPERATIONAL_DASHBOARD: 'operational_dashboard',
};

export const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  DOUGHNUT: 'doughnut',
  AREA: 'area',
  SCATTER: 'scatter',
};

export class ReportingService {
  constructor() {
    this.dateFormat = 'yyyy-MM-dd';
  }

  // Generate Revenue Summary Report
  generateRevenueSummary(data, dateRange = {}) {
    const { startDate, endDate } = dateRange;
    const orders = this.filterByDateRange(data.salesOrders || [], startDate, endDate);
    const invoices = this.filterByDateRange(data.invoices || [], startDate, endDate);

    const totalRevenue = orders.reduce((sum, order) => sum + (order.sellingPrice || 0), 0);
    const totalCosts = orders.reduce((sum, order) => sum + (order.estimatedCost || 0), 0);
    const totalProfit = totalRevenue - totalCosts;

    const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

    const pendingInvoices = invoices.filter(inv => inv.status === 'Sent');
    const totalPending = pendingInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

    return {
      period: { startDate, endDate },
      summary: {
        totalRevenue,
        totalCosts,
        totalProfit,
        profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
        totalPaid,
        totalPending,
        collectionRate: totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0,
      },
      breakdown: {
        byServiceType: this.groupByField(orders, 'serviceType', 'sellingPrice'),
        byCustomer: this.groupByField(orders, 'customerName', 'sellingPrice'),
        byMonth: this.groupByMonth(orders, 'sellingPrice'),
      },
      charts: {
        revenueByServiceType: this.createChartData(
          this.groupByField(orders, 'serviceType', 'sellingPrice'),
          CHART_TYPES.PIE
        ),
        monthlyRevenue: this.createChartData(
          this.groupByMonth(orders, 'sellingPrice'),
          CHART_TYPES.LINE
        ),
      },
    };
  }

  // Generate Customer Analysis Report
  generateCustomerAnalysis(data, dateRange = {}) {
    const { startDate, endDate } = dateRange;
    const customers = data.customers || [];
    const orders = this.filterByDateRange(data.salesOrders || [], startDate, endDate);

    const customerStats = customers.map(customer => {
      const customerOrders = orders.filter(order => order.customerId === customer.id);
      const totalValue = customerOrders.reduce((sum, order) => sum + (order.sellingPrice || 0), 0);
      const orderCount = customerOrders.length;
      const avgOrderValue = orderCount > 0 ? totalValue / orderCount : 0;

      return {
        customerId: customer.id,
        customerName: customer.name,
        type: customer.type,
        totalValue,
        orderCount,
        avgOrderValue,
        lastOrderDate: customerOrders.length > 0
          ? Math.max(...customerOrders.map(o => new Date(o.createdAt)))
          : null,
      };
    });

    // Sort by total value
    customerStats.sort((a, b) => b.totalValue - a.totalValue);

    return {
      period: { startDate, endDate },
      summary: {
        totalCustomers: customers.length,
        activeCustomers: customerStats.filter(c => c.orderCount > 0).length,
        topCustomers: customerStats.slice(0, 10),
        newCustomers: customers.filter(c => {
          if (!startDate || !endDate) return false;
          const createdDate = parseISO(c.createdAt);
          return isWithinInterval(createdDate, { start: parseISO(startDate), end: parseISO(endDate) });
        }).length,
      },
      customerStats,
      charts: {
        customerTypeDistribution: this.createChartData(
          this.groupByField(customers, 'type'),
          CHART_TYPES.DOUGHNUT
        ),
        topCustomers: this.createChartData(
          customerStats.slice(0, 10).map(c => ({ label: c.customerName, value: c.totalValue })),
          CHART_TYPES.BAR
        ),
      },
    };
  }

  // Generate Cargo Analysis Report
  generateCargoAnalysis(data, dateRange = {}) {
    const { startDate, endDate } = dateRange;
    const orders = this.filterByDateRange(data.salesOrders || [], startDate, endDate);

    const totalWeight = orders.reduce((sum, order) => sum + (order.weight || 0), 0);
    const totalVolume = orders.reduce((sum, order) => sum + (order.volume || 0), 0);
    const totalValue = orders.reduce((sum, order) => sum + (order.value || 0), 0);

    return {
      period: { startDate, endDate },
      summary: {
        totalShipments: orders.length,
        totalWeight,
        totalVolume,
        totalValue,
        avgWeightPerShipment: orders.length > 0 ? totalWeight / orders.length : 0,
        avgVolumePerShipment: orders.length > 0 ? totalVolume / orders.length : 0,
        avgValuePerShipment: orders.length > 0 ? totalValue / orders.length : 0,
      },
      breakdown: {
        byCargoType: this.groupByField(orders, 'cargoType', 'weight'),
        byServiceType: this.groupByField(orders, 'serviceType', 'weight'),
        byRoute: this.groupByRoute(orders),
      },
      charts: {
        cargoTypeDistribution: this.createChartData(
          this.groupByField(orders, 'cargoType'),
          CHART_TYPES.PIE
        ),
        weightByServiceType: this.createChartData(
          this.groupByField(orders, 'serviceType', 'weight'),
          CHART_TYPES.BAR
        ),
      },
    };
  }

  // Generate Invoice Aging Report
  generateInvoiceAgingReport(data) {
    const invoices = data.invoices || [];
    const currentDate = new Date();

    const agingBuckets = {
      current: { min: 0, max: 30, invoices: [], total: 0 },
      '31-60': { min: 31, max: 60, invoices: [], total: 0 },
      '61-90': { min: 61, max: 90, invoices: [], total: 0 },
      '91+': { min: 91, max: Infinity, invoices: [], total: 0 },
    };

    invoices.filter(inv => inv.status !== 'Paid').forEach(invoice => {
      const dueDate = parseISO(invoice.dueDate);
      const daysPastDue = Math.floor((currentDate - dueDate) / (1000 * 60 * 60 * 24));

      let bucket;
      if (daysPastDue <= 30) bucket = 'current';
      else if (daysPastDue <= 60) bucket = '31-60';
      else if (daysPastDue <= 90) bucket = '61-90';
      else bucket = '91+';

      agingBuckets[bucket].invoices.push({
        ...invoice,
        daysPastDue,
      });
      agingBuckets[bucket].total += invoice.total || 0;
    });

    return {
      generatedDate: currentDate.toISOString(),
      summary: {
        totalOutstanding: Object.values(agingBuckets).reduce((sum, bucket) => sum + bucket.total, 0),
        totalInvoices: Object.values(agingBuckets).reduce((sum, bucket) => sum + bucket.invoices.length, 0),
      },
      agingBuckets,
      charts: {
        agingDistribution: this.createChartData(
          Object.entries(agingBuckets).map(([period, data]) => ({
            label: period === 'current' ? 'Current' : `${period} days`,
            value: data.total,
          })),
          CHART_TYPES.DOUGHNUT
        ),
      },
    };
  }

  // Generate Executive Summary Dashboard
  generateExecutiveSummary(data) {
    const currentMonth = new Date();
    const startOfCurrentMonth = startOfMonth(currentMonth);
    const endOfCurrentMonth = endOfMonth(currentMonth);

    const previousMonth = subMonths(currentMonth, 1);
    const startOfPreviousMonth = startOfMonth(previousMonth);
    const endOfPreviousMonth = endOfMonth(previousMonth);

    const currentMonthData = {
      salesOrders: this.filterByDateRange(data.salesOrders || [], startOfCurrentMonth, endOfCurrentMonth),
      invoices: this.filterByDateRange(data.invoices || [], startOfCurrentMonth, endOfCurrentMonth),
      customers: data.customers || [],
    };

    const previousMonthData = {
      salesOrders: this.filterByDateRange(data.salesOrders || [], startOfPreviousMonth, endOfPreviousMonth),
      invoices: this.filterByDateRange(data.invoices || [], startOfPreviousMonth, endOfPreviousMonth),
    };

    const currentRevenue = currentMonthData.salesOrders.reduce((sum, order) => sum + (order.sellingPrice || 0), 0);
    const previousRevenue = previousMonthData.salesOrders.reduce((sum, order) => sum + (order.sellingPrice || 0), 0);
    const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const currentProfit = currentRevenue - currentMonthData.salesOrders.reduce((sum, order) => sum + (order.estimatedCost || 0), 0);
    const previousProfit = previousRevenue - previousMonthData.salesOrders.reduce((sum, order) => sum + (order.estimatedCost || 0), 0);
    const profitGrowth = previousProfit > 0 ? ((currentProfit - previousProfit) / previousProfit) * 100 : 0;

    return {
      generatedDate: currentMonth.toISOString(),
      kpis: {
        totalRevenue: {
          current: currentRevenue,
          previous: previousRevenue,
          growth: revenueGrowth,
        },
        totalProfit: {
          current: currentProfit,
          previous: previousProfit,
          growth: profitGrowth,
        },
        totalOrders: {
          current: currentMonthData.salesOrders.length,
          previous: previousMonthData.salesOrders.length,
          growth: previousMonthData.salesOrders.length > 0
            ? ((currentMonthData.salesOrders.length - previousMonthData.salesOrders.length) / previousMonthData.salesOrders.length) * 100
            : 0,
        },
        totalCustomers: currentMonthData.customers.length,
        activeCustomers: new Set(currentMonthData.salesOrders.map(order => order.customerId)).size,
      },
      topMetrics: {
        bestSellingService: this.getMostFrequentValue(currentMonthData.salesOrders, 'serviceType'),
        largestCustomer: this.getLargestBySum(currentMonthData.salesOrders, 'customerName', 'sellingPrice'),
        mostCommonCargoType: this.getMostFrequentValue(currentMonthData.salesOrders, 'cargoType'),
      },
      alerts: this.generateAlerts(data),
    };
  }

  // Helper methods
  filterByDateRange(data, startDate, endDate) {
    if (!startDate || !endDate) return data;

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    return data.filter(item => {
      const itemDate = parseISO(item.createdAt);
      return isWithinInterval(itemDate, { start, end });
    });
  }

  groupByField(data, field, sumField = null) {
    const groups = {};

    data.forEach(item => {
      const key = item[field] || 'Unknown';
      if (!groups[key]) {
        groups[key] = { count: 0, total: 0 };
      }
      groups[key].count++;
      if (sumField && item[sumField] !== undefined) {
        groups[key].total += item[sumField];
      }
    });

    return Object.entries(groups).map(([label, data]) => ({
      label,
      ...data,
    }));
  }

  groupByMonth(data, sumField = null) {
    const groups = {};

    data.forEach(item => {
      const date = parseISO(item.createdAt);
      const monthKey = format(date, 'yyyy-MM');

      if (!groups[monthKey]) {
        groups[monthKey] = { count: 0, total: 0, label: format(date, 'MMM yyyy') };
      }
      groups[monthKey].count++;
      if (sumField && item[sumField] !== undefined) {
        groups[monthKey].total += item[sumField];
      }
    });

    return Object.values(groups).sort((a, b) => a.label.localeCompare(b.label));
  }

  groupByRoute(data) {
    const routes = {};

    data.forEach(order => {
      const route = `${order.origin} → ${order.destination}`;
      if (!routes[route]) {
        routes[route] = { count: 0, totalWeight: 0, totalValue: 0 };
      }
      routes[route].count++;
      routes[route].totalWeight += order.weight || 0;
      routes[route].totalValue += order.sellingPrice || 0;
    });

    return Object.entries(routes).map(([route, data]) => ({
      route,
      ...data,
    })).sort((a, b) => b.totalValue - a.totalValue);
  }

  createChartData(data, chartType) {
    return {
      type: chartType,
      data: data.map(item => ({
        label: item.label,
        value: item.total || item.count || item.value,
      })),
    };
  }

  getMostFrequentValue(data, field) {
    const frequency = {};
    let maxCount = 0;
    let mostFrequent = null;

    data.forEach(item => {
      const value = item[field] || 'Unknown';
      frequency[value] = (frequency[value] || 0) + 1;

      if (frequency[value] > maxCount) {
        maxCount = frequency[value];
        mostFrequent = value;
      }
    });

    return mostFrequent;
  }

  getLargestBySum(data, groupField, sumField) {
    const groups = {};

    data.forEach(item => {
      const key = item[groupField] || 'Unknown';
      groups[key] = (groups[key] || 0) + (item[sumField] || 0);
    });

    let largest = null;
    let maxSum = 0;

    Object.entries(groups).forEach(([key, sum]) => {
      if (sum > maxSum) {
        maxSum = sum;
        largest = key;
      }
    });

    return largest;
  }

  generateAlerts(data) {
    const alerts = [];
    const invoices = data.invoices || [];
    const currentDate = new Date();

    // Overdue invoices
    const overdueInvoices = invoices.filter(inv => {
      const dueDate = parseISO(inv.dueDate);
      return dueDate < currentDate && inv.status !== 'Paid';
    });

    if (overdueInvoices.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Overdue Invoices',
        message: `${overdueInvoices.length} invoices are overdue for payment`,
        count: overdueInvoices.length,
      });
    }

    // High value orders pending
    const highValueOrders = (data.salesOrders || []).filter(order =>
      order.status === 'Draft' && order.sellingPrice > 50000000
    );

    if (highValueOrders.length > 0) {
      alerts.push({
        type: 'info',
        title: 'High Value Orders Pending',
        message: `${highValueOrders.length} high-value orders awaiting confirmation`,
        count: highValueOrders.length,
      });
    }

    return alerts;
  }

  // Generate comprehensive report
  generateComprehensiveReport(data, reportType, options = {}) {
    switch (reportType) {
      case REPORT_TYPES.REVENUE_SUMMARY:
        return this.generateRevenueSummary(data, options.dateRange);

      case REPORT_TYPES.CUSTOMER_ANALYSIS:
        return this.generateCustomerAnalysis(data, options.dateRange);

      case REPORT_TYPES.CARGO_ANALYSIS:
        return this.generateCargoAnalysis(data, options.dateRange);

      case REPORT_TYPES.INVOICE_AGING:
        return this.generateInvoiceAgingReport(data);

      case REPORT_TYPES.EXECUTIVE_SUMMARY:
        return this.generateExecutiveSummary(data);

      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }
}

// Utility functions
export const createReportingService = () => new ReportingService();

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatPercentage = (value) => {
  return `${Number(value).toFixed(1)}%`;
};

export const formatNumber = (value) => {
  return Number(value).toLocaleString('id-ID');
};

export default {
  ReportingService,
  REPORT_TYPES,
  CHART_TYPES,
  createReportingService,
  formatCurrency,
  formatPercentage,
  formatNumber,
};