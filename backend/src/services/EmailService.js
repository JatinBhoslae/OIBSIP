import sendEmail from '../utils/nodemailer.js';

/**
 * Enterprise Email Service wrapper for sending low stock notifications with HTML templates.
 */
export const sendLowStockEmail = async ({
  ingredientName,
  category,
  currentStock,
  minimumStock,
  unit = 'pcs',
  status = 'Low Stock',
}) => {
  const adminEmail = process.env.SMTP_USER || 'admin@pizzahub.com';
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/inventory`;
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isOutOfStock = currentStock === 0;
  const statusBadgeColor = isOutOfStock ? '#ef4444' : '#f59e0b';
  const statusBadgeBg = isOutOfStock ? '#fee2e2' : '#fef3c7';

  const subject = `PizzaHub Inventory Alert [${isOutOfStock ? 'OUT OF STOCK' : 'LOW STOCK'}]: ${ingredientName} (${currentStock} ${unit})`;

  const textMessage = `[ALERT] PizzaHub Inventory Alert\n\nIngredient: ${ingredientName}\nCategory: ${category}\nCurrent Stock: ${currentStock} ${unit}\nMinimum Stock: ${minimumStock} ${unit}\nStatus: ${status}\nDate: ${currentDate}\n\nPlease restock in admin panel: ${dashboardUrl}`;

  const htmlMessage = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: auto; background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155; }
        .header { background: linear-gradient(135deg, #ff5e36 0%, #ea580c 100%); padding: 24px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 1px; }
        .content { padding: 28px; }
        .alert-card { background-color: #0f172a; border-left: 4px solid ${statusBadgeColor}; padding: 16px; border-radius: 6px; margin-bottom: 20px; }
        .badge { display: inline-block; padding: 6px 12px; background-color: ${statusBadgeBg}; color: ${statusBadgeColor}; font-weight: bold; border-radius: 20px; font-size: 12px; text-transform: uppercase; margin-bottom: 10px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .table td { padding: 10px 0; border-bottom: 1px solid #334155; color: #cbd5e1; font-size: 14px; }
        .table td.label { font-weight: 600; color: #94a3b8; width: 40%; }
        .table td.value { font-weight: 700; color: #f8fafc; }
        .btn { display: block; width: 220px; margin: 25px auto 10px auto; padding: 14px; background-color: #ff5e36; color: #ffffff !important; text-align: center; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 14px; box-shadow: 0 4px 12px rgba(255, 94, 54, 0.3); }
        .footer { background-color: #0f172a; padding: 18px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🍕 PizzaHub ERP Alert</h1>
        </div>
        <div class="content">
          <div class="alert-card">
            <span class="badge">${status}</span>
            <h2 style="margin: 0; color: #f8fafc; font-size: 18px;">Critical Stock Level Reached</h2>
            <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 13px;">Immediate restock required to ensure unbroken pizza production.</p>
          </div>

          <table class="table">
            <tr>
              <td class="label">Ingredient Name</td>
              <td class="value">${ingredientName}</td>
            </tr>
            <tr>
              <td class="label">Category</td>
              <td class="value" style="text-transform: capitalize;">${category}</td>
            </tr>
            <tr>
              <td class="label">Current Stock</td>
              <td class="value" style="color: ${statusBadgeColor};">${currentStock} ${unit}</td>
            </tr>
            <tr>
              <td class="label">Minimum Stock</td>
              <td class="value">${minimumStock} ${unit}</td>
            </tr>
            <tr>
              <td class="label">Alert Date</td>
              <td class="value">${currentDate}</td>
            </tr>
          </table>

          <a href="${dashboardUrl}" class="btn">View in Admin Dashboard</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} PizzaHub Enterprise ERP System. Automated Stock Monitor Service.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    email: adminEmail,
    subject,
    message: textMessage,
    html: htmlMessage,
  });
};
