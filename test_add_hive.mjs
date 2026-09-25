import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, runTransaction } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  console.log('--- Testing Firestore Connection & Add Hive pipeline ---');

  // Test 1: Counter Transaction
  console.log('1. Testing generateHiveId counter transaction...');
  const bkId = 'BK-1001';
  const stateCode = 'PB';
  const counterKey = `hives_${bkId}`;
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
      const hiveId = `HC-${stateCode}-${bkId}-H${String(nextSeq).padStart(2, '0')}`;
      return { hiveId, seq: nextSeq };
    });
    console.log('Counter transaction SUCCESS:', result);
  } catch (err) {
    console.error('Counter transaction FAILED:', err);
  }

  // Test 2: Hives write
  console.log('2. Testing Hives doc setDoc...');
  const testHiveId = `HC-${stateCode}-${bkId}-H99`;
  const docId = `HIVE_${testHiveId.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const hiveData = {
    id: docId,
    hiveId: testHiveId,
    beekeeperId: bkId,
    hiveType: 'Langstroth',
    colonyType: 'Apis mellifera',
    area: 'Mustard Belt',
    landType: 'Farmland',
    lat: 31.5273,
    lng: 75.9142,
    address: 'Hoshiarpur, Punjab',
    setupDate: '2026-09-25',
    registrationDate: new Date().toISOString(),
    expectedProduction: 20,
    status: 'active',
    approvalStatus: 'approved',
    isSample: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'hives', docId), hiveData);
    console.log('Hives setDoc SUCCESS:', docId);
  } catch (err) {
    console.error('Hives setDoc FAILED:', err);
  }

  // Test 3: Ledger record write
  console.log('3. Testing ledger record...');
  const ledgerId = `BLK_TEST_${Date.now()}`;
  try {
    await setDoc(doc(db, 'ledgerRecords', ledgerId), {
      index: 9999,
      timestamp: new Date().toISOString(),
      action: 'HIVE_REGISTERED',
      entityId: testHiveId,
      dataHash: 'hash123',
      previousHash: 'hash000',
      blockHash: 'hash999',
      isSample: false,
    });
    console.log('Ledger setDoc SUCCESS:', ledgerId);
  } catch (err) {
    console.error('Ledger setDoc FAILED:', err);
  }

  // Test 4: Activity log write
  console.log('4. Testing activity log write...');
  const logId = `LOG_TEST_${Date.now()}`;
  try {
    await setDoc(doc(db, 'activityLogs', logId), {
      id: logId,
      actorId: 'TEST_USER',
      actorRole: 'BEEKEEPER',
      actorEmail: 'test@honeychain.in',
      action: 'HIVE_REGISTERED',
      entityType: 'HIVE',
      entityId: testHiveId,
      details: 'Test hive registration',
      timestamp: new Date().toISOString(),
    });
    console.log('Activity log setDoc SUCCESS:', logId);
  } catch (err) {
    console.error('Activity log setDoc FAILED:', err);
  }

  process.exit(0);
}

test().catch(e => {
  console.error('Test script crashed:', e);
  process.exit(1);
});
