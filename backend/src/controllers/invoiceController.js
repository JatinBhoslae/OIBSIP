import Order from '../models/Order.js';
import { generateInvoiceHTML } from '../services/InvoiceService.js';

/**
 * GET /api/orders/:id/invoice
 */
export const getOrderInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Security check: Customer can only view their own order invoice unless admin
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this invoice' });
    }

    const htmlContent = generateInvoiceHTML(order);

    if (req.query.format === 'html' || req.query.print === 'true') {
      res.setHeader('Content-Type', 'text/html');
      return res.send(htmlContent);
    }

    return res.status(200).json({
      success: true,
      invoiceNumber: order.invoiceNumber || order.orderNumber,
      orderNumber: order.orderNumber,
      trackingCode: order.trackingCode,
      htmlContent,
      order,
    });
  } catch (error) {
    next(error);
  }
};
