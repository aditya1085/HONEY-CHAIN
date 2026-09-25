import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Header
    'brand.title': 'Honey Chain',
    'brand.tagline': 'Traceable Pure Honey from Hive to Home',
    'nav.home': 'Home',
    'nav.marketplace': 'Marketplace',
    'nav.verify': 'Verify QR',
    'nav.dashboard': 'Dashboard',
    'nav.approvalQueue': 'Approvals',
    'nav.activityLogs': 'Audit Trail',
    'nav.idGenerators': 'ID Engine',
    'nav.analytics': 'Analytics & AI',
    'nav.moderation': 'Moderation & Disputes',
    'nav.users': 'User Management',
    'nav.dataManager': 'Data Manager',
    'nav.settings': 'Platform Settings',
    'nav.myHives': 'My Hives',
    'nav.listings': 'My Listings',
    'nav.orders': 'Orders',
    'nav.payouts': 'Payouts & Trust',
    'nav.harvests': 'Harvests',
    'nav.harvestPool': 'Harvest Pool',
    'nav.batches': 'Batches & Registry',
    'nav.labPortal': 'Lab Portal',
    'nav.ledgerExplorer': 'Ledger Explorer',
    'nav.speciesThresholds': 'Species Thresholds',
    'nav.adminHives': 'Hives & IoT Matrix',
    'nav.apiDocs': 'IoT Dev API',
    'nav.camera': 'Camera Tool',
    'nav.signIn': 'Sign In',
    'nav.signOut': 'Sign Out',
    'nav.registerBeekeeper': 'Register as Beekeeper',
    'nav.adminConsole': 'Admin Console',
    'nav.operations': 'Operations & Control',

    // Roles
    'role.admin': 'Admin',
    'role.beekeeper': 'Beekeeper',
    'role.lab': 'Accredited Lab',
    'role.consumer': 'Consumer',
    'role.switchPersona': 'Switch Role Persona',

    // Statuses
    'status.pending': 'Pending Review',
    'status.approved': 'Approved & Verified',
    'status.rejected': 'Rejected',
    'status.suspended': 'Suspended',
    'status.active': 'Active',
    'status.packaged': 'Packaged',
    'status.sold': 'Sold',
    'status.in_stock': 'In Stock',
    'status.dormant': 'Dormant',
    'status.dispatched': 'Dispatched',
    'status.received': 'Received',
    'status.in_testing': 'In Testing',
    'status.completed': 'Completed',
    'status.delivered': 'Delivered',
    'status.shipped': 'Shipped',
    'status.placed': 'Order Placed',

    // Common Actions
    'action.cancel': 'Cancel',
    'action.confirm': 'Confirm',
    'action.save': 'Save',
    'action.close': 'Close',
    'action.search': 'Search...',
    'action.filter': 'Filter',
    'action.refresh': 'Refresh',
    'action.exportCsv': 'Export CSV',
    'action.testGenerate': 'Generate Next ID',
    'action.details': 'Details',
    'action.viewDetails': 'View Details',
    'action.addToCart': 'Add to Cart',
    'action.buyNow': 'Buy Now',
    'action.checkout': 'Proceed to Checkout',
    'action.submit': 'Submit',
    'action.delete': 'Delete',
    'action.edit': 'Edit',
    'action.update': 'Update',
    'action.back': 'Back',
    'action.next': 'Next',
    'action.download': 'Download',
    'action.downloadInvoice': 'Download Tax Invoice (PDF)',
    'action.verify': 'Verify',
    'action.scanQR': 'Scan QR Code',
    'action.clear': 'Clear',
    'action.reset': 'Reset',
    'action.add': 'Add New',
    'action.viewCart': 'View Cart',

    // Marketplace
    'market.heroTag': '100% Purity Certified • Direct From Beekeepers',
    'market.heroTitle': 'Honey Chain Marketplace',
    'market.heroDesc': 'Purchase verified single-origin raw honey with continuous IoT apiary telemetry and laboratory purity seals anchored to the blockchain.',
    'market.notifyBtn': 'Notify Me on Rare Harvests',
    'market.searchPlaceholder': 'Search by variety (Mustard, Acacia), state, or beekeeper...',
    'market.sort': 'Sort:',
    'market.sortTrust': 'Highest Trust Score',
    'market.sortPriceAsc': 'Price: Low to High',
    'market.sortPriceDesc': 'Price: High to Low',
    'market.sortNewest': 'Newest Batches',
    'market.flora': 'Flora:',
    'market.allVarieties': 'All Varieties',
    'market.state': 'State:',
    'market.allStates': 'All States',
    'market.size': 'Size:',
    'market.allSizes': 'All Sizes',
    'market.minTrust': 'Min Trust:',
    'market.allRatings': 'All Ratings',
    'market.rawOnly': '✔ Raw & Unfiltered Only',
    'market.rawToggle': 'Raw & Unfiltered',
    'market.loading': 'Loading marketplace...',
    'market.noResults': 'No honey listings match your filters',
    'market.noResultsDesc': 'Try adjusting your search criteria or subscribe for a stock alert when new batches arrive.',
    'market.batchProvenance': 'Batch Provenance:',
    'market.beekeeper': 'Beekeeper:',
    'market.trust': 'Trust',
    'market.pure': '100% PURE',
    'market.off': 'OFF',
    'market.jar': 'Jar',
    'market.outOfStock': 'Out of Stock',
    'market.inStock': 'In Stock',
    'market.stock': 'Stock:',
    'market.verifiedOnly': '100% Verified Pure & Lab Certified',
    'market.verifyProvenance': 'Inspect Provenance',
    'market.scanJarQr': 'Scan Jar QR Code',
    'market.directPayout': '88% Goes Directly to Apiculturist',

    // Product Detail Modal
    'product.detailTitle': 'Single-Origin Honey Provenance',
    'product.pureLabCertified': 'NABL Certified Pure Raw Honey',
    'product.trustScore': 'Platform Trust Score',
    'product.batchId': 'Batch ID',
    'product.beekeeperName': 'Apiculturist / Beekeeper',
    'product.stateOrigin': 'Geographical Origin',
    'product.harvestDate': 'Harvest Date',
    'product.labReportId': 'Lab Test Report #',
    'product.labVerdict': 'Chemical Purity Verdict',
    'product.telemetryNotice': 'IoT Hive Telemetry Streamed',
    'product.freeShipping': 'Free delivery across India on orders over ₹499',
    'product.addedToCart': 'Added to your honey cart!',
    'product.reviews': 'Customer Reviews & Feedback',
    'product.writeReview': 'Leave a Verified Review',
    'product.noReviews': 'No customer reviews yet. Be the first to review!',

    // Cart Drawer Modal
    'cart.title': 'Your Honey Basket',
    'cart.empty': 'Your cart is empty',
    'cart.emptyDesc': 'Explore raw, single-origin honey batches directly from accredited apiaries.',
    'cart.startShopping': 'Explore Marketplace',
    'cart.subtotal': 'Subtotal',
    'cart.shipping': 'Shipping',
    'cart.free': 'FREE',
    'cart.total': 'Total',
    'cart.checkout': 'Proceed to Instant Checkout',
    'cart.directPayoutNote': 'Direct settlement: 88% reaches the beekeeper upon delivery.',
    'cart.clear': 'Clear Cart',

    // Home View
    'home.govtBadge': 'Complements Government Madhukranti Beekeeping Portal',
    'home.heroTitle': 'Traceable Pure Honey from Hive to Your Home.',
    'home.heroDesc': 'Empowering Indian beekeepers to sell pure, lab-certified honey directly to consumers. Every jar is backed by IoT hive sensors, NABL purity reports, and cryptographic tamper-evident ledger verification.',
    'home.verifyPackBtn': 'Verify Honey Pack QR',
    'home.viewApiaryBtn': 'View My Apiary',
    'home.registerBeekeeperBtn': 'Register as Beekeeper',
    'home.exploreIdBtn': 'Explore ID Engine',
    'home.registeredBeekeepers': 'Registered Beekeepers',
    'home.registeredBeekeepersSub': 'Govt ID & Madhukranti',
    'home.trackedHives': 'Tracked Hives',
    'home.trackedHivesSub': 'IoT & Health Monitored',
    'home.purityGuarantee': 'Purity Guarantee',
    'home.purityGuaranteeSub': 'NABL Accredited Labs',
    'home.middlemen': 'Middlemen',
    'home.middlemenSub': 'Direct Farm Gate Payout',
    'home.ecoTitle': 'A Complete 4-Role Traceability Ecosystem',
    'home.ecoSubtitle': 'Engineered with strict zero-trust Firestore Security Rules, custom claims, and transaction-safe atomic IDs.',
    'home.roleBkTitle': 'Beekeeper',
    'home.roleBkDesc': 'Register apiary with GPS coordinates, verify Aadhaar last 4 & Madhukranti ID, receive automated Beekeeper ID, and monitor hives.',
    'home.roleBkAction': 'Register / Status',
    'home.roleAdminTitle': 'System Admin',
    'home.roleAdminDesc': 'Verify Madhukranti credentials, approve beekeepers, oversee audit logs, supervise atomic sequence counters and platform settings.',
    'home.roleAdminAction': 'Open Admin Queue',
    'home.roleLabTitle': 'Accredited Lab',
    'home.roleLabDesc': 'Input multi-parameter test results (moisture, HMF, sucrose, pollen count), generate cryptographic SHA-256 report hashes.',
    'home.roleLabAction': 'Access Lab Portal',
    'home.roleConsumerTitle': 'Consumer',
    'home.roleConsumerDesc': 'Scan QR codes on honey jars to trace complete hive telemetry, verify NABL purity certificates, and purchase directly.',
    'home.roleConsumerAction': 'Browse Marketplace',
    'home.smartIdTitle': 'Deterministic ID Engine Architecture',
    'home.smartIdDesc': 'Zero-collision atomic sequence generation across all supply-chain entities, ensuring complete traceability and integrity.',
    'home.tryScanner': 'Try QR Scanner',
    'home.cameraTool': 'Camera Capture Tool',

    // QR Verification
    'verify.title': 'Honey Chain QR Provenance Verifier',
    'verify.subtitle': 'Enter or scan your Honey Pack ID (e.g. HB-2609-UP-0001-P0001) to view tamper-evident lab purity certificates & IoT hive history.',
    'verify.packIdPlaceholder': 'Enter Honey Pack ID (e.g. HB-2609-UP-0001-P0001)...',
    'verify.verifyButton': 'Verify Provenance',
    'verify.demoPacks': 'Try Verified Sample Packs:',
    'verify.verifiedPurity': '100% Verified Pure Honey',
    'verify.blockchainAnchored': 'Cryptographic Ledger Verified',
    'verify.originApiary': 'Apiary Origin & Beekeeper',
    'verify.labCertification': 'NABL Lab Analysis & Verdict',
    'verify.iotConditions': 'Live Apiary & Brood Telemetry',
    'verify.firstScanned': 'First Verified Scan',
    'verify.scanCount': 'Total Scans Recorded',
    'verify.tamperProof': 'Tamper-Evident Report Hash',

    // Authentication Modal
    'auth.titleSignIn': 'Sign In to Honey Chain',
    'auth.titleSignUp': 'Create Honey Chain Account',
    'auth.subtitle': 'Traceable honey supply chain & direct-to-consumer marketplace',
    'auth.email': 'Email Address',
    'auth.emailPlaceholder': 'you@example.com',
    'auth.password': 'Password',
    'auth.passwordPlaceholder': '••••••••',
    'auth.displayName': 'Full Name',
    'auth.displayNamePlaceholder': 'Your Name',
    'auth.role': 'Account Role',
    'auth.submitSignIn': 'Sign In',
    'auth.submitSignUp': 'Create Account',
    'auth.switchModeSignUp': 'Do not have an account? Sign Up',
    'auth.switchModeSignIn': 'Already have an account? Sign In',
    'auth.orGoogle': 'Or continue with Google',
    'auth.quickDemo': 'Instant Persona Sign-In (1-Click Demo)',
    'auth.operationNotAllowedTitle': 'Firebase Email/Password Sign-In Disabled',
    'auth.operationNotAllowedDesc': 'Email/Password authentication is not yet enabled in your Firebase Console. Please follow the instructions to enable it under Firebase Console > Authentication > Sign-in method > Email/Password.',

    // Beekeeper Registration
    'reg.title': 'Beekeeper Registration Form',
    'reg.subtitle': 'Link your apiary with Honey Chain & Madhukranti Portal for transparent direct-to-consumer sales',
    'reg.fullName': 'Full Name (as per Govt ID)',
    'reg.email': 'Email Address',
    'reg.phone': 'Phone Number',
    'reg.state': 'State',
    'reg.district': 'District',
    'reg.address': 'Apiary / Farm Address',
    'reg.gps': 'GPS Coordinates',
    'reg.detectGps': 'Auto-detect GPS',
    'reg.aadhaarLast4': 'Aadhaar Last 4 Digits',
    'reg.aadhaarHint': 'Only the last 4 digits are recorded. Full Aadhaar is NEVER stored.',
    'reg.madhukrantiId': 'Madhukranti Portal ID / Registration Number',
    'reg.madhukrantiHint': 'Govt National Beekeeping & Honey Mission registration identifier',
    'reg.submit': 'Submit for Admin Verification',
    'reg.submitting': 'Registering Apiary...',
    'reg.success': 'Registration submitted! Your application is pending government ID cross-verification.',
    'reg.disclaimer': 'I certify that the information provided is accurate and complies with National Bee Board standards.',

    // Admin Queue
    'admin.queueTitle': 'Beekeeper Verification Queue',
    'admin.queueSubtitle': 'Review submitted Aadhaar Last-4, Madhukranti credentials, and apiary location before approving.',
    'admin.approve': 'Approve & Issue ID',
    'admin.reject': 'Reject',
    'admin.suspend': 'Suspend',
    'admin.checklist': 'Verification Checklist',
    'admin.aadhaarCheck': 'Aadhaar last 4 digits match & valid hash generated',
    'admin.madhukrantiCheck': 'Madhukranti portal registration ID cross-checked',
    'admin.gpsCheck': 'Apiary coordinates match agricultural/forest zone',
    'admin.reason': 'Reason for Rejection / Suspension',

    // Pending Banner
    'pending.title': 'Your Beekeeper Registration is Under Review',
    'pending.desc': 'Our admin team is currently cross-verifying your Madhukranti ID and Aadhaar details. Once approved, your unique Beekeeper ID (e.g. B045) will be generated and you can start adding hives.',

    // Orders
    'orders.title': 'My Honey Orders & Traceability',
    'orders.subtitle': 'Track real-time shipment status, view batch provenance certificates, and leave verified reviews.',
    'orders.noOrders': 'No orders found',
    'orders.noOrdersDesc': 'Explore our marketplace and order 100% verified pure raw honey directly from beekeepers.',
    'orders.orderId': 'Order ID',
    'orders.placedOn': 'Placed On',
    'orders.deliveredOn': 'Delivered On',
    'orders.totalAmount': 'Total Paid',
    'orders.items': 'Items Ordered',
    'orders.viewBatch': 'Trace Batch',
    'orders.leaveReview': 'Write Review',

    // Hives
    'hives.title': 'My Registered Hives & Apiary Telemetry',
    'hives.subtitle': 'Manage smart IoT brood chambers, record inspections, and monitor colony health.',
    'hives.addHive': 'Add New Hive',
    'hives.noHives': 'No hives registered yet',
    'hives.noHivesDesc': 'Register your first hive to start receiving live temperature, humidity, and weight alerts.',
    'hives.hiveId': 'Hive ID',
    'hives.colonyType': 'Colony Species',
    'hives.floraZone': 'Floral Zone',
    'hives.iotDevice': 'IoT Serial',
    'hives.pairIot': 'Pair IoT Sensor',
    'hives.temp': 'Temperature',
    'hives.humidity': 'Humidity',
    'hives.weight': 'Weight',

    // Harvests
    'harvest.title': 'Apiary Harvest Logs',
    'harvest.subtitle': 'Log raw honey extractions before pooling into testable certification batches.',
    'harvest.addHarvest': 'Record New Harvest',
    'harvest.noHarvests': 'No harvests recorded yet',
    'harvest.weightKg': 'Weight (Kg)',
    'harvest.date': 'Harvest Date',

    // Batches
    'batch.title': 'Batches & Registry',
    'batch.subtitle': 'Standardized honey batches under NABL testing and cryptographic blockchain anchoring.',
    'batch.batchId': 'Batch ID',
    'batch.origin': 'Origin State',
    'batch.labReport': 'Lab Report',
    'batch.verdict': 'Purity Verdict',

    // Lab Portal
    'lab.title': 'NABL Accredited Laboratory Portal',
    'lab.subtitle': 'Chemical purity analysis, C4 sugar screening, pollen count verification, and digital seal issuance.',
    'lab.samplesList': 'Received Samples for Testing',
    'lab.sampleId': 'Sample ID',
    'lab.enterReport': 'Enter Chemical Analysis',
    'lab.moisture': 'Moisture Content (%)',
    'lab.hmf': 'HMF Content (mg/kg)',
    'lab.sucrose': 'Sucrose (%)',
    'lab.c4Sugars': 'C4 Sugar Adulteration',
    'lab.pollenCount': 'Pollen Count / 10g',
    'lab.certify': 'Certify & Anchor Hash',

    // Bee Assistant (Madhubot)
    'bot.title': 'Madhubot AI Assistant',
    'bot.subtitle': 'Bilingual Beekeeping & Purity Expert',
    'bot.placeholder': 'Ask in English or हिंदी (e.g. FSSAI standards, Varroa treatment)...',
    'bot.welcome': 'Namaste! I am Madhubot (मधुमित्र). How can I help you with beekeeping, lab purity standards, or honey verification today?',

    // Analytics & AI
    'analytics.title': 'National Honey Intelligence & Analytics',
    'analytics.subtitle': 'Server-cached multi-dimensional aggregation across 5 states',
    'analytics.aiInsights': 'Gemini 3.8 Flash Supply Chain Insights',
    'analytics.recompute': 'Recompute Stats Document',

    // Data Manager
    'data.managerTitle': 'Master Data Manager & Simulator',
    'data.managerSubtitle': 'CRUD operations, CSV batch importer, sample data generator & IoT simulator',
    'data.generateSample': 'Generate Sample Data Wizard',
    'data.deleteSample': 'Delete All Sample Data',
    'data.factoryReset': 'Confirmed Factory Reset',
    'data.sensorSimulator': 'IoT Brood Telemetry Simulator',

    // Indian States
    'state.uttarPradesh': 'Uttar Pradesh',
    'state.punjab': 'Punjab',
    'state.jammuKashmir': 'Jammu & Kashmir',
    'state.westBengal': 'West Bengal',
    'state.madhyaPradesh': 'Madhya Pradesh',
    'state.maharashtra': 'Maharashtra',
    'state.himachalPradesh': 'Himachal Pradesh',
    'state.uttarakhand': 'Uttarakhand',
    'state.rajasthan': 'Rajasthan',
    'state.bihar': 'Bihar',
    'state.haryana': 'Haryana',
    'state.gujarat': 'Gujarat',
    'state.karnataka': 'Karnataka',
    'state.kerala': 'Kerala',
    'state.tamilNadu': 'Tamil Nadu',
    'state.andhraPradesh': 'Andhra Pradesh',
    'state.odisha': 'Odisha',
    'state.assam': 'Assam',

    // Honey Varieties
    'variety.mustard': 'Mustard',
    'variety.acacia': 'Acacia',
    'variety.litchi': 'Litchi',
    'variety.eucalyptus': 'Eucalyptus',
    'variety.multiflora': 'Multiflora',
    'variety.jamun': 'Jamun',
    'variety.neem': 'Neem',
    'variety.sunflower': 'Sunflower',
    'variety.kashmirAcacia': 'Kashmir White Acacia',
    'variety.wildJamun': 'Wild Forest Jamun',
    'variety.tulsi': 'Tulsi',
    'variety.sidr': 'Sidr / Ber',
    'variety.coriander': 'Coriander',

    // General
    'lang.en': 'English',
    'lang.hi': 'हिंदी',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
  },
  hi: {
    // Brand & Header
    'brand.title': 'हनी चेन (Honey Chain)',
    'brand.tagline': 'छत्ते से घर तक शुद्ध व प्रमाणित शहद',
    'nav.home': 'मुख्य पृष्ठ',
    'nav.marketplace': 'बाज़ार (मार्केटप्लेस)',
    'nav.verify': 'क्यूआर सत्यापन',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.approvalQueue': 'सत्यापन कतार',
    'nav.activityLogs': 'ऑडिट लॉग्स',
    'nav.idGenerators': 'आईडी इंजन',
    'nav.analytics': 'एनालिटिक्स एवं एआई',
    'nav.moderation': 'मॉडरेशन व विवाद',
    'nav.users': 'उपयोगकर्ता प्रबंधन',
    'nav.dataManager': 'डेटा प्रबंधक (Data Manager)',
    'nav.settings': 'प्लेटफ़ॉर्म सेटिंग्स',
    'nav.myHives': 'मेरे छत्ते (Hives)',
    'nav.listings': 'मेरी लिस्टिंग',
    'nav.orders': 'ऑर्डर ट्रैकिंग',
    'nav.payouts': 'भुगतान व ट्रस्ट',
    'nav.harvests': 'शहद फसल (Harvests)',
    'nav.harvestPool': 'फसल पूल (Harvest Pool)',
    'nav.batches': 'बैच व सत्यापन',
    'nav.labPortal': 'लैब पोर्टल (Lab)',
    'nav.ledgerExplorer': 'क्रिप्टोग्राफिक लेज़र',
    'nav.speciesThresholds': 'प्रजाति थ्रेसहोल्ड',
    'nav.adminHives': 'छत्ते एवं आईओटी मैट्रिक्स',
    'nav.apiDocs': 'आईओटी एपीआई डॉक्स',
    'nav.camera': 'कैमरा टूल',
    'nav.signIn': 'साइन इन',
    'nav.signOut': 'साइन आउट',
    'nav.registerBeekeeper': 'मधुमक्खी पालक पंजीकरण',
    'nav.adminConsole': 'प्रशासक कंसोल',
    'nav.operations': 'संचालन एवं नियंत्रण',

    // Roles
    'role.admin': 'प्रशासक (Admin)',
    'role.beekeeper': 'मधुमक्खी पालक',
    'role.lab': 'प्रमाणित प्रयोगशाला',
    'role.consumer': 'उपभोक्ता',
    'role.switchPersona': 'उपयोगकर्ता भूमिका बदलें',

    // Statuses
    'status.pending': 'समीक्षाधीन (Pending)',
    'status.approved': 'प्रमाणित एवं स्वीकृत',
    'status.rejected': 'अस्वीकृत',
    'status.suspended': 'निलंबित',
    'status.active': 'सक्रिय',
    'status.packaged': 'पैकेज्ड',
    'status.sold': 'बिक चुका',
    'status.in_stock': 'उपलब्ध',
    'status.dormant': 'निष्क्रिय',
    'status.dispatched': 'भेज दिया गया',
    'status.received': 'प्राप्त हुआ',
    'status.in_testing': 'जांच जारी',
    'status.completed': 'संपूर्ण',
    'status.delivered': 'वितरित',
    'status.shipped': 'रवाना हुआ',
    'status.placed': 'ऑर्डर दर्ज',

    // Common Actions
    'action.cancel': 'रद्द करें',
    'action.confirm': 'पुष्टि करें',
    'action.save': 'सहेजें',
    'action.close': 'बंद करें',
    'action.search': 'खोजें...',
    'action.filter': 'फ़िल्टर',
    'action.refresh': 'ताज़ा करें',
    'action.exportCsv': 'सीएसवी निर्यात',
    'action.testGenerate': 'अगली आईडी बनाएं',
    'action.details': 'विवरण',
    'action.viewDetails': 'विवरण देखें',
    'action.addToCart': 'कार्ट में जोड़ें',
    'action.buyNow': 'अभी खरीदें',
    'action.checkout': 'भुगतान की ओर बढ़ें',
    'action.submit': 'जमा करें',
    'action.delete': 'हटाएं',
    'action.edit': 'संपादित करें',
    'action.update': 'अद्यतन करें',
    'action.back': 'वापस',
    'action.next': 'आगे बढ़ें',
    'action.download': 'डाउनलोड',
    'action.downloadInvoice': 'टैक्स इनवॉइस डाउनलोड करें (PDF)',
    'action.verify': 'सत्यापित करें',
    'action.scanQR': 'क्यूआर कोड स्कैन करें',
    'action.clear': 'हटाएं',
    'action.reset': 'रीसेट',
    'action.add': 'नया जोड़ें',
    'action.viewCart': 'कार्ट देखें',

    // Marketplace
    'market.heroTag': '१००% शुद्धता प्रमाणित • सीधे मधुमक्खी पालकों से',
    'market.heroTitle': 'हनी चेन बाज़ार (Marketplace)',
    'market.heroDesc': 'आईओटी छत्ते की निगरानी व ब्लॉकचेन से सुरक्षित प्रयोगशाला रिपोर्ट के साथ १००% शुद्ध एकल-मूल कच्चा शहद खरीदें।',
    'market.notifyBtn': 'दुर्लभ शहद फसल पर मुझे सूचित करें',
    'market.searchPlaceholder': 'किस्म (सरसों, बबूल), राज्य या मधुमक्खी पालक से खोजें...',
    'market.sort': 'क्रमबद्ध:',
    'market.sortTrust': 'उच्चतम ट्रस्ट स्कोर',
    'market.sortPriceAsc': 'मूल्य: कम से अधिक',
    'market.sortPriceDesc': 'मूल्य: अधिक से कम',
    'market.sortNewest': 'नवीनतम बैच',
    'market.flora': 'किस्म / वनस्पति:',
    'market.allVarieties': 'सभी किस्में (All Varieties)',
    'market.state': 'राज्य:',
    'market.allStates': 'सभी राज्य (All States)',
    'market.size': 'मात्रा / आकार:',
    'market.allSizes': 'सभी आकार (All Sizes)',
    'market.minTrust': 'न्यूनतम ट्रस्ट:',
    'market.allRatings': 'सभी रेटिंग',
    'market.rawOnly': '✔ केवल कच्चा एवं अनफ़िल्टर्ड',
    'market.rawToggle': 'कच्चा एवं अनफ़िल्टर्ड',
    'market.loading': 'बाज़ार लोड हो रहा है...',
    'market.noResults': 'आपके फ़िल्टर के अनुसार कोई शहद उपलब्ध नहीं है',
    'market.noResultsDesc': 'कृपया अपनी खोज शर्तें बदलें या नया बैच आने पर अलर्ट प्राप्त करने हेतु सदस्यता लें।',
    'market.batchProvenance': 'बैच प्रमाणिकता:',
    'market.beekeeper': 'मधुमक्खी पालक:',
    'market.trust': 'ट्रस्ट',
    'market.pure': '१००% शुद्ध',
    'market.off': 'छूट',
    'market.jar': 'जार',
    'market.outOfStock': 'स्टॉक समाप्त',
    'market.inStock': 'स्टॉक में उपलब्ध',
    'market.stock': 'उपलब्ध स्टॉक:',
    'market.verifiedOnly': '१००% लैब प्रमाणित व शुद्ध शहद',
    'market.verifyProvenance': 'प्रमाणिकता जांचें',
    'market.scanJarQr': 'जार का क्यूआर कोड स्कैन करें',
    'market.directPayout': '८८% आय सीधे पालक के बैंक खाते में',

    // Product Detail Modal
    'product.detailTitle': 'एकल-मूल शहद उत्पत्ति एवं प्रमाणिकता',
    'product.pureLabCertified': 'एनबीबी/NABL प्रमाणित शुद्ध कच्चा शहद',
    'product.trustScore': 'प्लेटफ़ॉर्म ट्रस्ट स्कोर',
    'product.batchId': 'बैच संख्या (ID)',
    'product.beekeeperName': 'मधुमक्खी पालक का नाम',
    'product.stateOrigin': 'भौगोलिक उत्पत्ति राज्य',
    'product.harvestDate': 'शहद फसल कटाई तिथि',
    'product.labReportId': 'प्रयोगशाला रिपोर्ट संख्या',
    'product.labVerdict': 'रासायनिक शुद्धता निर्णय',
    'product.telemetryNotice': 'आईओटी छत्ते का सीधा तापमान एवं आर्द्रता डेटा',
    'product.freeShipping': '₹४९९ से अधिक के ऑर्डर पर पूरे भारत में निःशुल्क डिलीवरी',
    'product.addedToCart': 'शहद कार्ट में जोड़ दिया गया!',
    'product.reviews': 'ग्राहक समीक्षाएं एवं रेटिंग',
    'product.writeReview': 'प्रमाणित समीक्षा लिखें',
    'product.noReviews': 'अभी कोई समीक्षा नहीं है। पहली समीक्षा आप लिखें!',

    // Cart Drawer Modal
    'cart.title': 'आपकी शहद टोकरी (Cart)',
    'cart.empty': 'आपकी टोकरी खाली है',
    'cart.emptyDesc': 'सीधे प्रमाणित मधुमक्खी फार्मों से कच्चा, शुद्ध शहद देखें।',
    'cart.startShopping': 'बाज़ार में खरीदारी करें',
    'cart.subtotal': 'उप-योग (Subtotal)',
    'cart.shipping': 'शिपिंग शुल्क',
    'cart.free': 'मुफ़्त',
    'cart.total': 'कुल देय राशि',
    'cart.checkout': 'तुरंत भुगतान करें',
    'cart.directPayoutNote': 'सीधा भुगतान: डिलीवरी पर ८८% राशि सीधे पालक को मिलती है।',
    'cart.clear': 'टोकरी खाली करें',

    // Home View
    'home.govtBadge': 'सरकारी मधुक्रांति मधुमक्खी पालन पोर्टल का सहयोगी',
    'home.heroTitle': 'छत्ते से आपके घर तक शुद्ध व प्रमाणित शहद।',
    'home.heroDesc': 'भारतीय मधुमक्खी पालकों को प्रयोगशाला प्रमाणित शुद्ध शहद सीधे उपभोक्ताओं को बेचने का अवसर। हर जार आईओटी सेंसर, NABL परीक्षण और क्रिप्टोग्राफिक लेज़र से सुरक्षित है।',
    'home.verifyPackBtn': 'शहद पैक क्यूआर जांचें',
    'home.viewApiaryBtn': 'मेरा मधुमक्खी फ़ार्म देखें',
    'home.registerBeekeeperBtn': 'पालक के रूप में पंजीकरण करें',
    'home.exploreIdBtn': 'आईडी इंजन देखें',
    'home.registeredBeekeepers': 'पंजीकृत मधुमक्खी पालक',
    'home.registeredBeekeepersSub': 'सरकारी पहचान व मधुक्रांति',
    'home.trackedHives': 'निगरानी वाले छत्ते',
    'home.trackedHivesSub': 'आईओटी एवं स्वास्थ्य ट्रैक',
    'home.purityGuarantee': 'शुद्धता गारंटी',
    'home.purityGuaranteeSub': 'NABL मान्यता प्राप्त लैब',
    'home.middlemen': 'बिचौलिए',
    'home.middlemenSub': 'सीधा फ़ार्म गेट भुगतान',
    'home.ecoTitle': 'संपूर्ण ४-भूमिका आपूर्ति श्रृंखला तंत्र',
    'home.ecoSubtitle': 'सख्त ज़ीरो-ट्रस्ट सुरक्षा नियमों, कस्टम क्लेम और सुरक्षित पहचान तंत्र पर निर्मित।',
    'home.roleBkTitle': 'मधुमक्खी पालक (Beekeeper)',
    'home.roleBkDesc': 'जीपीएस से फ़ार्म पंजीकृत करें, आधार अंतिम ४ और मधुक्रांति आईडी सत्यापित करें, स्वचालित आईडी प्राप्त करें।',
    'home.roleBkAction': 'पंजीकरण / स्थिति',
    'home.roleAdminTitle': 'सिस्टम प्रशासक (Admin)',
    'home.roleAdminDesc': 'मधुक्रांति क्रेडेंशियल्स की समीक्षा करें, पालकों को स्वीकृति दें, ऑडिट लॉग्स और प्लेटफ़ॉर्म सेटिंग्स देखें।',
    'home.roleAdminAction': 'सत्यापन कतार खोलें',
    'home.roleLabTitle': 'मान्यता प्राप्त लैब (Lab)',
    'home.roleLabDesc': 'रासायनिक परीक्षण परिणाम (नमी, HMF, सूक्रोज़, परागकण) दर्ज करें और क्रिप्टोग्राफिक हैश सील जारी करें।',
    'home.roleLabAction': 'लैब पोर्टल खोलें',
    'home.roleConsumerTitle': 'उपभोक्ता (Consumer)',
    'home.roleConsumerDesc': 'जार पर क्यूआर स्कैन करके छत्ते का इतिहास, NABL रिपोर्ट देखें और बिचौलियों के बिना सीधे शुद्ध शहद खरीदें।',
    'home.roleConsumerAction': 'बाज़ार देखें',
    'home.smartIdTitle': 'विशिष्ट आईडी इंजन वास्तुकला',
    'home.smartIdDesc': 'सभी इकाइयों के लिए शून्य-टकराव क्रमिक आईडी जनरेशन, जो अटूट पारदर्शिता सुनिश्चित करता है।',
    'home.tryScanner': 'क्यूआर स्कैनर आज़माएं',
    'home.cameraTool': 'कैमरा कैप्चर टूल',

    // QR Verification
    'verify.title': 'हनी चेन क्यूआर प्रमाणिकता सत्यापन',
    'verify.subtitle': 'अपरिवर्तनीय लैब रिपोर्ट व आईओटी इतिहास देखने हेतु हनी पैक आईडी (जैसे HB-2609-UP-0001-P0001) दर्ज या स्कैन करें।',
    'verify.packIdPlaceholder': 'हनी पैक आईडी दर्ज करें (जैसे HB-2609-UP-0001-P0001)...',
    'verify.verifyButton': 'प्रमाणिकता सत्यापित करें',
    'verify.demoPacks': 'सत्यापित नमूना पैक आज़माएं:',
    'verify.verifiedPurity': '१००% सत्यापित शुद्ध शहद',
    'verify.blockchainAnchored': 'क्रिप्टोग्राफिक लेज़र सत्यापित',
    'verify.originApiary': 'मधुमक्खी पालन क्षेत्र व पालक',
    'verify.labCertification': 'NABL रासायनिक परीक्षण निर्णय',
    'verify.iotConditions': 'आईओटी ब्रूड तापमान एवं आर्द्रता',
    'verify.firstScanned': 'प्रथम सत्यापन स्कैन',
    'verify.scanCount': 'कुल रिकॉर्डेड स्कैन',
    'verify.tamperProof': 'सुरक्षित रिपोर्ट हैश (SHA-256)',

    // Authentication Modal
    'auth.titleSignIn': 'हनी चेन में साइन इन करें',
    'auth.titleSignUp': 'हनी चेन खाता बनाएं',
    'auth.subtitle': 'पारदर्शी शहद आपूर्ति श्रृंखला एवं प्रत्यक्ष बाज़ार',
    'auth.email': 'ईमेल पता',
    'auth.emailPlaceholder': 'you@example.com',
    'auth.password': 'पासवर्ड',
    'auth.passwordPlaceholder': '••••••••',
    'auth.displayName': 'पूरा नाम',
    'auth.displayNamePlaceholder': 'आपका नाम',
    'auth.role': 'खाता भूमिका',
    'auth.submitSignIn': 'साइन इन करें',
    'auth.submitSignUp': 'खाता बनाएं',
    'auth.switchModeSignUp': 'खाता नहीं है? नया बनाएं',
    'auth.switchModeSignIn': 'पहले से खाता है? साइन इन करें',
    'auth.orGoogle': 'या गूगल (Google) से जारी रखें',
    'auth.quickDemo': 'त्वरित डेमो साइन-इन (१-क्लिक)',
    'auth.operationNotAllowedTitle': 'Firebase ईमेल/पासवर्ड साइन-इन अक्षम है',
    'auth.operationNotAllowedDesc': 'आपके फायरबेस कंसोल में ईमेल/पासवर्ड प्रमाणीकरण सक्षम नहीं है। कृपया Firebase Console > Authentication > Sign-in method में जाकर Email/Password चालू करें।',

    // Beekeeper Registration
    'reg.title': 'मधुमक्खी पालक पंजीकरण फॉर्म',
    'reg.subtitle': 'पारदर्शी व सीधे उपभोक्ता तक शहद बेचने हेतु मधुक्रांति पोर्टल एवं हनी चेन से जुड़ें',
    'reg.fullName': 'पूरा नाम (सरकारी पहचान पत्र अनुसार)',
    'reg.email': 'ईमेल पता',
    'reg.phone': 'फ़ोन नंबर',
    'reg.state': 'राज्य',
    'reg.district': 'ज़िला',
    'reg.address': 'मधुमक्खी पालन क्षेत्र / फ़ार्म का पता',
    'reg.gps': 'जीपीएस निर्देशांक',
    'reg.detectGps': 'जीपीएस स्वतः प्राप्त करें',
    'reg.aadhaarLast4': 'आधार के अंतिम 4 अंक',
    'reg.aadhaarHint': 'केवल अंतिम 4 अंक संग्रहीत किए जाते हैं। पूरा आधार कभी सहेजा नहीं जाता।',
    'reg.madhukrantiId': 'मधुक्रांति पोर्टल आईडी / पंजीकरण संख्या',
    'reg.madhukrantiHint': 'राष्ट्रीय मधुमक्खी पालन एवं शहद मिशन पंजीकरण संख्या',
    'reg.submit': 'सत्यापन हेतु जमा करें',
    'reg.submitting': 'पंजीकरण हो रहा है...',
    'reg.success': 'पंजीकरण जमा हो गया! आपका आवेदन सत्यापन हेतु कतार में है।',
    'reg.disclaimer': 'मैं प्रमाणित करता हूँ कि दी गई जानकारी राष्ट्रीय मधुमक्खी बोर्ड के मानकों के अनुसार है।',

    // Admin Queue
    'admin.queueTitle': 'मधुमक्खी पालक सत्यापन कतार',
    'admin.queueSubtitle': 'स्वीकृति से पूर्व आधार अंतिम-4, मधुक्रांति क्रेडेंशियल्स एवं जीपीएस की समीक्षा करें।',
    'admin.approve': 'स्वीकृत करें और आईडी दें',
    'admin.reject': 'अस्वीकृत करें',
    'admin.suspend': 'निलंबित करें',
    'admin.checklist': 'सत्यापन चेकलिस्ट',
    'admin.aadhaarCheck': 'आधार अंतिम 4 अंक एवं सुरक्षित हैश सत्यापित',
    'admin.madhukrantiCheck': 'मधुक्रांति पोर्टल आईडी जांची गई',
    'admin.gpsCheck': 'कृषि/वन क्षेत्र के जीपीएस निर्देशांक सही हैं',
    'admin.reason': 'अस्वीकृति / निलंबन का कारण',

    // Pending Banner
    'pending.title': 'आपका पंजीकरण वर्तमान में समीक्षाधीन है',
    'pending.desc': 'हमारी टीम मधुक्रांति आईडी और आधार विवरण की जांच कर रही है। स्वीकृति मिलते ही आपकी विशिष्ट आईडी (जैसे B045) आवंटित होगी।',

    // Orders
    'orders.title': 'मेरे शहद ऑर्डर एवं ट्रैकिंग',
    'orders.subtitle': 'वास्तविक समय में शिपमेंट स्थिति देखें, बैच प्रमाण पत्र डाउनलोड करें एवं समीक्षा दें।',
    'orders.noOrders': 'कोई ऑर्डर नहीं मिला',
    'orders.noOrdersDesc': 'हमारे बाज़ार में जाएं और सीधे पालकों से १००% शुद्ध कच्चा शहद ऑर्डर करें।',
    'orders.orderId': 'ऑर्डर संख्या',
    'orders.placedOn': 'ऑर्डर तिथि',
    'orders.deliveredOn': 'वितरण तिथि',
    'orders.totalAmount': 'कुल भुगतान',
    'orders.items': 'मदें',
    'orders.viewBatch': 'बैच देखें',
    'orders.leaveReview': 'समीक्षा लिखें',

    // Hives
    'hives.title': 'मेरे पंजीकृत छत्ते एवं आईओटी टेलीमेट्री',
    'hives.subtitle': 'स्मार्ट आईओटी ब्रूड चैंबर प्रबंधित करें, निरीक्षण दर्ज करें और स्वास्थ्य देखें।',
    'hives.addHive': 'नया छत्ता जोड़ें',
    'hives.noHives': 'अभी कोई छत्ता पंजीकृत नहीं है',
    'hives.noHivesDesc': 'तापमान, आर्द्रता और वजन अलर्ट प्राप्त करने हेतु अपना पहला छत्ता पंजीकृत करें।',
    'hives.hiveId': 'छत्ता संख्या (ID)',
    'hives.colonyType': 'मधुमक्खी प्रजाति',
    'hives.floraZone': 'वनस्पति क्षेत्र',
    'hives.iotDevice': 'आईओटी सीरियल',
    'hives.pairIot': 'आईओटी सेंसर जोड़ें',
    'hives.temp': 'तापमान',
    'hives.humidity': 'आर्द्रता',
    'hives.weight': 'वजन',

    // Harvests
    'harvest.title': 'फ़ार्म शहद फसल लॉग्स',
    'harvest.subtitle': 'परीक्षण बैच में मिलाने से पूर्व कच्चे शहद की निष्कर्षण प्रविष्टियां दर्ज करें।',
    'harvest.addHarvest': 'नई फसल दर्ज करें',
    'harvest.noHarvests': 'अभी कोई फसल दर्ज नहीं है',
    'harvest.weightKg': 'वजन (किग्रा)',
    'harvest.date': 'कटाई तिथि',

    // Batches
    'batch.title': 'बैच एवं रजिस्ट्री',
    'batch.subtitle': 'NABL परीक्षण एवं ब्लॉकचेन एंकरिंग के तहत मानकीकृत शहद बैच।',
    'batch.batchId': 'बैच संख्या',
    'batch.origin': 'उत्पत्ति राज्य',
    'batch.labReport': 'लैब रिपोर्ट',
    'batch.verdict': 'शुद्धता निर्णय',

    // Lab Portal
    'lab.title': 'NABL मान्यता प्राप्त प्रयोगशाला पोर्टल',
    'lab.subtitle': 'रासायनिक शुद्धता विश्लेषण, C4 शुगर स्क्रीनिंग, परागकण जांच एवं डिजिटल सील।',
    'lab.samplesList': 'परीक्षण हेतु प्राप्त नमूने',
    'lab.sampleId': 'नमूना संख्या',
    'lab.enterReport': 'रासायनिक विश्लेषण दर्ज करें',
    'lab.moisture': 'नमी मात्रा (%)',
    'lab.hmf': 'HMF मात्रा (मिग्रा/किग्रा)',
    'lab.sucrose': 'सूक्रोज़ (%)',
    'lab.c4Sugars': 'C4 शुगर मिलावट',
    'lab.pollenCount': 'परागकण संख्या / १० ग्राम',
    'lab.certify': 'प्रमाणित करें एवं हैश सील दें',

    // Bee Assistant (Madhubot Hindi)
    'bot.title': 'मधुमित्र एआई सहायक (Madhubot)',
    'bot.subtitle': 'द्विभाषी मधुमक्खी पालन एवं शुद्धता विशेषज्ञ',
    'bot.placeholder': 'हिंदी या अंग्रेज़ी में प्रश्न पूछें (जैसे वररोआ माइट्स का उपचार, FSSAI मानक)...',
    'bot.welcome': 'नमस्ते! मैं मधुमित्र (Madhubot) हूँ। आज मैं मधुमक्खी पालन, एफएसएसएआई शुद्धता मानकों या लेज़र सत्यापन में आपकी क्या सहायता कर सकता हूँ?',

    // Analytics & AI (Hindi)
    'analytics.title': 'राष्ट्रीय शहद बुद्धिमत्ता एवं एनालिटिक्स',
    'analytics.subtitle': '५ राज्यों में सर्वर-कैश्ड बहुआयामी एकत्रीकरण',
    'analytics.aiInsights': 'जेमिनी ३.८ फ़्लैश आपूर्ति श्रृंखला विश्लेषण',
    'analytics.recompute': 'आंकड़े पुनः गणना करें',

    // Data Manager (Hindi)
    'data.managerTitle': 'मास्टर डेटा प्रबंधक एवं सिमुलेटर',
    'data.managerSubtitle': 'CRUD संचालन, सीएसवी बैच आयातक, नमूना डेटा जनरेटर एवं आईओटी सिमुलेटर',
    'data.generateSample': 'नमूना डेटा विज़ार्ड चलाएं',
    'data.deleteSample': 'सभी नमूना डेटा हटाएं',
    'data.factoryReset': 'पुष्टीकृत फ़ैक्टरी रीसेट (RESET)',
    'data.sensorSimulator': 'आईओटी ब्रूड टेलीमेट्री सिमुलेटर',

    // Indian States
    'state.uttarPradesh': 'उत्तर प्रदेश (Uttar Pradesh)',
    'state.punjab': 'पंजाब (Punjab)',
    'state.jammuKashmir': 'जम्मू और कश्मीर (Jammu & Kashmir)',
    'state.westBengal': 'पश्चिम बंगाल (West Bengal)',
    'state.madhyaPradesh': 'मध्य प्रदेश (Madhya Pradesh)',
    'state.maharashtra': 'महाराष्ट्र (Maharashtra)',
    'state.himachalPradesh': 'हिमाचल प्रदेश (Himachal Pradesh)',
    'state.uttarakhand': 'उत्तराखंड (Uttarakhand)',
    'state.rajasthan': 'राजस्थान (Rajasthan)',
    'state.bihar': 'बिहार (Bihar)',
    'state.haryana': 'हरियाणा (Haryana)',
    'state.gujarat': 'गुजरात (Gujarat)',
    'state.karnataka': 'कर्नाटक (Karnataka)',
    'state.kerala': 'केरल (Kerala)',
    'state.tamilNadu': 'तमिलनाडु (Tamil Nadu)',
    'state.andhraPradesh': 'आंध्र प्रदेश (Andhra Pradesh)',
    'state.odisha': 'ओडिशा (Odisha)',
    'state.assam': 'असम (Assam)',

    // Honey Varieties
    'variety.mustard': 'सरसों (Mustard)',
    'variety.acacia': 'बबूल / कीकर (Acacia)',
    'variety.litchi': 'लीची (Litchi)',
    'variety.eucalyptus': 'सफ़ेदा / नीलगिरी (Eucalyptus)',
    'variety.multiflora': 'मल्टीफ्लोरा / बहुपुष्पी (Multiflora)',
    'variety.jamun': 'जामुन (Jamun)',
    'variety.neem': 'नीम (Neem)',
    'variety.sunflower': 'सूरजमुखी (Sunflower)',
    'variety.kashmirAcacia': 'कश्मीर व्हाइट बबूल (Acacia)',
    'variety.wildJamun': 'जंगली जामुन शहद (Wild Jamun)',
    'variety.tulsi': 'तुलसी (Tulsi)',
    'variety.sidr': 'बेर / सिद्र (Sidr)',
    'variety.coriander': 'धनिया (Coriander)',

    // General
    'lang.en': 'English',
    'lang.hi': 'हिंदी',
    'theme.light': 'लाइट',
    'theme.dark': 'डार्क',
  },
};

