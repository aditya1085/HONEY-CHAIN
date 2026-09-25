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

    // Roles
    'role.admin': 'Admin',
    'role.beekeeper': 'Beekeeper',
    'role.lab': 'Accredited Lab',
    'role.consumer': 'Consumer',

    // Statuses
    'status.pending': 'Pending Review',
    'status.approved': 'Approved & Verified',
    'status.rejected': 'Rejected',
    'status.suspended': 'Suspended',
    'status.active': 'Active',

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

    // Actions & Common
    'action.cancel': 'Cancel',
    'action.confirm': 'Confirm',
    'action.save': 'Save',
    'action.close': 'Close',
    'action.search': 'Search...',
    'action.filter': 'Filter',
    'action.refresh': 'Refresh',
    'action.exportCsv': 'Export CSV',
    'action.testGenerate': 'Generate Next ID',

    // Pending Banner
    'pending.title': 'Your Beekeeper Registration is Under Review',
    'pending.desc': 'Our admin team is currently cross-verifying your Madhukranti ID and Aadhaar details. Once approved, your unique Beekeeper ID (e.g. B045) will be generated and you can start adding hives.',

    // Marketplace & Verification
    'market.verifiedOnly': '100% Verified Pure & Lab Certified',
    'market.addToCart': 'Add to Cart',
    'market.verifyProvenance': 'Inspect Provenance',
    'market.scanJarQr': 'Scan Jar QR Code',
    'market.directPayout': '88% Goes Directly to Apiculturist',

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

    // General
    'lang.en': 'English',
    'lang.hi': 'हिंदी',
    'theme.light': 'Light',
    'theme.dark': 'Honey Dark',
  },
  hi: {
    // Brand & Header
    'brand.title': 'हनी चेन (Honey Chain)',
    'brand.tagline': 'छत्ते से घर तक शुद्ध व प्रमाणित शहद',
    'nav.home': 'मुख्य पृष्ठ',
    'nav.marketplace': 'बाज़ार',
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

    // Roles
    'role.admin': 'प्रशासक (Admin)',
    'role.beekeeper': 'मधुमक्खी पालक',
    'role.lab': 'प्रमाणित प्रयोगशाला',
    'role.consumer': 'उपभोक्ता',

    // Statuses
    'status.pending': 'समीक्षाधीन (Pending)',
    'status.approved': 'प्रमाणित एवं स्वीकृत',
    'status.rejected': 'अस्वीकृत',
    'status.suspended': 'निलंबित',
    'status.active': 'सक्रिय',

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

    // Actions & Common
    'action.cancel': 'रद्द करें',
    'action.confirm': 'पुष्टि करें',
    'action.save': 'सहेजें',
    'action.close': 'बंद करें',
    'action.search': 'खोजें...',
    'action.filter': 'फ़िल्टर',
    'action.refresh': 'ताज़ा करें',
    'action.exportCsv': 'सीएसवी निर्यात',
    'action.testGenerate': 'अगली आईडी उत्पन्न करें',

    // Pending Banner
    'pending.title': 'आपका पंजीकरण वर्तमान में समीक्षाधीन है',
    'pending.desc': 'हमारी टीम मधुक्रांति आईडी और आधार विवरण की जांच कर रही है। स्वीकृति मिलते ही आपकी विशिष्ट आईडी (जैसे B045) आवंटित होगी।',

    // Marketplace & Verification (Hindi)
    'market.verifiedOnly': '१००% लैब प्रमाणित व शुद्ध शहद',
    'market.addToCart': 'कार्ट में जोड़ें',
    'market.verifyProvenance': 'प्रमाणिकता जांचें',
    'market.scanJarQr': 'जार का क्यूआर कोड स्कैन करें',
    'market.directPayout': '८८% आय सीधे पालक के बैंक खाते में',

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

    // General
    'lang.en': 'English',
    'lang.hi': 'हिंदी',
    'theme.light': 'लाइट',
    'theme.dark': 'हनी डार्क',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('hc_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('hc_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
