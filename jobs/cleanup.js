const cron = require('node-cron');
const User = require('../models/User');

const startUserCleanupJob = () => {
  cron.schedule('0 2 * * *', async () => {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    try {
      const result = await User.deleteMany({
        isActive: false,
        deactivatedAt: { $lte: cutoffDate }
      });

      console.log(`Auto-deletion: ${result.deletedCount} user(s) permanently deleted.`);
    } catch (err) {
      console.error('Auto-deletion error:', err);
    }
  });

  console.log('User cleanup cron job scheduled to run daily at 2:00 AM');
};

module.exports = startUserCleanupJob;
