import React, { useEffect, useState, useRef, useCallback } from 'react';
import gsap from 'gsap';
import * as api from '../services/api';
import type { NotificationItem } from '../services/api';

export const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);

  const fetchCount = useCallback(async () => {
    try {
      const { count } = await api.fetchUnreadCount();
      setUnreadCount(count);
    } catch { /* ignore if not authenticated yet */ }
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  useEffect(() => {
    if (unreadCount > 0 && badgeRef.current) {
      gsap.fromTo(badgeRef.current, { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });
    }
  }, [unreadCount]);

  const handleOpen = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoading(true);
    try {
      const items = await api.fetchNotifications();
      setNotifications(items);
      if (unreadCount > 0) {
        await api.markAllNotificationsRead();
        setUnreadCount(0);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }

    requestAnimationFrame(() => {
      if (panelRef.current) {
        gsap.fromTo(panelRef.current, { opacity: 0, y: -10, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'power3.out' });
      }
    });
  };

  const timeAgo = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const typeIcon: Record<string, string> = {
    NUDGE: 'notification_important',
    REVIEW_APPROVED: 'check_circle',
    REVIEW_FLAGGED: 'flag',
    SYSTEM: 'info',
  };

  const typeColor: Record<string, string> = {
    NUDGE: 'text-tertiary',
    REVIEW_APPROVED: 'text-primary',
    REVIEW_FLAGGED: 'text-error',
    SYSTEM: 'text-secondary',
  };

  return (
    <div className="relative">
      <button onClick={handleOpen} className="p-2 rounded-full hover:bg-white/80 transition-all text-secondary relative">
        <span className="material-symbols-outlined" style={unreadCount > 0 ? { fontVariationSettings: "'FILL' 1" } : undefined}>
          notifications
        </span>
        {unreadCount > 0 && (
          <span ref={badgeRef} className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-error text-on-error text-[10px] font-black rounded-full flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div ref={panelRef} className="absolute right-0 top-12 z-50 w-96 max-h-[70vh] bg-white rounded-[1.5rem] shadow-[0px_24px_48px_rgba(27,27,30,0.12)] ring-1 ring-outline-variant/10 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-outline-variant/10 flex items-center justify-between">
              <h3 className="font-bold text-on-surface">Notifications</h3>
              {notifications.length > 0 && (
                <span className="text-xs font-semibold text-secondary">{notifications.length} total</span>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {loading && <div className="p-8 text-center text-secondary text-sm">Loading...</div>}

              {!loading && notifications.length === 0 && (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-4xl text-outline-variant">notifications_off</span>
                  <p className="text-sm text-secondary mt-2">No notifications yet</p>
                </div>
              )}

              {!loading && notifications.map((n) => (
                <div key={n.id} className={`px-5 py-4 border-b border-outline-variant/5 hover:bg-surface-container-low transition-colors ${!n.read ? 'bg-primary-container/10' : ''}`}>
                  <div className="flex gap-3">
                    <span className={`material-symbols-outlined text-xl mt-0.5 ${typeColor[n.type] ?? 'text-secondary'}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}>
                      {typeIcon[n.type] ?? 'circle_notifications'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface">{n.title}</p>
                      {n.message && <p className="text-xs text-secondary mt-1 leading-relaxed">{n.message}</p>}
                      <p className="text-[10px] text-secondary mt-1.5 font-semibold">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
