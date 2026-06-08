import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BellIcon } from './icons';
import { notificationAPI } from '../services/api';

interface NotificationBellProps {
    onSeeAll: () => void;
}

const formatTime = (iso: string): string => {
    if (!iso) return '';
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60)     return 'just now';
    if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString();
};

const NotificationBell: React.FC<NotificationBellProps> = ({ onSeeAll }) => {
    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [items, setItems] = useState<any[]>([]);
    const [loaded, setLoaded] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const refreshCount = useCallback(async () => {
        try {
            const r = await notificationAPI.unreadCount();
            if (r.success) setUnread(r.data?.unreadCount ?? r.data?.unread_count ?? 0);
        } catch { /* ignore */ }
    }, []);

    const loadList = useCallback(async () => {
        try {
            const r = await notificationAPI.list();
            if (r.success) setItems((r.data?.notifications || []).slice(0, 8));
            setLoaded(true);
        } catch { setLoaded(true); }
    }, []);

    useEffect(() => {
        refreshCount();
        const id = setInterval(refreshCount, 60_000);
        return () => clearInterval(id);
    }, [refreshCount]);

    useEffect(() => {
        if (open && !loaded) loadList();
    }, [open, loaded, loadList]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleItemClick = async (n: any) => {
        if (!(n.readAt || n.read_at)) {
            try {
                await notificationAPI.markRead(String(n.id));
                setUnread(c => Math.max(0, c - 1));
                setItems(prev => prev.map(x => x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x));
            } catch { /* ignore */ }
        }
        if (n.data?.ctaUrl) {
            window.location.href = n.data.ctaUrl;
        }
    };

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => { setOpen(o => !o); if (!loaded) loadList(); }}
                className="relative p-2 rounded-xl text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 transition-all"
                aria-label="Notifications"
            >
                <BellIcon className="w-5 h-5" />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-brand-primary text-white text-[10px] font-bold rounded-full leading-none">
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right z-50 animate-slide-down">
                    <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-light-border dark:border-dark-border flex items-center justify-between">
                            <h3 className="font-bold text-sm text-light-text-primary dark:text-dark-text-primary">Notifications</h3>
                            {unread > 0 && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">{unread} new</span>
                            )}
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {!loaded ? (
                                <div className="px-4 py-8 text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">Loading…</div>
                            ) : items.length === 0 ? (
                                <div className="px-4 py-10 text-center">
                                    <BellIcon className="w-8 h-8 mx-auto mb-2 opacity-30 text-light-text-secondary dark:text-dark-text-secondary" />
                                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">No notifications yet</p>
                                </div>
                            ) : (
                                items.map(n => {
                                    const isRead = !!(n.readAt || n.read_at);
                                    return (
                                        <button
                                            key={n.id}
                                            onClick={() => handleItemClick(n)}
                                            className={`w-full text-left px-4 py-3 border-b border-light-border/50 dark:border-dark-border/50 hover:bg-light-bg dark:hover:bg-dark-bg transition-colors ${isRead ? '' : 'bg-brand-primary/[0.03]'}`}
                                        >
                                            <div className="flex items-start gap-2.5">
                                                {!isRead && <span className="mt-1.5 w-2 h-2 rounded-full bg-brand-primary shrink-0" />}
                                                <div className={`flex-1 min-w-0 ${isRead ? '' : 'pl-0'}`}>
                                                    <p className={`text-sm font-semibold truncate ${isRead ? 'text-light-text-secondary dark:text-dark-text-secondary' : 'text-light-text-primary dark:text-dark-text-primary'}`}>{n.title}</p>
                                                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5 line-clamp-2">{n.body}</p>
                                                    <p className="text-[11px] text-light-text-muted dark:text-dark-text-muted mt-1">{formatTime(n.createdAt || n.created_at)}</p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        <button
                            onClick={() => { setOpen(false); onSeeAll(); }}
                            className="w-full px-4 py-3 text-center text-sm font-semibold text-brand-primary hover:bg-light-bg dark:hover:bg-dark-bg border-t border-light-border dark:border-dark-border"
                        >
                            See all notifications →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
