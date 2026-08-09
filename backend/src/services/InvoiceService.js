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

  const formattedTime = new Date(order.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const gstAmount = order.gst || 0;
  const cgst = Math.round(gstAmount / 2);
  const sgst = gstAmount - cgst;

  const itemsRows = (order.items || [])
    .map(
      (item, idx) => {
        const unitPrice = Number(item.price) || 0;
        const qty = Number(item.quantity) || 1;
        return `
    <tr class="item-row">
      <td class="col-center text-muted">${String(idx + 1).padStart(2, '0')}</td>
      <td class="col-desc">
        <span class="item-name">${item.name || 'Pizza Item'}</span>
        <span class="item-spec">Size: ${item.size || 'Medium'}</span>
        ${
          item.isCustom && item.customization
            ? `<span class="item-custom">Base: ${item.customization.base || 'Standard'} | Sauce: ${item.customization.sauce || 'Standard'} | Cheese: ${item.customization.cheese || 'Mozzarella'}</span>`
            : ''
        }
      </td>
      <td class="col-center">${qty}</td>
      <td class="col-right">₹${unitPrice.toFixed(2)}</td>
      <td class="col-right text-bold">₹${(unitPrice * qty).toFixed(2)}</td>
    </tr>
  `;
      }
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Tax Invoice - #${order.invoiceNumber || order.orderNumber}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Courier+Prime&family=Inter:wght@300;400;600;800;900&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          background-color: #0B0F19;
          color: #E2E8F0;
          margin: 0;
          padding: 40px 20px;
          -webkit-print-color-adjust: exact;
        }

        .invoice-card {
          max-width: 800px;
          margin: 0 auto;
          background-color: #111827;
          border-radius: 24px;
          border: 1px solid #1F2937;
          padding: 40px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
          position: relative;
          overflow: hidden;
        }

        /* Branding element border */
        .invoice-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, #FF6B00 0%, #E63946 100%);
        }

        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-b: 1px solid #1F2937;
          padding-bottom: 25px;
          margin-bottom: 30px;
        }

        .logo-wrap h1 {
          margin: 0;
          font-size: 26px;
          font-weight: 900;
          background: linear-gradient(90deg, #FF6B00 0%, #FFA500 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .logo-wrap p {
          margin: 4px 0 0 0;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #9CA3AF;
          font-weight: 600;
        }

        .receipt-badge {
          text-align: right;
        }

        .receipt-badge h2 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          color: #FFF;
          letter-spacing: -0.5px;
        }

        .receipt-badge p {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: #9CA3AF;
        }

        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 30px;
        }

        .meta-card {
          background-color: #1F2937;
          border: 1px solid #374151;
          border-radius: 16px;
          padding: 20px;
        }

        .meta-card h3 {
          margin: 0 0 10px 0;
          font-size: 11px;
          font-weight: 800;
          color: #FF6B00;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }

        .meta-card p {
          margin: 3px 0;
          font-size: 12px;
          color: #D1D5DB;
          line-height: 1.4;
        }

        .table-wrap {
          margin-bottom: 30px;
        }

        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .invoice-table th {
          background-color: #1F2937;
          color: #9CA3AF;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 12px;
          border-bottom: 2px solid #374151;
        }

        .invoice-table td {
          padding: 16px 12px;
          border-bottom: 1px solid #1F2937;
          font-size: 12px;
          vertical-align: top;
        }

        .item-row:hover {
          background-color: #1F2937/20;
        }

        .col-center { text-align: center; }
        .col-right { text-align: right; }
        .col-desc { max-width: 300px; }

        .item-name {
          font-weight: 700;
          color: #FFF;
          display: block;
        }

        .item-spec {
          font-size: 10px;
          color: #9CA3AF;
          display: block;
          margin-top: 2px;
        }

        .item-custom {
          font-size: 10px;
          color: #FF6B00;
          display: block;
          margin-top: 4px;
          font-family: 'Courier Prime', monospace;
        }

        .totals-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 30px;
        }

        .barcode-box {
          text-align: left;
        }

        .barcode-mock {
          font-family: 'Courier Prime', monospace;
          background-color: #1F2937;
          border: 1px solid #374151;
          color: #FFF;
          padding: 12px;
          border-radius: 12px;
          font-size: 11px;
          letter-spacing: 3px;
          text-align: center;
          width: 200px;
        }

        .barcode-box p {
          margin: 4px 0 0 0;
          font-size: 10px;
          color: #9CA3AF;
          text-align: center;
        }

        .totals-card {
          width: 320px;
          background-color: #1F2937;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #374151;
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #D1D5DB;
          margin-bottom: 8px;
        }

        .totals-row.bold {
          font-weight: 700;
          color: #FFF;
        }

        .totals-row.grand {
          font-size: 18px;
          font-weight: 900;
          color: #FF6B00;
          border-top: 2px dashed #374151;
          padding-top: 10px;
          margin-top: 8px;
          margin-bottom: 0;
        }

        .payment-banner {
          background-color: #111827;
          border: 1px solid #1F2937;
          padding: 15px 20px;
          border-radius: 16px;
          font-size: 11px;
          color: #9CA3AF;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .payment-banner strong {
          color: #FFF;
        }

        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #1F2937;
          font-size: 10px;
          color: #6B7280;
          line-height: 1.5;
        }

        .text-muted { color: #6B7280 !important; }
        .text-bold { font-weight: 700; color: #FFF; }

        @media print {
          body {
            background-color: #FFF;
            color: #000;
            padding: 0;
          }
          .invoice-card {
            border: none;
            box-shadow: none;
            background-color: #FFF;
            color: #000;
            padding: 0;
          }
          .meta-card, .invoice-table th, .totals-card, .barcode-mock {
            background-color: #F3F4F6 !important;
            border: 1px solid #E5E7EB !important;
            color: #000 !important;
          }
          .item-name, .text-bold, .totals-row.bold, .receipt-badge h2 {
            color: #000 !important;
          }
          .totals-row.grand {
            color: #E63946 !important;
          }
          .payment-banner {
            background-color: #F9FAFB !important;
            border: 1px solid #E5E7EB !important;
            color: #374151 !important;
          }
          .payment-banner strong {
            color: #000 !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        
        <!-- Top Header -->
        <div class="header-section">
          <div class="logo-wrap">
            <h1>🍕 PizzaHub Operations</h1>
            <p>Official GST Invoice</p>
          </div>
          <div class="receipt-badge">
            <h2>TAX INVOICE</h2>
            <p><strong>#${order.invoiceNumber || order.orderNumber}</strong></p>
          </div>
        </div>

        <!-- Client Billing Info -->
        <div class="meta-grid">
          <div class="meta-card">
            <h3>Billed From</h3>
            <p><strong>PizzaHub Franchise Delhi #09</strong></p>
            <p>GSTIN: 07AABC4872X1Z0</p>
            <p>12 Connaught Place, Inner Circle</p>
            <p>New Delhi, 110001</p>
            <p>Support: delivery@pizzahub.com</p>
          </div>
          <div class="meta-card">
            <h3>Billed To</h3>
            <p><strong>${order.user?.name || 'Valued Customer'}</strong></p>
            <p>Phone: ${order.phone || 'N/A'}</p>
            <p>Date: ${formattedDate} (${formattedTime})</p>
            <p>Address: ${order.shippingAddress?.street}, ${order.shippingAddress?.city} - ${order.shippingAddress?.zipCode}</p>
          </div>
        </div>

        <!-- Item List -->
        <div class="table-wrap">
          <table class="invoice-table">
            <thead>
              <tr>
                <th style="width: 40px;" class="col-center">No</th>
                <th>Product Description</th>
                <th style="width: 60px;" class="col-center">Qty</th>
                <th style="width: 100px;" class="col-right">Rate</th>
                <th style="width: 110px;" class="col-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
        </div>

        <!-- Barcode & Totals -->
        <div class="totals-section">
          <div class="barcode-box">
            <div class="barcode-mock">
              ||| |||| | | |||| | ||
            </div>
            <p>Tracking Code: ${order.trackingCode || 'TRK-DEFAULT'}</p>
          </div>

          <div class="totals-card">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span class="text-bold">₹${(Number(order.totalAmount) || 0).toFixed(2)}</span>
            </div>
            ${
              (order.discountAmount || 0) > 0
                ? `<div class="totals-row bold" style="color: #22C55E;">
                    <span>Discount (${order.couponCode || 'Promo'}):</span>
                    <span>-₹${(Number(order.discountAmount) || 0).toFixed(2)}</span>
                  </div>`
                : ''
            }
            <div class="totals-row">
              <span>CGST (2.5%):</span>
              <span>₹${cgst.toFixed(2)}</span>
            </div>
            <div class="totals-row">
              <span>SGST (2.5%):</span>
              <span>₹${sgst.toFixed(2)}</span>
            </div>
            <div class="totals-row">
              <span>Delivery Fee:</span>
              <span>${(order.deliveryCharges || 0) === 0 ? 'FREE' : `₹${(Number(order.deliveryCharges) || 0).toFixed(2)}`}</span>
            </div>
            <div class="totals-row grand">
              <span>Grand Total:</span>
              <span>₹${(Number(order.grandTotal) || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Payment Banner details -->
        <div class="payment-banner">
          <span>Payment Gateway: <strong>${order.paymentMethod || 'Razorpay'}</strong></span>
          <span>Status: <strong style="color: #22C55E;">${(order.paymentStatus || 'pending').toUpperCase()}</strong></span>
          <span>Transaction ID: <strong>${order.paymentId || 'N/A'}</strong></span>
        </div>

        <div class="footer">
          <p>This is a computer-generated document and requires no physical signature.</p>
          <p>© 2026 PizzaHub Corp. Thank you for your order!</p>
        </div>

      </div>
    </body>
    </html>
  `;
};
