import Ingredient from '../models/Ingredient.js';
import { createNotificationService } from './NotificationService.js';
import { sendLowStockEmail } from './EmailService.js';
import { getIO } from '../utils/socket.js';

/**
 * Enterprise Inventory Monitoring Engine.
 * Scans inventory, evaluates threshold criteria, triggers notifications & emails, and detects restocked items.
 */
export const runInventoryMonitor = async () => {
  console.log('[INVENTORY MONITOR] Starting stock check execution...');
  let alertsTriggered = 0;
  let alertsSkipped = 0;

  try {
    const ingredients = await Ingredient.find({ isAvailable: true });

    for (const item of ingredients) {
      const minStock = item.minimumStock || item.threshold || 10;
      const currentStock = item.quantity;

      if (currentStock <= minStock) {
        const isOutOfStock = currentStock === 0;
        const type = isOutOfStock ? 'OUT_OF_STOCK' : 'LOW_STOCK';
        const priority = isOutOfStock ? 'CRITICAL' : currentStock <= minStock / 2 ? 'HIGH' : 'MEDIUM';

        const title = isOutOfStock
          ? `[OUT OF STOCK] ${item.name}`
          : `[LOW STOCK] ${item.name}`;

        const message = isOutOfStock
          ? `Ingredient '${item.name}' is completely OUT OF STOCK! Production may be halted.`
          : `Stock for '${item.name}' has dropped to ${currentStock} ${item.unit} (Minimum threshold: ${minStock} ${item.unit}).`;

        // Attempt to create notification (includes 24-hr de-duplication check)
        const notification = await createNotificationService({
          ingredient: item._id,
          type,
          priority,
          currentStock,
          minimumStock: minStock,
          title,
          message,
        });

        if (notification) {
          alertsTriggered++;
          console.log(`[INVENTORY MONITOR] Alert generated for ${item.name} (${type})`);

          // Send HTML Email Alert asynchronously
          sendLowStockEmail({
            ingredientName: item.name,
            category: item.category,
            currentStock,
            minimumStock: minStock,
            unit: item.unit,
            status: isOutOfStock ? 'Out Of Stock' : 'Low Stock',
          })
            .then((sent) => {
              notification.emailStatus = sent ? 'sent' : 'failed';
              notification.save().catch((err) => console.error('Failed to update email status:', err));
            })
            .catch((err) => console.error('Email error:', err));
        } else {
          alertsSkipped++;
        }
      } else {
        // Restock Flow: Item is above minimum stock
        // Broadcast restock event via socket if previously low
        const io = getIO();
        if (io) {
          io.to('admin-room').emit('inventoryRestocked', {
            ingredientId: item._id,
            name: item.name,
            currentStock,
          });
        }
      }
    }

    console.log(
      `[INVENTORY MONITOR] Check finished. Alerts Generated: ${alertsTriggered}, Duplicates Skipped: ${alertsSkipped}`
    );

    return { alertsTriggered, alertsSkipped };
  } catch (error) {
    console.error('[INVENTORY MONITOR ERROR] Execution failed:', error.message);
    throw error;
  }
};
