import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { LabProfile, HarvestRecord, BatchRecord } from '../types';
import { recordLedgerBlock } from './blockchainService';

export const SEEDED_LABS: LabProfile[] = [
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
    address: '1153 Ganeshkhind Road, Shivajinagar, Pune, Maharashtra 411016',
    status: 'approved',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
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
    address: 'Sector 14, Ring Road Vikas Nagar, Lucknow, Uttar Pradesh 226022',
    status: 'approved',
    createdAt: '2026-09-05T10:00:00.000Z',
    updatedAt: '2026-09-05T10:00:00.000Z',
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
    address: 'Krishi Bhawan, Dr. Rajendra Prasad Road, New Delhi 110001',
    status: 'approved',
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-10T10:00:00.000Z',
  },
];

/**
 * Seed initial Phase 3 labs and sample harvests if not present
 */
export async function seedPhase3Data(): Promise<void> {
  try {
    // 1. Seed Labs
    for (const lab of SEEDED_LABS) {
      await setDoc(doc(db, 'labs', lab.id), lab, { merge: true });
    }

    // 2. Check if any harvests exist
    const harvestsSnap = await getDocs(collection(db, 'harvests'));
    if (harvestsSnap.empty) {
      const sampleHarvests: HarvestRecord[] = [
        {
          id: 'HVST_SEED_01',
          beekeeperId: 'B001',
          beekeeperName: 'Rajesh Kumar Verma',
          hiveId: 'HC-UP-B001-H01',
          state: 'UP',
          district: 'Varanasi',
          floralSource: 'Mustard',
          quantityKg: 32.5,
          moisture: 17.8,
          extractionDate: '2026-09-18',
          extractionMethod: 'Stainless Centrifugal Cold Extract',
          notes: 'Golden yellow, rich aroma from organic mustard fields along the Ganga plain.',
          status: 'unbatched',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'HVST_SEED_02',
          beekeeperId: 'B001',
          beekeeperName: 'Rajesh Kumar Verma',
          hiveId: 'HC-UP-B001-H02',
          state: 'UP',
          district: 'Varanasi',
          floralSource: 'Mustard',
          quantityKg: 28.0,
          moisture: 18.2,
          extractionDate: '2026-09-19',
          extractionMethod: 'Stainless Centrifugal Cold Extract',
          notes: 'High natural enzyme activity, single-origin mustard blossom.',
          status: 'unbatched',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'HVST_SEED_03',
          beekeeperId: 'B002',
          beekeeperName: 'Amit Singh',
          hiveId: 'HC-UP-B002-H01',
          state: 'UP',
          district: 'Ayodhya',
          floralSource: 'Acacia',
          quantityKg: 45.0,
          moisture: 17.0,
          extractionDate: '2026-09-20',
          extractionMethod: 'Gravity Sieve Raw Extraction',
          notes: 'Clear amber acacia blossom honey, delicate sweetness.',
          status: 'unbatched',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      for (const h of sampleHarvests) {
        await setDoc(doc(db, 'harvests', h.id), h);
      }
    }
  } catch (err) {
    console.warn('Phase 3 seeding note:', err);
  }
}
