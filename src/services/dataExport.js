// Data Export Utility for FreightFlow Application

export const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'xlsx',
  PDF: 'pdf',
  JSON: 'json',
};

export const EXPORT_TEMPLATES = {
  customers: {
    filename: 'customers_export',
    columns: [
      { key: 'id', header: 'ID', width: 10 },
      { key: 'name', header: 'Customer Name', width: 25 },
      { key: 'type', header: 'Type', width: 15 },
      { key: 'email', header: 'Email', width: 25 },
      { key: 'phone', header: 'Phone', width: 15 },
      { key: 'address', header: 'Address', width: 30 },
      { key: 'taxId', header: 'Tax ID', width: 20 },
      { key: 'creditLimit', header: 'Credit Limit', width: 15, format: 'currency' },
      { key: 'paymentTerms', header: 'Payment Terms', width: 15 },
      { key: 'status', header: 'Status', width: 10 },
      { key: 'createdAt', header: 'Created Date', width: 15, format: 'date' },
    ],
  },

  salesOrders: {
    filename: 'sales_orders_export',
    columns: [
      { key: 'id', header: 'ID', width: 10 },
      { key: 'orderNumber', header: 'Order Number', width: 15 },
      { key: 'customerName', header: 'Customer', width: 25 },
      { key: 'origin', header: 'Origin', width: 20 },
      { key: 'destination', header: 'Destination', width: 20 },
      { key: 'cargoType', header: 'Cargo Type', width: 15 },
      { key: 'serviceType', header: 'Service Type', width: 15 },
      { key: 'weight', header: 'Weight (kg)', width: 12, format: 'number' },
      { key: 'volume', header: 'Volume (m³)', width: 12, format: 'number' },
      { key: 'value', header: 'Cargo Value', width: 15, format: 'currency' },
      { key: 'estimatedCost', header: 'Est. Cost', width: 15, format: 'currency' },
      { key: 'sellingPrice', header: 'Selling Price', width: 15, format: 'currency' },
      { key: 'status', header: 'Status', width: 12 },
      { key: 'priority', header: 'Priority', width: 10 },
      { key: 'createdAt', header: 'Created Date', width: 15, format: 'date' },
    ],
  },

  invoices: {
    filename: 'invoices_export',
    columns: [
      { key: 'id', header: 'ID', width: 10 },
      { key: 'invoiceNumber', header: 'Invoice Number', width: 15 },
      { key: 'customerName', header: 'Customer', width: 25 },
      { key: 'subtotal', header: 'Subtotal', width: 15, format: 'currency' },
      { key: 'taxRate', header: 'Tax Rate (%)', width: 12, format: 'percentage' },
      { key: 'taxAmount', header: 'Tax Amount', width: 15, format: 'currency' },
      { key: 'total', header: 'Total', width: 15, format: 'currency' },
      { key: 'status', header: 'Status', width: 12 },
      { key: 'dueDate', header: 'Due Date', width: 15, format: 'date' },
      { key: 'paymentTerms', header: 'Payment Terms', width: 15 },
      { key: 'createdAt', header: 'Created Date', width: 15, format: 'date' },
    ],
  },

  vendors: {
    filename: 'vendors_export',
    columns: [
      { key: 'id', header: 'ID', width: 10 },
      { key: 'name', header: 'Vendor Name', width: 25 },
      { key: 'type', header: 'Type', width: 15 },
      { key: 'serviceType', header: 'Service Type', width: 15 },
      { key: 'email', header: 'Email', width: 25 },
      { key: 'phone', header: 'Phone', width: 15 },
      { key: 'address', header: 'Address', width: 30 },
      { key: 'rating', header: 'Rating', width: 10, format: 'number' },
      { key: 'status', header: 'Status', width: 10 },
      { key: 'createdAt', header: 'Created Date', width: 15, format: 'date' },
    ],
  },
};

// Utility functions for data formatting
const formatValue = (value, formatType) => {
  if (value === null || value === undefined) return '';

  switch (formatType) {
    case 'currency':
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(value);

    case 'date':
      return new Date(value).toLocaleDateString('id-ID');

    case 'datetime':
      return new Date(value).toLocaleString('id-ID');

    case 'number':
      return Number(value).toLocaleString('id-ID');

    case 'percentage':
      return `${Number(value).toFixed(1)}%`;

    default:
      return String(value);
  }
};

