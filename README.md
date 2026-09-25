# 🐝 Honey Chain (हनी चेन)
> **Direct Beekeeper-to-Consumer Honey Traceability, IoT Brood Telemetry & Cryptographic Verification Platform**

Honey Chain is a full-stack, enterprise-grade honey authenticity and fair-trade marketplace platform engineered for the Indian apiculture ecosystem. It integrates with the National Bee Board / Madhukranti portal standards, provides real-time IoT brood chamber monitoring, enforces cryptographic provenance through Polygon Amoy / SHA-256 hash chaining, and empowers beekeepers with transparent 88% direct payouts.

---

## 🌟 Key Architecture & Phase Breakdown

### Phase 1: Beekeeper KYC & Identity Engine
- **Identity Integrity**: Generates atomic, sequential identifiers (`BK-1001`, `HV-1001`, `HB-2026-PB-1001`, `DEV-1001`).
- **Privacy By Design**: Full 12-digit Aadhaar is **never stored anywhere** in the database; only salted SHA-256 hashes and the last 4 digits are recorded.
- **Admin Verification Queue**: Dual checklist verification matching National Bee Board Madhukranti portal registration ID and agricultural GPS zone coordinates.

### Phase 2: Hive Management & IoT Telemetry
- **On-Chain Hive Anchoring**: Immutable hive records with GPS coordinates, colony species (`Apis cerana indica`, `Apis mellifera`, `Apis dorsata`), and printable high-density QR stickers.
- **Real-Time Sensor Telemetry**: Streams temperature, humidity, weight, and battery levels via ESP32/Nordic node HTTP endpoints.
- **Automated Health Alerts**: Autonomous anomaly triggers for brood overheating (>38°C), dry air, or sudden weight drop indicating swarming.
- **AI Disease Diagnosis**: Camera capture with Gemini image analysis diagnosing Varroa mites, foulbrood (AFB/EFB), and wax moth infestations.

### Phase 3: Extraction, Quality Gates & Lab Certification
- **Harvest Aggregation Pool**: Beekeepers log extraction harvests by floral source (Mustard, Acacia, Jamun, Eucalyptus, Multiflora).
- **IoT Verification Gate**: **Hard rule**: Batches cannot be verified or sent to labs unless continuous IoT sensor readings were recorded for the linked hives during the bloom period.
- **Accredited Lab Certification**: FSSAI parameters (Moisture ≤ 20%, HMF ≤ 80 mg/kg, F/G Ratio ≥ 1.0, C4 adulteration sugar test).
- **Cryptographic Hash Ledger**: Generates SHA-256 lab report hash and links it to serialized retail pack QR codes (`HB-2026-PB-1001-P0001` to `P0020`).

### Phase 4: Direct Marketplace & Fair Payouts
- **Verified Honey Store**: Consumers browse lab-certified honey jars with verifiable provenance tags.
- **Direct Payout Engine**: 88% of retail revenue remitted directly to beekeepers, with a 12% transparent platform fee.
- **Tamper-Evident QR Verification**: Consumers scan the jar QR with any smartphone camera to inspect the full supply chain journey, lab purity report, and scan counter (detects counterfeit refilling).
- **Order Tracking & Tax Invoices**: Full delivery lifecycle with instant PDF invoice downloads.

### Phase 5: Server Analytics, AI Intelligence & Data Manager
- **Pre-Computed Analytics Engine**: High-performance cached stats maintained server-side (`system_stats/overview`) with multi-dimensional slicers (state, floral source, species, quality verdict).
- **Gemini 3.8 Flash Supply Chain Insights**: Autonomous anomaly detection, regional yield forecasts, and strategic agricultural recommendations.
- **Marketplace Moderation & Dispute Center**: Automated review fraud heuristics (detecting unverified purchases, rating/lab verdict divergence, and review velocity spam) with 1-click refund resolutions.
- **Admin Data Manager**:
  - Full CRUD explorer for every platform collection with auto-generated IDs.
  - CSV / Excel batch importer with interactive column mapping, validation preview, and downloadable templates.
  - "Generate Sample Data" wizard populating realistic linked records across 5 states.
  - "Delete All Sample Data" and confirmed factory reset (`RESET-HONEY-CHAIN`).
  - Interactive IoT Brood Telemetry Simulator streaming live telemetry and anomaly spikes.
- **Madhubot (मधुमित्र)**: Bilingual (English / हिंदी) AI Bee Assistant available across the entire platform.
- **PWA Ready**: Offline-capable service worker, Web App Manifest, and installable on Android / iOS / Desktop.

---

## 🔒 Security Specification Checklist

1. **RBAC Rules**: `firestore.rules` enforces role-based separation:
   - `ADMIN`: Full access to approval queues, dispute resolutions, and system stats.
   - `BEEKEEPER`: Read/write limited strictly to their own hives, harvests, and listings.
   - `LAB`: Restricted to submitting and certifying lab reports.
   - `CONSUMER`: Read access to public marketplace and public QR package verification.
2. **Aadhaar Privacy**: Guaranteed that no full Aadhaar numbers are persisted in any document, log, or telemetry record.
3. **Ledger Integrity**: SHA-256 hash-chaining prevents backward tampering of records.

---

## 🚀 Acceptance Criteria Verification

| Requirement | Status | Implementation Details |
|---|---|---|
| 1. Register → Approve → Beekeeper ID | ✅ Complete | Beekeeper registers with Madhukranti ID; Admin verifies checklist in `AdminApprovalQueue.tsx` and atomically issues sequential ID (e.g. `B001`). |
| 2. Camera hive add → Hive ID unique/immutable/on-chain | ✅ Complete | `AddHiveModal.tsx` captures camera photos, validates GPS, creates immutable `HC-[State]-[BK]-H[Seq]` ID and logs block to ledger. |
| 3. Device readings → live charts → alerts | ✅ Complete | Recharts live line charts with reference lines for FSSAI/species boundaries in `HiveDetailView.tsx`. |
| 4. Disease scan works | ✅ Complete | `CameraCapture.tsx` + Gemini AI visual analysis diagnoses brood conditions. |
| 5. Batch verify blocked without IoT, allowed with | ✅ Complete | `/api/batches/verify-gate` verifies presence of sensor readings before unlocking lab dispatch. |
| 6. Lab report → hash → packs + QR | ✅ Complete | `LabPortal.tsx` computes SHA-256 hash, generates serialized pack IDs (`HB-...-P0001`), and exports printable PDF QR sheets. |
| 7. Listing → camera QR scan → full verify page | ✅ Complete | Camera / QR scanner decodes pack ID and routes to `QRVerifyPage.tsx` displaying complete traceability audit. |
| 8. Razorpay test purchase → delivered → verified review → Trust Score | ✅ Complete | Full checkout pipeline with COD / Test Razorpay gateway; delivering order unlocks review and updates Beekeeper Trust Score. |
| 9. Data Manager add/edit/delete/import/generate/clear | ✅ Complete | `AdminDataManager.tsx` with full CRUD, CSV column mapping preview, sample wizard, and sensor simulator. |
| 10. Security rules block cross-role access, no full Aadhaar, no console errors | ✅ Complete | Hardened `firestore.rules`, full Aadhaar masked, and zero linter/TypeScript errors. |

---

## 🛠 Local Setup & Running

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in GEMINI_API_KEY and FIREBASE_API_KEY as explained in .env.example

# 3. Start full-stack dev server
npm run dev
# The server runs on http://localhost:3000
```
