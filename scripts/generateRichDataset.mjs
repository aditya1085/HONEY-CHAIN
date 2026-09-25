import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore';
import crypto from 'crypto';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

console.log('=== Generating Realistic Production Dataset for Honey Chain ===');
console.log('Target Firebase Project:', config.projectId);

const app = initializeApp(config);
const db = getFirestore(app);

// 12 Authentic Indian Beekeeping Regions with Real Coordinates & Flora
const REGIONS = [
  {
    state: 'Punjab',
    stateCode: 'PB',
    district: 'Hoshiarpur',
    flora: 'Mustard',
    lat: 31.5273,
    lng: 75.9149,
    colony: 'Apis mellifera',
    hiveType: 'Langstroth',
  },
  {
    state: 'Punjab',
    stateCode: 'PB',
    district: 'Ludhiana',
    flora: 'Mustard',
    lat: 30.9010,
    lng: 75.8573,
    colony: 'Apis mellifera',
    hiveType: 'Langstroth',
  },
  {
    state: 'Himachal Pradesh',
    stateCode: 'HP',
    district: 'Kullu',
    flora: 'Apple Orchard & Multiflora',
    lat: 31.9579,
    lng: 77.1095,
    colony: 'Apis cerana indica',
    hiveType: 'Traditional',
  },
  {
    state: 'Himachal Pradesh',
    stateCode: 'HP',
    district: 'Solan',
    flora: 'Wild Multiflora',
    lat: 30.9084,
    lng: 77.0999,
    colony: 'Apis cerana indica',
    hiveType: 'Top Bar',
  },
  {
    state: 'Uttarakhand',
    stateCode: 'UK',
    district: 'Dehradun',
    flora: 'Litchi',
    lat: 30.3165,
    lng: 78.0322,
    colony: 'Apis cerana indica',
    hiveType: 'Langstroth',
  },
  {
    state: 'Uttarakhand',
    stateCode: 'UK',
    district: 'Udham Singh Nagar',
    flora: 'Mustard & Eucalyptus',
    lat: 28.9800,
    lng: 79.4000,
    colony: 'Apis mellifera',
    hiveType: 'Langstroth',
  },
  {
    state: 'Uttar Pradesh',
    stateCode: 'UP',
    district: 'Saharanpur',
    flora: 'Mustard & Eucalyptus',
    lat: 29.9679,
    lng: 77.5452,
    colony: 'Apis mellifera',
    hiveType: 'Langstroth',
  },
  {
    state: 'Uttar Pradesh',
    stateCode: 'UP',
    district: 'Lucknow',
    flora: 'Jamun & Multiflora',
    lat: 26.8467,
    lng: 80.9462,
    colony: 'Apis cerana indica',
    hiveType: 'Newton',
  },
  {
    state: 'West Bengal',
    stateCode: 'WB',
    district: 'South 24 Parganas',
    flora: 'Sundarban Mangrove Multiflora',
    lat: 22.1245,
    lng: 88.8451,
    colony: 'Apis dorsata',
    hiveType: 'Traditional',
  },
  {
    state: 'Kerala',
    stateCode: 'KL',
    district: 'Wayanad',
    flora: 'Cardamom & Forest Flora',
    lat: 11.6854,
    lng: 76.1320,
    colony: 'Tetragonula iridipennis',
    hiveType: 'Traditional',
  },
  {
    state: 'Karnataka',
    stateCode: 'KA',
    district: 'Kodagu (Coorg)',
    flora: 'Coffee Blossom',
    lat: 12.3375,
    lng: 75.8069,
    colony: 'Apis cerana indica',
    hiveType: 'Newton',
  },
  {
    state: 'Maharashtra',
    stateCode: 'MH',
    district: 'Mahabaleshwar',
    flora: 'Jamun & Hirda Multiflora',
    lat: 17.9237,
    lng: 73.6586,
    colony: 'Apis cerana indica',
    hiveType: 'Newton',
  },
  {
    state: 'Madhya Pradesh',
    stateCode: 'MP',
    district: 'Hoshangabad',
    flora: 'Karanj & Multiflora',
    lat: 22.7519,
    lng: 77.7289,
    colony: 'Apis florea',
    hiveType: 'Traditional',
  },
  {
    state: 'Tamil Nadu',
    stateCode: 'TN',
    district: 'Nilgiris',
    flora: 'Eucalyptus & Wild Thyme',
    lat: 11.4102,
    lng: 76.6950,
    colony: 'Apis cerana indica',
    hiveType: 'Newton',
  },
  {
    state: 'Rajasthan',
    stateCode: 'RJ',
    district: 'Bharatpur',
    flora: 'Yellow Mustard',
    lat: 27.2152,
    lng: 77.5030,
    colony: 'Apis mellifera',
    hiveType: 'Langstroth',
  },
  {
    state: 'Jammu & Kashmir',
    stateCode: 'JK',
    district: 'Anantnag (Tral)',
    flora: 'Kashmir White Acacia',
    lat: 33.7311,
    lng: 75.1522,
    colony: 'Apis cerana indica',
    hiveType: 'Traditional',
  },
];

