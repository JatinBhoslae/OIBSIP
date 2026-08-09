/**
 * Generates clean HTML template for printable / downloadable invoice.
 */
export const generateInvoiceHTML = (order) => {
  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const itemsRows = order.items
    .map(
      (item, idx) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #334155; text-align: center; color: #94a3b8;">${idx + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #334155;">
        <strong style="color: #f8fafc;">${item.name}</strong> (${item.size})
        ${
          item.isCustom && item.customization
            ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 3px;">
                Base: ${item.customization.base || 'Standard'} | Sauce: ${item.customization.sauce || 'Standard'} | Cheese: ${item.customization.cheese || 'Mozzarella'}
              </div>`
            : ''
        }
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #334155; text-align: center; color: #cbd5e1;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #334155; text-align: right; color: #cbd5e1;">₹${item.price}</td>
      <td style="padding: 10px; border-bottom: 1px solid #334155; text-align: right; font-weight: bold; color: #f8fafc;">₹${item.price * item.quantity}</td>
    </tr>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice #${order.invoiceNumber || order.orderNumber}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 30px; }
        .invoice-card { max-width: 800px; margin: auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 35px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .brand-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ff5e36; padding-bottom: 20px; margin-bottom: 25px; }
        .logo { font-size: 26px; font-weight: 900; color: #ff5e36; letter-spacing: -0.5px; }
        .sub-logo { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; }
        .inv-details { text-align: right; }
        .inv-details h2 { margin: 0; font-size: 20px; color: #f8fafc; }
        .inv-details p { margin: 3px 0 0 0; font-size: 12px; color: #94a3b8; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .meta-box { background-color: #0f172a; padding: 15px 20px; border-radius: 10px; border: 1px solid #334155; }
        .meta-box h4 { margin: 0 0 8px 0; font-size: 12px; color: #ff5e36; text-transform: uppercase; letter-spacing: 1px; }
        .meta-box p { margin: 2px 0; font-size: 13px; color: #cbd5e1; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        .table th { background-color: #0f172a; color: #94a3b8; font-size: 11px; text-transform: uppercase; padding: 10px; border-bottom: 1px solid #334155; }
        .totals-table { width: 300px; margin-left: auto; border-collapse: collapse; }
        .totals-table td { padding: 6px 10px; font-size: 13px; color: #cbd5e1; }
        .totals-table tr.grand { font-size: 16px; font-weight: bold; color: #ff5e36; border-top: 2px solid #334155; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #334155; font-size: 12px; color: #64748b; }
        @media print {
          body { background: white; color: black; padding: 0; }
          .invoice-card { border: none; box-shadow: none; background: white; color: black; }
          .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; }
          .meta-box p, td { color: black !important; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="brand-header">
          <div>
            <div class="logo">🍕 PizzaHub ERP</div>
            <div class="sub-logo">Official Tax Invoice</div>
          </div>
          <div class="inv-details">
            <h2>INVOICE</h2>
            <p><strong>#${order.invoiceNumber || order.orderNumber}</strong></p>
            <p>Date: ${formattedDate}</p>
            <p>Tracking Code: <strong>${order.trackingCode || 'TRK-ORDER'}</strong></p>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-box">
            <h4>Billed From</h4>
            <p><strong>PizzaHub Corporate Store #01</strong></p>
            <p>GSTIN: 27AAAAA0000A1Z5</p>
            <p>123 Pizza Street, Food District</p>
            <p>Support: support@pizzahub.com</p>
          </div>
          <div class="meta-box">
            <h4>Billed To</h4>
            <p><strong>${order.user?.name || 'Customer'}</strong></p>
            <p>Phone: ${order.phone || 'N/A'}</p>
            <p>Email: ${order.user?.email || 'N/A'}</p>
            <p>Address: ${order.shippingAddress?.street}, ${order.shippingAddress?.city} - ${order.shippingAddress?.zipCode}</p>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th style="text-align: left;">Item Description</th>
              <th style="width: 70px;">Qty</th>
              <th style="width: 100px; text-align: right;">Unit Price</th>
              <th style="width: 110px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <table class="totals-table">
          <tr>
            <td>Subtotal:</td>
            <td style="text-align: right;">₹${order.totalAmount}</td>
          </tr>
          ${
            order.discountAmount > 0
              ? `<tr>
                  <td style="color: #22c55e;">Discount (${order.couponCode || 'Promo'}):</td>
                  <td style="text-align: right; color: #22c55e;">-₹${order.discountAmount}</td>
                </tr>`
              : ''
          }
          <tr>
            <td>GST (5%):</td>
            <td style="text-align: right;">₹${order.gst}</td>
          </tr>
          <tr>
            <td>Delivery Fee:</td>
            <td style="text-align: right;">${order.deliveryCharges === 0 ? 'FREE' : `₹${order.deliveryCharges}`}</td>
          </tr>
          <tr class="grand">
            <td>Grand Total:</td>
            <td style="text-align: right;">₹${order.grandTotal}</td>
          </tr>
        </table>

        <div style="margin-top: 25px; padding: 12px; background-color: #0f172a; border-radius: 8px; border: 1px solid #334155; font-size: 12px; color: #94a3b8; display: flex; justify-content: space-between; align-items: center;">
          <span>Payment Method: <strong style="color: #f8fafc;">${order.paymentMethod || 'Razorpay'}</strong></span>
          <span>Payment Status: <strong style="color: #22c55e; text-transform: uppercase;">${order.paymentStatus}</strong></span>
          <span>Payment ID: <strong style="color: #cbd5e1;">${order.paymentId || 'Simulated'}</strong></span>
        </div>

        <div class="footer">
          <p>Thank you for ordering with PizzaHub! For support, email support@pizzahub.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
