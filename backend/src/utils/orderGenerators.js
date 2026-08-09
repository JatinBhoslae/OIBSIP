import crypto from 'crypto';
import Order from '../models/Order.js';

/**
 * Generates sequential, human-readable order number: PH202600001
 */
export const generateOrderNumber = async () => {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `PH${currentYear}`;

  // Find latest order for the current year
  const latestOrder = await Order.findOne({
    orderNumber: new RegExp(`^${yearPrefix}`),
  })
    .sort({ createdAt: -1 })
    .select('orderNumber');

  let sequence = 1;
  if (latestOrder && latestOrder.orderNumber) {
    const numPart = latestOrder.orderNumber.replace(yearPrefix, '');
    const parsed = parseInt(numPart, 10);
    if (!isNaN(parsed)) {
      sequence = parsed + 1;
    }
  }

  // Format as PH202600001
  const paddedSequence = sequence.toString().padStart(5, '0');
  return `${yearPrefix}${paddedSequence}`;
};

/**
 * Generates unique tracking code: TRK-A9F5KD83
 */
export const generateTrackingCode = () => {
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TRK-${randomHex}`;
};

/**
 * Generates sequential invoice number: INV-2026-00001
 */
export const generateInvoiceNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  const latestOrder = await Order.findOne({
    invoiceNumber: new RegExp(`^${prefix}`),
  })
    .sort({ createdAt: -1 })
    .select('invoiceNumber');

  let sequence = 1;
  if (latestOrder && latestOrder.invoiceNumber) {
    const numPart = latestOrder.invoiceNumber.replace(prefix, '');
    const parsed = parseInt(numPart, 10);
    if (!isNaN(parsed)) {
      sequence = parsed + 1;
    }
  }

  const paddedSequence = sequence.toString().padStart(5, '0');
  return `${prefix}${paddedSequence}`;
};
