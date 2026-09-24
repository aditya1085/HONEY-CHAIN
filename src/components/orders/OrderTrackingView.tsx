import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { OrderRecord, OrderStatus } from '../../types';
import { generateOrderInvoicePdf } from '../../services/invoiceService';
import { logActivity } from '../../services/activityLogger';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Download,
  AlertTriangle,
  ExternalLink,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';

interface OrderTrackingViewProps {
  currentUserId?: string;
  userRole?: string;
  onVerifyBatch?: (batchId: string) => void;
  onVerifyPack?: (packId: string) => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  currentUserId,
  userRole,
  onVerifyBatch,
  onVerifyPack,
}) => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Dispatch Update Form
  const [courierName, setCourierName] = useState<string>('DTDC Express');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  useEffect(() => {
    // If admin, see all orders; if customer, see own orders
    let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    if (userRole !== 'ADMIN' && currentUserId) {
      q = query(
        collection(db, 'orders'),
        where('userId', '==', currentUserId),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as OrderRecord);
        setOrders(list);
        setLoading(false);
        if (list.length > 0 && !selectedOrder) {
          setSelectedOrder(list[0]);
        }
      },
      (err) => {
        console.warn('Orders listener fallback:', err);
        const fallbackQ = collection(db, 'orders');
        onSnapshot(fallbackQ, (snap) => {
          const list = snap.docs.map((d) => d.data() as OrderRecord);
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders(list);
          setLoading(false);
        });
      }
    );

    return () => unsubscribe();
  }, [currentUserId, userRole]);

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingStatus(true);
    try {
      const now = new Date().toISOString();
      const updates: any = {
        status: nextStatus,
        updatedAt: now,
      };

      if (nextStatus === 'dispatched') {
        updates['tracking.courierName'] = courierName;
        updates['tracking.trackingNumber'] =
          trackingNumber || `IND-POST-${Math.floor(100000 + Math.random() * 900000)}`;
        updates['tracking.dispatchedAt'] = now;
      } else if (nextStatus === 'delivered') {
        updates['tracking.deliveredAt'] = now;
      }

      await updateDoc(doc(db, 'orders', orderId), updates);

      await logActivity({
        actorRole: (userRole as any) || 'ADMIN',
        action: 'UPDATE_ORDER_STATUS',
        entityType: 'ORDER',
        entityId: orderId,
        details: `Order ${orderId} transitioned to status: ${nextStatus.toUpperCase()}`,
      });

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: nextStatus });
      }
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredOrders = orders.filter((o) =>
    statusFilter === 'ALL' ? true : o.status === statusFilter
  );

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'placed':
        return (
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
            Order Placed
          </span>
        );
      case 'confirmed':
        return (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
            Payment Confirmed
          </span>
        );
      case 'dispatched':
        return (
          <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">
            Dispatched in Transit
          </span>
        );
      case 'delivered':
        return (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
            Delivered
          </span>
        );
      case 'cancelled':
        return (
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Truck className="h-6 w-6 text-amber-500" />
            Orders & Traceability Tracking
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Real-time fulfillment state machine with verified consignment tracking and official invoices
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'confirmed', 'dispatched', 'delivered'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === s
                  ? 'bg-amber-500 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              {s === 'ALL' ? 'All Orders' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-sm text-zinc-400">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
          <Package className="mx-auto h-12 w-12 text-zinc-300" />
          <h3 className="mt-2 text-base font-bold text-zinc-800 dark:text-zinc-200">
            No orders found
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Orders placed in the marketplace will appear here for live consignment tracking.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Selector List */}
          <div className="space-y-3">
            {filteredOrders.map((ord) => {
              const isSelected = selectedOrder?.id === ord.id;
              return (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {ord.orderId}
                    </span>
                    {getStatusBadge(ord.status)}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                    <span>{new Date(ord.createdAt).toLocaleDateString()}</span>
                    <strong className="text-zinc-900 dark:text-zinc-100 font-mono">
                      ₹{ord.totalInr}
                    </strong>
                  </div>

                  <div className="mt-1 text-[11px] text-zinc-400 truncate">
                    {ord.items.map((i) => `${i.quantity}x ${i.title}`).join(', ')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Order Tracking Panel */}
          {selectedOrder && (
            <div className="lg:col-span-2 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5 dark:border-zinc-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                      {selectedOrder.orderId}
                    </h3>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString()} • Paid via{' '}
                    {selectedOrder.paymentDetails.method}
                  </p>
                </div>

                <button
                  onClick={() => generateOrderInvoicePdf(selectedOrder)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 shadow-xs"
                >
                  <Download className="h-3.5 w-3.5 text-amber-500" />
                  <span>Download Invoice (PDF)</span>
                </button>
              </div>

              {/* Order State Machine Stepper */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Consignment Milestones
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div
                    className={`p-3 rounded-xl border ${
                      ['placed', 'confirmed', 'dispatched', 'delivered'].includes(selectedOrder.status)
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-400'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>1. Confirmed</span>
                    </div>
                    <div className="text-[10px] opacity-80 mt-1">Payment verified</div>
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${
                      ['confirmed', 'dispatched', 'delivered'].includes(selectedOrder.status)
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-400'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" />
                      <span>2. Packed</span>
                    </div>
                    <div className="text-[10px] opacity-80 mt-1">Serialized jars</div>
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${
                      ['dispatched', 'delivered'].includes(selectedOrder.status)
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-400'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" />
                      <span>3. Dispatched</span>
                    </div>
                    <div className="text-[10px] opacity-80 mt-1">In transit</div>
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${
                      selectedOrder.status === 'delivered'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-400'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>4. Delivered</span>
                    </div>
                    <div className="text-[10px] opacity-80 mt-1">To doorstep</div>
                  </div>
                </div>
              </div>

              {/* Tracking Information Box */}
              {selectedOrder.tracking && (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Logistics Courier:</span>
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {selectedOrder.tracking.courierName}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Waybill / Consignment Tracking:</span>
                    <strong className="font-mono text-zinc-800 dark:text-zinc-200">
                      {selectedOrder.tracking.trackingNumber}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Estimated Delivery:</span>
                    <strong className="text-emerald-600">
                      {selectedOrder.tracking.estimatedDelivery}
                    </strong>
                  </div>
                </div>
              )}

              {/* Order Items Table */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Ordered Jars
                </div>
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50 uppercase text-[10px] font-semibold text-zinc-500">
                      <tr>
                        <th className="p-3">Item</th>
                        <th className="p-3">Batch ID</th>
                        <th className="p-3">Qty</th>
                        <th className="p-3">Price</th>
                        <th className="p-3 text-right">Provenance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono">
                      {selectedOrder.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-sans font-medium text-zinc-900 dark:text-zinc-100">
                            {it.title} ({it.jarSizeGrams}g)
                          </td>
                          <td className="p-3 text-amber-700 dark:text-amber-400">{it.batchId}</td>
                          <td className="p-3">{it.quantity}</td>
                          <td className="p-3 font-sans font-bold">₹{it.priceInr * it.quantity}</td>
                          <td className="p-3 text-right">
                            {onVerifyBatch && (
                              <button
                                onClick={() => onVerifyBatch(it.batchId)}
                                className="inline-flex items-center gap-1 font-sans text-xs font-bold text-amber-600 hover:underline"
                              >
                                <span>Verify QR</span>
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Admin / Beekeeper Status Transition Controls */}
              {userRole === 'ADMIN' && (
                <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-900/40 dark:bg-purple-950/20 space-y-3">
                  <h4 className="font-bold text-xs text-purple-900 dark:text-purple-200">
                    Admin Fulfillment Gate Controller
                  </h4>

                  <div className="flex flex-wrap items-center gap-2">
                    {selectedOrder.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'dispatched')}
                        disabled={updatingStatus}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-sm"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        <span>Dispatch Order with Tracking Number</span>
                      </button>
                    )}

                    {selectedOrder.status === 'dispatched' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'delivered')}
                        disabled={updatingStatus}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Mark Consignment Delivered</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
