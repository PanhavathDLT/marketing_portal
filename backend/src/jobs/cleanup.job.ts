// Background jobs — register each job in src/index.ts
// Add scheduled tasks here (e.g. expired-token cleanup, points expiry)

// Example structure:
// export function schedulePointsExpiry() {
//   if (env.ENABLE_POINTS_EXPIRY_JOB !== 'true') return;
//   cron.schedule('0 2 * * *', async () => { ... });
// }
