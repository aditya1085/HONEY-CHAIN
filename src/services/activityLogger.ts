import { collection, doc, setDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { ActivityLog, UserRole } from '../types';

/**
 * Log an event to the append-only /activityLogs collection
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

  try {
    await setDoc(logRef, logEntry);
    return logId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `activityLogs/${logId}`);
  }
}

/**
 * Fetch recent activity logs
 */
export async function getRecentActivityLogs(maxItems = 30): Promise<ActivityLog[]> {
  try {
    const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(maxItems));
    const snapshot = await getDocs(q);
    const logs: ActivityLog[] = [];
    snapshot.forEach((docSnap) => {
      logs.push(docSnap.data() as ActivityLog);
    });
    return logs;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'activityLogs');
  }
}
