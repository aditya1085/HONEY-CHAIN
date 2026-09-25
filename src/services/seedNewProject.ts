import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { seedPhase3Data } from './seedPhase3';
import { seedPhase4Data } from './seedPhase4';

export const INITIAL_SPECIES_THRESHOLDS = [
  {
    id: 'Apis cerana indica',
    colonyType: 'Apis cerana indica (Indian Bee)',
    tempMin: 32,
    tempMax: 36,
    humidityMin: 55,
    humidityMax: 70,
    description: 'Indigenous Indian cavity-nesting bee. Highly resilient to regional climates and Varroa mites.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'Apis mellifera',
    colonyType: 'Apis mellifera (Italian Bee)',
    tempMin: 33,
    tempMax: 36,
    humidityMin: 50,
    humidityMax: 65,
    description: 'Commercial European honeybee with high honey yield. Requires tight temperature regulation in brood nest.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'Apis dorsata',
    colonyType: 'Apis dorsata (Giant Rock Bee)',
    tempMin: 30,
    tempMax: 38,
    humidityMin: 45,
    humidityMax: 80,
    description: 'Wild cliff and high tree nesting giant bee. Important for forest wild honey harvesting.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'Apis florea',
    colonyType: 'Apis florea (Little Bee)',
    tempMin: 31,
    tempMax: 37,
    humidityMin: 50,
    humidityMax: 75,
    description: 'Small wild bush-dwelling bee producing delicate, highly medicinal honey.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'Tetragonula iridipennis',
    colonyType: 'Tetragonula iridipennis (Stingless Bee / Dammer Bee)',
    tempMin: 28,
    tempMax: 35,
    humidityMin: 60,
    humidityMax: 85,
    description: 'Medicinal Cheruthen stingless bee. Produces rare antioxidant-rich propolis honey.',
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_PLATFORM_CONFIG = {
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
  updatedAt: new Date().toISOString(),
};

export const INITIAL_COUNTERS = [
  { id: 'beekeepers', current: 1000 },
  { id: 'hives', current: 1000 },
  { id: 'harvests', current: 1000 },
  { id: 'batches', current: 1000 },
  { id: 'jars', current: 1000 },
  { id: 'iot_nodes', current: 100 },
];

/**
 * Seed all baseline production collections into the active Firebase Firestore database
 */
export async function seedProductionDatabase(): Promise<{ success: boolean; message: string; details?: string[] }> {
  const details: string[] = [];
  try {
    // 1. Seed Atomic Sequence Counters
    for (const counter of INITIAL_COUNTERS) {
      await setDoc(doc(db, 'counters', counter.id), { current: counter.current }, { merge: true });
      details.push(`Counter seeded: counters/${counter.id} (start: ${counter.current})`);
    }

    // 2. Seed Species Thresholds
    for (const species of INITIAL_SPECIES_THRESHOLDS) {
      await setDoc(doc(db, 'speciesThresholds', species.id), species, { merge: true });
      details.push(`Threshold seeded: speciesThresholds/${species.id}`);
    }

    // 3. Seed Platform Config
    await setDoc(doc(db, 'settings', 'platform_config'), INITIAL_PLATFORM_CONFIG, { merge: true });
    details.push('Platform settings seeded: settings/platform_config');

    // 4. Seed Testing Probe
    await setDoc(doc(db, 'test', 'probe'), {
      status: 'active',
      platform: 'Honey Chain',
      verifiedAt: new Date().toISOString(),
    }, { merge: true });
    details.push('Probe document seeded: test/probe');

    // 5. Seed Labs and Sample Harvests / Batches
    await seedPhase3Data();
    details.push('Accredited NABL Labs seeded: LAB_CBRTI_PUNE, LAB_APEX_LUCKNOW, LAB_NBB_DELHI');

    // 6. Seed Marketplace Listings
    await seedPhase4Data();
    details.push('Marketplace sample listings and batches seeded.');

    return {
      success: true,
      message: 'Successfully seeded all production baseline collections!',
      details,
    };
  } catch (err: any) {
    console.error('Error seeding production database:', err);
    return {
      success: false,
      message: err?.message || 'Failed to seed production database',
      details,
    };
  }
}
