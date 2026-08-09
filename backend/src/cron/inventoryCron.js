import cron from 'node-cron';
import { runInventoryMonitor } from '../services/InventoryMonitorService.js';

const setupInventoryCron = () => {
  // Determine environment: 5 min for development, 1 hour for production
  const isDev = process.env.NODE_ENV !== 'production';
  const schedulePattern = isDev ? '*/5 * * * *' : '0 * * * *';

  console.log(
    `[CRON INIT] Registering Inventory Monitor Cron (${isDev ? 'Development: every 5 mins' : 'Production: every 1 hour'})`
  );

  cron.schedule(schedulePattern, async () => {
    console.log(`[CRON TICK] Starting automated inventory scan at ${new Date().toISOString()}`);
    try {
      await runInventoryMonitor();
    } catch (error) {
      console.error('[CRON FAILURE] Inventory scan failed:', error.message);
    }
  });

  // Run an initial scan 10 seconds after server startup
  setTimeout(() => {
    console.log('[CRON STARTUP] Running initial inventory scan...');
    runInventoryMonitor().catch((err) =>
      console.error('[CRON STARTUP ERROR] Initial scan failed:', err.message)
    );
  }, 10000);
};

export default setupInventoryCron;
