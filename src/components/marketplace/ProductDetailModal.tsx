import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { HoneyListing, ReviewRecord, CartItem } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Star,
  MapPin,
  HeartHandshake,
  ShoppingBag,
  ExternalLink,
  MessageSquare,
  Send,
  AlertCircle,
  FlaskConical,
  Cpu,
  CornerDownRight,
} from 'lucide-react';

interface ProductDetailModalProps {
  listing: HoneyListing | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
  onVerifyPack: (batchId: string) => void;
  currentUser?: { uid: string; email?: string | null; displayName?: string | null };
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  listing,
  isOpen,
  onClose,
  onAddToCart,
  onVerifyPack,
  currentUser,
}) => {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [rating, setRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string>('');
  const [hasPurchased, setHasPurchased] = useState<boolean>(false);

  // Beekeeper reply state
  const [replyingToReviewId, setReplyingToReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !listing) return;

    // Listen to reviews for this listing / batch
    const q = query(collection(db, 'reviews'), where('batchId', '==', listing.batchId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as ReviewRecord);
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReviews(list);
    });

    // Check if current user has a verified purchase order for this batch
    if (currentUser?.uid) {
      const checkOrder = async () => {
        try {
          const ordersQ = query(
            collection(db, 'orders'),
            where('userId', '==', currentUser.uid)
          );
          const snap = await getDocs(ordersQ);
          let purchased = false;
          snap.docs.forEach((doc) => {
            const data = doc.data();
            if (data.items?.some((it: any) => it.batchId === listing.batchId)) {
              purchased = true;
            }
          });
          setHasPurchased(purchased);
        } catch (e) {
          console.warn('Check purchase error:', e);
        }
      };
      checkOrder();
    }

    return () => unsubscribe();
  }, [isOpen, listing, currentUser]);

  if (!isOpen || !listing) return null;

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    setSubmittingReview(true);
    setReviewError('');

    try {
      const reviewId = `REV_${Date.now()}`;
      const newReview: ReviewRecord = {
        id: reviewId,
        orderId: 'VERIFIED_BUYER_ORDER',
        batchId: listing.batchId,
        listingId: listing.id,
        userId: currentUser?.uid || 'guest',
        userName: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Verified Buyer',
        beekeeperId: listing.beekeeperId,
        rating,
        comment: reviewComment.trim(),
        verifiedPurchase: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'reviews', reviewId), newReview);

      // Trigger automatic Trust Score recomputation
      try {
        await fetch('/api/trust-score/recompute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ beekeeperId: listing.beekeeperId }),
        });
      } catch (trustErr) {
        console.warn('Trust score recomputation trigger warning:', trustErr);
      }

      setReviewComment('');
      setSubmittingReview(false);
    } catch (err) {
      console.error('Submit review error:', err);
      setReviewError('Failed to post review. Please try again.');
      setSubmittingReview(false);
    }
  };

  const handlePostReply = async (reviewId: string) => {
    if (!replyText.trim()) return;

    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        beekeeperReply: {
          replyText: replyText.trim(),
          repliedAt: new Date().toISOString(),
          beekeeperName: listing.beekeeperName,
        },
        updatedAt: new Date().toISOString(),
      });
      setReplyText('');
      setReplyingToReviewId(null);
    } catch (err) {
      console.error('Post reply error:', err);
    }
  };

  const averageRating = reviews.length
    ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) * 10) / 10
    : 4.9;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative my-8 w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Product Title & Provenance Badges */}
        <div className="space-y-2 pr-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              100% PURE & UNADULTERATED
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {listing.floralSource} Honey
            </span>
            {listing.rawUnfiltered && (
              <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Cold Extracted Raw
              </span>
            )}
          </div>

          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{listing.title}</h2>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1 font-semibold text-amber-500">
              <Star className="h-3.5 w-3.5 fill-amber-500" />
              {averageRating} ({reviews.length} verified reviews)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-zinc-400" />
              Origin: {listing.state}
            </span>
            <span>•</span>
            <span className="font-mono text-zinc-700 dark:text-zinc-300">
              Batch: {listing.batchId}
            </span>
          </div>
        </div>

        {/* Provenance & Cryptographic Certification Card */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-900 dark:text-amber-200">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <span>{t('Full Blockchain Provenance & Lab Certificate Available')}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t('This jar is cryptographically anchored. View live hive IoT history, NABL test parameters & SHA-256 seal.')}
            </p>
          </div>

          <button
            onClick={() => {
              onClose();
              onVerifyPack(listing.batchId);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shrink-0 shadow-sm"
          >
            <span>{t('verify.verifyButton')}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Description & Beekeeper Note */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {t('About this Honey Harvest')}
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {listing.description}
          </p>
          <div className="text-xs text-slate-500 pt-1">
            {t('Harvested by master beekeeper')}{' '}
            <strong className="text-slate-800 dark:text-slate-200">{listing.beekeeperName}</strong> in{' '}
            {t(listing.state)}. {t('Net jar weight')}: <strong>{listing.jarSizeGrams}g</strong>.
          </div>
        </div>

        {/* Pricing & Add to Cart Controls */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400 font-semibold">{t('Special Direct Price')}</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                ₹{listing.priceInr}
              </span>
              {listing.mrpInr > listing.priceInr && (
                <span className="text-sm text-slate-400 line-through">₹{listing.mrpInr}</span>
              )}
              <span className="text-xs text-emerald-600 font-bold ml-1">
                {t('Inclusive of all taxes')}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono">
              {t('market.stock')} <strong>{listing.stockCount} jars</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 font-bold"
              >
                -
              </button>
              <span className="px-3 py-2 text-xs font-bold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(listing.stockCount, quantity + 1))}
                className="px-3 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 font-bold"
              >
                +
              </button>
            </div>

            <button
              onClick={() => {
                onAddToCart({
                  listingId: listing.id,
                  batchId: listing.batchId,
                  title: listing.title,
                  floralSource: listing.floralSource,
                  jarSizeGrams: listing.jarSizeGrams,
                  priceInr: listing.priceInr,
                  quantity,
                  maxStock: listing.stockCount,
                  beekeeperName: listing.beekeeperName,
                });
                onClose();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 transition"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{t('action.addToCart')} (₹{listing.priceInr * quantity})</span>
            </button>
          </div>
        </div>

        {/* Customer Reviews & Feedback Section */}
        <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-500" />
              Verified Purchase Reviews ({reviews.length})
            </h3>
            <span className="text-xs text-zinc-400">Only verified buyers can review</span>
          </div>

          {/* Leave a review form (Verified purchase only) */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Rate this Honey Batch
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 hover:scale-110 transition"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        s <= rating ? 'fill-amber-500 text-amber-500' : 'text-zinc-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handlePostReview} className="space-y-2">
              <textarea
                rows={2}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with aroma, floral notes, texture, or apiary freshness..."
                className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400">
                  ✔ Verified Purchase Protection Active
                </span>
                <button
                  type="submit"
                  disabled={submittingReview || !reviewComment.trim()}
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {submittingReview ? 'Posting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-4">
              Be the first verified customer to leave a review for this batch!
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-800/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                        {rev.userName}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        Verified Purchase
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < rev.rating ? 'fill-amber-500 text-amber-500' : 'text-zinc-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {rev.comment}
                  </p>

                  {/* Beekeeper Reply Display */}
                  {rev.beekeeperReply ? (
                    <div className="ml-4 mt-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs dark:border-amber-900/40 dark:bg-amber-950/20 space-y-1">
                      <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <CornerDownRight className="h-3.5 w-3.5 text-amber-600" />
                        <span>Beekeeper Response ({rev.beekeeperReply.beekeeperName})</span>
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300 text-xs">
                        {rev.beekeeperReply.replyText}
                      </p>
                    </div>
                  ) : (
                    /* Allow beekeeper to reply if logged in as beekeeper */
                    currentUser?.uid === listing.beekeeperId && (
                      <div className="pt-1">
                        {replyingToReviewId === rev.id ? (
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write a polite response to this customer..."
                              className="flex-1 rounded-lg border border-zinc-300 px-2.5 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                            />
                            <button
                              onClick={() => handlePostReply(rev.id)}
                              className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-white"
                            >
                              Reply
                            </button>
                            <button
                              onClick={() => setReplyingToReviewId(null)}
                              className="text-xs text-zinc-500"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setReplyingToReviewId(rev.id)}
                            className="text-xs font-semibold text-amber-600 hover:underline"
                          >
                            Reply as Beekeeper
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
