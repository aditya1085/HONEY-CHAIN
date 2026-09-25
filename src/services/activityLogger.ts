import { collection, doc, setDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { ActivityLog, UserRole } from '../types';

const LOCAL_STORAGE_KEY = 'hc_activity_logs';

/**
 * Retrieve locally stored activity logs
 */
export function getLocalActivityLogs(): ActivityLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Store an activity log locally in localStorage
 */
function saveLocalActivityLog(entry: ActivityLog) {
  try {
    const existing = getLocalActivityLogs();
    const updated = [entry, ...existing.filter((e) => e.id !== entry.id)].slice(0, 200);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    // Dispatch event for UI listeners (e.g. ActivityLogViewer)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hc:activity_logged', { detail: entry }));
    }
  } catch (err) {
    console.warn('Could not cache activity log locally:', err);
  }
}

/**
 * Log an event to the append-only /activityLogs collection
 * Non-blocking: will never crash the calling workflow if Firestore write permissions are restricted.
 */
export async function logActivity(params: {
  action: string;
  entityType: ActivityLog['entityType'];
  entityId: string;
  details: string;
  actorRole?: UserRole | 'SYSTEM';
}): Promise<string> {
  const currentAuth = auth?.currentUser;
  const logId = `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const logRef = doc(db, 'activityLogs', logId);

  const logEntry: ActivityLog = {
    id: logId,
    actorId: currentAuth?.uid || 'SYSTEM',
    actorRole: params.actorRole || 'SYSTEM',
    actorEmail: currentAuth?.email || 'system@honeychain.local',
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    details: params.details,
    timestamp: new Date().toISOString(),
  };

  // Always cache locally first so user and admin audit trails are immediate
  saveLocalActivityLog(logEntry);

  // Send to server in background
  try {
    fetch('/api/activity-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry),
    }).catch(() => {});
  } catch {}

  // Attempt Firestore write
  try {
    await setDoc(logRef, logEntry);
  } catch (err) {
    // Graceful fallback: do NOT crash caller with handleFirestoreError for secondary audit logs
    console.warn(`[ActivityLogger] Direct Firestore write note (${logId}):`, err);
  }

  return logId;
}

/**
 * Fetch recent activity logs (merges Firestore and local cached logs)
 */
export async function getRecentActivityLogs(maxItems = 50): Promise<ActivityLog[]> {
  const localLogs = getLocalActivityLogs();
  try {
    const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(maxItems));
    const snapshot = await getDocs(q);
    const firestoreLogs: ActivityLog[] = [];
    snapshot.forEach((docSnap) => {
      firestoreLogs.push(docSnap.data() as ActivityLog);
    });

    // Merge unique logs
    const map = new Map<string, ActivityLog>();
    firestoreLogs.forEach((l) => map.set(l.id, l));
    localLogs.forEach((l) => map.set(l.id, l));

    const combined = Array.from(map.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return combined.slice(0, maxItems);
  } catch (err) {
    console.warn('Could not query Firestore activityLogs, using local audit cache:', err);
    return localLogs.slice(0, maxItems);
  }
}
