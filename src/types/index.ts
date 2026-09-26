/**
 * Honey Chain Types and Interfaces
 */

export type UserRole = 'ADMIN' | 'BEEKEEPER' | 'LAB' | 'CONSUMER';

export type BeekeeperStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type HiveType = 'Langstroth' | 'KTB' | 'Traditional' | 'Other';
export type ColonyType = 'Apis cerana indica' | 'Apis mellifera' | 'Apis dorsata' | 'Apis florea' | 'Stingless';
export type LandType = 'Forest' | 'Farmland' | 'Urban' | 'Orchard' | 'Mangrove' | 'Other';
export type HiveStatus = 'active' | 'inactive' | 'decommissioned';

export interface UserProfile {
  id: string;
  uid?: string;
  email: string;
  displayName: string;
  role: UserRole;
  beekeeperId?: string;
  labId?: string;
  aadhaarLast4?: string;
  trustScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BeekeeperProfile {
  id: string; // Document ID (e.g. user uid or generated doc id)
  userId: string;
  beekeeperId?: string; // e.g. B001 or B045 (assigned upon approval)
  beekeeperSeq?: number;
  name: string;
  email: string;
  phone: string;
  state: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  aadhaarLast4: string; // ONLY 4 digits
  aadhaarHash: string;  // SHA-256 of salt + Aadhaar
  madhukrantiId: string;
  yearsOfExperience?: number;
  totalHivesCount?: number;
  totalHivesPlanned?: number;
  trustScore?: number;
  status: BeekeeperStatus;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HiveRecord {
  id: string;
  hiveId: string; // e.g. HC-UP-B045-H01
  beekeeperId: string;
  hiveType: HiveType;
  colonyType: ColonyType;
  area: string;
  landType: LandType;
  lat: number;
  lng: number;
  address: string;
  state?: string;
  district?: string;
  imageUrl?: string;
  setupDate: string;
  registrationDate: string;
  expectedProduction: number;
  status: HiveStatus;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  iotDeviceId?: string;
  notes?: string;
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IoTDevice {
  id: string;
  deviceSerial: string;
  apiKeyHash: string;
  hiveId: string;
  beekeeperId: string;
  model: string;
  batteryPercent: number;
  status: 'online' | 'offline' | 'unpaired';
  lastReadingAt?: string;
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SensorReading {
  id: string;
  deviceSerial: string;
  hiveId: string;
  beekeeperId: string;
  temperature: number;
  humidity: number;
  weight?: number;
  battery?: number;
  deviceId?: string;
  timestamp: string;
  isAnomaly?: boolean;
  isSample?: boolean;
}

export interface SpeciesThreshold {
  id: string;
  colonyType: ColonyType;
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
  notes?: string;
  updatedAt: string;
}

export interface HealthAlert {
  id: string;
  hiveId: string;
  beekeeperId: string;
  type: 'TEMPERATURE_HIGH' | 'TEMPERATURE_LOW' | 'HUMIDITY_HIGH' | 'HUMIDITY_LOW' | 'DEVICE_OFFLINE' | 'DISEASE_DETECTED' | 'WEIGHT_DROP';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  readingValue?: number;
  thresholdValue?: number;
  status: 'active' | 'acknowledged' | 'resolved';
  timestamp: string;
}

export interface DiseaseScan {
  id: string;
  hiveId: string;
  beekeeperId: string;
  images: string[];
  condition: string;
  confidence: number;
  severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actions: string[];
  disclaimer: string;
  modelUsed: string;
  scannedAt: string;
  autoAlertCreated: boolean;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ALERT' | 'INFO' | 'APPROVAL';
  read: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  actorId: string;
  actorRole: UserRole | 'SYSTEM';
  actorEmail: string;
  action: string;
  entityType: 'BEEKEEPER' | 'HIVE' | 'BATCH' | 'PACK' | 'LAB_SAMPLE' | 'ORDER' | 'SYSTEM';
  entityId: string;
  details: string;
  timestamp: string;
}

export interface SystemCounter {
  current: number;
  updatedAt: string;
}

export type FloralSource =
  | 'Mustard'
  | 'Acacia'
  | 'Multiflora'
  | 'Jamun'
  | 'Eucalyptus'
  | 'Lychee'
  | 'Wildflower'
  | 'Kashmir White'
  | 'Other';

export interface HarvestRecord {
  id: string;
  beekeeperId: string;
  beekeeperName?: string;
  hiveId: string;
  state: string;
  district?: string;
  floralSource: FloralSource | string;
  quantityKg: number;
  moisture: number; // in percentage e.g. 18.5
  extractionDate: string;
  extractionMethod: string;
  notes?: string;
  status: 'unbatched' | 'batched';
  batchId?: string;
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HiveEvaluation {
  hiveId: string;
  passed: boolean;
  readingCount: number;
  avgTemp?: number;
  avgHumidity?: number;
  tempInRange: boolean;
  humidityInRange: boolean;
  lastReadingDate?: string;
  reason?: string;
}

export type BatchStatus =
  | 'created'
  | 'verifying'
  | 'verified'
  | 'verification_failed'
  | 'sample_sent'
  | 'lab_tested'
  | 'packaged'
  | 'listed'
  | 'completed';

export interface BatchRecord {
  id: string;
  batchId: string; // HB-2609-UP-0012
  batchSeq?: number;
  state: string;
  district?: string;
  beekeeperIds: string[];
  hiveIds: string[];
  harvestIds: string[];
  floralSource: string;
  totalQuantityKg: number;
  totalWeightKg?: number;
  avgMoisture: number;
  status: BatchStatus;
  verificationDetails?: {
    verifiedAt: string;
    verifiedBy: string;
    passed: boolean;
    summary: string;
    hiveEvaluations: HiveEvaluation[];
  };
  sampleId?: string;
  labId?: string;
  labName?: string;
  labReportId?: string;
  labVerdict?: 'PURE' | 'ADULTERATED' | 'SUB_STANDARD';
  purityPercentage?: number;
  reportHash?: string;
  packagingDetails?: {
    jarSizeGrams: number;
    packCount: number;
    packagedAt: string;
    packIds: string[];
  };
  ledgerBlockIndex?: number;
  ledgerHash?: string;
  polygonTxHash?: string;
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LabProfile {
  id: string;
  userId: string;
  labName: string;
  accreditationNo: string; // e.g. NABL-TC-0841 / FSSAI-2024
  contactPerson: string;
  email: string;
  phone: string;
  state: string;
  district: string;
  address: string;
  status: 'approved' | 'pending';
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type LabSampleStatus = 'dispatched' | 'received' | 'in_testing' | 'completed';

export interface LabSample {
  id: string;
  sampleId: string; // LS-2609-0001
  batchId: string;
  beekeeperId: string;
  labId: string;
  labName: string;
  floralSource: string;
  quantityMl: number;
  dispatchedAt: string;
  courierTracking?: string;
  status: LabSampleStatus;
  reportId?: string;
  receivedAt?: string;
  completedAt?: string;
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LabTestParameters {
  moisture: number; // std <= 20%
  fructose: number; // std >= 35%
  glucose: number; // std >= 30%
  fgRatio: number; // std >= 0.95
  sucrose: number; // std <= 5%
  hmf: number; // mg/kg, std <= 80
  pollenCountMillion: number; // e.g. 0.85
  c4Sugars: 'Negative' | 'Positive'; // std Negative
  antibioticsResidue: 'Pass' | 'Fail'; // std Pass
  heavyMetals: 'Pass' | 'Fail'; // std Pass
}

export interface LabReport {
  id: string;
  reportId: string;
  sampleId: string;
  batchId: string;
  state?: string;
  district?: string;
  labId: string;
  labName: string;
  accreditationNo: string;
  testedBy: string;
  analystName?: string;
  testDate: string;
  parameters: LabTestParameters;
  verdict: 'PURE' | 'ADULTERATED' | 'SUB_STANDARD';
  purityPercentage?: number;
  passFail?: 'Pass' | 'Fail';
  remarks: string;
  pdfUrl?: string;
  reportHash: string; // SHA-256 hash of report parameters + batchId + sampleId
  ledgerBlockIndex?: number;
  ledgerHash?: string;
  polygonTxHash?: string;
  isSample?: boolean;
  createdAt: string;
}

export interface HoneyPack {
  id: string;
  packId: string; // HB-2609-UP-0012-P0001
  batchId: string;
  hiveIds: string[];
  beekeeperId: string;
  floralSource: string;
  jarSizeGrams: number;
  harvestDate?: string;
  packagingDate: string;
  labReportId?: string;
  labVerdict?: string;
  reportHash?: string;
  qrCodeDataUrl?: string;
  status: 'packaged' | 'in_stock' | 'sold';
  isSample?: boolean;
  scanCount?: number;
  firstScannedAt?: string;
  lastScannedAt?: string;
  createdAt: string;
}

export interface HoneyListing {
  id: string;
  batchId: string;
  beekeeperId: string;
  beekeeperName: string;
  title: string;
  description: string;
  floralSource: string;
  state: string;
  jarSizeGrams: number;
  priceInr: number;
  mrpInr: number;
  stockCount: number;
  initialStock: number;
  imageUrl?: string;
  rawUnfiltered: boolean;
  status: 'active' | 'out_of_stock' | 'archived';
  labVerdict: string;
  labReportId?: string;
  reportHash?: string;
  trustScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  listingId: string;
  batchId: string;
  title: string;
  floralSource: string;
  jarSizeGrams: number;
  priceInr: number;
  quantity: number;
  maxStock: number;
  beekeeperName: string;
  imageUrl?: string;
}

export type OrderStatus =
  | 'placed'
  | 'paid'
  | 'confirmed'
  | 'packed'
  | 'dispatched'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  listingId: string;
  batchId: string;
  title: string;
  floralSource: string;
  jarSizeGrams: number;
  priceInr: number;
  quantity: number;
  maxStock?: number;
  beekeeperId?: string;
  beekeeperName: string;
  assignedPackIds?: string[];
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderRecord {
  id: string;
  orderId: string; // ORD-2609-0012
  userId?: string;
  userEmail?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  items: OrderItem[];
  subtotalInr?: number;
  taxInr?: number;
  shippingInr: number;
  totalInr: number;
  totalAmountInr?: number;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  paymentMethod?: string;
  paymentId?: string;
  courierName?: string;
  trackingNumber?: string;
  isSample?: boolean;
  paymentDetails: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    method: 'RAZORPAY_TEST' | 'COD_TEST' | 'MOCK_ONLINE';
    paidAt: string;
    verified: boolean;
    isSimulated?: boolean;
  };
  tracking?: {
    courierName?: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
    dispatchedAt?: string;
    deliveredAt?: string;
  };
  invoicePdfGenerated?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutRecord {
  id: string;
  payoutId: string;
  beekeeperId: string;
  beekeeperName: string;
  orderId: string;
  grossAmountInr: number;
  platformFeeInr: number; // e.g. 10%
  netPayoutInr: number; // e.g. 90%
  status: 'pending' | 'processing' | 'disbursed';
  transactionRef?: string;
  disbursedAt?: string;
  createdAt: string;
}

export interface ReviewRecord {
  id: string;
  orderId: string;
  batchId: string;
  listingId: string;
  userId?: string;
  userName?: string;
  customerId?: string;
  customerName?: string;
  beekeeperId: string;
  rating: number; // 1 to 5
  comment: string;
  verifiedPurchase?: boolean;
  isVerifiedBuyer?: boolean;
  isSample?: boolean;
  beekeeperReply?: {
    replyText: string;
    repliedAt: string;
    beekeeperName: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface TrustScoreWeights {
  iotComplianceWeight: number; // e.g. 0.35
  labPurityWeight: number; // e.g. 0.35
  customerRatingWeight: number; // e.g. 0.20
  fulfillmentWeight: number; // e.g. 0.10
}

export interface TrustScoreBreakdown {
  beekeeperId: string;
  totalScore: number; // 0 - 100
  iotScore: number;
  labScore: number;
  customerScore: number;
  fulfillmentScore: number;
  weights: TrustScoreWeights;
  calculatedAt: string;
  history?: Array<{
    score: number;
    date: string;
    reason: string;
  }>;
}

export interface StockAlert {
  id: string;
  userId: string;
  userEmail: string;
  floralSource?: string;
  beekeeperId?: string;
  searchTerm?: string;
  createdAt: string;
  active: boolean;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ORDER' | 'STOCK_ALERT' | 'REVIEW' | 'PAYOUT' | 'TRUST_SCORE' | 'BATCH';
  linkTab?: string;
  linkParam?: string;
  data?: Record<string, any>;
  orderId?: string;
  batchId?: string;
  packId?: string;
  read: boolean;
  createdAt: string;
}

export type LedgerEventType =
  | 'HIVE_REGISTERED'
  | 'BATCH_CREATED'
  | 'BATCH_VERIFIED'
  | 'LAB_REPORT_HASHED'
  | 'PACKAGING_COMPLETED'
  | 'ADMIN_APPROVAL';

export interface LedgerBlock {
  index: number;
  eventType: LedgerEventType;
  entityId: string;
  dataHash: string;
  previousHash: string;
  currentHash: string;
  timestamp: string;
  metadata: Record<string, unknown>;
  polygonTxHash?: string;
}

export interface LedgerHead {
  headIndex: number;
  headHash: string;
  totalBlocks: number;
  lastUpdated: string;
  chainMode: 'POLYGON_AMOY' | 'HASH_CHAIN';
}

export interface SystemStatsRecord {
  id: string;
  totalBeekeepers: number;
  activeBeekeepers: number;
  totalHives: number;
  activeHives: number;
  totalHarvestKg: number;
  totalBatches: number;
  pureBatches: number;
  flaggedBatches: number;
  totalOrders: number;
  totalGmv: number;
  avgOrderValue: number;
  beekeeperEarnings: number;
  platformRevenue: number;
  speciesDistribution: Record<string, number>;
  floralDistribution: Record<string, number>;
  stateYields: Record<string, { hives: number; harvestKg: number; salesGmv: number; purityRate: number }>;
  monthlyTrends: { month: string; harvestKg: number; sales: number; avgMoisture: number }[];
  qualityMetrics: { avgMoisture: number; avgHmf: number; avgFgRatio: number; c4PassRate: number };
  updatedAt: string;
}

export interface DisputeRecord {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  claimAmount?: number;
  reason: 'Damaged Seal' | 'Suspected Adulteration' | 'Delayed Delivery' | 'Package Mismatch' | 'Other';
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'REFUNDED' | 'REJECTED' | 'RESOLVED';
  evidenceUrl?: string;
  beekeeperId?: string;
  batchId?: string;
  adminNotes?: string;
  refundAmount?: number;
  resolvedAt?: string;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress?: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface PlatformSettings {
  id: string;
  platformFeePercent: number;
  minIotReadingsForVerification: number;
  iotSamplingIntervalMinutes: number;
  escrowHoldDays: number;
  razorpayTestMode: boolean;
  autoAnchorThreshold: number;
  autoPayoutEnabled: boolean;
  speciesThresholds?: Record<string, { tempMin: number; tempMax: number; humidityMin: number; humidityMax: number }>;
  notificationChannels?: { emailAlerts: boolean; inAppAlerts: boolean; smsAlerts: boolean };
  updatedAt: string;
}

export interface ReviewFraudAnalysis {
  reviewId: string;
  riskScore: number; // 0 - 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  flags: string[];
  recommendation: 'APPROVE' | 'FLAG_FOR_REVIEW' | 'AUTO_SUPPRESS';
}