// Fallback normalized dictionary for phrases rendered as raw English text
const phraseDictionary: Record<string, string> = {
  // Navigation & buttons
  'home': 'मुख्य पृष्ठ',
  'marketplace': 'बाज़ार',
  'verify qr': 'क्यूआर सत्यापन',
  'dashboard': 'डैशबोर्ड',
  'sign in': 'साइन इन',
  'sign out': 'साइन आउट',
  'my hives': 'मेरे छत्ते',
  'my listings': 'मेरी लिस्टिंग',
  'listings': 'मेरी लिस्टिंग',
  'orders': 'ऑर्डर',
  'harvests': 'शहद फसल',
  'harvest pool': 'फसल पूल',
  'batches & registry': 'बैच व सत्यापन',
  'batches': 'बैच',
  'lab portal': 'लैब पोर्टल',
  'analytics & ai': 'एनालिटिक्स एवं एआई',
  'data manager': 'डेटा प्रबंधक',
  'admin console': 'प्रशासक कंसोल',
  'approvals': 'सत्यापन कतार',
  'moderation & disputes': 'मॉडरेशन व विवाद',
  'user management': 'उपयोगकर्ता प्रबंधन',
  'payouts & trust score': 'भुगतान व ट्रस्ट स्कोर',
  'payouts & trust': 'भुगतान व ट्रस्ट',
  'audit trail (csv export)': 'ऑडिट लॉग्स (सीएसवी निर्यात)',
  'audit trail': 'ऑडिट लॉग्स',
  'cryptographic ledger': 'क्रिप्टोग्राफिक लेज़र',
  'platform settings': 'प्लेटफ़ॉर्म सेटिंग्स',
  'camera tool': 'कैमरा टूल',
  'id engine': 'आईडी इंजन',

  // Filters & sorting
  'flora:': 'किस्म:',
  'state:': 'राज्य:',
  'size:': 'आकार:',
  'sort:': 'क्रम:',
  'min trust:': 'न्यूनतम ट्रस्ट:',
  'all varieties': 'सभी किस्में (All Varieties)',
  'all states': 'सभी राज्य (All States)',
  'all sizes': 'सभी आकार (All Sizes)',
  'highest trust score': 'उच्चतम ट्रस्ट स्कोर',
  'price: low to high': 'मूल्य: कम से अधिक',
  'price: high to low': 'मूल्य: अधिक से कम',
  'newest batches': 'नवीनतम बैच',
  'raw & unfiltered': 'कच्चा एवं अनफ़िल्टर्ड',
  '✔ raw & unfiltered only': '✔ केवल कच्चा एवं अनफ़िल्टर्ड',

  // States
  'uttar pradesh': 'उत्तर प्रदेश',
  'punjab': 'पंजाब',
  'jammu & kashmir': 'जम्मू और कश्मीर',
  'west bengal': 'पश्चिम बंगाल',
  'madhya pradesh': 'मध्य प्रदेश',
  'maharashtra': 'महाराष्ट्र',
  'himachal pradesh': 'हिमाचल प्रदेश',
  'uttarakhand': 'उत्तराखंड',
  'rajasthan': 'राजस्थान',
  'bihar': 'बिहार',
  'haryana': 'हरियाणा',
  'gujarat': 'गुजरात',
  'karnataka': 'कर्नाटक',
  'kerala': 'केरल',
  'tamil nadu': 'तमिलनाडु',
  'andhra pradesh': 'आंध्र प्रदेश',
  'odisha': 'ओडिशा',
  'assam': 'असम',

  // Varieties
  'mustard': 'सरसों (Mustard)',
  'acacia': 'बबूल (Acacia)',
  'litchi': 'लीची (Litchi)',
  'eucalyptus': 'नीलगिरी (Eucalyptus)',
  'multiflora': 'मल्टीफ्लोरा (Multiflora)',
  'jamun': 'जामुन (Jamun)',
  'neem': 'नीम (Neem)',
  'sunflower': 'सूरजमुखी (Sunflower)',
  'kashmir white acacia': 'कश्मीर व्हाइट बबूल',
  'wild forest jamun': 'जंगली जामुन शहद',
  'tulsi': 'तुलसी (Tulsi)',
  'sidr / ber': 'बेर / सिद्र (Sidr)',
  'coriander': 'धनिया (Coriander)',

  // Common UI labels
  'add to cart': 'कार्ट में जोड़ें',
  'details': 'विवरण',
  'view details': 'विवरण देखें',
  'cancel': 'रद्द करें',
  'confirm': 'पुष्टि करें',
  'save': 'सहेजें',
  'close': 'बंद करें',
  'clear': 'हटाएं',
  'delete': 'हटाएं',
  'edit': 'संपादित करें',
  'back': 'वापस',
  'submit': 'जमा करें',
  'search...': 'खोजें...',
  'refresh': 'ताज़ा करें',
  'filter': 'फ़िल्टर',
  'loading...': 'लोड हो रहा है...',
  '100% pure': '१००% शुद्ध',
  'in stock': 'स्टॉक में उपलब्ध',
  'out of stock': 'स्टॉक समाप्त',
  'beekeeper': 'मधुमक्खी पालक',
  'batch provenance:': 'बैच प्रमाणिकता:',
  'view cart': 'कार्ट देखें',
  'your honey basket': 'आपकी शहद टोकरी',
  'subtotal': 'उप-योग',
  'shipping': 'शिपिंग',
  'free': 'मुफ़्त',
  'total': 'कुल राशि',
  'proceed to instant checkout': 'तुरंत भुगतान करें',
  '100% purity certified • direct from beekeepers': '१००% शुद्धता प्रमाणित • सीधे मधुमक्खी पालकों से',
  'notify me on rare harvests': 'दुर्लभ शहद फसल पर सूचित करें',
  'search by variety (mustard, acacia), state, or beekeeper...': 'किस्म (सरसों, बबूल), राज्य या मधुमक्खी पालक से खोजें...',
  'download tax invoice (pdf)': 'टैक्स इनवॉइस डाउनलोड करें (PDF)',
  'verify honey pack qr': 'शहद पैक क्यूआर जांचें',
  'register as beekeeper': 'मधुमक्खी पालक पंजीकरण',
  'view my apiary': 'मेरा मधुमक्खी फ़ार्म देखें',
  'explore id engine': 'आईडी इंजन देखें',
  'registered beekeepers': 'पंजीकृत मधुमक्खी पालक',
  'tracked hives': 'निगरानी वाले छत्ते',
  'purity guarantee': 'शुद्धता गारंटी',
  'middlemen': 'बिचौलिए',
  'direct farm gate payout': 'सीधा फ़ार्म गेट भुगतान',
  'govt id & madhukranti': 'सरकारी पहचान व मधुक्रांति',
  'nabl accredited labs': 'NABL मान्यता प्राप्त लैब',
  'iot & health monitored': 'आईओटी एवं स्वास्थ्य ट्रैक',

  // Admin & Analytics Headings
  'executive analytics & ai intelligence': 'कार्यकारी एनालिटिक्स एवं एआई इंटेलिजेंस',
  'ai-driven telemetry insights, demand forecasting, anomaly detection, and regional quality heat-maps.': 'एआई आधारित आईओटी अंतर्दृष्टि, मांग पूर्वानुमान, विसंगति पहचान और क्षेत्रीय गुणवत्ता हीट-मैप।',
  'total revenue': 'कुल राजस्व (GMV)',
  'active beekeepers': 'सक्रिय मधुमक्खी पालक',
  'monitored hives': 'ट्रैक किए गए छत्ते',
  'lab verified honey': 'लैब प्रमाणित शुद्ध शहद',
  'ai insights & health alerts': 'एआई अंतर्दृष्टि एवं स्वास्थ्य चेतावनी',
  'gemini-powered audit & harvest prediction': 'जेमिनी आधारित ऑडिट एवं शहद फसल पूर्वानुमान',
  'anomalies detected': 'पहचानी गई विसंगतियां',
  '30-day harvest projection': '३०-दिवसीय फसल पूर्वानुमान',
  'actionable recommendations': 'महत्वपूर्ण कार्य सिफ़ारिशें',
  'floral variety distribution': 'पुष्प प्रजाति वितरण (Floral Distribution)',
  'colony species matrix': 'छत्ता मधुमक्खी प्रजाति मैट्रिक्स (Species Matrix)',
  'quality compliance & state purity heat-map': 'गुणवत्ता अनुपालन एवं राज्य शुद्धता हीट-मैप',
  'cross-referenced against fssai honey guidelines (moisture ≤ 20%, hmf ≤ 80mg/kg, c4 negative)': 'FSSAI मानकों (नमी ≤ २०%, HMF ≤ ८० mg/kg, C4 शून्य) के विरुद्ध सत्यापित',
  '100% c4 adulteration free': '१००% C4 मिलावट रहित',
  'fssai compliant': 'FSSAI प्रमाणित',
  'state / region': 'राज्य / क्षेत्र',
  'hives registered': 'पंजीकृत छत्ते',
  'total harvest': 'कुल शहद उत्पादन',
  'sales gmv': 'कुल बिक्री (GMV)',
  'purity compliance': 'शुद्धता अनुपालन',
  'status': 'स्थिति',

  // Data Manager
  'system data & operations manager': 'सिस्टम डेटा एवं संचालन प्रबंधक',
  'full entity crud, csv/excel import with mapping preview, linked sample generator, confirmed reset, and live sensor simulator.': 'पूर्ण इकाई प्रबंधन, सीएसवी आयात, नमूना डेटा जनरेटर, सिस्टम रीसेट और आईओटी सिम्युलेटर।',
  'realistic linked sample dataset wizard': 'यथार्थवादी लिंक किया गया नमूना डेटासेट विज़ार्ड',
  'generate full sample dataset': 'पूर्ण नमूना डेटासेट उत्पन्न करें',
  'populating multi-entity graph...': 'मल्टी-इकाई ग्राफ़ तैयार हो रहा है...',
  'purge sample data': 'नमूना डेटा साफ़ करें',
  'delete all sample records': 'सभी नमूना रिकॉर्ड हटाएं',
  'production baseline setup': 'उत्पादन बेसलाइन सेटअप',
  'initialize production baseline': 'उत्पादन बेसलाइन प्रारंभ करें',
  'initializing baseline...': 'बेसलाइन प्रारंभ हो रही है...',
  'clearing sample data...': 'नमूना डेटा साफ़ हो रहा है...',
  'factory reset platform': 'फ़ैक्टरी रीसेट प्लेटफ़ॉर्म',
  'clear all records': 'सभी रिकॉर्ड हटाएं',
  'iot telemetry live simulator': 'आईओटी टेलीमेट्री लाइव सिम्युलेटर',
  'send single reading': 'एकल रीडिंग भेजें',
  'auto stream (5s)': 'स्वचालित प्रवाह (५ से)',
  'stop streaming': 'प्रवाह रोकें',
  'temperature (°c)': 'तापमान (°C)',
  'humidity (%)': 'आर्द्रता (%)',
  'hive weight (kg)': 'छत्ते का वजन (kg)',
  'battery level (%)': 'बैटरी स्तर (%)',

  // Table Headers
  'hive id': 'छत्ता संख्या (ID)',
  'species & architecture': 'प्रजाति एवं छत्ता प्रकार',
  'flora / gps': 'पुष्प स्रोत / जीपीएस',
  'iot device': 'आईओटी उपकरण',
  'actions': 'कार्रवाई',
  'name': 'नाम',
  'district': 'जिला',
  'state': 'राज्य',
  'aadhaar': 'आधार',
  'madhukranti id': 'मधुक्रांति आईडी',
  'trust score': 'ट्रस्ट स्कोर',
  'applied date': 'आवेदन तिथि',
  'user email': 'ईमेल',
  'display name': 'नाम',
  'assigned role': 'निर्धारित भूमिका',
  'created at': 'निर्माण तिथि',
  'batch id': 'बैच संख्या (ID)',
  'floral source': 'पुष्प स्रोत',
  'origin state': 'उत्पत्ति राज्य',
  'harvest kg': 'फसल (kg)',
  'lab report': 'लैब रिपोर्ट',
  'lab verdict': 'लैब निर्णय',
  'date': 'तिथि',
  'order id': 'ऑर्डर संख्या',
  'items': 'सामग्री',
  'total amount': 'कुल राशि',
  'order status': 'ऑर्डर स्थिति',
  'tracking': 'ट्रैकिंग',

  // Status values
  'pending': 'सत्यापन लंबित',
  'approved': 'स्वीकृत एवं सत्यापित',
  'rejected': 'अस्वीकृत',
  'active': 'सक्रिय',
  'inactive': 'निष्क्रिय',
  'packaged': 'पैकेज्ड व सीलबंद',
  'verified': 'सत्यापित',
  'pure': '१००% शुद्ध',
  'adulterated': 'मिलावटी / अस्वीकृत',
  'delivered': 'सफलतापूर्वक डिलीवर',
  'shipped': 'डिलीवरी हेतु रवाना',
  'paid': 'भुगतान सफल',
  'placed': 'ऑर्डर प्राप्त',
  'refunded': 'वापस / रिफंडेड',
  'draft': 'ड्राफ़्ट',

  // Approval Queue
  'admin approval queue': 'प्रशासक स्वीकृति कतार',
  'review and verify pending beekeeper applications, madhukranti credentials, and apiary documentation.': 'लंबित मधुमक्खी पालक आवेदनों, मधुक्रांति पहचान और फार्म दस्तावेजों की समीक्षा व सत्यापन करें।',
  'verify madhukranti': 'मधुक्रांति सत्यापन',
  'approve & issue credentials': 'स्वीकृति दें एवं क्रेडेंशियल जारी करें',
  'reject application': 'आवेदन अस्वीकृत करें',
  'put on hold': 'होल्ड पर रखें',
  'audit documentation': 'ऑडिट दस्तावेज',

  // User Management
  'user management & role control': 'उपयोगकर्ता प्रबंधन एवं भूमिका नियंत्रण',
  'view all registered platform accounts and monitor immutable role allocations.': 'सभी पंजीकृत प्लेटफ़ॉर्म खातों की निगरानी और अपरिवर्तनीय भूमिका आवंटन देखें।',
  'admin accounts': 'प्रशासक खाते',
  'beekeeper accounts': 'पालक खाते',
  'lab accounts': 'लैब खाते',
  'consumer accounts': 'उपभोक्ता खाते',

  // Moderation & Disputes
  'marketplace moderation & dispute resolution': 'मार्केटप्लेस मॉडरेशन एवं विवाद समाधान',
  'monitor customer reviews, manage ai fraud flags, and resolve customer order disputes.': 'ग्राहक समीक्षाओं की निगरानी, एआई धोखाधड़ी अलर्ट और ऑर्डर विवादों का त्वरित समाधान करें।',
  'customer disputes': 'ग्राहक विवाद',
  'customer reviews & ratings': 'ग्राहक समीक्षाएं एवं रेटिंग',
  'resolve dispute': 'विवाद हल करें',
  'issue refund': 'रिफंड जारी करें',

  // Platform Settings
  'platform economic & quality settings': 'प्लेटफ़ॉर्म आर्थिक एवं गुणवत्ता सेटिंग्स',
  'configure direct farm-gate payout percentages, fssai lab thresholds, and global iot parameters.': 'सीधे पालक भुगतान प्रतिशत (८८%), FSSAI रासायनिक सीमाएं और आईओटी सीमाएं निर्धारित करें।',
  'beekeeper payout share (%)': 'मधुमक्खी पालक भुगतान हिस्सा (८८%)',
  'platform fee share (%)': 'प्लेटफ़ॉर्म संचालन शुल्क (१२%)',
  'fssai max moisture (%)': 'अधिकतम नमी सीमा (२०%)',
  'fssai max hmf (mg/kg)': 'अधिकतम HMF सीमा (८० mg/kg)',
  'fssai min fructose/glucose ratio': 'न्यूनतम F/G अनुपात (१.०)',
  'iot safe min temperature (°c)': 'आईओटी न्यूनतम सुरक्षित तापमान (३२°C)',
  'iot safe max temperature (°c)': 'आईओटी अधिकतम सुरक्षित तापमान (३६.५°C)',
  'iot safe min humidity (%)': 'आईओटी न्यूनतम सुरक्षित आर्द्रता (५५%)',
  'iot safe max humidity (%)': 'आईओटी अधिकतम सुरक्षित आर्द्रता (७०%)',
  'save platform settings': 'प्लेटफ़ॉर्म सेटिंग्स सहेजें',

  // Lab Portal
  'accredited laboratory testing portal': 'मान्यता प्राप्त प्रयोगशाला परीक्षण पोर्टल',
  'conduct fssai-certified chemical analysis on pooled harvest batches, issue cryptographically hashed reports.': 'शहद बैचों का FSSAI रासायनिक परीक्षण करें और क्रिप्टोग्राफिक हैश सील युक्त रिपोर्ट जारी करें।',
  'awaiting testing': 'परीक्षण की प्रतीक्षा में',
  'testing completed': 'परीक्षण पूर्ण',
  'enter test results': 'परीक्षण परिणाम दर्ज करें',
  'fructose (%)': 'फ्रुक्टोज़ प्रतिशत (%)',
  'glucose (%)': 'ग्लूकोज़ प्रतिशत (%)',
  'calculated f/g ratio': 'गणना किया गया F/G अनुपात',
  'c4 carbon sugars': 'C4 कार्बन शर्करा परीक्षण',
  'issue lab verdict & cryptographic seal': 'लैब निर्णय एवं डिजिटल सील जारी करें',

  // Hive Management & Telemetry
  'hives & iot matrix': 'छत्ते एवं आईओटी सेंसर मैट्रिक्स',
  'real-time telemetry monitoring across all registered hives in india.': 'भारत भर में सभी पंजीकृत छत्तों की वास्तविक समय आईओटी निगरानी।',
  'all registered hives': 'सभी पंजीकृत छत्ते',
  'paired iot hardware': 'संबद्ध आईओटी उपकरण',
  'print qr identity sticker': 'क्यूआर पहचान स्टिकर प्रिंट करें',
  'health status': 'स्वास्थ्य स्थिति',
  'battery': 'बैटरी',
  'last seen': 'अंतिम सिग्नल',

  // Harvests & Pool
  'harvest pool & batch aggregation': 'शहद फसल पूल एवं बैच समूहन',
  'aggregate single-beekeeper harvests into verifiable commercial testing batches.': 'व्यक्तिगत पालकों की फसल को व्यावसायिक परीक्षण बैचों में एकत्रित करें।',
  'create new batch': 'नया बैच बनाएं',
  'selected harvests weight': 'चयनित फसल वजन',
  'send batch to accredited lab': 'बैच को मान्यता प्राप्त लैब में भेजें',

  // My Hives & Beekeeper Views
  'my apiary hives': 'मेरे मधुमक्खी छत्ते',
  'monitor your brood temperature, humidity, and honey weight in real-time.': 'अपने छत्तों के तापमान, आर्द्रता और शहद उत्पादन की लाइव निगरानी करें।',
  'register new hive': 'नया छत्ता पंजीकृत करें',
  'healthy brood temperature': 'सुरक्षित ब्रूड तापमान',
  'active iot stream': 'सक्रिय आईओटी सिग्नल',

  // Access Denied & Role Lock
  'access denied — role restricted': 'पहुंच अस्वीकृत — भूमिका प्रतिबंधित',
  'access denied': 'पहुंच अस्वीकृत',
  'return to authorized dashboard': 'अधिकृत डैशबोर्ड पर वापस जाएं',
  'admin authorization required': 'प्रशासक अनुमति आवश्यक',
  'beekeeper portal only': 'केवल मधुमक्खी पालक पोर्टल',
  'lab portal only': 'केवल लैब पोर्टल',

  // Admin Analytics & Charts
  'platform analytics': 'प्लेटफ़ॉर्म समग्र एनालिटिक्स',
  'executive summary': 'कार्यकारी सारांश',
  'ai anomaly detection': 'एआई विसंगति पहचान (AI Anomaly)',
  'ai harvest forecasts': 'एआई फसल पूर्वानुमान',
  'ai recommendations': 'एआई रणनीतिक सुझाव',
  'recompute metrics': 'मेट्रिक्स पुनः गणना करें',
  'recomputing...': 'गणना जारी...',
  'quality metrics': 'गुणवत्ता मेट्रिक्स (FSSAI)',
  'state yields': 'राज्यवार शहद उत्पादन',
  'monthly trends': 'मासिक रुझान (Trends)',
  'species distribution': 'मधुमक्खी प्रजाति वितरण',
  'floral distribution': 'वानस्पतिक स्रोत वितरण',
  'purity distribution': 'शुद्धता वितरण अनुपात',
  'fssai compliance rate': 'FSSAI अनुपालन दर',
  'avg moisture content': 'औसत नमी प्रतिशत',
  'average moisture': 'औसत नमी',
  'average hmf': 'औसत HMF स्तर',
  'c4 pass rate': 'C4 शर्करा उत्तीर्ण दर',
  'gross merchandise value': 'सकल व्यापार मूल्य (GMV)',
  'total gmv': 'कुल व्यापार मूल्य (GMV)',
  'beekeeper earnings (88%)': 'पालक प्रत्यक्ष आय (८८%)',
  'platform revenue (12%)': 'प्लेटफ़ॉर्म संचालन शुल्क (१२%)',
  'total beekeepers': 'कुल मधुमक्खी पालक',
  'total hives': 'कुल पंजीकृत छत्ते',
  'active hives': 'सक्रिय छत्ते',
  'total batches': 'कुल शहद बैच',
  'pure batches': 'प्रमाणित शुद्ध बैच',
  'flagged batches': 'अस्वीकृत / संदिग्ध बैच',
  'total orders': 'कुल ग्राहक ऑर्डर',
  'avg order value': 'औसत ऑर्डर मूल्य',
  'ai insights': 'एआई अंतर्दृष्टि (AI Insights)',
  'ai quality & yield insights': 'एआई गुणवत्ता एवं उत्पादन अंतर्दृष्टि',
  'geographic coverage & telemetry map': 'राष्ट्रीय भौगोलिक विस्तार एवं आईओटी मानचित्र',
  'all 12 certified indian honey belts': 'भारत के सभी १२ प्रमाणित शहद क्षेत्र',

  // Lab Portal & Chemical Analysis
  'laboratory test report': 'प्रयोगशाला परीक्षण रिपोर्ट',
  'enter test parameters': 'परीक्षण पैरामीटर दर्ज करें',
  'moisture content': 'नमी प्रतिशत (%)',
  'moisture (%)': 'नमी (%)',
  'fructose concentration': 'फ्रुक्टोज़ सांद्रता (%)',
  'glucose concentration': 'ग्लूकोज़ सांद्रता (%)',
  'f/g ratio': 'F/G अनुपात',
  'sucrose content': 'सुक्रोज़ प्रतिशत (%)',
  'sucrose (%)': 'सुक्रोज़ (%)',
  'hmf (mg/kg)': 'HMF स्तर (mg/kg)',
  'pollen density': 'पराग कण घनत्व (मिलियन/ग्राम)',
  'c4 carbon sugar test': 'C4 कार्बन शर्करा परीक्षण',
  'c4 test': 'C4 परीक्षण',
  'antibiotics residue': 'एंटीबायोटिक अवशेष',
  'heavy metals test': 'भारी धातु परीक्षण',
  'chemical verdict': 'रासायनिक शुद्धता निर्णय',
  'sub_standard': 'मानक से कम (SUB-STANDARD)',
  'issue digital certificate': 'डिजिटल प्रमाणपत्र व क्रिप्टोग्राफिक सील जारी करें',
  'tested by': 'परीक्षणकर्ता (वरिष्ठ विश्लेषक)',
  'accreditation no.': 'मान्यता संख्या (NABL No.)',
  'test date': 'परीक्षण तिथि',
  'remarks': 'टिप्पणी / विवरण',

  // Orders & Tracking
  'order tracking': 'ऑर्डर ट्रैकिंग',
  'order date': 'ऑर्डर तिथि',
  'customer name': 'ग्राहक का नाम',
  'customer email': 'ग्राहक ईमेल',
  'shipping address': 'वितरण पता',
  'courier': 'कूरियर पार्टनर',
  'tracking no': 'ट्रैकिंग संख्या',
  'download invoice': 'टैक्स इनवॉइस डाउनलोड करें',
  'payment method': 'भुगतान माध्यम',

  // Beekeeper Modals & Registration
  'add hive': 'नया छत्ता जोड़ें',
  'edit hive': 'छत्ता विवरण संपादित करें',
  'hive type': 'छत्ता प्रकार',
  'colony type': 'कालोनी प्रजाति',
  'apiary area': 'फार्म क्षेत्र',
  'land type': 'भूमि प्रकार',
  'expected yield': 'अनुमानित वार्षिक शहद (किलो)',
  'iot device id': 'आईओटी उपकरण आईडी',
  'battery level': 'बैटरी स्तर',
  'pair device': 'उपकरण संबद्ध करें',
  'record harvest': 'शहद फसल दर्ज करें',
  'quantity (kg)': 'मात्रा (किलो)',
  'extraction date': 'निष्कासन तिथि',
  'extraction method': 'निष्कासन विधि',

  // Common UI actions & generic terms
  'pure raw honey': 'शुद्ध प्राकृतिक कच्चा शहद',
  'raw honey': 'कच्चा शहद',
  'honey chain': 'हनी चेन (Honey Chain)',
};

