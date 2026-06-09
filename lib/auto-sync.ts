import { syncSupabaseToMysql } from '@/lib/sync-mysql';
import { createAdminClient } from '@/lib/supabase-server';

let intervalHandle: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

function getIntervalMinutes(): number {
  const env = process.env.SYNC_INTERVAL_MINUTES;
  const val = env ? parseInt(env, 10) : NaN;
  return !isNaN(val) && val > 0 ? val : 5;
}

async function logServerEvent(level: string, source: string, message: string, metadata?: Record<string, unknown>) {
  try {
    const supabase = createAdminClient();
    await supabase.from('server_logs').insert({
      level,
      source,
      message,
      metadata: metadata || null,
    });
  } catch {
    // silently ignore logging errors
  }
}

export async function runSyncOnce() {
  if (isRunning) return { success: false, message: 'Sync already in progress' };
  isRunning = true;
  try {
    const result = await syncSupabaseToMysql();
    await logServerEvent('info', 'auto-sync', result.message, {
      membersCount: result.membersCount,
      zonesCount: result.zonesCount,
      checkInsCount: result.checkInsCount,
    });
    return result;
  } catch (error: any) {
    const msg = error.message || 'Auto-sync failed';
    await logServerEvent('error', 'auto-sync', msg, { error: String(error) });
    return { success: false, message: msg };
  } finally {
    isRunning = false;
  }
}

export function startAutoSync() {
  if (process.env.NODE_ENV !== 'development') {
    console.log('[auto-sync] Skipping: only runs in development mode');
    return;
  }

  if (intervalHandle) {
    console.log('[auto-sync] Already running');
    return;
  }

  const intervalMin = getIntervalMinutes();

  runSyncOnce().then((result) => {
    console.log(`[auto-sync] Initial sync: ${result.message}`);
  });

  intervalHandle = setInterval(() => {
    runSyncOnce().then((result) => {
      console.log(`[auto-sync] Periodic sync: ${result.message}`);
    });
  }, intervalMin * 60 * 1000);

  console.log(`[auto-sync] Started: syncing every ${intervalMin} minute(s)`);
}

export function stopAutoSync() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log('[auto-sync] Stopped');
  }
}
