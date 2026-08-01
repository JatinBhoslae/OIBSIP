import cron from 'node-cron';
import Ingredient from '../models/Ingredient.js';
import sendEmail from '../utils/nodemailer.js';

const setupInventoryCron = () => {
  // Run inventory check every day at 9:00 AM (0 9 * * *)
  cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Running daily inventory checks...');
    try {
      const lowStockItems = await Ingredient.find({
        $expr: { $lte: ['$quantity', '$threshold'] },
      });

      if (lowStockItems.length > 0) {
        const itemDetails = lowStockItems
          .map((item) => `- ${item.name}: Current Stock ${item.quantity} ${item.unit} (Threshold: ${item.threshold})`)
          .join('\n');

        const adminEmail = process.env.SMTP_USER || 'admin@pizzahub.com';
        await sendEmail({
          email: adminEmail,
          subject: '[PizzaHub CRON] Daily Low Stock Report',
          message: `Dear Admin,\n\nThe following ingredients are low in stock:\n\n${itemDetails}\n\nPlease restock them as soon as possible.\n\nRegards,\nPizzaHub System`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #ff5e36;">Daily Low Stock Report</h2>
              <p>The following items have crossed their minimum threshold levels:</p>
              <ul>
                ${lowStockItems
                  .map(
                    (item) =>
                      `<li><strong>${item.name}</strong>: ${item.quantity} ${item.unit} remaining (Threshold: ${item.threshold})</li>`
                  )
                  .join('')}
              </ul>
              <p>Please log in to the admin panel to update quantities.</p>
            </div>
          `,
        });
        console.log('[CRON] Low stock report email sent.');
      } else {
        console.log('[CRON] All stock levels are normal.');
      }
    } catch (error) {
      console.error('[CRON ERROR] Failed checking inventory:', error.message);
    }
  });
};

export default setupInventoryCron;
