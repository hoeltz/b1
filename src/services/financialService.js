// Financial Service - Core financial calculations for freight forwarding business
import dataSyncService from './dataSync';

const financialService = {
  // Chart of Accounts for Freight Forwarding
  chartOfAccounts: {
    // ASSETS (1xxxx)
    '11001': { code: '11001', name: 'Kas & Bank', category: 'Current Assets', type: 'debit' },
    '11002': { code: '11002', name: 'Piutang Usaha', category: 'Current Assets', type: 'debit' },
    '11003': { code: '11003', name: 'Persediaan', category: 'Current Assets', type: 'debit' },
    '11004': { code: '11004', name: 'Uang Muka', category: 'Current Assets', type: 'debit' },

    // FIXED ASSETS (12xxx)
    '12001': { code: '12001', name: 'Kendaraan', category: 'Fixed Assets', type: 'debit' },
    '12002': { code: '12002', name: 'Gudang & Fasilitas', category: 'Fixed Assets', type: 'debit' },
    '12003': { code: '12003', name: 'Peralatan Kantor', category: 'Fixed Assets', type: 'debit' },
    '12004': { code: '12004', name: 'Sistem IT', category: 'Fixed Assets', type: 'debit' },

    // LIABILITIES (2xxxx)
    '21001': { code: '21001', name: 'Hutang Usaha', category: 'Current Liabilities', type: 'credit' },
    '21002': { code: '21002', name: 'Hutang Bank Jangka Pendek', category: 'Current Liabilities', type: 'credit' },
    '21003': { code: '21003', name: 'Accrued Expenses', category: 'Current Liabilities', type: 'credit' },
    '22001': { code: '22001', name: 'Hutang Bank Jangka Panjang', category: 'Long Term Liabilities', type: 'credit' },

    // EQUITY (3xxxx)
    '31001': { code: '31001', name: 'Modal Disetor', category: 'Equity', type: 'credit' },
    '31002': { code: '31002', name: 'Laba Ditahan', category: 'Equity', type: 'credit' },
    '31003': { code: '31003', name: 'Cadangan', category: 'Equity', type: 'credit' },

    // REVENUE (4xxxx)
    '41001': { code: '41001', name: 'Pendapatan Freight', category: 'Revenue', type: 'credit' },
    '41002': { code: '41002', name: 'Biaya Handling', category: 'Revenue', type: 'credit' },
    '41003': { code: '41003', name: 'Biaya Dokumentasi', category: 'Revenue', type: 'credit' },
    '41004': { code: '41004', name: 'Biaya Storage', category: 'Revenue', type: 'credit' },
    '41005': { code: '41005', name: 'Pendapatan Asuransi', category: 'Revenue', type: 'credit' },

    // COST OF GOODS SOLD (5xxxx)
    '51001': { code: '51001', name: 'Biaya Langsung Pengiriman', category: 'COGS', type: 'debit' },
    '51002': { code: '51002', name: 'Biaya Bahan Bakar', category: 'COGS', type: 'debit' },
    '51003': { code: '51003', name: 'Biaya Driver/Operator', category: 'COGS', type: 'debit' },
    '51004': { code: '51004', name: 'Biaya Maintenance Kendaraan', category: 'COGS', type: 'debit' },

    // OPERATING EXPENSES (6xxxx)
    '61001': { code: '61001', name: 'Gaji & Upah', category: 'Operating Expenses', type: 'debit' },
    '61002': { code: '61002', name: 'Sewa Kantor', category: 'Operating Expenses', type: 'debit' },
    '61003': { code: '61003', name: 'Utilities', category: 'Operating Expenses', type: 'debit' },
    '61004': { code: '61004', name: 'Biaya Marketing', category: 'Operating Expenses', type: 'debit' },
    '61005': { code: '61005', name: 'Asuransi Perusahaan', category: 'Operating Expenses', type: 'debit' },
    '61006': { code: '61006', name: 'Biaya Administrasi', category: 'Operating Expenses', type: 'debit' },
  },

  // PL (Profit & Loss) Calculations
  calculatePL: async (startDate, endDate) => {
    try {
      // Get data from various sources
      const [customers, orders, invoices] = await Promise.all([
        dataSyncService.getCustomers(),
        dataSyncService.getSalesOrders(),
        // Mock invoices data for now
        Promise.resolve([])
      ]);

      // Filter orders by date range
      const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });

      // Calculate Revenue
      const totalRevenue = filteredOrders
        .filter(order => order.status === 'Delivered')
        .reduce((sum, order) => sum + (parseFloat(order.sellingPrice) || 0), 0);

      // Calculate Operational Costs
      const totalOperationalCosts = filteredOrders
        .filter(order => order.status === 'Delivered')
        .reduce((sum, order) => {
          return sum + (order.operationalCosts || []).reduce((costSum, cost) => {
            return costSum + (parseFloat(cost.amount) || 0);
          }, 0);
        }, 0);

      // Calculate Selling Costs
      const totalSellingCosts = filteredOrders
        .filter(order => order.status === 'Delivered')
        .reduce((sum, order) => {
          return sum + (order.sellingCosts || []).reduce((costSum, cost) => {
            return costSum + (parseFloat(cost.amount) || 0);
          }, 0);
        }, 0);

      // Calculate COGS (Cost of Goods Sold)
      const cogs = totalOperationalCosts + totalSellingCosts;

      // Calculate Gross Profit
      const grossProfit = totalRevenue - cogs;

      // Calculate Operating Expenses (mock data for now)
      const operatingExpenses = {
        salaries: 50000000, // Rp 50M
        rent: 15000000,    // Rp 15M
        utilities: 5000000, // Rp 5M
        marketing: 10000000, // Rp 10M
        insurance: 8000000, // Rp 8M
        admin: 3000000     // Rp 3M
      };

      const totalOperatingExpenses = Object.values(operatingExpenses).reduce((sum, exp) => sum + exp, 0);

      // Calculate Net Profit
      const netProfit = grossProfit - totalOperatingExpenses;

      return {
        period: { startDate, endDate },
        revenue: {
          freightRevenue: totalRevenue,
          handlingFee: totalRevenue * 0.1, // 10% of revenue
          documentationFee: totalRevenue * 0.05, // 5% of revenue
          storageFee: totalRevenue * 0.03, // 3% of revenue
          insuranceRevenue: totalRevenue * 0.02, // 2% of revenue
          totalRevenue
        },
        cogs: {
          directCosts: totalOperationalCosts,
          fuelCosts: totalOperationalCosts * 0.3, // 30% of operational costs
          driverCosts: totalOperationalCosts * 0.4, // 40% of operational costs
          maintenanceCosts: totalOperationalCosts * 0.3, // 30% of operational costs
          totalCOGS: cogs
        },
        operatingExpenses,
        grossProfit,
        netProfit,
        margins: {
          grossMargin: grossProfit / totalRevenue,
          netMargin: netProfit / totalRevenue
        }
      };
    } catch (error) {
      console.error('Error calculating PL:', error);
      throw error;
    }
  },

  // Balance Sheet Calculations
  calculateBalanceSheet: async (asOfDate) => {
    try {
      const [customers, orders, invoices] = await Promise.all([
        dataSyncService.getCustomers(),
        dataSyncService.getSalesOrders(),
        Promise.resolve([])
      ]);

      // Calculate Accounts Receivable (AR)
      const accountsReceivable = orders
        .filter(order => order.status === 'Delivered' && !order.paid)
        .reduce((sum, order) => sum + (parseFloat(order.sellingPrice) || 0), 0);

      // Calculate Accounts Payable (AP) - mock data for now
      const accountsPayable = 75000000; // Rp 75M

      // Current Assets
      const currentAssets = {
        cashAndBank: 100000000, // Rp 100M
        accountsReceivable,
        inventory: 25000000,    // Rp 25M
        prepaidExpenses: 15000000 // Rp 15M
      };

      // Fixed Assets
      const fixedAssets = {
        vehicles: 500000000,    // Rp 500M
        warehouse: 300000000,   // Rp 300M
        officeEquipment: 50000000, // Rp 50M
        itSystems: 25000000     // Rp 25M
      };

      // Total Assets
      const totalAssets = Object.values(currentAssets).reduce((sum, asset) => sum + asset, 0) +
                         Object.values(fixedAssets).reduce((sum, asset) => sum + asset, 0);

      // Current Liabilities
      const currentLiabilities = {
        accountsPayable,
        shortTermLoans: 100000000, // Rp 100M
        accruedExpenses: 20000000  // Rp 20M
      };

      // Long Term Liabilities
      const longTermLiabilities = {
        longTermLoans: 200000000 // Rp 200M
      };

      // Total Liabilities
      const totalLiabilities = Object.values(currentLiabilities).reduce((sum, liability) => sum + liability, 0) +
                              Object.values(longTermLiabilities).reduce((sum, liability) => sum + liability, 0);

      // Equity
      const equity = {
        paidInCapital: 300000000, // Rp 300M
        retainedEarnings: 150000000, // Rp 150M
        reserves: 50000000 // Rp 50M
      };

      const totalEquity = Object.values(equity).reduce((sum, eq) => sum + eq, 0);

      // Balance Check (Assets should equal Liabilities + Equity)
      const balanceCheck = totalAssets - (totalLiabilities + totalEquity);

      return {
        asOfDate,
        assets: {
          current: currentAssets,
          fixed: fixedAssets,
          total: totalAssets
        },
        liabilities: {
          current: currentLiabilities,
          longTerm: longTermLiabilities,
          total: totalLiabilities
        },
        equity,
        totalEquity,
        balanceCheck,
        ratios: {
          currentRatio: currentAssets.cashAndBank / Object.values(currentLiabilities).reduce((sum, liability) => sum + liability, 0),
          debtToEquity: totalLiabilities / totalEquity,
          returnOnAssets: 0.15, // Mock ROA
          returnOnEquity: 0.25  // Mock ROE
        }
      };
    } catch (error) {
      console.error('Error calculating Balance Sheet:', error);
      throw error;
    }
  },

  // Cash Flow Calculations
  calculateCashFlow: async (startDate, endDate) => {
    try {
      const [orders, invoices] = await Promise.all([
        dataSyncService.getSalesOrders(),
        Promise.resolve([])
      ]);

      // Filter orders by date range
      const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });

      // Operating Activities
      const cashFromOperations = filteredOrders
        .filter(order => order.status === 'Delivered')
        .reduce((sum, order) => sum + (parseFloat(order.sellingPrice) || 0), 0);

      const cashForOperations = filteredOrders
        .filter(order => order.status === 'Delivered')
        .reduce((sum, order) => {
          return sum + (order.operationalCosts || []).reduce((costSum, cost) => {
            return costSum + (parseFloat(cost.amount) || 0);
          }, 0);
        }, 0);

      // Investing Activities (mock data)
      const cashForInvesting = -50000000; // Equipment purchase

      // Financing Activities (mock data)
      const cashFromFinancing = 100000000; // Bank loan

      // Net Cash Flow
      const netCashFlow = cashFromOperations - cashForOperations + cashForInvesting + cashFromFinancing;

      return {
        period: { startDate, endDate },
        operating: {
          cashReceived: cashFromOperations,
          cashPaid: cashForOperations,
          netOperating: cashFromOperations - cashForOperations
        },
        investing: {
          equipmentPurchases: 50000000,
          netInvesting: cashForInvesting
        },
        financing: {
          loanProceeds: 100000000,
          netFinancing: cashFromFinancing
        },
        netCashFlow,
        beginningCash: 50000000, // Mock beginning balance
        endingCash: 50000000 + netCashFlow
      };
    } catch (error) {
      console.error('Error calculating Cash Flow:', error);
      throw error;
    }
  },

  // AR/AP Aging Calculations
  calculateARAging: async () => {
    try {
      const [customers, orders] = await Promise.all([
        dataSyncService.getCustomers(),
        dataSyncService.getSalesOrders()
      ]);

      // Mock aging data structure
      const agingData = {
        current: { amount: 150000000, count: 15 }, // 0-30 days
        thirtyDays: { amount: 75000000, count: 8 }, // 31-60 days
        sixtyDays: { amount: 25000000, count: 3 }, // 61-90 days
        ninetyDays: { amount: 10000000, count: 1 } // 90+ days
      };

      const totalAR = Object.values(agingData).reduce((sum, item) => sum + item.amount, 0);

      return {
        totalReceivables: totalAR,
        aging: agingData,
        averageCollectionPeriod: 45, // Mock days
        collectionRate: 0.85 // 85% collection rate
      };
    } catch (error) {
      console.error('Error calculating AR Aging:', error);
      throw error;
    }
  },

  calculateAPAging: async () => {
    try {
      // Mock AP aging data
      const agingData = {
        current: { amount: 200000000, count: 20 }, // 0-30 days
        thirtyDays: { amount: 50000000, count: 5 }, // 31-60 days
        sixtyDays: { amount: 15000000, count: 2 } // 60+ days
      };

      const totalAP = Object.values(agingData).reduce((sum, item) => sum + item.amount, 0);

      return {
        totalPayables: totalAP,
        aging: agingData,
        averagePaymentPeriod: 35, // Mock days
        paymentRate: 0.90 // 90% on-time payment rate
      };
    } catch (error) {
      console.error('Error calculating AP Aging:', error);
      throw error;
    }
  },

  // Financial Ratios
  calculateFinancialRatios: async (plData, bsData) => {
    try {
      const ratios = {
        profitability: {
          grossMargin: plData.margins.grossMargin,
          netMargin: plData.margins.netMargin,
          returnOnAssets: bsData.ratios.returnOnAssets,
          returnOnEquity: bsData.ratios.returnOnEquity
        },
        liquidity: {
          currentRatio: bsData.ratios.currentRatio,
          quickRatio: bsData.ratios.currentRatio - 0.2, // Simplified
          cashRatio: bsData.assets.current.cashAndBank / bsData.liabilities.current.accountsPayable
        },
        leverage: {
          debtToEquity: bsData.ratios.debtToEquity,
          debtToAssets: bsData.liabilities.total / bsData.assets.total,
          interestCoverage: 5.5 // Mock ICR
        },
        efficiency: {
          assetTurnover: plData.revenue.totalRevenue / bsData.assets.total,
          inventoryTurnover: 8.5, // Mock inventory turnover
          receivablesTurnover: 12 // Mock AR turnover
        }
      };

      return ratios;
    } catch (error) {
      console.error('Error calculating financial ratios:', error);
      throw error;
    }
  },

  // Export functions for reports
  exportToCSV: (data, filename) => {
    // Simple CSV export functionality
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  },

  exportToPDF: (data, title) => {
    // PDF export using jsPDF (if available)
    console.log('PDF export for:', title, data);
    // Implementation would use jsPDF library
  }
};

export default financialService;