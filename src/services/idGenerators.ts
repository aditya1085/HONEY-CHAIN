import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Format current date to YYMM (e.g., September 2026 -> 2609)
 */
export function getYYMM(): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yy}${mm}`;
}

/**
 * Clean and standardize 2-letter state code
 */
export function standardizeStateCode(stateInput: string): string {
  if (!stateInput) return 'IN';
  const clean = stateInput.trim().toUpperCase();
  if (clean.length === 2) return clean;
  // Common state mappings
  const map: Record<string, string> = {
    'UTTAR PRADESH': 'UP',
    'MAHARASHTRA': 'MH',
    'KARNATAKA': 'KA',
    'PUNJAB': 'PB',
    'HARYANA': 'HR',
    'MADHYA PRADESH': 'MP',
    'GUJARAT': 'GJ',
    'RAJASTHAN': 'RJ',
    'TAMIL NADU': 'TN',
    'KERALA': 'KL',
    'HIMACHAL PRADESH': 'HP',
    'UTTARAKHAND': 'UK',
    'WEST BENGAL': 'WB',
    'BIHAR': 'BR',
    'ASSAM': 'AS',
  };
  return map[clean] || clean.slice(0, 2);
}

/**
 * Local sequence generator fallback
 */
function getNextLocalSequence(key: string, step = 1): number {
  try {
    const fullKey = `hc_seq_${key}`;
    const cur = parseInt(localStorage.getItem(fullKey) || '0', 10);
    const next = isNaN(cur) ? step : cur + step;
    localStorage.setItem(fullKey, String(next));
    return next;
  } catch {
    return Math.floor(step + Math.random() * 99);
  }
}

/**
 * Generate Beekeeper ID: `B` + zero-padded counter (e.g. B001, B045)
 * Executed atomically in a Firestore transaction upon Admin approval, with local fallback.
 */
export async function generateBeekeeperId(): Promise<{ beekeeperId: string; seq: number }> {
  const counterRef = doc(db, 'counters', 'beekeepers');

  try {
    const result = await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      let nextSeq = 1;
      if (counterSnap.exists()) {
        const current = counterSnap.data().current;
        nextSeq = typeof current === 'number' ? current + 1 : 1;
      }
      transaction.set(counterRef, {
        current: nextSeq,
        updatedAt: new Date().toISOString(),
      });
      const beekeeperId = `B${String(nextSeq).padStart(3, '0')}`;
      return { beekeeperId, seq: nextSeq };
    });
    return result;
  } catch (err) {
    console.warn('Counter transaction notice for beekeepers, using local generator:', err);
    const nextSeq = getNextLocalSequence('beekeepers');
    return { beekeeperId: `B${String(nextSeq).padStart(3, '0')}`, seq: nextSeq };
  }
}

/**
 * Generate Hive ID: `HC-[State]-[BeekeeperID]-H[Seq]` e.g. HC-UP-B045-H01
 * Uses an atomic per-beekeeper counter. Immutable.
 */
export async function generateHiveId(stateName: string, beekeeperId: string): Promise<{ hiveId: string; seq: number }> {
  const stateCode = standardizeStateCode(stateName);
  const counterKey = `hives_${beekeeperId}`;
  const counterRef = doc(db, 'counters', counterKey);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      let nextSeq = 1;
      if (counterSnap.exists()) {
        const current = counterSnap.data().current;
        nextSeq = typeof current === 'number' ? current + 1 : 1;
      }
      transaction.set(counterRef, {
        current: nextSeq,
        updatedAt: new Date().toISOString(),
      });
      const hiveId = `HC-${stateCode}-${beekeeperId}-H${String(nextSeq).padStart(2, '0')}`;
      return { hiveId, seq: nextSeq };
    });
    return result;
  } catch (err) {
    console.warn(`Counter transaction notice for ${counterKey}, using local generator:`, err);
    const nextSeq = getNextLocalSequence(counterKey);
    return { hiveId: `HC-${stateCode}-${beekeeperId}-H${String(nextSeq).padStart(2, '0')}`, seq: nextSeq };
  }
}

/**
 * Generate Batch ID: `HB-[YYMM]-[State]-[Seq]` e.g. HB-2609-UP-0012
 */
export async function generateBatchId(stateName: string): Promise<{ batchId: string; seq: number }> {
  const yymm = getYYMM();
  const stateCode = standardizeStateCode(stateName);
  const counterKey = `batches_${stateCode}_${yymm}`;
  const counterRef = doc(db, 'counters', counterKey);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      let nextSeq = 1;
      if (counterSnap.exists()) {
        const current = counterSnap.data().current;
        nextSeq = typeof current === 'number' ? current + 1 : 1;
      }
      transaction.set(counterRef, {
        current: nextSeq,
        updatedAt: new Date().toISOString(),
      });
      const batchId = `HB-${yymm}-${stateCode}-${String(nextSeq).padStart(4, '0')}`;
      return { batchId, seq: nextSeq };
    });
    return result;
  } catch (err) {
    console.warn(`Counter transaction notice for ${counterKey}, using local generator:`, err);
    const nextSeq = getNextLocalSequence(counterKey);
    return { batchId: `HB-${yymm}-${stateCode}-${String(nextSeq).padStart(4, '0')}`, seq: nextSeq };
  }
}

/**
 * Bulk-generate Pack IDs for a batch: `[BatchID]-P[Seq]` e.g. HB-2609-UP-0012-P0001
 */
export async function generatePackIds(batchId: string, count: number): Promise<string[]> {
  if (count <= 0) return [];
  const counterKey = `packs_${batchId}`;
  const counterRef = doc(db, 'counters', counterKey);

  try {
    const packIds = await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      let startSeq = 1;
      if (counterSnap.exists()) {
        const current = counterSnap.data().current;
        startSeq = typeof current === 'number' ? current + 1 : 1;
      }
      const endSeq = startSeq + count - 1;
      transaction.set(counterRef, {
        current: endSeq,
        updatedAt: new Date().toISOString(),
      });
      const generated: string[] = [];
      for (let s = startSeq; s <= endSeq; s++) {
        generated.push(`${batchId}-P${String(s).padStart(4, '0')}`);
      }
      return generated;
    });
    return packIds;
  } catch (err) {
    console.warn(`Counter transaction notice for ${counterKey}, using local generator:`, err);
    const endSeq = getNextLocalSequence(counterKey, count);
    const startSeq = endSeq - count + 1;
    const generated: string[] = [];
    for (let s = startSeq; s <= endSeq; s++) {
      generated.push(`${batchId}-P${String(s).padStart(4, '0')}`);
    }
    return generated;
  }
}

/**
 * Generate Lab Sample ID: `LS-[YYMM]-[Seq]` e.g. LS-2609-0001
 */
export async function generateLabSampleId(): Promise<{ sampleId: string; seq: number }> {
  const yymm = getYYMM();
  const counterKey = `lab_samples_${yymm}`;
  const counterRef = doc(db, 'counters', counterKey);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      let nextSeq = 1;
      if (counterSnap.exists()) {
        const current = counterSnap.data().current;
        nextSeq = typeof current === 'number' ? current + 1 : 1;
      }
      transaction.set(counterRef, {
        current: nextSeq,
        updatedAt: new Date().toISOString(),
      });
      const sampleId = `LS-${yymm}-${String(nextSeq).padStart(4, '0')}`;
      return { sampleId, seq: nextSeq };
    });
    return result;
  } catch (err) {
    console.warn(`Counter transaction notice for ${counterKey}, using local generator:`, err);
    const nextSeq = getNextLocalSequence(counterKey);
    return { sampleId: `LS-${yymm}-${String(nextSeq).padStart(4, '0')}`, seq: nextSeq };
  }
}

/**
 * Generate Order ID: `HC-ORD-[YYMM]-[Seq]` e.g. HC-ORD-2609-0001
 */
export async function generateOrderId(): Promise<{ orderId: string; seq: number }> {
  const yymm = getYYMM();
  const counterKey = `orders_${yymm}`;
  const counterRef = doc(db, 'counters', counterKey);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      let nextSeq = 1;
      if (counterSnap.exists()) {
        const current = counterSnap.data().current;
        nextSeq = typeof current === 'number' ? current + 1 : 1;
      }
      transaction.set(counterRef, {
        current: nextSeq,
        updatedAt: new Date().toISOString(),
      });
      const orderId = `HC-ORD-${yymm}-${String(nextSeq).padStart(4, '0')}`;
      return { orderId, seq: nextSeq };
    });
    return result;
  } catch (err) {
    console.warn(`Counter transaction notice for ${counterKey}, using local generator:`, err);
    const nextSeq = getNextLocalSequence(counterKey);
    return { orderId: `HC-ORD-${yymm}-${String(nextSeq).padStart(4, '0')}`, seq: nextSeq };
  }
}
