// Standalone script to seed production baseline data into honeychain-production
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const config = require('../firebase-applet-config.json');

console.log('--- Honey Chain Production Baseline Seeder ---');
console.log('Target Project:', config.projectId);

const app = initializeApp(config);
const db = getFirestore(app);
const timestamp = new Date().toISOString();

async function runSeed() {
  try {
    console.log('1. Seeding atomic sequence counters...');
    const counters = [
      { id: 'beekeepers', current: 1000 },
      { id: 'hives', current: 1000 },
      { id: 'harvests', current: 1000 },
      { id: 'batches', current: 1000 },
      { id: 'jars', current: 1000 },
      { id: 'iot_nodes', current: 100 },
    ];
    for (const c of counters) {
      await setDoc(doc(db, 'counters', c.id), { current: c.current }, { merge: true });
      console.log(`   - counters/${c.id}: ${c.current}`);
    }

    console.log('2. Seeding species thresholds...');
    const species = [
      {
        id: 'Apis cerana indica',
        colonyType: 'Apis cerana indica (Indian Bee)',
        tempMin: 32,
        tempMax: 36,
        humidityMin: 55,
        humidityMax: 70,
        description: 'Indigenous Indian cavity-nesting bee.',
        updatedAt: timestamp,
      },
      {
        id: 'Apis mellifera',
        colonyType: 'Apis mellifera (Italian Bee)',
        tempMin: 33,
        tempMax: 36,
        humidityMin: 50,
        humidityMax: 65,
        description: 'Commercial European honeybee with high honey yield.',
        updatedAt: timestamp,
      },
      {
        id: 'Apis dorsata',
        colonyType: 'Apis dorsata (Giant Rock Bee)',
        tempMin: 30,
        tempMax: 38,
        humidityMin: 45,
        humidityMax: 80,
        description: 'Wild cliff and high tree nesting giant bee.',
        updatedAt: timestamp,
      },
      {
        id: 'Apis florea',
        colonyType: 'Apis florea (Little Bee)',
        tempMin: 31,
        tempMax: 37,
        humidityMin: 50,
        humidityMax: 75,
        description: 'Small wild bush-dwelling bee producing delicate honey.',
        updatedAt: timestamp,
      },
      {
        id: 'Tetragonula iridipennis',
        colonyType: 'Tetragonula iridipennis (Stingless Bee / Dammer Bee)',
        tempMin: 28,
        tempMax: 35,
        humidityMin: 60,
        humidityMax: 85,
        description: 'Medicinal Cheruthen stingless bee.',
        updatedAt: timestamp,
      },
    ];
    for (const s of species) {
      await setDoc(doc(db, 'speciesThresholds', s.id), s, { merge: true });
      console.log(`   - speciesThresholds/${s.id}`);
    }

    console.log('3. Seeding platform settings...');
    await setDoc(doc(db, 'settings', 'platform_config'), {
      beekeeperPayoutPct: 88,
      platformFeePct: 12,
      fssaiMaxMoisture: 20.0,
      fssaiMaxHmf: 80.0,
      fssaiMinFgRatio: 1.0,
      iotMinTemp: 32.0,
      iotMaxTemp: 36.5,
      iotMinHumidity: 55.0,
      iotMaxHumidity: 70.0,
      paymentMode: 'TEST_GATEWAY',
      maintenanceMode: false,
      updatedAt: timestamp,
    }, { merge: true });
    console.log('   - settings/platform_config (88/12 payout)');

    console.log('4. Seeding accredited testing labs...');
    const labs = [
      {
        id: 'LAB_CBRTI_PUNE',
        userId: 'lab_cbrti_user',
        labName: 'Central Bee Research & Training Institute (CBRTI) National Lab',
        accreditationNo: 'NABL-TC-0841 • FSSAI-REF-01',
        contactPerson: 'Dr. Ramesh K. Sharma',
        email: 'cbrti.testing@honeychain.gov.in',
        phone: '+91 20 2565 1204',
        state: 'MH',
        district: 'Pune',
        status: 'approved',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: 'LAB_APEX_LUCKNOW',
        userId: 'lab_apex_user',
        labName: 'Apex Regional Honey Quality & Residue Testing Lab',
        accreditationNo: 'NABL-TC-1120 • FSSAI-UP-44',
        contactPerson: 'Dr. Sunita Verma',
        email: 'apex.lab@honeychain.org',
        phone: '+91 522 239 8812',
        state: 'UP',
        district: 'Lucknow',
        status: 'approved',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: 'LAB_NBB_DELHI',
        userId: 'lab_nbb_user',
        labName: 'National Bee Board Honey Traceability Center of Excellence',
        accreditationNo: 'NABL-TC-0992 • MOA-NBB-09',
        contactPerson: 'Er. Alok Tripathi',
        email: 'nbb.quality@honeychain.gov.in',
        phone: '+91 11 2338 5590',
        state: 'DL',
        district: 'New Delhi',
        status: 'approved',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ];
    for (const l of labs) {
      await setDoc(doc(db, 'labs', l.id), l, { merge: true });
      console.log(`   - labs/${l.id}`);
    }

    console.log('5. Seeding probe...');
    await setDoc(doc(db, 'test', 'probe'), {
      status: 'active',
      platform: 'Honey Chain',
      verifiedAt: timestamp,
    }, { merge: true });
    console.log('   - test/probe');

    console.log('✅ Baseline seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.code, err.message);
    console.log('\nNOTE: If you received "permission-denied", make sure you have pasted the firestore.rules into your Firebase Console:');
    console.log('https://console.firebase.google.com/project/' + config.projectId + '/firestore/rules');
    process.exit(1);
  }
}

runSeed();