const originalTextMap = new WeakMap<Node, string>();
const originalPlaceholderMap = new WeakMap<Element, string>();
const originalTitleMap = new WeakMap<Element, string>();

const WORD_DICTIONARY: Record<string, string> = {
  beekeepers: 'मधुमक्खी पालक',
  beekeeper: 'मधुमक्खी पालक',
  hives: 'छत्ते',
  hive: 'छत्ता',
  harvests: 'शहद फसल',
  harvest: 'फसल',
  batches: 'बैच',
  batch: 'बैच',
  orders: 'ऑर्डर',
  order: 'ऑर्डर',
  packages: 'पैकेज',
  package: 'पैकेज',
  reports: 'रिपोर्ट',
  report: 'रिपोर्ट',
  readings: 'रीडिंग',
  reading: 'रीडिंग',
  devices: 'उपकरण',
  device: 'उपकरण',
  telemetry: 'आईओटी टेलीमेट्री',
  analytics: 'एनालिटिक्स',
  settings: 'सेटिंग्स',
  status: 'स्थिति',
  total: 'कुल',
  active: 'सक्रिय',
  pending: 'समीक्षाधीन',
  approved: 'स्वीकृत',
  rejected: 'अस्वीकृत',
  completed: 'संपूर्ण',
  delivered: 'वितरित',
  shipped: 'रवाना',
  pure: 'शुद्ध',
  purity: 'शुद्धता',
  adulterated: 'मिलावटी',
  moisture: 'नमी',
  temperature: 'तापमान',
  humidity: 'आर्द्रता',
  weight: 'वजन',
  battery: 'बैटरी',
  search: 'खोजें',
  filter: 'फ़िल्टर',
  download: 'डाउनलोड',
  export: 'निर्यात',
  import: 'आयात',
  save: 'सहेजें',
  cancel: 'रद्द करें',
  submit: 'जमा करें',
  confirm: 'पुष्टि करें',
  delete: 'हटाएं',
  clear: 'हटाएं',
  close: 'बंद करें',
  edit: 'संपादित करें',
  view: 'देखें',
  details: 'विवरण',
  actions: 'कार्य',
  admin: 'प्रशासक',
  consumer: 'उपभोक्ता',
  lab: 'प्रयोगशाला',
  price: 'मूल्य',
  stock: 'स्टॉक',
  quantity: 'मात्रा',
  date: 'तिथि',
  name: 'नाम',
  email: 'ईमेल',
  phone: 'फ़ोन',
  state: 'राज्य',
  district: 'जिला',
  address: 'पता',
  verified: 'सत्यापित',
  healthy: 'स्वस्थ',
  score: 'स्कोर',
  trust: 'विश्वास',
  revenue: 'राजस्व',
  earnings: 'कमाई',
  payout: 'भुगतान',
  payouts: 'भुगतान',
  logout: 'साइन आउट',
  login: 'साइन इन',
  signin: 'साइन इन',
  signout: 'साइन आउट',
  signup: 'पंजीकरण',
  cart: 'कार्ट',
  checkout: 'चेकआउट',
  summary: 'सारांश',
  insights: 'अंतर्दृष्टि',
  blockchain: 'ब्लॉकचेन',
  ledger: 'लेज़र',
  honey: 'शहद',
  raw: 'कच्चा',
  organic: 'जैविक',
  flora: 'किस्म',
};

