import cron from 'node-cron';
import { scoreboardJob } from './jobs/scoreboard.js';

const SYNC_CRON = process.env.SYNC_CRON ?? '0 */2 * * * *';

console.log('[sync] Starting with cron schedule:', SYNC_CRON);

cron.schedule(SYNC_CRON, scoreboardJob);
