/**
 * Honey Chain — Master Sample Data Generator
 * Video-Demo Ready: Generates 76 Beekeepers across 12 authentic Indian regions (5-8 per state),
 * 192 Hives, 30 Days Telemetry with Healthy & Abnormal Readings, 52 Batches at Varied Stages,
 * Diverse Lab Reports (90-99% Purity + Borderline & Failed), 130 Orders, Varied Reviews, and Real Coordinates.
 */

import {
  BeekeeperProfile,
  HiveRecord,
  IoTDevice,
  SensorReading,
  HealthAlert,
  HarvestRecord,
  BatchRecord,
  LabReport,
  HoneyPack,
  HoneyListing,
  OrderRecord,
  ReviewRecord,
  UserProfile,
} from '../types';

export interface MasterSampleDataset {
  users: UserProfile[];
  beekeepers: BeekeeperProfile[];
  hives: HiveRecord[];
  iotDevices: IoTDevice[];
  sensorReadings: SensorReading[];
  healthAlerts: HealthAlert[];
  harvests: HarvestRecord[];
  batches: BatchRecord[];
  labReports: LabReport[];
  packages: HoneyPack[];
  listings: HoneyListing[];
  orders: OrderRecord[];
  reviews: ReviewRecord[];
}

export interface RegionConfig {
  state: string;
  districts: { name: string; lat: number; lng: number; flora: string }[];
}

// 12 Authentic Indian Beekeeping Regions with Real GPS Coordinates & Districts
export const INDIAN_BEEKEEPING_REGIONS: RegionConfig[] = [
  {
    state: 'Punjab',
    districts: [
      { name: 'Hoshiarpur', lat: 31.5273, lng: 75.9142, flora: 'Mustard' },
      { name: 'Ludhiana', lat: 30.9010, lng: 75.8573, flora: 'Mustard' },
    ],
  },
  {
    state: 'Himachal Pradesh',
    districts: [
      { name: 'Kullu', lat: 31.9579, lng: 77.1095, flora: 'Apple Blossom' },
      { name: 'Shimla', lat: 31.1048, lng: 77.1734, flora: 'Multiflora' },
      { name: 'Solan', lat: 30.9084, lng: 77.0999, flora: 'Wildflower' },
    ],
  },
  {
    state: 'Uttarakhand',
    districts: [
      { name: 'Dehradun', lat: 30.3165, lng: 78.0322, flora: 'Litchi' },
      { name: 'Udham Singh Nagar', lat: 28.9738, lng: 79.4144, flora: 'Mustard' },
    ],
  },
  {
    state: 'Uttar Pradesh',
    districts: [
      { name: 'Saharanpur', lat: 29.9671, lng: 77.5510, flora: 'Eucalyptus' },
      { name: 'Bareilly', lat: 28.3670, lng: 79.4304, flora: 'Mustard' },
      { name: 'Lucknow', lat: 26.8467, lng: 80.9462, flora: 'Jamun' },
    ],
  },
  {
    state: 'West Bengal',
    districts: [
      { name: 'South 24 Parganas', lat: 22.1557, lng: 88.5833, flora: 'Sundarbans Mangrove' },
    ],
  },
  {
    state: 'Kerala',
    districts: [
      { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366, flora: 'Coconut Blossom' },
      { name: 'Wayanad', lat: 11.6854, lng: 76.1320, flora: 'Multiflora' },
      { name: 'Idukki', lat: 9.8494, lng: 76.9720, flora: 'Cardamom Flora' },
    ],
  },
  {
    state: 'Karnataka',
    districts: [
      { name: 'Kodagu (Coorg)', lat: 12.3375, lng: 75.8069, flora: 'Coffee Blossom' },
      { name: 'Chikkamagaluru', lat: 13.3161, lng: 75.7720, flora: 'Eucalyptus' },
    ],
  },
  {
    state: 'Maharashtra',
    districts: [
      { name: 'Mahabaleshwar', lat: 17.9307, lng: 73.6477, flora: 'Jamun' },
      { name: 'Kolhapur', lat: 16.7050, lng: 74.2433, flora: 'Multiflora' },
      { name: 'Satara', lat: 17.6805, lng: 73.9930, flora: 'Wildflower' },
    ],
  },
  {
    state: 'Madhya Pradesh',
    districts: [
      { name: 'Hoshangabad', lat: 22.7533, lng: 77.7289, flora: 'Mustard' },
      { name: 'Indore', lat: 22.7196, lng: 75.8577, flora: 'Multiflora' },
    ],
  },
  {
    state: 'Tamil Nadu',
    districts: [
      { name: 'Nilgiris', lat: 11.4102, lng: 76.6950, flora: 'Multiflora' },
      { name: 'Kanyakumari', lat: 8.0883, lng: 77.5385, flora: 'Neem Blossom' },
    ],
  },
  {
    state: 'Rajasthan',
    districts: [
      { name: 'Alwar', lat: 27.5530, lng: 76.6346, flora: 'Mustard' },
      { name: 'Bharatpur', lat: 27.2152, lng: 77.5030, flora: 'Mustard & Ajwain' },
    ],
  },
  {
    state: 'Jammu & Kashmir',
    districts: [
      { name: 'Anantnag', lat: 33.7311, lng: 75.1522, flora: 'Apple Blossom' },
      { name: 'Baramulla', lat: 34.2045, lng: 74.3436, flora: 'Saffron & Wild Flora' },
    ],
  },
];

