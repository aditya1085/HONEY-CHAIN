import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { HoneyListing, HoneyPack, ReviewRecord, OrderRecord, TrustScoreBreakdown } from '../types';

export async function seedPhase4Data(): Promise<void> {
  try {
    // 1. Seed Sample Pack for Instant QR Verification testing
    const samplePackId = 'HB-2609-UP-0001-P0001';
    const packDoc: HoneyPack = {
      id: samplePackId,
      packId: samplePackId,
      batchId: 'HB-2609-UP-0001',
      hiveIds: ['HC-UP-B001-H01', 'HC-UP-B001-H02'],
      beekeeperId: 'B001',
      floralSource: 'Mustard',
      jarSizeGrams: 500,
      packagingDate: '2026-09-22T08:30:00.000Z',
      labReportId: 'LBR-2609-0001',
      labVerdict: 'PURE',
      reportHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      status: 'packaged',
      scanCount: 1,
      firstScannedAt: '2026-09-23T14:10:00.000Z',
      createdAt: '2026-09-22T08:30:00.000Z',
    };
    await setDoc(doc(db, 'packages', samplePackId), packDoc, { merge: true });

    // 2. Seed Sample Live Listings
    const sampleListing1: HoneyListing = {
      id: 'LIST_HB_2609_UP_0001',
      batchId: 'HB-2609-UP-0001',
      beekeeperId: 'B001',
      beekeeperName: 'Rajesh Kumar Verma',
      title: 'Pure Raw Mustard Blossom Honey (Ganga Basin)',
      description: 'Single-origin unheated cold-extracted honey collected during peak mustard flowering along the Varanasi plains. High in active bio-enzymes with gentle floral sweetness.',
      floralSource: 'Mustard',
      state: 'UP',
      jarSizeGrams: 500,
      priceInr: 450,
      mrpInr: 550,
      stockCount: 18,
      initialStock: 20,
      rawUnfiltered: true,
      status: 'active',
      labVerdict: 'PURE',
      labReportId: 'LBR-2609-0001',
      reportHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      trustScore: 96,
      createdAt: '2026-09-22T10:00:00.000Z',
      updatedAt: '2026-09-22T10:00:00.000Z',
    };

    const sampleListing2: HoneyListing = {
      id: 'LIST_HB_2609_UP_0002',
      batchId: 'HB-2609-UP-0002',
      beekeeperId: 'B002',
      beekeeperName: 'Amit Singh',
      title: 'Wild Acacia Forest Raw Honey (Ayodhya Apiary)',
      description: 'Delicate light amber honey gathered by indigenous Apis cerana indica colonies foraging on wild acacia blossoms. Mild sweetness, zero processing.',
      floralSource: 'Acacia',
      state: 'UP',
      jarSizeGrams: 500,
      priceInr: 580,
      mrpInr: 680,
      stockCount: 22,
      initialStock: 25,
      rawUnfiltered: true,
      status: 'active',
      labVerdict: 'PURE',
      trustScore: 94,
      createdAt: '2026-09-23T11:00:00.000Z',
      updatedAt: '2026-09-23T11:00:00.000Z',
    };

    await setDoc(doc(db, 'listings', sampleListing1.id), sampleListing1, { merge: true });
    await setDoc(doc(db, 'listings', sampleListing2.id), sampleListing2, { merge: true });

    // 3. Seed Sample Review
    const reviewId = 'REV_SAMPLE_01';
    const sampleReview: ReviewRecord = {
      id: reviewId,
      orderId: 'ORD-2609-0012',
      batchId: 'HB-2609-UP-0001',
      listingId: sampleListing1.id,
      userId: 'user_neha_sharma',
      userName: 'Neha Sharma',
      beekeeperId: 'B001',
      rating: 5,
      comment: 'Incredible golden clarity and distinct mustard blossom warmth. Tested the QR code on the jar and was amazed to see the live hive temperatures from the Varanasi apiary!',
      verifiedPurchase: true,
      beekeeperReply: {
        replyText: 'Thank you Neha ji! Our bees worked hard during the peak winter blossom. Warm regards from Varanasi.',
        repliedAt: '2026-09-23T16:00:00.000Z',
        beekeeperName: 'Rajesh Kumar Verma',
      },
      createdAt: '2026-09-23T12:00:00.000Z',
      updatedAt: '2026-09-23T16:00:00.000Z',
    };
    await setDoc(doc(db, 'reviews', reviewId), sampleReview, { merge: true });

    // 4. Seed Trust Scores
    const trustScoreB001: TrustScoreBreakdown = {
      beekeeperId: 'B001',
      totalScore: 96,
      iotScore: 98,
      labScore: 99,
      customerScore: 94,
      fulfillmentScore: 97,
      weights: {
        iotComplianceWeight: 0.35,
        labPurityWeight: 0.35,
        customerRatingWeight: 0.2,
        fulfillmentWeight: 0.1,
      },
      calculatedAt: '2026-09-23T10:00:00.000Z',
    };
    await setDoc(doc(db, 'trust_scores', 'B001'), trustScoreB001, { merge: true });
  } catch (err) {
    console.warn('Phase 4 seeding note:', err);
  }
}
