import { getDashboardOverview, getSalesAnalytics, getOrderAnalytics } from './AnalyticsService.js';

/**
 * Generates CSV content string from analytics data
 */
export const generateCSVReport = async (reportType = 'sales', range = '30days') => {
  let csvContent = '';

  if (reportType === 'sales') {
    const sales = await getSalesAnalytics(range);
    csvContent = 'Date,Revenue,Orders,GST,Discounts,Delivery Fees\n';
    for (const row of sales.dailyRevenue) {
      csvContent += `${row._id},${row.revenue},${row.orders},${row.gst},${row.discounts},${row.deliveryFees}\n`;
    }
  } else if (reportType === 'orders') {
    const orders = await getOrderAnalytics(range);
    csvContent = 'Metric,Value\n';
    csvContent += `Total Orders,${orders.totalOrders}\n`;
    csvContent += `Completion Rate,${orders.completionRate}%\n`;
    csvContent += `Cancellation Rate,${orders.cancellationRate}%\n`;
    csvContent += `Refund Rate,${orders.refundRate}%\n`;
    csvContent += '\nPeak Hours\nHour,Orders\n';
    for (const h of orders.peakHours) {
      csvContent += `${h.hour},${h.orders}\n`;
    }
  } else if (reportType === 'dashboard') {
    const dash = await getDashboardOverview(range);
    csvContent = 'KPI,Value\n';
    csvContent += `Total Revenue,${dash.totalRevenue}\n`;
    csvContent += `Total Orders,${dash.totalOrders}\n`;
    csvContent += `Avg Order Value,${dash.avgOrderValue}\n`;
    csvContent += `Pending Orders,${dash.pendingOrders}\n`;
    csvContent += `Completed Orders,${dash.completedOrders}\n`;
    csvContent += `Cancelled Orders,${dash.cancelledOrders}\n`;
    csvContent += `Active Customers,${dash.activeCustomers}\n`;
    csvContent += `Low Stock Items,${dash.lowStockItems}\n`;
  }

  return csvContent;
};

/**
 * Generates Excel-compatible HTML table for download
 */
export const generateExcelReport = async (reportType = 'sales', range = '30days') => {
  let htmlTable = '<html><head><meta charset="utf-8"></head><body>';

  if (reportType === 'sales') {
    const sales = await getSalesAnalytics(range);
    htmlTable += '<h2>PizzaHub Sales Report</h2>';
    htmlTable += '<table border="1" cellpadding="8"><thead><tr><th>Date</th><th>Revenue (₹)</th><th>Orders</th><th>GST (₹)</th><th>Discounts (₹)</th><th>Delivery Fees (₹)</th></tr></thead><tbody>';
    for (const row of sales.dailyRevenue) {
      htmlTable += `<tr><td>${row._id}</td><td>${row.revenue}</td><td>${row.orders}</td><td>${row.gst}</td><td>${row.discounts}</td><td>${row.deliveryFees}</td></tr>`;
    }
    htmlTable += '</tbody></table>';
    htmlTable += `<p><strong>Gross Revenue:</strong> ₹${sales.grossRevenue} | <strong>Net Revenue:</strong> ₹${sales.netRevenue} | <strong>Total Refunds:</strong> ₹${sales.totalRefunds}</p>`;
  } else if (reportType === 'dashboard') {
    const dash = await getDashboardOverview(range);
    htmlTable += '<h2>PizzaHub Executive Dashboard Report</h2>';
    htmlTable += `<table border="1" cellpadding="8"><tbody>`;
    htmlTable += `<tr><td>Total Revenue</td><td>₹${dash.totalRevenue}</td></tr>`;
    htmlTable += `<tr><td>Total Orders</td><td>${dash.totalOrders}</td></tr>`;
    htmlTable += `<tr><td>Avg Order Value</td><td>₹${dash.avgOrderValue}</td></tr>`;
    htmlTable += `<tr><td>Pending Orders</td><td>${dash.pendingOrders}</td></tr>`;
    htmlTable += `<tr><td>Completed Orders</td><td>${dash.completedOrders}</td></tr>`;
    htmlTable += `<tr><td>Cancelled Orders</td><td>${dash.cancelledOrders}</td></tr>`;
    htmlTable += `<tr><td>Refunded Orders</td><td>${dash.refundedOrders}</td></tr>`;
    htmlTable += `<tr><td>Active Customers</td><td>${dash.activeCustomers}</td></tr>`;
    htmlTable += `<tr><td>Low Stock Items</td><td>${dash.lowStockItems}</td></tr>`;
    htmlTable += `</tbody></table>`;
  }

  htmlTable += '</body></html>';
  return htmlTable;
};

/**
 * Generates Printable PDF-friendly HTML report page
 */
export const generatePDFReport = async (reportType = 'sales', range = '30days') => {
  const dash = await getDashboardOverview(range);
  const sales = await getSalesAnalytics(range);

  const reportDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>PizzaHub Business Report</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 900px; margin: auto; padding: 40px; background: #fff; color: #1e293b; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #ff5e36; padding-bottom: 15px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: 900; color: #ff5e36; }
        .subtitle { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; }
        h2 { color: #0f172a; font-size: 18px; margin-top: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
        .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; }
        .kpi-value { font-size: 22px; font-weight: 800; color: #0f172a; }
        .kpi-label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }
        th { background: #f1f5f9; color: #475569; padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
        .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        @media print { body { padding: 20px; } .kpi-grid { grid-template-columns: repeat(4, 1fr); } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">🍕 PizzaHub Business Report</div>
          <div class="subtitle">${reportType.toUpperCase()} Report • ${reportDate}</div>
        </div>
        <div style="text-align: right; font-size: 12px; color: #64748b;">
          <p>Generated by PizzaHub ERP</p>
          <p>Period: Last ${range}</p>
        </div>
      </div>

      <h2>Executive Summary</h2>
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-value">₹${dash.totalRevenue}</div><div class="kpi-label">Total Revenue</div></div>
        <div class="kpi"><div class="kpi-value">${dash.totalOrders}</div><div class="kpi-label">Total Orders</div></div>
        <div class="kpi"><div class="kpi-value">₹${dash.avgOrderValue}</div><div class="kpi-label">Avg Order Value</div></div>
        <div class="kpi"><div class="kpi-value">${dash.activeCustomers}</div><div class="kpi-label">Active Customers</div></div>
      </div>
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-value">${dash.pendingOrders}</div><div class="kpi-label">Pending</div></div>
        <div class="kpi"><div class="kpi-value">${dash.completedOrders}</div><div class="kpi-label">Delivered</div></div>
        <div class="kpi"><div class="kpi-value">${dash.cancelledOrders}</div><div class="kpi-label">Cancelled</div></div>
        <div class="kpi"><div class="kpi-value">${dash.lowStockItems}</div><div class="kpi-label">Low Stock</div></div>
      </div>

      <h2>Daily Revenue Breakdown</h2>
      <table>
        <thead><tr><th>Date</th><th>Revenue (₹)</th><th>Orders</th><th>GST (₹)</th><th>Discounts (₹)</th></tr></thead>
        <tbody>
          ${sales.dailyRevenue
            .map((r) => `<tr><td>${r._id}</td><td>₹${r.revenue}</td><td>${r.orders}</td><td>₹${r.gst}</td><td>₹${r.discounts}</td></tr>`)
            .join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>© ${new Date().getFullYear()} PizzaHub Enterprise ERP System — Confidential Business Report</p>
      </div>
    </body>
    </html>
  `;
};