const FIRST_NAMES = [
  'Gurpreet', 'Harpreet', 'Jasbir', 'Balwinder', 'Farooq', 'Ghulam', 'Bashir',
  'Ramkishore', 'Dinesh', 'Suresh', 'Debabrata', 'Animesh', 'Subhash', 'Biju',
  'Shaji', 'Appanna', 'Manjunath', 'Dnyaneshwar', 'Santosh', 'Rajeshwar',
  'Jagdish', 'Murugan', 'Kavitha', 'Sita', 'Meenakshi', 'Laxmi', 'Harish',
  'Virendra', 'Trilochan', 'Narendra', 'Amarjit', 'Pawan', 'Satish', 'Sunil'
];

const LAST_NAMES = [
  'Singh', 'Kaur', 'Mir', 'Wani', 'Verma', 'Yadav', 'Mondal', 'Biswas',
  'Thomas', 'Nair', 'Gowda', 'Hegde', 'Patil', 'More', 'Patidar', 'Meena',
  'Chettiar', 'Sharma', 'Gupta', 'Bhat', 'Rathore', 'Choudhary'
];

const LAB_IDS = ['LAB_CBRTI_PUNE', 'LAB_APEX_LUCKNOW', 'LAB_NBB_DELHI'];

export async function generateDataset() {
  const timestamp = new Date().toISOString();

  console.log('1. Generating 75 authentic Indian Beekeepers...');
  const beekeepers = [];
  const hives = [];
  const iotDevices = [];
  const sensorReadings = [];

  for (let i = 0; i < 75; i++) {
    const region = REGIONS[i % REGIONS.length];
    const fName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lName = LAST_NAMES[(i * 3 + 2) % LAST_NAMES.length];
    const fullName = `${fName} ${lName}`;
    const bkId = `BK-${1001 + i}`;
    const userId = `usr_bk_${1001 + i}`;

    // Add small random jitter (0.01 - 0.04) to coordinates so hives are distinct in region
    const jitterLat = (Math.random() - 0.5) * 0.08;
    const jitterLng = (Math.random() - 0.5) * 0.08;
    const bkLat = Number((region.lat + jitterLat).toFixed(4));
    const bkLng = Number((region.lng + jitterLng).toFixed(4));

    // Varied status: 65 approved, 7 pending, 3 rejected
    let status = 'approved';
    if (i === 12 || i === 25 || i === 38 || i === 47 || i === 58 || i === 68 || i === 73) {
      status = 'pending';
    } else if (i === 31 || i === 62 || i === 74) {
      status = 'rejected';
    }

    // Realistic Trust Score variance (74 to 99)
    const trustScore = status === 'approved' ? Math.floor(88 + Math.random() * 11) : Math.floor(70 + Math.random() * 15);

    const bkp = {
      id: bkId,
      beekeeperId: bkId,
      userId,
      name: fullName,
      state: region.state,
      district: region.district,
      address: `${region.district} Apiary Zone, ${region.state}`,
      lat: bkLat,
      lng: bkLng,
      phone: `+91 ${90000 + (i * 123) % 9000} ${10000 + (i * 321) % 89999}`,
      aadhaarLast4: String(1000 + (i * 73) % 8999),
      aadhaarHash: crypto.createHash('sha256').update(`aadhaar_salt_${i}_${bkId}`).digest('hex'),
      madhukrantiId: `NBB/${region.stateCode}/2024/${String(1000 + i)}`,
      trustScore,
      status,
      isSample: true,
      createdAt: new Date(Date.now() - (75 - i) * 86400000).toISOString(),
      updatedAt: timestamp,
    };
    beekeepers.push(bkp);

    // Create 2 to 4 hives per beekeeper (Total ~200 hives)
    const hivesCount = 2 + (i % 3);
    for (let h = 0; h < hivesCount; h++) {
      const hiveSeq = hives.length + 1001;
      const hiveId = `HV-${hiveSeq}`;
      const devSerial = `DEV-${hiveSeq}`;
      const hLat = Number((bkLat + (Math.random() - 0.5) * 0.02).toFixed(4));
      const hLng = Number((bkLng + (Math.random() - 0.5) * 0.02).toFixed(4));

      const hive = {
        id: hiveId,
        hiveId,
        beekeeperId: bkId,
        hiveType: region.hiveType,
        colonyType: region.colony,
        area: `${region.flora} Belt, ${region.district}`,
        lat: hLat,
        lng: hLng,
        status: status === 'rejected' ? 'inactive' : 'active',
        iotDeviceId: devSerial,
        isSample: true,
        createdAt: new Date(Date.now() - (60 - (i % 30)) * 86400000).toISOString(),
      };
      hives.push(hive);

      const device = {
        id: devSerial,
        deviceSerial: devSerial,
        hiveId,
        beekeeperId: bkId,
        status: status === 'rejected' ? 'inactive' : 'active',
        lastSeen: timestamp,
        isSample: true,
        createdAt: hive.createdAt,
      };
      iotDevices.push(device);

      // Create 30 days of sensor telemetry
      // Mix of healthy readings and 12% abnormal thermal/humidity spikes
      for (let day = 30; day >= 0; day -= 2) {
        const readingTime = new Date(Date.now() - day * 86400000).toISOString();
        const isSpike = (i + h + day) % 8 === 0;
        let temp = 33.8 + (Math.random() * 2.2);
        let hum = 58.0 + (Math.random() * 9.0);
        if (isSpike) {
          temp = (i % 2 === 0) ? 37.8 + Math.random() * 2.5 : 26.5 - Math.random() * 2.0;
          hum = 75.0 + Math.random() * 8.0;
        }

        sensorReadings.push({
          id: `SR-${devSerial}-D${day}`,
          deviceSerial: devSerial,
          hiveId,
          temperature: Number(temp.toFixed(1)),
          humidity: Number(hum.toFixed(1)),
          weight: Number((32.0 + (30 - day) * 0.35 + Math.random()).toFixed(1)),
          battery: Math.max(45, Math.floor(98 - day * 1.2)),
          timestamp: readingTime,
          isSample: true,
        });
      }
    }
  }

  console.log(`Created ${beekeepers.length} beekeepers, ${hives.length} hives, and ${sensorReadings.length} sensor readings.`);

  // 2. Generating 50 Batches
  console.log('2. Generating 50 realistic Batches across pipeline stages...');
  const batches = [];
  const labReports = [];
  const listings = [];

  const BATCH_STAGES = [
    'draft', 'verified', 'sent_to_lab', 'report_received', 'packaged', 'live', 'sold_out', 'rejected'
  ];

  for (let b = 0; b < 50; b++) {
    const region = REGIONS[b % REGIONS.length];
    const bkp = beekeepers[b % beekeepers.length];
    const batchId = `HB-2026-${region.stateCode}-${1001 + b}`;
    const weightKg = 80 + (b * 7) % 320;
    const stage = BATCH_STAGES[b % BATCH_STAGES.length];
    const isRejected = stage === 'rejected';

    // Purity variance: mostly 92-98%, borderline 86-90%, rejected 72-82%
    let purity = 94.0 + (Math.random() * 4.5);
    let moisture = 17.5 + (Math.random() * 2.0);
    let hmf = 14.0 + (Math.random() * 25.0);
    let verdict = 'PURE';

    if (isRejected) {
      verdict = 'ADULTERATED';
      purity = 74.0 + Math.random() * 8.0;
      moisture = 22.5 + Math.random() * 2.0; // Above 20% limit
      hmf = 88.0 + Math.random() * 20.0;     // Above 80mg/kg
    } else if (b % 7 === 0) {
      purity = 88.5; // Borderline
      moisture = 19.8;
    }

    const labId = LAB_IDS[b % LAB_IDS.length];
    const reportId = `LR-${2026}-${1001 + b}`;

    const batchDoc = {
      id: batchId,
      batchId,
      beekeeperIds: [bkp.beekeeperId],
      hiveIds: [`HV-${1001 + (b * 2) % hives.length}`],
      floralSource: region.flora,
      originState: region.state,
      totalWeightKg: weightKg,
      status: stage,
      verificationStatus: isRejected ? 'REJECTED' : (stage === 'draft' ? 'PENDING' : 'VERIFIED'),
      labVerdict: verdict,
      labReportId: reportId,
      purityPercentage: Number(purity.toFixed(1)),
      ledgerHash: crypto.createHash('sha256').update(`batch_${batchId}_${weightKg}`).digest('hex'),
      isSample: true,
      createdAt: new Date(Date.now() - (50 - b) * 86400000).toISOString(),
    };
    batches.push(batchDoc);

    // Lab Report
    const labReport = {
      id: reportId,
      reportId,
      batchId,
      labId,
      analystName: 'Senior Residue Chemist',
      fructosePercent: 38.2,
      glucosePercent: 31.4,
      fgRatio: 1.21,
      moisturePercent: Number(moisture.toFixed(1)),
      hmfMgPerKg: Number(hmf.toFixed(1)),
      c4SugarsPercent: isRejected ? 12.4 : 0.0,
      purityPercentage: Number(purity.toFixed(1)),
      verdict,
      pdfHash: crypto.createHash('sha256').update(`report_${reportId}`).digest('hex'),
      isSample: true,
      testedAt: new Date(Date.now() - (45 - b) * 86400000).toISOString(),
    };
    labReports.push(labReport);

    // If packaged, live, or sold_out, create Marketplace Listing
    if (stage === 'packaged' || stage === 'live' || stage === 'sold_out') {
      const listId = `list_${1001 + listings.length}`;
      const price = 450 + (b * 25) % 450;
      const stock = stage === 'sold_out' ? 0 : 15 + (b * 3) % 40;

      listings.push({
        id: listId,
        title: `Raw Single-Origin ${region.flora} Honey (500g)`,
        description: `Unpasteurized, cold-extracted honey gathered from native ${region.colony} bees in ${region.district}, ${region.state}. Lab certified with ${purity.toFixed(1)}% purity.`,
        floralSource: region.flora,
        batchId,
        beekeeperId: bkp.beekeeperId,
        beekeeperName: bkp.name,
        price,
        priceInr: price,
        mrp: Math.round(price * 1.25),
        mrpInr: Math.round(price * 1.25),
        stock,
        stockCount: stock,
        initialStock: stock + 20,
        jarSizeGrams: 500,
        state: region.state,
        rating: Number((4.5 + Math.random() * 0.5).toFixed(1)),
        reviewCount: 5 + (b * 3) % 25,
        status: stage === 'sold_out' ? 'sold_out' : 'active',
        rawUnfiltered: true,
        trustScore: bkp.trustScore,
        labVerdict: 'PURE',
        isSample: true,
        createdAt: batchDoc.createdAt,
        updatedAt: timestamp,
      });
    }
  }

  console.log(`Created ${batches.length} batches, ${labReports.length} lab reports, and ${listings.length} listings.`);

  // 3. Generating 120 Orders & 140 Reviews with realistic variance
  console.log('3. Generating 120 Orders & 140 Reviews with realistic feedback and rating spread...');
  const orders = [];
  const reviews = [];

  const CITIES = [
    { city: 'Delhi', state: 'Delhi', pin: '110001' },
    { city: 'Mumbai', state: 'Maharashtra', pin: '400001' },
    { city: 'Bengaluru', state: 'Karnataka', pin: '560001' },
    { city: 'Kolkata', state: 'West Bengal', pin: '700001' },
    { city: 'Chennai', state: 'Tamil Nadu', pin: '600001' },
    { city: 'Hyderabad', state: 'Telangana', pin: '500001' },
    { city: 'Pune', state: 'Maharashtra', pin: '411001' },
    { city: 'Chandigarh', state: 'Punjab', pin: '160017' },
    { city: 'Jaipur', state: 'Rajasthan', pin: '302001' },
    { city: 'Lucknow', state: 'Uttar Pradesh', pin: '226001' },
  ];

  const ORDER_STATUSES = ['delivered', 'delivered', 'shipped', 'packed', 'paid', 'placed', 'refunded'];

  for (let o = 0; o < 120; o++) {
    const custCity = CITIES[o % CITIES.length];
    const listing = listings[o % listings.length];
    const orderId = `ORD-2026-${1001 + o}`;
    const qty = 1 + (o % 3);
    const totalAmount = listing.price * qty;
    const orderStatus = ORDER_STATUSES[o % ORDER_STATUSES.length];

    orders.push({
      id: orderId,
      customerName: `${FIRST_NAMES[(o * 2) % FIRST_NAMES.length]} ${LAST_NAMES[(o * 4) % LAST_NAMES.length]}`,
      customerEmail: `customer_${1001 + o}@example.in`,
      items: [
        {
          listingId: listing.id,
          title: listing.title,
          price: listing.price,
          quantity: qty,
          floralSource: listing.floralSource,
          batchId: listing.batchId,
        }
      ],
      totalAmount,
      status: orderStatus,
      shippingAddress: {
        city: custCity.city,
        state: custCity.state,
        pincode: custCity.pin,
      },
      trackingNumber: `IN-EXP-${980000 + o}`,
      courierName: (o % 2 === 0) ? 'Blue Dart Express' : 'Delhivery Surface',
      isSample: true,
      createdAt: new Date(Date.now() - (60 - (o % 55)) * 86400000).toISOString(),
    });
  }

  // Realistic review comments for 5, 4, 3, 2 stars
  const REVIEW_TEXTS = {
    5: [
      'Unbelievable aroma! You can taste the genuine floral nectar. Scanned the QR code on the jar and verified the exact NABL report.',
      'Finest raw honey I have ever purchased in India. The crystallization proves zero adulteration and no heat treatment.',
      'The blockchain verification gave me full peace of mind. Knowing the beekeeper gets 88% direct payout makes this platform truly ethical.',
      'Very mild sweetness with rich floral undertones. My family loved it! Will definitely subscribe monthly.',
      'Superb traceability. Love that I can see the hive telemetry temperature charts right from my phone.',
    ],
    4: [
      'Pure honey, authentic taste. Crystallized naturally during cold weather. Good tamper-evident packaging.',
      'Great flavor and clean lab certificate. Delivery took 4 days to Bangalore, otherwise excellent experience.',
      'Noticeably better than commercial supermarket honey brands. Thick texture and pleasant aroma.',
      'Natural wild honey taste. Slightly floral aroma, exactly as raw honey should be.',
    ],
    3: [
      'Quality of honey is great, but courier box had a slight dent. Luckily the jar was safe inside bubble wrap.',
      'Decent raw honey. A bit sweeter than expected for mustard honey, but laboratory test passed FSSAI standards.',
      'Good product, but the delivery tracking update was slow on day 2. Received it safely though.',
    ],
    2: [
      'Jar outer seal was slightly sticky during transit. Honey tastes raw and genuine, but please improve cap seal tightness.',
      'Taste is very pungent and strong. Not suited for my tea, though family members liked it for morning warm water.',
    ],
  };

  for (let r = 0; r < 140; r++) {
    const listing = listings[r % listings.length];
    // Realistic distribution: 75% positive (5 & 4), 18% 3-star, 7% 2-star
    let rating = 5;
    if (r % 7 === 0) rating = 3;
    else if (r % 15 === 0) rating = 2;
    else if (r % 3 === 0) rating = 4;

    const reviewPool = REVIEW_TEXTS[rating];
    const comment = reviewPool[r % reviewPool.length];

    reviews.push({
      id: `REV-2026-${1001 + r}`,
      listingId: listing.id,
      batchId: listing.batchId,
      userId: `user_buyer_${1001 + r}`,
      userName: `${FIRST_NAMES[(r * 5) % FIRST_NAMES.length]} ${LAST_NAMES[(r * 7) % LAST_NAMES.length]}`,
      rating,
      comment,
      verifiedPurchase: true,
      isSample: true,
      createdAt: new Date(Date.now() - (50 - (r % 45)) * 86400000).toISOString(),
    });
  }

  console.log(`Created ${orders.length} orders and ${reviews.length} reviews.`);

  return { beekeepers, hives, iotDevices, sensorReadings, batches, labReports, listings, orders, reviews };
}