const FIRST_NAMES = [
  'Gurpreet', 'Harpreet', 'Manjit', 'Suresh', 'Rajender', 'Ramesh', 'Amit', 'Sunita',
  'Mohammad', 'Debabrata', 'Pradip', 'Thomas', 'Shaji', 'Manjunatha', 'Bopanna', 'Aniket',
  'Ganesh', 'Devendra', 'Shivam', 'Murugan', 'Selvi', 'Bhanwar Lal', 'Ramswaroop', 'Farooq',
  'Ghulam', 'Shabir', 'Balvinder', 'Kewal', 'Dinesh', 'Virendra', 'Subhash', 'Naveen',
  'Prakash', 'Mahesh', 'Arun', 'Kishore', 'Sudhir', 'Niranjan', 'Basavaraj', 'Somanna',
  'Vittal', 'Kailash', 'Chhagan', 'Jitendra', 'Madan', 'Vijay', 'Hemant', 'Jagdish',
  'Satish', 'Trilochan', 'Nirmal', 'Sukhdev', 'Paramjit', 'Joginder', 'Kuldeep', 'Jasbir',
  'Harbhajan', 'Avtar', 'Bikram', 'Deepak', 'Gopal', 'Madhav', 'Narayan', 'Radheshyam',
  'Kishan', 'Govind', 'Bhupendra', 'Lokendra', 'Yogendra', 'Gajendra', 'Devraj', 'Kalyan',
  'Tenzin', 'Dorje', 'Stanzin', 'Karma'
];

const LAST_NAMES = [
  'Singh', 'Kaur', 'Negi', 'Thakur', 'Joshi', 'Rawat', 'Verma', 'Mondal',
  'Baidya', 'Varghese', 'Mathew', 'Gowda', 'Hegde', 'Patil', 'Deshmukh', 'Bundela',
  'Patel', 'Swamy', 'Ramanathan', 'Sharma', 'Meena', 'Mir', 'Lone', 'Bhat',
  'Yadav', 'Gupta', 'Chaudhary', 'Rana', 'Dhar', 'Nair', 'Pillai', 'Shetty',
  'Reddy', 'Rao', 'Borah', 'Saikia', 'Barman', 'Roy', 'Sen', 'Dutta'
];