// Convert array of objects to CSV
const arrayToCSV = (data, columns) => {
  if (!data || data.length === 0) return '';

  // Create header row
  const headers = columns.map(col => col.header);
  const csvRows = [headers.join(',')];

  // Create data rows
  data.forEach(row => {
    const values = columns.map(col => {
      const value = row[col.key];
      const formattedValue = formatValue(value, col.format);

      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (formattedValue.includes(',') || formattedValue.includes('"') || formattedValue.includes('\n')) {
        return `"${formattedValue.replace(/"/g, '""')}"`;
      }
      return formattedValue;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
};

// Download file helper
const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Main export functions
export const exportToCSV = (data, templateName) => {
  try {
    const template = EXPORT_TEMPLATES[templateName];
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    const csvContent = arrayToCSV(data, template.columns);
    const filename = `${template.filename}_${new Date().toISOString().split('T')[0]}.csv`;

    downloadFile(csvContent, filename, 'text/csv');
    return { success: true, filename };
  } catch (error) {
    console.error('CSV export error:', error);
    throw error;
  }
};

export const exportToJSON = (data, templateName) => {
  try {
    const template = EXPORT_TEMPLATES[templateName];
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const filename = `${template.filename}_${new Date().toISOString().split('T')[0]}.json`;

    downloadFile(jsonContent, filename, 'application/json');
    return { success: true, filename };
  } catch (error) {
    console.error('JSON export error:', error);
    throw error;
  }
};

// Simple PDF export using print styles
export const exportToPDF = (data, templateName) => {
  try {
    const template = EXPORT_TEMPLATES[templateName];
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }

    // Generate HTML table
    const htmlContent = generatePrintHTML(data, template);

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };

    return { success: true };
  } catch (error) {
    console.error('PDF export error:', error);
    throw error;
  }
};

// Generate HTML for printing
const generatePrintHTML = (data, template) => {
  const currentDate = new Date().toLocaleDateString('id-ID');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${template.filename}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          margin: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .header .date {
          color: #666;
          margin-top: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .number {
          text-align: right;
        }
        .currency {
          text-align: right;
        }
        .date {
          text-align: center;
        }
        @media print {
          body { margin: 0; }
          .header { page-break-after: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>FreightFlow - ${template.filename.replace('_', ' ').toUpperCase()}</h1>
        <div class="date">Generated on: ${currentDate}</div>
      </div>
      <table>
        <thead>
          <tr>
            ${template.columns.map(col => `<th style="width: ${col.width * 8}px">${col.header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${template.columns.map(col => {
                const value = row[col.key];
                const formattedValue = formatValue(value, col.format);
                const cellClass = col.format === 'number' || col.format === 'currency' ? col.format : '';

                return `<td class="${cellClass}">${formattedValue}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
};

// Batch export function
export const batchExport = async (data, templateName, formats = [EXPORT_FORMATS.CSV]) => {
  const results = [];
  const template = EXPORT_TEMPLATES[templateName];

  if (!template) {
    throw new Error(`Template '${templateName}' not found`);
  }

  for (const format of formats) {
    try {
      let result;
      switch (format) {
        case EXPORT_FORMATS.CSV:
          result = exportToCSV(data, templateName);
          break;
        case EXPORT_FORMATS.JSON:
          result = exportToJSON(data, templateName);
          break;
        case EXPORT_FORMATS.PDF:
          result = exportToPDF(data, templateName);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
      results.push({ format, success: true, result });
    } catch (error) {
      results.push({ format, success: false, error: error.message });
    }
  }

  return results;
};

// Get available templates
export const getAvailableTemplates = () => {
  return Object.keys(EXPORT_TEMPLATES);
};

// Get template info
export const getTemplateInfo = (templateName) => {
  return EXPORT_TEMPLATES[templateName] || null;
};

export default {
  EXPORT_FORMATS,
  EXPORT_TEMPLATES,
  exportToCSV,
  exportToJSON,
  exportToPDF,
  batchExport,
  getAvailableTemplates,
  getTemplateInfo,
};