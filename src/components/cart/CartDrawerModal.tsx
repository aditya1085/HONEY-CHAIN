import React, { useState } from 'react';
import { doc, updateDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { CartItem, ShippingAddress, OrderRecord, PayoutRecord } from '../../types';
import { generateOrderInvoicePdf } from '../../services/invoiceService';
import { logActivity } from '../../services/activityLogger';
import {
  X,
  ShoppingBag,
  Trash2,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Download,
  AlertTriangle,
  Lock,
  Truck,
  Sparkles,
} from 'lucide-react';

interface CartDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (listingId: string, qty: number) => void;
  onRemoveItem: (listingId: string) => void;
  onClearCart: () => void;
  currentUser?: { uid: string; email?: string | null; displayName?: string | null };
  onOrderCompleted?: (order: OrderRecord) => void;
  onOrderPlaced?: (orderId: string) => void;
}

export const CartDrawerModal: React.FC<CartDrawerModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currentUser,
  onOrderCompleted,
  onOrderPlaced,
}) => {
  const [step, setStep] = useState<'cart' | 'address' | 'payment' | 'confirmed'>('cart');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: currentUser?.displayName || 'Aditya Tripathi',
    phone: '+91 98765 43210',
    addressLine1: 'Flat 402, Honey Blossom Residency, Sector 14',
    addressLine2: 'Near Central Research Apiary',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    pincode: '221005',
  });

  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY_TEST' | 'COD_TEST'>('RAZORPAY_TEST');
  const [processing, setProcessing] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string>('');
  const [completedOrder, setCompletedOrder] = useState<OrderRecord | null>(null);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.priceInr * item.quantity, 0);
  const taxInr = Math.round(subtotal * 0.05); // 5% GST
  const shippingInr = subtotal >= 999 || subtotal === 0 ? 0 : 60;
  const totalInr = subtotal + taxInr + shippingInr;

  const handleProceedToAddress = () => {
    if (cartItems.length === 0) return;
    setStep('address');
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.pincode) {
      setCheckoutError('Please fill in complete shipping address details.');
      return;
    }
    setStep('payment');
  };

  const handleExecutePayment = async () => {
    setProcessing(true);
    setCheckoutError('');

    try {
      // 1. Call Backend to create order and check stock
      const createResp = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          shippingAddress,
          userId: currentUser?.uid || 'guest_user',
          userEmail: currentUser?.email || 'buyer@honeychain.org',
        }),
      });

      const createData = await createResp.json();
      if (!createData.success) {
        throw new Error(createData.error || 'Failed to initialize payment');
      }

      const { orderId, razorpay } = createData;

      // 2. Simulate Razorpay Test Mode Payment & Signature Verification
      const mockPaymentId = `pay_test_${Math.random().toString(36).substring(2, 10)}`;
      const mockSignature = `sig_test_${Math.random().toString(36).substring(2, 12)}`;

      const verifyResp = await fetch('/api/checkout/verify-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayOrderId: razorpay.orderId,
          razorpayPaymentId: mockPaymentId,
          razorpaySignature: mockSignature,
        }),
      });

      const verifyData = await verifyResp.json();
      if (!verifyData.success || !verifyData.verified) {
        throw new Error('Payment signature verification failed');
      }

      const now = new Date().toISOString();

      // 3. Decrement Stock for all listings
      for (const item of cartItems) {
        const listingRef = doc(db, 'listings', item.listingId);
        await updateDoc(listingRef, {
          stockCount: increment(-item.quantity),
          updatedAt: now,
        }).catch((err) => console.warn('Stock decrement:', err));
      }

      // 4. Create Order Record in Firestore
      const newOrder: OrderRecord = {
        id: orderId,
        orderId,
        userId: currentUser?.uid || 'guest_user',
        userEmail: currentUser?.email || 'buyer@honeychain.org',
        items: cartItems.map((c) => ({
          listingId: c.listingId,
          batchId: c.batchId,
          title: c.title,
          floralSource: c.floralSource,
          jarSizeGrams: c.jarSizeGrams,
          priceInr: c.priceInr,
          quantity: c.quantity,
          beekeeperId: 'B001',
          beekeeperName: c.beekeeperName,
        })),
        subtotalInr: subtotal,
        taxInr,
        shippingInr,
        totalInr,
        status: 'confirmed',
        shippingAddress,
        paymentDetails: {
          razorpayOrderId: razorpay.orderId,
          razorpayPaymentId: mockPaymentId,
          razorpaySignature: mockSignature,
          method: paymentMethod,
          paidAt: now,
          verified: true,
        },
        tracking: {
          courierName: 'India Post Speed Post / DTDC Express',
          trackingNumber: `HC-EXP-${Math.floor(100000 + Math.random() * 900000)}`,
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 3600 * 1000).toLocaleDateString(),
          dispatchedAt: now,
        },
        invoicePdfGenerated: true,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'orders', orderId), newOrder);

      // 5. Generate Beekeeper Payout Record (90% to Beekeeper, 10% platform fee)
      const platformFee = Math.round(subtotal * 0.1);
      const beekeeperNet = subtotal - platformFee;
      const payoutId = `PAYOUT_${orderId}`;

      const payoutRecord: PayoutRecord = {
        id: payoutId,
        payoutId,
        beekeeperId: 'B001',
        beekeeperName: cartItems[0]?.beekeeperName || 'Beekeeper',
        orderId,
        grossAmountInr: subtotal,
        platformFeeInr: platformFee,
        netPayoutInr: beekeeperNet,
        status: 'pending',
        createdAt: now,
      };

      await setDoc(doc(db, 'payouts', payoutId), payoutRecord);

      // 6. Notify Buyer
      const notifId = `notif_${Date.now()}`;
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        userId: currentUser?.uid || 'guest_user',
        title: `Order Confirmed: ${orderId}`,
        message: `Your verified pure honey order (${orderId}) is confirmed! Tracking: ${newOrder.tracking?.trackingNumber}`,
        type: 'ORDER',
        linkTab: 'orders',
        read: false,
        createdAt: now,
      });

      // 7. Log Activity
      await logActivity({
        actorRole: 'BEEKEEPER',
        action: 'ORDER_PLACED',
        entityType: 'ORDER',
        entityId: orderId,
        details: `Order ${orderId} placed for ₹${totalInr} (${cartItems.length} items). Razorpay ID: ${mockPaymentId}`,
      });

      // 8. Auto-download Invoice PDF
      await generateOrderInvoicePdf(newOrder);

      setCompletedOrder(newOrder);
      setStep('confirmed');
      onClearCart();
      if (onOrderCompleted) onOrderCompleted(newOrder);
      if (onOrderPlaced) onOrderPlaced(orderId);
    } catch (err) {
      console.error('Payment execution error:', err);
      setCheckoutError(err instanceof Error ? err.message : 'Checkout transaction failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs">
      <div className="relative h-full w-full max-w-md bg-white shadow-2xl dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b p-5 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-amber-500" />
            <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              {step === 'cart'
                ? `Cart (${cartItems.length} items)`
                : step === 'address'
                ? 'Delivery Address'
                : step === 'payment'
                ? 'Secure Checkout'
                : 'Order Confirmed!'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {checkoutError && (
            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{checkoutError}</span>
            </div>
          )}

          {/* STEP 1: CART ITEMS */}
          {step === 'cart' && (
            <>
              {cartItems.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <ShoppingBag className="mx-auto h-12 w-12 text-zinc-300" />
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Your cart is empty
                  </p>
                  <p className="text-xs text-zinc-400">
                    Explore the marketplace to add certified pure honey jars.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.listingId}
                      className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1">
                        <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                          {item.title}
                        </h4>
                        <div className="text-[11px] text-zinc-500">
                          {item.floralSource} • {item.jarSizeGrams}g • ₹{item.priceInr}
                        </div>
                        <div className="font-mono text-[10px] text-amber-700 dark:text-amber-400">
                          Batch: {item.batchId}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-lg border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                          <button
                            onClick={() => onUpdateQuantity(item.listingId, item.quantity - 1)}
                            className="px-2 py-1 text-xs font-bold text-zinc-600 dark:text-zinc-300"
                          >
                            -
                          </button>
                          <span className="px-2 py-1 text-xs font-bold">{item.quantity}</span>
                          <button
                            onClick={() =>
                              onUpdateQuantity(
                                item.listingId,
                                Math.min(item.maxStock, item.quantity + 1)
                              )
                            }
                            className="px-2 py-1 text-xs font-bold text-zinc-600 dark:text-zinc-300"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.listingId)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* STEP 2: SHIPPING ADDRESS FORM */}
          {step === 'address' && (
            <form onSubmit={handleProceedToPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={shippingAddress.fullName}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, fullName: e.target.value })
                  }
                  required
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Phone Number (For Delivery SMS / OTP)
                </label>
                <input
                  type="tel"
                  value={shippingAddress.phone}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, phone: e.target.value })
                  }
                  required
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Flat, House No., Building Name
                </label>
                <input
                  type="text"
                  value={shippingAddress.addressLine1}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })
                  }
                  required
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.city}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, city: e.target.value })
                    }
                    required
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.pincode}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, pincode: e.target.value })
                    }
                    required
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={shippingAddress.state}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, state: e.target.value })
                  }
                  required
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
            </form>
          )}

          {/* STEP 3: RAZORPAY PAYMENT SIMULATION */}
          {step === 'payment' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-blue-900 dark:text-blue-200">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <span>Razorpay Test Gateway (SHA-256 Verified)</span>
                  </div>
                  <span className="rounded-full bg-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-900">
                    TEST MODE
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Simulates full UPI, NetBanking, and Card authorization with HMAC-SHA256 signature verification.
                </p>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2 text-xs">
                <label
                  onClick={() => setPaymentMethod('RAZORPAY_TEST')}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === 'RAZORPAY_TEST'
                      ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="h-4 w-4 text-amber-600" />
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      Razorpay Online (UPI / Card / NetBanking)
                    </span>
                  </div>
                  <span className="h-4 w-4 rounded-full border border-amber-600 flex items-center justify-center">
                    {paymentMethod === 'RAZORPAY_TEST' && (
                      <span className="h-2 w-2 rounded-full bg-amber-600" />
                    )}
                  </span>
                </label>

                <label
                  onClick={() => setPaymentMethod('COD_TEST')}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === 'COD_TEST'
                      ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Truck className="h-4 w-4 text-zinc-500" />
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      Cash on Delivery (COD)
                    </span>
                  </div>
                  <span className="h-4 w-4 rounded-full border border-zinc-400 flex items-center justify-center">
                    {paymentMethod === 'COD_TEST' && (
                      <span className="h-2 w-2 rounded-full bg-amber-600" />
                    )}
                  </span>
                </label>
              </div>

              <div className="rounded-xl bg-zinc-50 p-3 text-xs text-zinc-500 dark:bg-zinc-800/40 space-y-1">
                <div className="flex justify-between">
                  <span>Ship To:</span>
                  <strong>{shippingAddress.fullName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Destination:</span>
                  <strong>
                    {shippingAddress.city}, {shippingAddress.pincode}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: ORDER CONFIRMED RECEIPT */}
          {step === 'confirmed' && completedOrder && (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                  Payment Verified & Order Confirmed!
                </h3>
                <p className="text-xs text-zinc-500 mt-1 font-mono">
                  Order ID: {completedOrder.orderId}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 space-y-2 text-left">
                <div className="flex justify-between">
                  <span>Payment Status:</span>
                  <strong className="font-bold">PAID (₹{completedOrder.totalInr})</strong>
                </div>
                <div className="flex justify-between">
                  <span>Razorpay Reference:</span>
                  <strong className="font-mono text-[11px]">
                    {completedOrder.paymentDetails.razorpayPaymentId}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Est. Delivery:</span>
                  <strong>{completedOrder.tracking?.estimatedDelivery}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Consignment Tracking:</span>
                  <strong className="font-mono">{completedOrder.tracking?.trackingNumber}</strong>
                </div>
              </div>

              <button
                onClick={() => generateOrderInvoicePdf(completedOrder)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white py-2.5 text-xs font-bold text-zinc-800 shadow-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <Download className="h-4 w-4 text-amber-500" />
                <span>Download Tax Invoice & Provenance Receipt (PDF)</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Total & Step Controller */}
        {step !== 'confirmed' && (
          <div className="border-t border-zinc-100 p-5 dark:border-zinc-800 space-y-3 bg-white dark:bg-zinc-900">
            {/* Price Breakdown */}
            <div className="space-y-1 text-xs text-zinc-500">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5% Pure Honey):</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">₹{taxInr}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span className="font-semibold text-emerald-600">
                  {shippingInr > 0 ? `₹${shippingInr}` : 'FREE (Order > ₹999)'}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t text-sm font-bold text-zinc-900 dark:text-zinc-100">
                <span>Total Amount:</span>
                <span className="text-amber-600 font-mono">₹{totalInr}</span>
              </div>
            </div>

            {/* Step Action Buttons */}
            {step === 'cart' && (
              <button
                onClick={handleProceedToAddress}
                disabled={cartItems.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 disabled:opacity-50 transition"
              >
                <span>Proceed to Shipping Address</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {step === 'address' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="rounded-xl border border-zinc-300 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Back to Cart
                </button>
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 transition"
                >
                  <span>Select Payment</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {step === 'payment' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStep('address')}
                  disabled={processing}
                  className="rounded-xl border border-zinc-300 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Back to Address
                </button>
                <button
                  type="button"
                  onClick={handleExecutePayment}
                  disabled={processing}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 disabled:opacity-50 transition"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>{processing ? 'Verifying Signature...' : `Pay ₹${totalInr}`}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'confirmed' && (
          <div className="border-t border-zinc-100 p-5 dark:border-zinc-800">
            <button
              onClick={onClose}
              className="w-full rounded-2xl bg-zinc-900 py-3 text-xs font-bold text-white hover:bg-zinc-800 transition dark:bg-zinc-100 dark:text-zinc-900"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