export function generateMasterDataset(): MasterSampleDataset {
  const timestamp = new Date().toISOString();
  const dataset: MasterSampleDataset = {
    users: [],
    beekeepers: [],
    hives: [],
    iotDevices: [],
    sensorReadings: [],
    healthAlerts: [],
    harvests: [],
    batches: [],
    labReports: [],
    packages: [],
    listings: [],
    orders: [],
    reviews: [],
  };

  // Add the 4 primary role accounts to users list (strictly one fixed role each)
  dataset.users.push(
    {
      id: 'usr_superadmin_01',
      uid: 'usr_superadmin_01',
      email: 'admin.honeychain@gmail.com',
      displayName: 'Aditya Tripathi (Platform Admin)',
      role: 'ADMIN',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'usr_beekeeper_demo_01',
      uid: 'usr_beekeeper_demo_01',
      email: 'beekeeper.demo@honeychain.in',
      displayName: 'Sita Ram (Beekeeper)',
      role: 'BEEKEEPER',
      beekeeperId: 'BK-1001',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'usr_lab_demo_01',
      uid: 'usr_lab_demo_01',
      email: 'lab.demo@honeychain.in',
      displayName: 'NABL Analytical Lab Lead',
      role: 'LAB',
      labId: 'LAB_CBRTI_PUNE',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'usr_consumer_demo_01',
      uid: 'usr_consumer_demo_01',
      email: 'consumer.demo@honeychain.in',
      displayName: 'Arjun Sharma',
      role: 'CONSUMER',
      createdAt: timestamp,
      updatedAt: timestamp,
    }
  );

  // 1. Generate 76 Beekeepers (at least 6-7 per state across 12 states)
  const TOTAL_BEEKEEPERS = 76;
  let hiveSequence = 1;
  let harvestSequence = 1;

  for (let i = 1; i <= TOTAL_BEEKEEPERS; i++) {
    const regionIndex = (i - 1) % INDIAN_BEEKEEPING_REGIONS.length;
    const region = INDIAN_BEEKEEPING_REGIONS[regionIndex];
    // Distribute beekeepers across the state's specific districts
    const districtObj = region.districts[(Math.floor((i - 1) / INDIAN_BEEKEEPING_REGIONS.length) + (i % 2)) % region.districts.length];

    // Status: 65 approved, 8 pending, 3 rejected
    let status: 'approved' | 'pending' | 'rejected' = 'approved';
    if (i === 11 || i === 23 || i === 35 || i === 47 || i === 59 || i === 65 || i === 71 || i === 74) {
      status = 'pending';
    } else if (i === 32 || i === 54 || i === 69) {
      status = 'rejected';
    }

    // Varied trust score (realistic spread between 68 and 99 so trust scores differ meaningfully)
    let trustScore = 91 + Math.floor(Math.sin(i * 1.7) * 7);
    if (i % 6 === 0) trustScore = 77 + (i % 8); // Borderline tier
    if (i % 17 === 0) trustScore = 68 + (i % 5); // Poor/investigation tier
    if (trustScore > 99) trustScore = 99;
    if (trustScore < 68) trustScore = 68;

    const firstName = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 3) % LAST_NAMES.length];
    const fullName = i === 1 ? 'Sita Ram (Beekeeper)' : `${firstName} ${lastName}`;
    const bkId = `BK-${(1000 + i).toString()}`;
    const aadhaarLast4 = (1000 + ((i * 149) % 9000)).toString();

    // Real GPS coordinates with realistic local jitter (within 5-12km of district center)
    const latJitter = Number((Math.sin(i * 3.7) * 0.06).toFixed(4));
    const lngJitter = Number((Math.cos(i * 4.3) * 0.06).toFixed(4));
    const lat = Number((districtObj.lat + latJitter).toFixed(4));
    const lng = Number((districtObj.lng + lngJitter).toFixed(4));

    const beekeeperDoc: BeekeeperProfile = {
      id: bkId,
      beekeeperId: bkId,
      userId: i === 1 ? 'usr_beekeeper_demo_01' : `user_bk_${i}`,
      name: fullName,
      email: i === 1 ? 'beekeeper.demo@honeychain.in' : `${firstName.toLowerCase()}.${bkId.toLowerCase()}@honeychain.in`,
      phone: `+91 ${98000 + (i * 127)} ${10000 + (i * 431)}`.slice(0, 15),
      state: region.state,
      district: districtObj.name,
      address: `${districtObj.name} Apiary Cluster, Sector ${(i % 7) + 1}`,
      lat,
      lng,
      aadhaarLast4,
      aadhaarHash: `sha256_hash_${aadhaarLast4}_${i}`,
      madhukrantiId: `NBB/${region.state.slice(0, 2).toUpperCase()}/2024/${(1000 + i).toString()}`,
      yearsOfExperience: 2 + (i % 24),
      totalHivesCount: 2 + (i % 4),
      trustScore,
      status,
      rejectionReason: status === 'rejected' ? 'Incomplete land tenancy verification & Aadhaar mismatch' : undefined,
      isSample: true,
      createdAt: new Date(Date.now() - (i * 86400000 * 3)).toISOString(),
      updatedAt: timestamp,
    };
    dataset.beekeepers.push(beekeeperDoc);

    if (i !== 1) {
      dataset.users.push({
        id: `user_bk_${i}`,
        uid: `user_bk_${i}`,
        email: beekeeperDoc.email,
        displayName: fullName,
        role: 'BEEKEEPER',
        beekeeperId: bkId,
        trustScore,
        createdAt: beekeeperDoc.createdAt,
        updatedAt: timestamp,
      });
    }

    // 2. Generate Hives (192 total hives: 2-3 per beekeeper across varied hive/colony/land types and verification statuses)
    const hivesForThisBk = (i % 2 === 0) ? 3 : 2;

    for (let h = 0; h < hivesForThisBk; h++) {
      if (dataset.hives.length >= 192) break;

      const hiveId = `HV-${(1000 + hiveSequence).toString()}`;
      const devId = `DEV-${(1000 + hiveSequence).toString()}`;

      const hiveTypes: Array<HiveRecord['hiveType']> = ['Langstroth', 'Traditional', 'KTB', 'Other'];
      const colonyTypes: Array<HiveRecord['colonyType']> = [
        'Apis mellifera',
        'Apis cerana indica',
        'Apis dorsata',
        'Stingless',
      ];
      const landTypes: Array<HiveRecord['landType']> = ['Farmland', 'Orchard', 'Forest', 'Mangrove'];

      const hType = hiveTypes[(hiveSequence + h) % hiveTypes.length];
      const cType = colonyTypes[(hiveSequence + h) % colonyTypes.length];
      const lType = landTypes[(hiveSequence + h) % landTypes.length];

      // Mix of Verified (approved), Unverified (pending), and Decommissioned (rejected)
      let hiveApproval: 'approved' | 'pending' | 'rejected' = 'approved';
      if (status !== 'approved') {
        hiveApproval = status;
      } else if (hiveSequence % 9 === 0) {
        hiveApproval = 'pending';
      }

      const hiveStatus = hiveApproval === 'approved' ? 'active' : (hiveApproval === 'pending' ? 'inactive' : 'decommissioned');

      const hiveDoc: HiveRecord = {
        id: hiveId,
        hiveId,
        beekeeperId: bkId,
        hiveType: hType,
        colonyType: cType,
        area: `${districtObj.flora} Flora Zone, Plot ${h + 1}`,
        landType: lType,
        lat: Number((lat + (h * 0.006) - 0.003).toFixed(4)),
        lng: Number((lng + (h * 0.006) - 0.003).toFixed(4)),
        address: `${districtObj.name}, ${region.state}`,
        state: region.state,
        district: districtObj.name,
        setupDate: new Date(Date.now() - (75 * 86400000)).toISOString().split('T')[0],
        registrationDate: new Date(Date.now() - (45 * 86400000)).toISOString().split('T')[0],
        expectedProduction: 16 + ((hiveSequence * 3) % 24),
        status: hiveStatus,
        approvalStatus: hiveApproval,
        iotDeviceId: devId,
        isSample: true,
        createdAt: beekeeperDoc.createdAt,
        updatedAt: timestamp,
      };
      dataset.hives.push(hiveDoc);

      // IoT Device associated with hive
      const iotDoc: IoTDevice = {
        id: devId,
        deviceSerial: devId,
        apiKeyHash: `hash_${devId}`,
        hiveId,
        beekeeperId: bkId,
        model: (hiveSequence % 2 === 0) ? 'HC-PRO-V2' : 'HC-SOLAR-IOT',
        batteryPercent: 62 + (hiveSequence % 36),
        status: hiveStatus === 'active' ? 'online' : 'offline',
        lastReadingAt: timestamp,
        isSample: true,
        createdAt: hiveDoc.createdAt,
        updatedAt: timestamp,
      };
      dataset.iotDevices.push(iotDoc);

      // 3. 30 Days of Sensor Readings per Active Hive (healthy + abnormal/alert-triggering)
      if (hiveStatus === 'active' && hiveSequence <= 75) {
        for (let day = 30; day >= 0; day--) {
          const readingTime = new Date(Date.now() - (day * 86400000)).toISOString();
          // Healthy brood temperature: 33.2°C to 35.6°C
          let temp = 33.4 + Math.sin(day * 0.45 + hiveSequence) * 1.5;
          let humidity = 57 + Math.cos(day * 0.38 + hiveSequence) * 9;
          let isAnomaly = false;

          // Introduce realistic alert-triggering anomalies on designated hives
          if ((hiveSequence === 3 || hiveSequence === 15 || hiveSequence === 31) && day === 1) {
            temp = 40.8; // Heat stress spike alert
            isAnomaly = true;
            dataset.healthAlerts.push({
              id: `ALT-HEAT-${hiveSequence}-${day}`,
              hiveId,
              beekeeperId: bkId,
              type: 'TEMPERATURE_HIGH',
              severity: 'CRITICAL',
              message: `Severe Brood Overheating: ${temp.toFixed(1)}°C in Hive ${hiveId}. Absconding risk high. Immediate ventilation needed.`,
              readingValue: temp,
              thresholdValue: 36.5,
              status: 'active',
              timestamp: readingTime,
            });
          } else if ((hiveSequence === 8 || hiveSequence === 24) && day === 2) {
            humidity = 87.5; // High humidity fungus alert
            isAnomaly = true;
            dataset.healthAlerts.push({
              id: `ALT-HUMID-${hiveSequence}-${day}`,
              hiveId,
              beekeeperId: bkId,
              type: 'HUMIDITY_HIGH',
              severity: 'HIGH',
              message: `Excess Humidity Detected: ${humidity.toFixed(1)}% in Hive ${hiveId}. Fungal chalkbrood threat. Inspect bottom board.`,
              readingValue: humidity,
              thresholdValue: 75.0,
              status: 'active',
              timestamp: readingTime,
            });
          } else if (hiveSequence === 19 && day === 3) {
            temp = 28.2; // Cold stress alert
            isAnomaly = true;
            dataset.healthAlerts.push({
              id: `ALT-COLD-${hiveSequence}-${day}`,
              hiveId,
              beekeeperId: bkId,
              type: 'TEMPERATURE_LOW',
              severity: 'MEDIUM',
              message: `Chilled Brood Risk: ${temp.toFixed(1)}°C in Hive ${hiveId}. Colony below physiological threshold. Check entrance reducers.`,
              readingValue: temp,
              thresholdValue: 31.0,
              status: 'active',
              timestamp: readingTime,
            });
          }

          dataset.sensorReadings.push({
            id: `SR-${hiveSequence}-${day}`,
            deviceSerial: devId,
            hiveId,
            beekeeperId: bkId,
            temperature: Number(temp.toFixed(1)),
            humidity: Number(humidity.toFixed(1)),
            weight: Number((19.0 + ((30 - day) * 0.35) + (hiveSequence % 6)).toFixed(1)),
            battery: 68 + (day % 30),
            timestamp: readingTime,
            isAnomaly,
            isSample: true,
          });
        }
      }

      // Generate Harvests
      if (hiveStatus === 'active' && (h === 0 || harvestSequence <= 120)) {
        const harvestId = `HVST-${(1000 + harvestSequence).toString()}`;
        const harvestDoc: HarvestRecord = {
          id: harvestId,
          beekeeperId: bkId,
          beekeeperName: fullName,
          hiveId,
          state: region.state,
          district: districtObj.name,
          floralSource: districtObj.flora,
          quantityKg: 22 + ((harvestSequence * 5) % 36),
          moisture: Number((17.1 + ((harvestSequence % 6) * 0.38)).toFixed(1)),
          extractionDate: new Date(Date.now() - (18 * 86400000)).toISOString().split('T')[0],
          extractionMethod: 'Centrifugal cold extraction without heat degradation',
          status: (harvestSequence % 2 === 0) ? 'batched' : 'unbatched',
          batchId: (harvestSequence % 2 === 0) ? `HB-2609-${region.state.slice(0, 2).toUpperCase()}-${(1000 + (harvestSequence % 45)).toString()}` : undefined,
          isSample: true,
          createdAt: new Date(Date.now() - (18 * 86400000)).toISOString(),
          updatedAt: timestamp,
        };
        dataset.harvests.push(harvestDoc);
        harvestSequence++;
      }

      hiveSequence++;
    }
  }

  // 4. Generate 52 Batches at Varied Stages
  // Stages: Draft (created), Verified, Sent to Lab (sample_sent), Report Received (lab_tested), Live (listed), Sold Out (completed), Rejected (verification_failed)
  const TOTAL_BATCHES = 52;

  for (let b = 1; b <= TOTAL_BATCHES; b++) {
    const region = INDIAN_BEEKEEPING_REGIONS[(b - 1) % INDIAN_BEEKEEPING_REGIONS.length];
    const distIdx = Math.floor((b - 1) / INDIAN_BEEKEEPING_REGIONS.length) % region.districts.length;
    const districtObj = region.districts[distIdx];
    const stCode = region.state.slice(0, 2).toUpperCase();
    const batchId = `HB-2609-${stCode}-${(1000 + b).toString()}`;
    
    // Find beekeepers in this exact state and district
    const bkInDistrict = dataset.beekeepers.filter(
      (bk) => bk.state === region.state && bk.district === districtObj.name
    );
    const bkAssigned = bkInDistrict.length > 0
      ? bkInDistrict[(b - 1) % bkInDistrict.length]
      : dataset.beekeepers[(b * 2) % dataset.beekeepers.length];

    const hivesInDistrict = dataset.hives.filter(
      (h) => h.state === region.state && h.district === districtObj.name
    );
    const hiveIds = hivesInDistrict.slice(0, 2).map((h) => h.hiveId);
    if (hiveIds.length === 0) hiveIds.push(`HV-${(1000 + b).toString()}`);

    const harvestsInDistrict = dataset.harvests.filter(
      (hv) => hv.state === region.state && hv.district === districtObj.name
    );
    const harvestIds = harvestsInDistrict.slice(0, 2).map((hv) => hv.id);
    if (harvestIds.length === 0) harvestIds.push(`HVST-${(1000 + b).toString()}`);

    // Status distribution matching prompt:
    // Draft: 6, Verified: 8, Sent to Lab: 8, Report Received: 10, Live: 12, Sold Out: 6, Rejected: 2
    let bStatus: BatchRecord['status'] = 'listed';
    if (b <= 6) bStatus = 'created'; // Draft
    else if (b <= 14) bStatus = 'verified'; // Verified
    else if (b <= 22) bStatus = 'sample_sent'; // Sent to Lab
    else if (b <= 32) bStatus = 'lab_tested'; // Report Received
    else if (b <= 44) bStatus = 'listed'; // Live
    else if (b <= 50) bStatus = 'completed'; // Sold Out
    else bStatus = 'verification_failed'; // Rejected

    // Varied Purity Results (mostly 90-99% PURE, with borderline SUB_STANDARD and failed ADULTERATED)
    let labVerdict: 'PURE' | 'ADULTERATED' | 'SUB_STANDARD' = 'PURE';
    let moisture = 17.2 + ((b % 5) * 0.4);
    let fgRatio = 1.18;
    let hmf = 18 + (b % 22);

    if (bStatus === 'verification_failed' || b === 51) {
      labVerdict = 'ADULTERATED'; // Failed purity test
      moisture = 22.8;
      fgRatio = 0.81;
      hmf = 89.5;
    } else if (b === 19 || b === 29) {
      labVerdict = 'SUB_STANDARD'; // Borderline purity test
      moisture = 20.3;
      fgRatio = 0.96;
      hmf = 71.0;
    }

    const reportId = `LBR-2609-${(1000 + b).toString()}`;
    const sampleId = `LS-2609-${(1000 + b).toString()}`;
    const reportHash = `hash_${b}_${labVerdict.toLowerCase()}_${moisture}_verified`;

    const purityPercentage = labVerdict === 'PURE'
      ? Number((95.2 + ((b * 1.7) % 4.3)).toFixed(1))
      : (labVerdict === 'SUB_STANDARD' ? 88.4 : 74.2);

    const labNames = [
      'Central Bee Research & Training Institute (CBRTI) National Lab',
      'Apex Regional Honey Quality & Residue Testing Lab',
      'National Bee Board Honey Traceability Center of Excellence',
    ];
    const assignedLabName = labNames[(b - 1) % labNames.length];
    const assignedLabId = (b - 1) % 3 === 0 ? 'LAB_CBRTI_PUNE' : ((b - 1) % 3 === 1 ? 'LAB_APEX_LUCKNOW' : 'LAB_NBB_DELHI');

    const batchDoc: BatchRecord = {
      id: batchId,
      batchId,
      state: region.state,
      district: districtObj.name,
      beekeeperIds: [bkAssigned.beekeeperId || 'BK-1001'],
      hiveIds,
      harvestIds,
      floralSource: districtObj.flora,
      totalQuantityKg: 65 + ((b * 8) % 115),
      totalWeightKg: 65 + ((b * 8) % 115),
      avgMoisture: Number(moisture.toFixed(1)),
      status: bStatus,
      sampleId,
      labId: assignedLabId,
      labName: assignedLabName,
      labReportId: bStatus !== 'created' && bStatus !== 'verified' ? reportId : undefined,
      labVerdict: bStatus !== 'created' && bStatus !== 'verified' ? labVerdict : undefined,
      purityPercentage: bStatus !== 'created' && bStatus !== 'verified' ? purityPercentage : undefined,
      reportHash: bStatus !== 'created' && bStatus !== 'verified' ? reportHash : undefined,
      packagingDetails: (bStatus === 'listed' || bStatus === 'completed') ? {
        jarSizeGrams: (b % 2 === 0) ? 500 : 250,
        packCount: 45 + (b % 40),
        packagedAt: new Date(Date.now() - (8 * 86400000)).toISOString(),
        packIds: [`${batchId}-P0001`, `${batchId}-P0002`],
      } : undefined,
      isSample: true,
      createdAt: new Date(Date.now() - (16 * 86400000)).toISOString(),
      updatedAt: timestamp,
    };
    dataset.batches.push(batchDoc);

    // 5. Lab Reports with varied purity results
    if (bStatus !== 'created' && bStatus !== 'verified') {
      const labDoc: LabReport = {
        id: reportId,
        reportId,
        sampleId,
        batchId,
        state: region.state,
        district: districtObj.name,
        labId: assignedLabId,
        labName: assignedLabName,
        accreditationNo: (b - 1) % 3 === 0 ? 'NABL-TC-0841 • FSSAI-2024' : ((b - 1) % 3 === 1 ? 'NABL-TC-1120 • FSSAI-UP-44' : 'NABL-TC-0992 • MOA-NBB-09'),
        testedBy: (b - 1) % 3 === 0
          ? 'Dr. Ramesh K. Sharma, Chief Honey Testing Officer'
          : ((b - 1) % 3 === 1 ? 'Dr. Sunita Verma, Lead Residue Chemist' : 'Er. Alok Tripathi, Traceability Scientist'),
        testDate: new Date(Date.now() - (6 * 86400000)).toISOString().split('T')[0],
        parameters: {
          moisture: Number(moisture.toFixed(1)),
          fructose: 38.6 - (labVerdict === 'ADULTERATED' ? 10 : 0),
          glucose: 31.4,
          fgRatio: Number(fgRatio.toFixed(2)),
          sucrose: labVerdict === 'ADULTERATED' ? 8.2 : 1.9,
          hmf: Number(hmf.toFixed(1)),
          pollenCountMillion: 0.88 + ((b % 5) * 0.08),
          c4Sugars: labVerdict === 'ADULTERATED' ? 'Positive' : 'Negative',
          antibioticsResidue: 'Pass',
          heavyMetals: 'Pass',
        },
        verdict: labVerdict,
        purityPercentage,
        passFail: labVerdict === 'PURE' ? 'Pass' : 'Fail',
        remarks: labVerdict === 'PURE'
          ? 'Passed all 18 FSSAI quality parameters. Zero exogenous C4/C3 sugars detected. High pollen density confirms genuine unpasteurized origin.'
          : (labVerdict === 'SUB_STANDARD'
            ? 'Moisture marginally elevated above export threshold (20.3%). Antibiotics and heavy metals clear.'
            : 'Fails purity screening: Exogenous C4 cane/corn sugar markers identified. Elevated HMF (89.5 mg/kg). Verification rejected.'),
        reportHash,
        isSample: true,
        createdAt: new Date(Date.now() - (6 * 86400000)).toISOString(),
      };
      dataset.labReports.push(labDoc);
    }

    // Honey Pack for retail QR verification
    const packId = `${batchId}-P0001`;
    const packDoc: HoneyPack = {
      id: packId,
      packId,
      batchId,
      hiveIds: batchDoc.hiveIds,
      beekeeperId: bkAssigned.beekeeperId || 'BK-1001',
      floralSource: districtObj.flora,
      jarSizeGrams: 500,
      packagingDate: new Date(Date.now() - (7 * 86400000)).toISOString(),
      labReportId: reportId,
      labVerdict: labVerdict,
      reportHash,
      status: bStatus === 'completed' ? 'sold' : 'in_stock',
      scanCount: 4 + (b % 14),
      firstScannedAt: new Date(Date.now() - (5 * 86400000)).toISOString(),
      lastScannedAt: timestamp,
      isSample: true,
      createdAt: new Date(Date.now() - (7 * 86400000)).toISOString(),
    };
    dataset.packages.push(packDoc);

    // Marketplace Listing (Live & Completed)
    if (bStatus === 'listed' || bStatus === 'completed') {
      const listingId = `LIST_${batchId}`;
      const price = 390 + ((b * 22) % 360);
      const mrp = price + 110;
      const listingDoc: HoneyListing = {
        id: listingId,
        batchId,
        beekeeperId: bkAssigned.beekeeperId || 'BK-1001',
        beekeeperName: bkAssigned.name,
        title: `Pure Raw ${districtObj.flora} Honey (${region.state})`,
        description: `Farmgate raw honey cold-extracted in ${districtObj.name}, ${region.state}. Sealed with CBRTI cryptographic lab certificate and tamper-evident QR tracing.`,
        floralSource: districtObj.flora,
        state: region.state,
        jarSizeGrams: 500,
        priceInr: price,
        mrpInr: mrp,
        stockCount: bStatus === 'completed' ? 0 : (14 + (b % 32)),
        initialStock: 45,
        rawUnfiltered: true,
        status: bStatus === 'completed' ? 'out_of_stock' : 'active',
        labVerdict: 'PURE',
        labReportId: reportId,
        reportHash,
        trustScore: bkAssigned.trustScore || 94,
        createdAt: new Date(Date.now() - (6 * 86400000)).toISOString(),
        updatedAt: timestamp,
      };
      dataset.listings.push(listingDoc);
    }
  }

  // 6. Generate 130 Orders across varied statuses
  const TOTAL_ORDERS = 130;
  const CONSUMER_CITIES = [
    { city: 'New Delhi', state: 'Delhi', pincode: '110001' },
    { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
    { city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
    { city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
    { city: 'Kolkata', state: 'West Bengal', pincode: '700001' },
    { city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
    { city: 'Pune', state: 'Maharashtra', pincode: '411001' },
    { city: 'Jaipur', state: 'Rajasthan', pincode: '302001' },
    { city: 'Chandigarh', state: 'Punjab', pincode: '160017' },
    { city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001' },
  ];

  for (let o = 1; o <= TOTAL_ORDERS; o++) {
    const orderId = `ORD-2609-${(1000 + o).toString()}`;
    const cityObj = CONSUMER_CITIES[(o - 1) % CONSUMER_CITIES.length];
    const listing = dataset.listings[(o - 1) % dataset.listings.length];

    // Status distribution: 14 placed, 19 paid, 16 packed, 34 shipped, 41 delivered, 6 cancelled
    let oStatus: OrderRecord['status'] = 'delivered';
    if (o <= 14) oStatus = 'placed';
    else if (o <= 33) oStatus = 'paid';
    else if (o <= 49) oStatus = 'packed';
    else if (o <= 83) oStatus = 'shipped';
    else if (o <= 124) oStatus = 'delivered';
    else oStatus = (o % 2 === 0) ? 'cancelled' : 'refunded';

    const qty = 1 + (o % 3);
    const itemTotal = (listing?.priceInr || 460) * qty;

    const orderDoc: OrderRecord = {
      id: orderId,
      orderId,
      customerId: `cust_${(1000 + (o % 45)).toString()}`,
      customerEmail: `customer.${o}@honeychain-buyer.in`,
      customerName: `${FIRST_NAMES[(o * 2) % FIRST_NAMES.length]} ${LAST_NAMES[(o * 3) % LAST_NAMES.length]}`,
      items: [
        {
          listingId: listing?.id || 'LIST_DEFAULT',
          batchId: listing?.batchId || 'HB-DEFAULT',
          title: listing?.title || 'Pure Raw Mustard Honey',
          floralSource: listing?.floralSource || 'Mustard',
          jarSizeGrams: listing?.jarSizeGrams || 500,
          priceInr: listing?.priceInr || 460,
          quantity: qty,
          maxStock: 50,
          beekeeperName: listing?.beekeeperName || 'Beekeeper',
        },
      ],
      totalAmountInr: itemTotal,
      totalInr: itemTotal,
      subtotalInr: itemTotal,
      shippingInr: itemTotal >= 999 ? 0 : 60,
      paymentDetails: {
        method: 'MOCK_ONLINE',
        paidAt: new Date(Date.now() - ((130 - o) * 3600000 * 4)).toISOString(),
        verified: true,
      },
      shippingAddress: {
        fullName: `${FIRST_NAMES[(o * 2) % FIRST_NAMES.length]} ${LAST_NAMES[(o * 3) % LAST_NAMES.length]}`,
        phone: '+91 98111 22334',
        addressLine1: `Flat ${(o % 60) + 1}, Vasant Enclave`,
        addressLine2: `Sector ${(o % 18) + 1}`,
        city: cityObj.city,
        state: cityObj.state,
        pincode: cityObj.pincode,
      },
      status: oStatus,
      paymentMethod: (o % 2 === 0) ? 'UPI' : 'CREDIT_CARD',
      paymentId: `PAY-UPI-${(10000 + o).toString()}`,
      trackingNumber: oStatus === 'shipped' || oStatus === 'delivered' ? `DELHIVERY-HC-${(100000 + o).toString()}` : undefined,
      courierName: 'Delhivery Surface Express',
      isSample: true,
      createdAt: new Date(Date.now() - ((130 - o) * 3600000 * 4)).toISOString(),
      updatedAt: timestamp,
    };
    dataset.orders.push(orderDoc);

    // 7. Realistic Reviews & Ratings with meaningful variation (5, 4, 3, 2 stars)
    if (oStatus === 'delivered' && o % 2 === 0) {
      let rating = 5;
      let comment = 'Top quality raw honey! The QR verification showing the CBRTI lab report and hive telemetry gave complete confidence.';
      if (o % 11 === 0) {
        rating = 2; // Critical review
        comment = 'Jar lid was loose and honey leaked in the carton during transit. Honey tastes okay but packaging needs better bubble wrap.';
      } else if (o % 7 === 0) {
        rating = 3; // Neutral review
        comment = 'Good honey but naturally crystallized quicker than expected in the cold. Distinctive strong floral taste.';
      } else if (o % 4 === 0) {
        rating = 4; // Solid 4-star
        comment = 'Very authentic taste and aroma. Clear lab certificate. Arrived in 3 days in Bengaluru.';
      } else if (o % 3 === 0) {
        rating = 5; // Enthusiastic Hindi review
        comment = 'अद्भुत स्वाद और 100% शुद्धता! मधुमक्खी पालक का लाइव स्थान और लैब रिपोर्ट देखकर बहुत संतुष्टि हुई।';
      }

      dataset.reviews.push({
        id: `REV-${(1000 + o).toString()}`,
        listingId: listing?.id || 'LIST_DEFAULT',
        batchId: listing?.batchId || 'HB-DEFAULT',
        beekeeperId: listing?.beekeeperId || 'BK-1001',
        orderId,
        customerId: orderDoc.customerId,
        customerName: orderDoc.customerName,
        rating,
        comment,
        isVerifiedBuyer: true,
        isSample: true,
        createdAt: new Date(Date.now() - ((130 - o) * 3600000 * 2)).toISOString(),
      });
    }
  }

  return dataset;
}

export const SAMPLE_DATA_MASTER = generateMasterDataset();
