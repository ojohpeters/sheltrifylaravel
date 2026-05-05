import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    HeartIcon,
    ArrowUpTrayIcon,
    PlayCircleIcon,
    CloseIcon,
    CloudArrowUpIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
    FilmIcon,
    LinkIcon
} from './icons';
import { rentalWahalaAPI, uploadAPI } from '../services/api';
import { getAIRecommendationsForFeels } from '../services/geminiService';
import { AIRecommendation } from '../types';
import { useToast } from '../contexts/ToastContext';

interface RentalWahalaPageProps {
    isAuthenticated?: boolean;
    isAdmin?: boolean;
    currentUser?: any;
}

interface WahalaVideo {
    id: string;
    videoUrl: string;
    caption?: string | null;
    music?: string | null;
    likes: number;
    shares: number;
    user: {
        id: string;
        fullName: string | null;
        email: string;
        avatarUrl: string | null;
    };
}

const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const formatCount = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return String(num);
};

const formatFileSize = (bytes: number): string => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' bytes';
};

// --- Grid Thumbnail Card ---
const WahalaGridCard: React.FC<{
    video: WahalaVideo;
    onOpen: () => void;
    onLike: () => void;
}> = React.memo(({ video, onOpen, onLike }) => {
    const { showSuccess } = useToast();
    const [isLiked, setIsLiked] = useState(false);
    const [likes, setLikes] = useState(video.likes || 0);

    const videoId = useMemo(() => getYouTubeId(video.videoUrl), [video.videoUrl]);
    const thumbnailUrl = useMemo(() =>
        videoId
            ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
            : null,
        [videoId]
    );
    const authorName = useMemo(() => video.user.fullName || video.user.email.split('@')[0], [video.user]);

    useEffect(() => { setLikes(video.likes || 0); }, [video.likes]);

    const handleLike = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        const wasLiked = isLiked;
        setIsLiked(!wasLiked);
        setLikes(wasLiked ? Math.max(0, likes - 1) : likes + 1);
        onLike();
    }, [isLiked, likes, onLike]);

    const handleShare = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (navigator.share) {
            navigator.share({ title: video.caption || 'Check out this Rental Wahala', url: window.location.href }).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.href);
            showSuccess('Link copied!');
        }
    }, [video.caption, showSuccess]);

    return (
        <div
            className="group relative rounded-2xl overflow-hidden bg-gray-900 cursor-pointer aspect-[9/16] shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            onClick={onOpen}
        >
            {/* Thumbnail */}
            {thumbnailUrl ? (
                <img
                    src={thumbnailUrl}
                    alt={video.caption || 'Rental Wahala'}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />
            ) : video.videoUrl ? (
                <video
                    src={video.videoUrl}
                    muted
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 w-full h-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <FilmIcon className="w-10 h-10 text-gray-500" />
                </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

            {/* Play icon center */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                    <PlayCircleIcon className="w-8 h-8 text-white" />
                </div>
            </div>

            {/* Author row */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <img
                    src={video.user.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=64'}
                    alt={authorName}
                    className="w-6 h-6 rounded-full border border-white/50 object-cover"
                    loading="lazy"
                />
                <span className="text-[10px] font-semibold text-white/90 drop-shadow-sm truncate max-w-[80px]">
                    {authorName}
                </span>
            </div>

            {/* Bottom: caption + actions */}
            <div className="absolute bottom-0 left-0 right-0 p-2.5">
                {video.caption && (
                    <p className="text-[10px] text-white/80 line-clamp-1 mb-1.5">{video.caption}</p>
                )}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleLike}
                        className="flex items-center gap-1 touch-manipulation"
                        aria-label={isLiked ? 'Unlike' : 'Like'}
                    >
                        <HeartIcon className={`w-4 h-4 transition-colors ${isLiked ? 'text-red-500 fill-current' : 'text-white fill-transparent stroke-white'}`} />
                        <span className="text-[10px] font-semibold text-white drop-shadow">{formatCount(likes)}</span>
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1 touch-manipulation"
                        aria-label="Share"
                    >
                        <ArrowUpTrayIcon className="w-4 h-4 text-white" />
                        <span className="text-[10px] font-semibold text-white drop-shadow">{formatCount(video.shares || 0)}</span>
                    </button>
                </div>
            </div>
        </div>
    );
});
WahalaGridCard.displayName = 'WahalaGridCard';

// --- Video Lightbox ---
const WahalaLightbox: React.FC<{
    video: WahalaVideo | null;
    onClose: () => void;
    onLike: () => void;
    onPrev: () => void;
    onNext: () => void;
    hasPrev: boolean;
    hasNext: boolean;
}> = ({ video, onClose, onLike, onPrev, onNext, hasPrev, hasNext }) => {
    const { showSuccess } = useToast();
    const [isLiked, setIsLiked] = useState(false);
    const [likes, setLikes] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const videoId = useMemo(() => video ? getYouTubeId(video.videoUrl) : null, [video]);
    const isLocalVideo = video && !videoId && video.videoUrl;
    const authorName = useMemo(() => video ? (video.user.fullName || video.user.email.split('@')[0]) : '', [video]);

    useEffect(() => {
        if (video) {
            setIsLiked(false);
            setLikes(video.likes || 0);
            setIsPlaying(false);
        }
    }, [video?.id]);

    // Key navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') onPrev();
            if (e.key === 'ArrowRight') onNext();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose, onPrev, onNext]);

    const handleLike = useCallback(() => {
        const wasLiked = isLiked;
        setIsLiked(!wasLiked);
        setLikes(wasLiked ? Math.max(0, likes - 1) : likes + 1);
        onLike();
    }, [isLiked, likes, onLike]);

    const handleShare = useCallback(() => {
        if (navigator.share) {
            navigator.share({ title: video?.caption || 'Check out this Rental Wahala', url: window.location.href }).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.href);
            showSuccess('Link copied!');
        }
    }, [video?.caption, showSuccess]);

    const handlePlay = useCallback(() => {
        if (isLocalVideo && videoRef.current) {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        } else {
            setIsPlaying(true);
        }
    }, [isLocalVideo]);

    const handleMute = useCallback(() => {
        setIsMuted(m => !m);
        if (videoRef.current) videoRef.current.muted = !isMuted;
    }, [isMuted]);

    if (!video) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={onClose}
        >
            <style>{`
                @keyframes lbFadeIn { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }
                .lb-animate { animation: lbFadeIn 0.2s ease-out forwards; }
            `}</style>

            {/* Prev / Next */}
            {hasPrev && (
                <button
                    onClick={e => { e.stopPropagation(); onPrev(); }}
                    className="absolute left-3 sm:left-6 z-20 p-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all touch-manipulation"
                    aria-label="Previous"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
            )}
            {hasNext && (
                <button
                    onClick={e => { e.stopPropagation(); onNext(); }}
                    className="absolute right-3 sm:right-6 z-20 p-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all touch-manipulation"
                    aria-label="Next"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            )}

            {/* Close */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all"
                aria-label="Close"
            >
                <CloseIcon className="w-5 h-5" />
            </button>

            {/* Main panel */}
            <div
                className="lb-animate relative flex flex-col sm:flex-row w-full max-w-4xl max-h-[95vh] mx-4 rounded-2xl overflow-hidden bg-gray-950 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Video side */}
                <div className="relative flex-1 bg-black flex items-center justify-center min-h-[50vh] sm:min-h-0" style={{ aspectRatio: '9/16', maxHeight: '85vh' }}>
                    {videoId ? (
                        <>
                            {isPlaying ? (
                                <iframe
                                    key={`${videoId}-${isMuted ? 'm' : 'u'}`}
                                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&rel=0&modestbranding=1&playsinline=1`}
                                    title={video.caption || 'Video'}
                                    className="absolute inset-0 w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <>
                                    <img
                                        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                                        alt={video.caption || 'Video'}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer" onClick={handlePlay}>
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:scale-110 transition-transform">
                                            <PlayCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    ) : isLocalVideo ? (
                        <>
                            <video
                                ref={videoRef}
                                src={video.videoUrl}
                                muted={isMuted}
                                loop
                                playsInline
                                className="absolute inset-0 w-full h-full object-contain"
                            />
                            {!isPlaying && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer" onClick={handlePlay}>
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:scale-110 transition-transform">
                                        <PlayCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={handleMute}
                                className="absolute top-3 left-3 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all"
                            >
                                {isMuted ? <SpeakerXMarkIcon className="w-4 h-4" /> : <SpeakerWaveIcon className="w-4 h-4" />}
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center justify-center w-full h-full">
                            <FilmIcon className="w-12 h-12 text-gray-600" />
                        </div>
                    )}
                </div>

                {/* Info side */}
                <div className="w-full sm:w-72 flex flex-col bg-gray-950 border-t sm:border-t-0 sm:border-l border-white/10">
                    {/* Author */}
                    <div className="flex items-center gap-3 p-4 border-b border-white/10">
                        <img
                            src={video.user.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=64'}
                            alt={authorName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-brand-primary/40"
                        />
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{authorName}</p>
                            <p className="text-xs text-white/50 truncate">{video.user.email.split('@')[0]}</p>
                        </div>
                    </div>

                    {/* Caption */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        {video.caption && (
                            <p className="text-sm text-white/80 leading-relaxed">{video.caption}</p>
                        )}
                        {video.music && (
                            <p className="text-xs text-brand-primary/70 mt-2 flex items-center gap-1">
                                <span>♪</span> {video.music}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="p-4 border-t border-white/10 flex items-center gap-4">
                        <button
                            onClick={handleLike}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all touch-manipulation group"
                            aria-label={isLiked ? 'Unlike' : 'Like'}
                        >
                            <HeartIcon className={`w-5 h-5 transition-all group-hover:scale-110 ${isLiked ? 'text-red-500 fill-current' : 'text-white fill-transparent stroke-white'}`} />
                            <span className="text-sm font-semibold text-white">{formatCount(likes)}</span>
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all touch-manipulation group"
                            aria-label="Share"
                        >
                            <ArrowUpTrayIcon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-semibold text-white">Share</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Skeleton ---
const GridSkeleton: React.FC = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[9/16] rounded-2xl bg-light-border dark:bg-dark-border animate-pulse" />
        ))}
    </div>
);

// --- Upload Modal ---
const UploadModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onUpload: (data: { videoUrl: string; caption?: string; music?: string }) => Promise<void>;
    uploading: boolean;
}> = ({ isOpen, onClose, onUpload, uploading }) => {
    const [uploadMethod, setUploadMethod] = useState<'file' | 'youtube'>('youtube');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [caption, setCaption] = useState('');
    const [music, setMusic] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showError } = useToast();

    const resetForm = useCallback(() => {
        setYoutubeUrl(''); setCaption(''); setMusic('');
        setVideoFile(null); setUploadProgress(0); setUploadMethod('youtube');
    }, []);

    const handleClose = useCallback(() => { resetForm(); onClose(); }, [resetForm, onClose]);

    const handleFileSelect = useCallback((file: File) => {
        const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
        if (!validTypes.includes(file.type)) { showError('Invalid file type. Please upload MP4, WebM, OGG, or MOV.'); return; }
        if (file.size > 20 * 1024 * 1024) { showError(`File too large. Max 20MB. Your file is ${formatFileSize(file.size)}.`); return; }
        setVideoFile(file);
    }, [showError]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setDragOver(false);
        const file = e.dataTransfer.files[0]; if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        let videoUrl = '';

        if (uploadMethod === 'youtube') {
            if (!youtubeUrl.trim()) { showError('Please enter a YouTube URL'); return; }
            const vId = getYouTubeId(youtubeUrl.trim());
            if (!vId) { showError('Please enter a valid YouTube URL'); return; }
            videoUrl = `https://www.youtube.com/watch?v=${vId}`;
        } else {
            if (!videoFile) { showError('Please select a video file'); return; }
            try {
                setUploadProgress(10);
                const response: any = await uploadAPI.uploadVideo(videoFile, true, (p) => setUploadProgress(10 + Math.round(p * 0.8)));
                if (response.success && response.data?.url) {
                    videoUrl = response.data.url; setUploadProgress(95);
                } else {
                    showError(response.message || 'Failed to upload video'); setUploadProgress(0); return;
                }
            } catch (err: any) {
                showError(err.message || 'Failed to upload video'); setUploadProgress(0); return;
            }
        }

        setUploadProgress(100);
        await onUpload({ videoUrl, caption: caption.trim() || undefined, music: music.trim() || undefined });
        resetForm();
    }, [uploadMethod, youtubeUrl, videoFile, caption, music, onUpload, resetForm, showError]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4 sm:p-4 bg-black/70 backdrop-blur-sm">
            <div className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl w-full max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                <button onClick={handleClose} className="absolute top-3 right-3 p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary" aria-label="Close">
                    <CloseIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                <div className="mb-4 sm:mb-5">
                    <h2 className="text-xl sm:text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">Upload Rental Wahala Video</h2>
                    <p className="mt-1 text-xs sm:text-sm text-light-text-secondary dark:text-dark-text-secondary">Share your funniest rental moments with the community</p>
                </div>

                <div className="flex gap-2 mb-4">
                    {(['youtube', 'file'] as const).map(m => (
                        <button key={m} type="button" onClick={() => setUploadMethod(m)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-medium text-xs sm:text-sm transition-all touch-manipulation ${
                                uploadMethod === m
                                    ? 'bg-brand-primary text-white'
                                    : 'bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary'
                            }`}
                        >
                            {m === 'youtube' ? <><LinkIcon className="w-4 h-4" /> YouTube URL</> : <><FilmIcon className="w-4 h-4" /> Upload File</>}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {uploadMethod === 'youtube' && (
                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1.5">YouTube URL <span className="text-red-500">*</span></label>
                            <input type="url" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-3 py-2.5 text-xs sm:text-sm text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                        </div>
                    )}

                    {uploadMethod === 'file' && (
                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1.5">Video File <span className="text-red-500">*</span></label>
                            {!videoFile ? (
                                <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                                        dragOver ? 'border-brand-primary bg-brand-primary/10' : 'border-light-border dark:border-dark-border hover:border-brand-primary/50'
                                    }`}
                                >
                                    <FilmIcon className="w-10 h-10 mx-auto text-light-text-secondary dark:text-dark-text-secondary mb-2" />
                                    <p className="text-xs sm:text-sm text-light-text-primary dark:text-dark-text-primary font-medium">Drag & drop or click to browse</p>
                                    <p className="text-[10px] sm:text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">MP4, WebM, OGG, MOV • Max 20MB</p>
                                </div>
                            ) : (
                                <div className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-3 flex items-center gap-3">
                                    <FilmIcon className="w-8 h-8 text-brand-primary flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-light-text-primary dark:text-dark-text-primary truncate">{videoFile.name}</p>
                                        <p className="text-[10px] text-light-text-secondary dark:text-dark-text-secondary">{formatFileSize(videoFile.size)}</p>
                                    </div>
                                    <button type="button" onClick={() => setVideoFile(null)} className="p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500">
                                        <CloseIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <input ref={fileInputRef} type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} className="hidden" />
                        </div>
                    )}

                    {uploading && uploadProgress > 0 && (
                        <div className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-3">
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-light-text-primary dark:text-dark-text-primary font-medium flex items-center gap-1.5"><span className="w-2 h-2 bg-brand-primary rounded-full animate-pulse inline-block" />Uploading...</span>
                                <span className="font-bold text-brand-primary">{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-light-border dark:bg-dark-border rounded-full h-2 overflow-hidden">
                                <div className="bg-gradient-to-r from-brand-primary to-cyan-400 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1.5">Caption</label>
                        <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="What's the wahala about?" rows={2}
                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-3 py-2.5 text-xs sm:text-sm text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none resize-none" />
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1.5">Music / Sound Credit</label>
                        <input type="text" value={music} onChange={e => setMusic(e.target.value)} placeholder="e.g., Dramatic Sound - Nollywood FX"
                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-3 py-2.5 text-xs sm:text-sm text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <button type="submit" disabled={uploading || (uploadMethod === 'youtube' ? !youtubeUrl.trim() : !videoFile)}
                            className="flex-1 bg-brand-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation">
                            {uploading ? 'Uploading...' : 'Upload Video'}
                        </button>
                        <button type="button" onClick={handleClose} disabled={uploading}
                            className="px-5 py-2.5 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary rounded-lg text-sm hover:bg-light-border dark:hover:bg-dark-border disabled:opacity-50 transition-colors touch-manipulation">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RentalWahalaPage: React.FC<RentalWahalaPageProps> = ({ isAuthenticated, isAdmin, currentUser }) => {
    const [videos, setVideos] = useState<WahalaVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isRecsModalOpen, setIsRecsModalOpen] = useState(false);
    const [isFetchingRecs, setIsFetchingRecs] = useState(false);
    const [recommendations, setRecommendations] = useState<AIRecommendation[] | null>(null);
    const [recsError, setRecsError] = useState<string | null>(null);
    const { showSuccess, showError } = useToast();

    const loadVideos = useCallback(async () => {
        try {
            setLoading(true);
            const response = await rentalWahalaAPI.getAll();
            if (response.success && response.data) {
                const normalized = Array.isArray(response.data) ? response.data : [];
                setVideos(normalized.map((v: any) => ({
                    id: v.id || String(Date.now()),
                    videoUrl: v.videoUrl || '',
                    caption: v.caption || null,
                    music: v.music || null,
                    likes: v.likes || 0,
                    shares: v.shares || 0,
                    user: v.user ? {
                        id: v.user.id || '',
                        fullName: v.user.fullName || v.user.email?.split('@')[0] || 'Anonymous',
                        email: v.user.email || '',
                        avatarUrl: v.user.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=64'
                    } : {
                        id: '',
                        fullName: 'Anonymous',
                        email: 'anonymous@anonymous.com',
                        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=64'
                    }
                })));
            } else {
                setVideos([]);
            }
        } catch {
            setVideos([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadVideos(); }, []);

    const handleLikeVideo = useCallback(async (videoId: string) => {
        try { await rentalWahalaAPI.like(videoId); } catch {}
    }, []);

    const handleUpload = useCallback(async (data: { videoUrl: string; caption?: string; music?: string }) => {
        setUploading(true);
        try {
            const response = await rentalWahalaAPI.create(data);
            if (response.success) {
                setIsUploadModalOpen(false);
                loadVideos();
                showSuccess('Video uploaded!');
            } else {
                showError(response.message || 'Upload failed');
            }
        } catch (err: any) {
            showError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    }, [loadVideos, showSuccess, showError]);

    const handleGetRecommendations = useCallback(async () => {
        setIsRecsModalOpen(true);
        setIsFetchingRecs(true);
        setRecsError(null);
        setRecommendations(null);
        try {
            const likedVideos = videos.map(v => ({
                id: parseInt(v.id) || 0,
                author: { name: v.user.fullName || v.user.email.split('@')[0], handle: v.user.email.split('@')[0], avatarUrl: v.user.avatarUrl || '' },
                videoUrl: v.videoUrl, caption: v.caption || '', music: v.music || '',
                likes: v.likes, comments: 0, shares: v.shares, isLiked: false
            }));
            const recs = await getAIRecommendationsForFeels(likedVideos);
            setRecommendations(recs);
        } catch (err: any) {
            setRecsError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsFetchingRecs(false);
        }
    }, [videos]);

    const lightboxVideo = lightboxIndex !== null ? videos[lightboxIndex] : null;

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* Hero */}
            <div className="relative h-44 sm:h-56 md:h-64 rounded-2xl overflow-hidden mb-6 sm:mb-8 shadow-lg">
                <img
                    src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200"
                    alt="Apartment building"
                    className="w-full h-full object-cover"
                    loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-center p-4 text-center">
                    <span className="inline-block px-3 py-1 mb-2 text-[10px] sm:text-xs font-bold tracking-widest uppercase bg-white/10 backdrop-blur-sm text-white/80 rounded-full border border-white/20">
                        Rental Community
                        </span>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-orange-100 to-amber-200 drop-shadow-lg">
                        Rental Wahala
                    </h1>
                    <p className="mt-1 text-sm text-white/75 max-w-xs">Funniest rental moments caught on video.</p>
                    {isAuthenticated && (
                        <div className="mt-3 flex flex-wrap justify-center gap-2">
                            <button onClick={() => setIsUploadModalOpen(true)}
                                className="inline-flex items-center gap-2 px-5 py-2 font-semibold text-white bg-brand-primary rounded-full shadow-lg hover:bg-brand-secondary transition-all hover:-translate-y-0.5 text-sm touch-manipulation">
                                <CloudArrowUpIcon className="w-4 h-4" /> Upload
                            </button>
                            <button onClick={() => setIsRecsModalOpen(true)}
                                className="inline-flex items-center gap-2 px-5 py-2 font-semibold text-white bg-white/20 backdrop-blur-sm border border-white/30 rounded-full hover:bg-white/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 text-sm touch-manipulation">
                                ✨ AI Ideas
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <GridSkeleton />
            ) : videos.length === 0 ? (
                <div className="text-center py-16 px-4">
                    <PlayCircleIcon className="w-14 h-14 mx-auto text-light-text-secondary dark:text-dark-text-secondary mb-3" />
                    <p className="text-base text-light-text-secondary dark:text-dark-text-secondary">No videos yet. Be the first to share!</p>
                    {isAuthenticated && (
                        <button onClick={() => setIsUploadModalOpen(true)}
                            className="mt-4 px-6 py-2.5 bg-brand-primary text-white rounded-full hover:bg-brand-secondary text-sm touch-manipulation">
                            Upload First Video
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {videos.map((video, index) => (
                        <WahalaGridCard
                            key={video.id}
                            video={video}
                            onOpen={() => setLightboxIndex(index)}
                            onLike={() => handleLikeVideo(video.id)}
                        />
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <WahalaLightbox
                    video={lightboxVideo}
                    onClose={() => setLightboxIndex(null)}
                    onLike={() => lightboxVideo && handleLikeVideo(lightboxVideo.id)}
                    onPrev={() => setLightboxIndex(i => (i !== null && i > 0 ? i - 1 : i))}
                    onNext={() => setLightboxIndex(i => (i !== null && i < videos.length - 1 ? i + 1 : i))}
                    hasPrev={lightboxIndex > 0}
                    hasNext={lightboxIndex < videos.length - 1}
                />
            )}

             <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleUpload}
                uploading={uploading}
            />

            {/* Recommendations Modal */}
            {isRecsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm" onClick={() => setIsRecsModalOpen(false)}>
                    <div className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl w-full max-w-3xl p-4 sm:p-6 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setIsRecsModalOpen(false)} className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">
                            <CloseIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        <h2 className="text-xl sm:text-2xl font-bold text-center text-light-text-primary dark:text-dark-text-primary mb-4 sm:mb-6">✨ Your Next Favorite Rental Wahala</h2>
                        <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                            {isFetchingRecs && (
                                <div className="flex justify-center items-center h-48 sm:h-64">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary" />
                                </div>
                            )}
                            {recsError && <p className="text-center text-red-500 p-8">{recsError}</p>}
                            {!isFetchingRecs && !recsError && recommendations && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                                    {recommendations.map((rec, i) => (
                                        <div key={i} className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl p-3 sm:p-4 flex flex-col group hover:-translate-y-0.5 hover:shadow-md transition-all">
                                            <div className="relative w-full h-28 sm:h-32 mb-2 sm:mb-3">
                                                <img src={rec.imageUrl} alt={rec.title} className="w-full h-full object-cover rounded-lg" loading="lazy" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                                    <PlayCircleIcon className="w-10 h-10 text-white/80" />
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-xs sm:text-sm text-light-text-primary dark:text-dark-text-primary">{rec.title}</h3>
                                            <p className="text-[10px] sm:text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1 flex-grow">{rec.caption}</p>
                                            <button className="w-full mt-3 bg-brand-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-brand-secondary transition-colors touch-manipulation">
                                                Create this Feel
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RentalWahalaPage;