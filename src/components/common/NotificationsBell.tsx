import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { NotificationRecord } from '../../types';
import {
  Bell,
  CheckCircle2,
  Package,
  Sparkles,
  ShoppingBag,
  HeartHandshake,
  MessageSquare,
  Clock,
  X,
} from 'lucide-react';

interface NotificationsBellProps {
  currentUserId?: string;
  userId?: string;
  userEmail?: string;
  onNavigateTab?: (tab: string, param?: string) => void;
  onSelectNotification?: (notification: NotificationRecord) => void;
}

export const NotificationsBell: React.FC<NotificationsBellProps> = ({
  currentUserId,
  userId,
  userEmail,
  onNavigateTab,
  onSelectNotification,
}) => {
  const effectiveUserId = currentUserId || userId;
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    // Listen to notifications
    const q = collection(db, 'notifications');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as NotificationRecord);
        // Filter for user or broadcast notifications
        const userNotifs = list.filter(
          (n) => !n.userId || n.userId === effectiveUserId || n.userId === 'guest_user' || (userEmail && n.userId === userEmail)
        );
        userNotifs.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setNotifications(userNotifs);
      },
      (err) => {
        console.warn('Notifications listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [effectiveUserId, userEmail]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), {
        read: true,
      });
    } catch (e) {
      console.warn('Mark read error:', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      for (const n of notifications.filter((x) => !x.read)) {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      }
    } catch (e) {
      console.warn('Mark all read error:', e);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'ORDER':
        return <Package className="h-4 w-4 text-emerald-500" />;
      case 'STOCK_ALERT':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      case 'REVIEW':
        return <MessageSquare className="h-4 w-4 text-amber-500" />;
      case 'TRUST_SCORE':
        return <HeartHandshake className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-zinc-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl border border-zinc-200 bg-white p-4 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 z-50 space-y-3">
          <div className="flex items-center justify-between border-b pb-2.5 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" />
              <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                Activity Notifications ({unreadCount} unread)
              </h4>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-semibold text-amber-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-6">
                No notifications right now.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    handleMarkAsRead(n.id);
                    if (onSelectNotification) {
                      onSelectNotification(n);
                      setIsOpen(false);
                    } else if (n.linkTab && onNavigateTab) {
                      onNavigateTab(n.linkTab, n.linkParam);
                      setIsOpen(false);
                    }
                  }}
                  className={`p-3 rounded-2xl border text-xs cursor-pointer transition ${
                    n.read
                      ? 'border-zinc-100 bg-zinc-50/50 dark:border-zinc-800/60 dark:bg-zinc-900/40 text-zinc-500'
                      : 'border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20 text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">{getNotifIcon(n.type)}</div>
                    <div className="space-y-0.5 flex-1">
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>{n.title}</span>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />}
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">{n.message}</p>
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1 pt-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