export const translateTextToHindi = (text: string): string => {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return text;

  // 1. Direct match
  const lower = trimmed.toLowerCase();
  if (phraseDictionary[lower]) {
    return text.replace(trimmed, phraseDictionary[lower]);
  }
  if (phraseDictionary[trimmed]) {
    return text.replace(trimmed, phraseDictionary[trimmed]);
  }

  // 2. Strip trailing punctuation
  const matchPunct = trimmed.match(/^(.*?)([:.!?…]+)$/);
  if (matchPunct) {
    const core = matchPunct[1].trim().toLowerCase();
    const punct = matchPunct[2];
    if (phraseDictionary[core]) {
      return text.replace(trimmed, phraseDictionary[core] + punct);
    }
    if (WORD_DICTIONARY[core]) {
      return text.replace(trimmed, WORD_DICTIONARY[core] + punct);
    }
  }

  // 3. Check single word dictionary
  if (WORD_DICTIONARY[lower]) {
    return text.replace(trimmed, WORD_DICTIONARY[lower]);
  }

  // 4. Substring phrase replacements
  let replaced = text;
  let hasChanged = false;
  for (const [enKey, hiVal] of Object.entries(phraseDictionary)) {
    if (enKey.length >= 4 && lower.includes(enKey)) {
      const regex = new RegExp(`\\b${enKey}\\b`, 'gi');
      if (regex.test(replaced)) {
        replaced = replaced.replace(regex, hiVal);
        hasChanged = true;
      }
    }
  }

  return hasChanged ? replaced : text;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      return (localStorage.getItem('hc_lang') as Language) || 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('hc_lang', lang);
    } catch (e) {
      console.warn(e);
    }
  };

  const t = (key: string): string => {
    if (!key) return '';
    // 1. Check exact key in selected language
    if (translations[language]?.[key]) {
      return translations[language][key];
    }
    // 2. If Hindi, check normalized phrase dictionary and translator
    if (language === 'hi') {
      const translated = translateTextToHindi(key);
      if (translated !== key) {
        return translated;
      }
    }
    // 3. Fallback to English dictionary or key itself
    return translations.en?.[key] || key;
  };

  // High-performance bidirectional DOM text translator for complete Hindi/English switching
  useEffect(() => {
    const isHindi = language === 'hi';

    const processElement = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
        if (!originalTextMap.has(node)) {
          originalTextMap.set(node, node.nodeValue);
        }
        const original = originalTextMap.get(node)!;
        if (isHindi) {
          const translated = translateTextToHindi(original);
          if (translated !== node.nodeValue) {
            node.nodeValue = translated;
          }
        } else {
          if (node.nodeValue !== original) {
            node.nodeValue = original;
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName?.toLowerCase();
        if (
          tag === 'script' ||
          tag === 'style' ||
          tag === 'code' ||
          (tag === 'input' && (el as HTMLInputElement).type === 'password')
        ) {
          return;
        }

        // Translate placeholders
        if (el.hasAttribute('placeholder')) {
          if (!originalPlaceholderMap.has(el)) {
            originalPlaceholderMap.set(el, el.getAttribute('placeholder') || '');
          }
          const orig = originalPlaceholderMap.get(el)!;
          if (isHindi) {
            el.setAttribute('placeholder', translateTextToHindi(orig));
          } else {
            el.setAttribute('placeholder', orig);
          }
        }

        // Translate titles
        if (el.hasAttribute('title')) {
          if (!originalTitleMap.has(el)) {
            originalTitleMap.set(el, el.getAttribute('title') || '');
          }
          const orig = originalTitleMap.get(el)!;
          if (isHindi) {
            el.setAttribute('title', translateTextToHindi(orig));
          } else {
            el.setAttribute('title', orig);
          }
        }

        el.childNodes.forEach(processElement);
      }
    };

    processElement(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(processElement);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
