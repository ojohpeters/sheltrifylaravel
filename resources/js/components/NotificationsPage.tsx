import React, { useState, useEffect, useCallback } from 'react';
import { CloseIcon, BellIcon, TrashIcon, CheckCircleIcon } from './icons';
import { notificationAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface NotificationsPageProps {
    onClose?: () => void;
}

const formatTime = (iso: string): string => {
    if (!iso) return '';
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60)      return 'just now';
    if (diff < 3600)    return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)   return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800)  return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString();
};

const typeBadge = (type: string): { label: string; color: string } => {
    const map: Record<string, { label: string; color: string }> = {
        product_interest:     { label: 'Interest',  color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
        appointment_request:  { label: 'Viewing',   color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
        admin_broadcast:      { label: 'Announcement', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
        admin_message:        { label: 'Admin',     color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
        account_suspended:    { label: 'Suspended', color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
        account_reactivated:  { label: 'Reactivated', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    };
    return map[type] || { label: type.replace(/_/g, ' '), color: 'bg-light-border/40 dark:bg-dark-border/40 text-light-text-secondary dark:text-dark-text-secondary' };
};

const NotificationsPage: React.FC<NotificationsPageProps> = ({ onClose }) => {
    const { showSuccess, showError } = useToast();
    const [notifs, setNotifs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const r = await notificationAPI.list();
            if (r.success) setNotifs(r.data?.notifications || []);
            else setNotifs([]);
        } catch { setNotifs([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleMarkRead = async (id: number, readAt: string | null) => {
        if (readAt) return;
        try {
            await notificationAPI.markRead(String(id));
            setNotifs(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString(), read_at: new Date().toISOString() } : n));
        } catch { /* ignore */ }
    };

    const handleMarkAllRead = async () => {
        try {
            const r = await notificationAPI.markAllRead();
            if (r.success) {
                showSuccess('All marked as read');
                setNotifs(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString(), read_at: new Date().toISOString() })));
            }
        } catch (e: any) { showError(e.message || 'Failed'); }
    };

    const handleDelete = async (id: number) => {
        try {
            const r = await notificationAPI.delete(String(id));
            if (r.success) {
                setNotifs(prev => prev.filter(n => n.id !== id));
            }
        } catch (e: any) { showError(e.message || 'Failed'); }
    };

    const visible = filter === 'all' ? notifs : notifs.filter(n => !(n.readAt || n.read_at));

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
            <div className="sticky top-0 z-10 bg-light-card/95 dark:bg-dark-card/95 backdrop-blur-sm border-b border-light-border dark:border-dark-border">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BellIcon className="w-5 h-5 text-brand-primary" />
                        <h2 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">Notifications</h2>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-light-border dark:hover:bg-dark-border text-light-text-secondary dark:text-dark-text-secondary">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-3xl">
                <div className="flex items-center justify-between mb-4 gap-2">
                    <div className="flex gap-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-1">
                        {(['all', 'unread'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                                    filter === f
                                        ? 'bg-brand-primary text-white'
                                        : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg dark:hover:bg-dark-bg'
                                }`}
                            >
                                {f === 'all' ? 'All' : 'Unread'}
                            </button>
                        ))}
                    </div>
                    {notifs.some(n => !(n.readAt || n.read_at)) && (
                        <button onClick={handleMarkAllRead} className="text-sm font-semibold text-brand-primary hover:underline">
                            Mark all read
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-4 animate-pulse">
                                <div className="h-4 bg-light-border dark:bg-dark-border rounded w-3/4 mb-2" />
                                <div className="h-3 bg-light-border dark:bg-dark-border rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : visible.length === 0 ? (
                    <div className="text-center py-16 text-light-text-secondary dark:text-dark-text-secondary">
                        <BellIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>You're all caught up.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {visible.map(n => {
                            const isRead = !!(n.readAt || n.read_at);
                            const badge = typeBadge(n.type);
                            const ctaUrl = n.data?.ctaUrl;
                            return (
                                <div
                                    key={n.id}
                                    onClick={() => handleMarkRead(n.id, n.readAt || n.read_at)}
                                    className={`group relative bg-light-card dark:bg-dark-card border rounded-xl p-4 cursor-pointer transition-all ${
                                        isRead
                                            ? 'border-light-border dark:border-dark-border opacity-80'
                                            : 'border-brand-primary/30 shadow-sm hover:shadow-md'
                                    }`}
                                >
                                    {!isRead && <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-brand-primary"></span>}
                                    <div className="flex items-start gap-3">
                                        <div className="shrink-0 w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                                            <BellIcon className="w-5 h-5 text-brand-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${badge.color}`}>
                                                    {badge.label}
                                                </span>
                                                <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{formatTime(n.createdAt || n.created_at)}</span>
                                            </div>
                                            <h3 className={`mt-1 font-semibold text-sm ${isRead ? 'text-light-text-secondary dark:text-dark-text-secondary' : 'text-light-text-primary dark:text-dark-text-primary'}`}>{n.title}</h3>
                                            <p className="mt-0.5 text-sm text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">{n.body}</p>

                                            {/* Quick contact actions for interest notifications */}
                                            {n.type === 'product_interest' && n.data?.seekerPhone && (
                                                <div className="mt-3 flex gap-2">
                                                    <a
                                                        onClick={e => e.stopPropagation()}
                                                        href={`tel:${n.data.seekerPhone}`}
                                                        className="px-3 py-1.5 text-xs font-semibold bg-brand-primary text-white rounded-lg hover:bg-brand-secondary"
                                                    >
                                                        📞 Call {n.data.seekerName?.split(' ')[0] || ''}
                                                    </a>
                                                    <a
                                                        onClick={e => e.stopPropagation()}
                                                        href={`https://wa.me/${(n.data.seekerPhone || '').replace(/[^\d+]/g, '')}?text=${encodeURIComponent(`Hi ${n.data.seekerName?.split(' ')[0] || ''}, you showed interest in "${n.data.productName || 'my listing'}" on ShelTrify.`)}`}
                                                        target="_blank" rel="noopener noreferrer"
                                                        className="px-3 py-1.5 text-xs font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600"
                                                    >
                                                        💬 WhatsApp
                                                    </a>
                                                </div>
                                            )}

                                            {ctaUrl && (
                                                <a
                                                    onClick={e => e.stopPropagation()}
                                                    href={ctaUrl}
                                                    className="mt-3 inline-block text-xs font-semibold text-brand-primary hover:underline"
                                                >
                                                    {n.data?.ctaLabel || 'Open →'}
                                                </a>
                                            )}
                                        </div>
                                        <button
                                            onClick={e => { e.stopPropagation(); handleDelete(n.id); }}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
