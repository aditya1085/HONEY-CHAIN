/**
 * Honey Chain — Master Sample Data Generator
 * Video-Demo Ready: Generates 75 Beekeepers, 185 Hives, 30 Days Telemetry, 50 Batches,
 * Varied Lab Reports, 125 Orders, Varied Reviews, and Real Indian Locations.
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

// 12 Authentic Indian Beekeeping Regions
export interface RegionConfig {
  state: string;
  districts: { name: string; lat: number; lng: number; flora: string }[];
}

export const INDIAN_BEEKEEPING_REGIONS: RegionConfig[] = [
  {
    state: 'Punjab',
    districts: [
      { name: 'Hoshiarpur', lat: 31.5273, lng: 75.9142, flora: 'Mustard' },
      { name: 'Ludhiana', lat: 30.9010, lng: 75.8573, flora: 'Mustard' },
      { name: 'Gurdaspur', lat: 32.0419, lng: 75.4053, flora: 'Eucalyptus' },
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
      { name: 'Nainital', lat: 29.3919, lng: 79.4542, flora: 'Multiflora' },
    ],
  },
  {
    state: 'Uttar Pradesh',
    districts: [
      { name: 'Saharanpur', lat: 29.9671, lng: 77.5510, flora: 'Eucalyptus' },
      { name: 'Bareilly', lat: 28.3670, lng: 79.4304, flora: 'Mustard' },
      { name: 'Lucknow', lat: 26.8467, lng: 80.9462, flora: 'Jamun' },
      { name: 'Ayodhya', lat: 26.7922, lng: 82.1998, flora: 'Mustard' },
    ],
  },
  {
    state: 'West Bengal',
    districts: [
      { name: 'South 24 Parganas', lat: 22.1557, lng: 88.5833, flora: 'Sundarbans Mangrove' },
      { name: 'Canning', lat: 22.3108, lng: 88.6580, flora: 'Sundarbans Mangrove' },
      { name: 'Malda', lat: 25.0108, lng: 88.1411, flora: 'Litchi' },
    ],
  },
  {
    state: 'Kerala',
    districts: [
      { name: 'Wayanad', lat: 11.6854, lng: 76.1320, flora: 'Multiflora' },
      { name: 'Idukki', lat: 9.8494, lng: 76.9720, flora: 'Cardamom Flora' },
      { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366, flora: 'Coconut Blossom' },
    ],
  },
  {
    state: 'Karnataka',
    districts: [
      { name: 'Kodagu (Coorg)', lat: 12.3375, lng: 75.8069, flora: 'Coffee Blossom' },
      { name: 'Chikkamagaluru', lat: 13.3161, lng: 75.7720, flora: 'Eucalyptus' },
      { name: 'Uttara Kannada', lat: 14.7953, lng: 74.6865, flora: 'Wild Forest' },
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
      { name: 'Sehore', lat: 23.2031, lng: 77.0844, flora: 'Soybean & Mustard' },
    ],
  },
  {
    state: 'Tamil Nadu',
    districts: [
      { name: 'Nilgiris (Ooty)', lat: 11.4102, lng: 76.6950, flora: 'Multiflora' },
      { name: 'Kanyakumari', lat: 8.0883, lng: 77.5385, flora: 'Neem Blossom' },
      { name: 'Dindigul', lat: 10.3673, lng: 77.9803, flora: 'Acacia' },
    ],
  },
  {
    state: 'Rajasthan',
    districts: [
      { name: 'Alwar', lat: 27.5530, lng: 76.6346, flora: 'Mustard' },
      { name: 'Bharatpur', lat: 27.2152, lng: 77.5030, flora: 'Mustard & Ajwain' },
      { name: 'Tonk', lat: 26.1664, lng: 75.7885, flora: 'Ber / Sidr' },
    ],
  },
  {
    state: 'Jammu & Kashmir',
    districts: [
      { name: 'Pulwama', lat: 33.8711, lng: 74.8967, flora: 'Kashmir White Acacia' },
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

  // Add the 4 primary role accounts to users list
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

  // 1. Generate 75 Beekeepers
  const TOTAL_BEEKEEPERS = 75;
  let hiveSequence = 1;
  let harvestSequence = 1;
  let batchSequence = 1;

  for (let i = 1; i <= TOTAL_BEEKEEPERS; i++) {
    const region = INDIAN_BEEKEEPING_REGIONS[(i - 1) % INDIAN_BEEKEEPING_REGIONS.length];
    const districtObj = region.districts[(i - 1) % region.districts.length];

    // Status: 65 approved, 7 pending, 3 rejected
    let status: 'approved' | 'pending' | 'rejected' = 'approved';
    if (i === 12 || i === 24 || i === 36 || i === 48 || i === 60 || i === 68 || i === 72) {
      status = 'pending';
    } else if (i === 33 || i === 55 || i === 70) {
      status = 'rejected';
    }

    // Varied trust score (realistic bell-curve with some lower scores)
    let trustScore = 90 + Math.floor(Math.sin(i * 1.5) * 8);
    if (i % 7 === 0) trustScore = 78 + (i % 10); // borderline
    if (i % 19 === 0) trustScore = 69 + (i % 5); // poor trust
    if (trustScore > 99) trustScore = 99;
    if (trustScore < 65) trustScore = 68;

    const firstName = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 3) % LAST_NAMES.length];
    const fullName = `${firstName} ${lastName}`;
    const bkId = `BK-${(1000 + i).toString()}`;
    const aadhaarLast4 = (1000 + ((i * 137) % 9000)).toString();

    // Jitter coordinates realistically within 15km of district center
    const latJitter = (Math.sin(i * 4.1) * 0.08);
    const lngJitter = (Math.cos(i * 3.7) * 0.08);
    const lat = Number((districtObj.lat + latJitter).toFixed(4));
    const lng = Number((districtObj.lng + lngJitter).toFixed(4));

    const beekeeperDoc: BeekeeperProfile = {
      id: bkId,
      beekeeperId: bkId,
      userId: `user_bk_${i}`,
      name: fullName,
      email: `${firstName.toLowerCase()}.${bkId.toLowerCase()}@honeychain.in`,
      phone: `+91 ${98000 + (i * 123)} ${10000 + (i * 456)}`.slice(0, 15),
      state: region.state,
      district: districtObj.name,
      address: `${districtObj.name} Apiary Zone, Block ${(i % 8) + 1}`,
      lat,
      lng,
      aadhaarLast4,
      aadhaarHash: `sha256_mock_hash_${aadhaarLast4}_${i}`,
      madhukrantiId: `NBB/${region.state.slice(0, 2).toUpperCase()}/2024/${(1000 + i).toString()}`,
      yearsOfExperience: 3 + (i % 25),
      totalHivesCount: 2 + (i % 5),
      trustScore,
      status,
      rejectionReason: status === 'rejected' ? 'Incomplete land tenancy verification & Aadhaar mismatch' : undefined,
      isSample: true,
      createdAt: new Date(Date.now() - (i * 86400000 * 3)).toISOString(),
      updatedAt: timestamp,
    };
    dataset.beekeepers.push(beekeeperDoc);

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

    // 2. Generate Hives (185 Total: 2-3 per beekeeper)
    const hivesForThisBk = (i % 3 === 0) ? 3 : 2;
    const bkHiveIds: string[] = [];

    for (let h = 0; h < hivesForThisBk; h++) {
      if (dataset.hives.length >= 185) break;

      const hiveId = `HV-${(1000 + hiveSequence).toString()}`;
      const devId = `DEV-${(1000 + hiveSequence).toString()}`;
      bkHiveIds.push(hiveId);

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

      const hiveDoc: HiveRecord = {
        id: hiveId,
        hiveId,
        beekeeperId: bkId,
        hiveType: hType,
        colonyType: cType,
        area: `${districtObj.flora} Belt, Plot ${h + 1}`,
        landType: lType,
        lat: Number((lat + (h * 0.005) - 0.002).toFixed(4)),
        lng: Number((lng + (h * 0.005) - 0.002).toFixed(4)),
        address: `${districtObj.name}, ${region.state}`,
        setupDate: new Date(Date.now() - (60 * 86400000)).toISOString().split('T')[0],
        registrationDate: new Date(Date.now() - (45 * 86400000)).toISOString().split('T')[0],
        expectedProduction: 18 + ((hiveSequence * 3) % 25),
        status: status === 'approved' ? 'active' : (status === 'pending' ? 'inactive' : 'decommissioned'),
        approvalStatus: status,
        iotDeviceId: devId,
        isSample: true,
        createdAt: beekeeperDoc.createdAt,
        updatedAt: timestamp,
      };
      dataset.hives.push(hiveDoc);

      // Associate IoT Device
      const iotDoc: IoTDevice = {
        id: devId,
        deviceSerial: devId,
        apiKeyHash: `hash_${devId}`,
        hiveId,
        beekeeperId: bkId,
        model: (hiveSequence % 2 === 0) ? 'HC-PRO-V2' : 'HC-SOLAR-IOT',
        batteryPercent: 65 + (hiveSequence % 35),
        status: status === 'approved' ? 'online' : 'offline',
        lastReadingAt: timestamp,
        isSample: true,
        createdAt: hiveDoc.createdAt,
        updatedAt: timestamp,
      };
      dataset.iotDevices.push(iotDoc);

      // Generate 30 days of sensor readings (1 per day for charts, with realistic diurnal values and anomalies)
      if (status === 'approved' && hiveSequence <= 60) {
        for (let day = 30; day >= 0; day--) {
          const readingTime = new Date(Date.now() - (day * 86400000)).toISOString();
          // Healthy brood temp: ~33.5 - 35.5 C
          let temp = 33.5 + Math.sin(day * 0.5 + hiveSequence) * 1.6;
          let humidity = 58 + Math.cos(day * 0.4 + hiveSequence) * 11;
          let isAnomaly = false;

          // Introduce alert-triggering anomalies on certain hives
          if ((hiveSequence === 3 || hiveSequence === 14 || hiveSequence === 29) && day === 1) {
            temp = 40.2; // Heat spike alert
            isAnomaly = true;
            dataset.healthAlerts.push({
              id: `ALT-TMP-${hiveSequence}-${day}`,
              hiveId,
              beekeeperId: bkId,
              type: 'TEMPERATURE_HIGH',
              severity: 'CRITICAL',
              message: `Brood overheating alert: ${temp.toFixed(1)}°C recorded in ${hiveId}. Immediate shade/cooling recommended.`,
              readingValue: temp,
              thresholdValue: 36.5,
              status: 'active',
              timestamp: readingTime,
            });
          } else if ((hiveSequence === 7 || hiveSequence === 22) && day === 2) {
            humidity = 88.5; // Humidity spike alert
            isAnomaly = true;
            dataset.healthAlerts.push({
              id: `ALT-HUM-${hiveSequence}-${day}`,
              hiveId,
              beekeeperId: bkId,
              type: 'HUMIDITY_HIGH',
              severity: 'HIGH',
              message: `Excess internal humidity (${humidity.toFixed(1)}%) in ${hiveId}. Risk of fungal chalkbrood infection.`,
              readingValue: humidity,
              thresholdValue: 75.0,
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
            weight: Number((18.5 + ((30 - day) * 0.3) + (hiveSequence % 5)).toFixed(1)),
            battery: 70 + (day % 30),
            timestamp: readingTime,
            isAnomaly,
            isSample: true,
          });
        }
      }

      // Generate Harvests
      if (status === 'approved' && h === 0 && harvestSequence <= 80) {
        const harvestId = `HVST-${(1000 + harvestSequence).toString()}`;
        const harvestDoc: HarvestRecord = {
          id: harvestId,
          beekeeperId: bkId,
          beekeeperName: fullName,
          hiveId,
          state: region.state,
          district: districtObj.name,
          floralSource: districtObj.flora,
          quantityKg: 20 + ((harvestSequence * 4) % 35),
          moisture: Number((17.2 + ((harvestSequence % 5) * 0.4)).toFixed(1)),
          extractionDate: new Date(Date.now() - (15 * 86400000)).toISOString().split('T')[0],
          extractionMethod: 'Centrifugal cold extraction without heating',
          status: (harvestSequence % 2 === 0) ? 'batched' : 'unbatched',
          batchId: (harvestSequence % 2 === 0) ? `HB-2609-${region.state.slice(0, 2).toUpperCase()}-${(1000 + (harvestSequence % 40)).toString()}` : undefined,
          isSample: true,
          createdAt: new Date(Date.now() - (15 * 86400000)).toISOString(),
          updatedAt: timestamp,
        };
        dataset.harvests.push(harvestDoc);
        harvestSequence++;
      }

      hiveSequence++;
    }
  }

  // 3. Generate 50 Batches across varied stages
  const TOTAL_BATCHES = 50;
  const batchStatuses: BatchRecord['status'][] = [
    'created',
    'verified',
    'sample_sent',
    'lab_tested',
    'packaged',
    'listed',
    'completed',
    'verification_failed',
  ];

  for (let b = 1; b <= TOTAL_BATCHES; b++) {
    const region = INDIAN_BEEKEEPING_REGIONS[(b - 1) % INDIAN_BEEKEEPING_REGIONS.length];
    const districtObj = region.districts[(b - 1) % region.districts.length];
    const stCode = region.state.slice(0, 2).toUpperCase();
    const batchId = `HB-2609-${stCode}-${(1000 + b).toString()}`;
    const bkAssigned = dataset.beekeepers[(b * 2) % dataset.beekeepers.length];

    // Cycle through realistic status distribution:
    // 5 created, 7 verified, 8 sample_sent, 10 lab_tested, 12 listed, 6 completed, 2 failed
    let bStatus: BatchRecord['status'] = 'listed';
    if (b <= 5) bStatus = 'created';
    else if (b <= 12) bStatus = 'verified';
    else if (b <= 20) bStatus = 'sample_sent';
    else if (b <= 30) bStatus = 'lab_tested';
    else if (b <= 42) bStatus = 'listed';
    else if (b <= 48) bStatus = 'completed';
    else bStatus = 'verification_failed';

    // Lab Purity with variation (mostly high 90-99%, plus borderline and a failed result)
    let labVerdict: 'PURE' | 'ADULTERATED' | 'SUB_STANDARD' = 'PURE';
    let moisture = 17.5 + ((b % 5) * 0.4);
    let fgRatio = 1.15;
    let hmf = 22 + (b % 20);

    if (bStatus === 'verification_failed' || b === 49) {
      labVerdict = 'ADULTERATED';
      moisture = 22.8;
      fgRatio = 0.82;
      hmf = 88.0;
    } else if (b === 18 || b === 27) {
      labVerdict = 'SUB_STANDARD';
      moisture = 20.4;
      fgRatio = 0.96;
      hmf = 72.0;
    }

    const reportId = `LBR-2609-${(1000 + b).toString()}`;
    const sampleId = `LS-2609-${(1000 + b).toString()}`;
    const reportHash = `rep_hash_${b}_${labVerdict.toLowerCase()}_${moisture}`;

    const batchDoc: BatchRecord = {
      id: batchId,
      batchId,
      state: region.state,
      beekeeperIds: [bkAssigned.beekeeperId || 'BK-1001'],
      hiveIds: [`HV-${(1000 + b).toString()}`, `HV-${(1001 + b).toString()}`],
      harvestIds: [`HVST-${(1000 + b).toString()}`],
      floralSource: districtObj.flora,
      totalQuantityKg: 60 + ((b * 7) % 120),
      avgMoisture: Number(moisture.toFixed(1)),
      status: bStatus,
      sampleId,
      labId: 'LAB_CBRTI_PUNE',
      labName: 'Central Bee Research & Training Institute (CBRTI)',
      labReportId: bStatus !== 'created' && bStatus !== 'verified' ? reportId : undefined,
      labVerdict: bStatus !== 'created' && bStatus !== 'verified' ? labVerdict : undefined,
      reportHash: bStatus !== 'created' && bStatus !== 'verified' ? reportHash : undefined,
      packagingDetails: (bStatus === 'listed' || bStatus === 'completed') ? {
        jarSizeGrams: (b % 2 === 0) ? 500 : 250,
        packCount: 40 + (b % 50),
        packagedAt: new Date(Date.now() - (7 * 86400000)).toISOString(),
        packIds: [`${batchId}-P0001`, `${batchId}-P0002`],
      } : undefined,
      isSample: true,
      createdAt: new Date(Date.now() - (14 * 86400000)).toISOString(),
      updatedAt: timestamp,
    };
    dataset.batches.push(batchDoc);

    // 4. Lab Report
    if (bStatus !== 'created' && bStatus !== 'verified') {
      const labDoc: LabReport = {
        id: reportId,
        reportId,
        sampleId,
        batchId,
        labId: 'LAB_CBRTI_PUNE',
        labName: 'Central Bee Research & Training Institute (CBRTI) National Lab',
        accreditationNo: 'NABL-TC-0841 • FSSAI-2024',
        testedBy: 'Dr. Ramesh K. Sharma, Senior Quality Analyst',
        testDate: new Date(Date.now() - (5 * 86400000)).toISOString().split('T')[0],
        parameters: {
          moisture: Number(moisture.toFixed(1)),
          fructose: 38.5 - (labVerdict === 'ADULTERATED' ? 10 : 0),
          glucose: 31.2,
          fgRatio: Number(fgRatio.toFixed(2)),
          sucrose: labVerdict === 'ADULTERATED' ? 7.8 : 2.1,
          hmf: Number(hmf.toFixed(1)),
          pollenCountMillion: 0.85 + ((b % 5) * 0.1),
          c4Sugars: labVerdict === 'ADULTERATED' ? 'Positive' : 'Negative',
          antibioticsResidue: 'Pass',
          heavyMetals: 'Pass',
        },
        verdict: labVerdict,
        remarks: labVerdict === 'PURE'
          ? 'Complies strictly with FSSAI Honey Standards (Gazette Notification 2018). No adulterants or C4 sugars detected.'
          : 'High moisture and exogenous sugar markers detected. Failed purity compliance.',
        reportHash,
        isSample: true,
        createdAt: new Date(Date.now() - (5 * 86400000)).toISOString(),
      };
      dataset.labReports.push(labDoc);
    }

    // 5. Honey Pack for QR verification
    const packId = `${batchId}-P0001`;
    const packDoc: HoneyPack = {
      id: packId,
      packId,
      batchId,
      hiveIds: batchDoc.hiveIds,
      beekeeperId: bkAssigned.beekeeperId || 'BK-1001',
      floralSource: districtObj.flora,
      jarSizeGrams: 500,
      packagingDate: new Date(Date.now() - (6 * 86400000)).toISOString(),
      labReportId: reportId,
      labVerdict: labVerdict,
      reportHash,
      status: bStatus === 'completed' ? 'sold' : 'in_stock',
      scanCount: 3 + (b % 15),
      firstScannedAt: new Date(Date.now() - (4 * 86400000)).toISOString(),
      lastScannedAt: timestamp,
      isSample: true,
      createdAt: new Date(Date.now() - (6 * 86400000)).toISOString(),
    };
    dataset.packages.push(packDoc);

    // 6. Marketplace Listing (for listed or completed batches)
    if (bStatus === 'listed' || bStatus === 'completed') {
      const listingId = `LIST_${batchId}`;
      const price = 380 + ((b * 25) % 350);
      const mrp = price + 100;
      const listingDoc: HoneyListing = {
        id: listingId,
        batchId,
        beekeeperId: bkAssigned.beekeeperId || 'BK-1001',
        beekeeperName: bkAssigned.name,
        title: `Pure Raw ${districtObj.flora} Honey (${region.state})`,
        description: `Single-origin 100% pure raw honey harvested from ${districtObj.name}, ${region.state}. Laboratory certified by CBRTI with cryptographic QR trace.`,
        floralSource: districtObj.flora,
        state: region.state,
        jarSizeGrams: 500,
        priceInr: price,
        mrpInr: mrp,
        stockCount: bStatus === 'completed' ? 0 : (12 + (b % 28)),
        initialStock: 40,
        rawUnfiltered: true,
        status: bStatus === 'completed' ? 'out_of_stock' : 'active',
        labVerdict: 'PURE',
        labReportId: reportId,
        reportHash,
        trustScore: bkAssigned.trustScore || 95,
        createdAt: new Date(Date.now() - (5 * 86400000)).toISOString(),
        updatedAt: timestamp,
      };
      dataset.listings.push(listingDoc);
    }
  }

  // 7. Generate 125 Orders with varied statuses
  const TOTAL_ORDERS = 125;
  const orderStatuses: OrderRecord['status'][] = [
    'placed', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'
  ];

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

    // Status distribution: 12 placed, 18 paid, 15 packed, 32 shipped, 42 delivered, 6 cancelled
    let oStatus: OrderRecord['status'] = 'delivered';
    if (o <= 12) oStatus = 'placed';
    else if (o <= 30) oStatus = 'paid';
    else if (o <= 45) oStatus = 'packed';
    else if (o <= 77) oStatus = 'shipped';
    else if (o <= 119) oStatus = 'delivered';
    else oStatus = (o % 2 === 0) ? 'cancelled' : 'refunded';

    const qty = 1 + (o % 3);
    const itemTotal = (listing?.priceInr || 450) * qty;

    const orderDoc: OrderRecord = {
      id: orderId,
      orderId,
      customerId: `cust_${(1000 + (o % 40)).toString()}`,
      customerEmail: `customer.${o}@example.com`,
      customerName: `${FIRST_NAMES[(o * 2) % FIRST_NAMES.length]} ${LAST_NAMES[(o * 3) % LAST_NAMES.length]}`,
      items: [
        {
          listingId: listing?.id || 'LIST_DEFAULT',
          batchId: listing?.batchId || 'HB-DEFAULT',
          title: listing?.title || 'Pure Raw Mustard Honey',
          floralSource: listing?.floralSource || 'Mustard',
          jarSizeGrams: listing?.jarSizeGrams || 500,
          priceInr: listing?.priceInr || 450,
          quantity: qty,
          maxStock: 50,
          beekeeperName: listing?.beekeeperName || 'Beekeeper',
        },
      ],
      totalAmountInr: itemTotal,
      totalInr: itemTotal,
      subtotalInr: itemTotal,
      shippingInr: 0,
      paymentDetails: {
        method: 'MOCK_ONLINE',
        paidAt: new Date(Date.now() - ((125 - o) * 3600000 * 5)).toISOString(),
        verified: true,
      },
      shippingAddress: {
        fullName: `${FIRST_NAMES[(o * 2) % FIRST_NAMES.length]} ${LAST_NAMES[(o * 3) % LAST_NAMES.length]}`,
        phone: '+91 98111 22334',
        addressLine1: `Flat ${(o % 50) + 1}, Garden Heights`,
        addressLine2: `Sector ${(o % 15) + 1}`,
        city: cityObj.city,
        state: cityObj.state,
        pincode: cityObj.pincode,
      },
      status: oStatus,
      paymentMethod: (o % 2 === 0) ? 'UPI' : 'CREDIT_CARD',
      paymentId: `PAY-UPI-${(10000 + o).toString()}`,
      trackingNumber: oStatus === 'shipped' || oStatus === 'delivered' ? `DELHIVERY-${(100000 + o).toString()}` : undefined,
      courierName: 'Delhivery Smart Surface',
      isSample: true,
      createdAt: new Date(Date.now() - ((125 - o) * 3600000 * 5)).toISOString(),
      updatedAt: timestamp,
    };
    dataset.orders.push(orderDoc);

    // 8. Generate Realistic Reviews for delivered orders
    if (oStatus === 'delivered' && o % 2 === 0) {
      // Rating variation: 5 stars (55%), 4 stars (25%), 3 stars (12%), 2 stars (8%)
      let rating = 5;
      let comment = 'Excellent quality raw honey! The QR code verification gave full peace of mind. Will buy again.';
      if (o % 11 === 0) {
        rating = 2;
        comment = 'Too crystallized at the bottom and took 5 days to deliver. The honey is okay but packaging was leaky.';
      } else if (o % 7 === 0) {
        rating = 3;
        comment = 'Authentic taste but strong wild aroma. Slightly higher moisture than what I usually prefer.';
      } else if (o % 4 === 0) {
        rating = 4;
        comment = 'Good natural honey. Smooth texture and mild floral notes. Fast delivery to Delhi.';
      } else if (o % 3 === 0) {
        rating = 5;
        comment = 'बहुत ही शुद्ध और प्राकृतिक शहद। मधुमक्खी पालक का लाइव डेटा देखकर बहुत खुशी हुई।';
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
        createdAt: new Date(Date.now() - ((125 - o) * 3600000 * 2)).toISOString(),
      });
    }
  }

  return dataset;
}

export const SAMPLE_DATA_MASTER = generateMasterDataset();
