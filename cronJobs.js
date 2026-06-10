const cron = require("node-cron");
const Note = require("./models/Note");

const autoCleanTrash = () => {
  // runs every day at midnight
  cron.schedule("0 0 * * *", async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await Note.deleteMany({
      isDeleted: true,
      deletedAt: { $lte: thirtyDaysAgo },
    });

    console.log(
      `Auto-cleanup: ${result.deletedCount} notes permanently deleted`,
    );
  });
};

module.exports = autoCleanTrash;
