import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
    HeartIcon, 
    ArrowUpTrayIcon, 
    BookmarkIcon, 
    PlayCircleIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
    CloudArrowUpIcon,
    CloseIcon,
    FilmIcon,
    LinkIcon
} from './icons';
import { rentalWahalaAPI, uploadAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface Wahala {
    id: string;
    author: { name: string; handle: string; avatarUrl: string };
    videoUrl: string;
    caption: string;
    music: string;
    likes: number;
    shares: number;
    isLiked: boolean;
}

// Format large numbers
const formatCount = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return String(num);
};

// Format file size
const formatFileSize = (bytes: number): string => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' bytes';
};

// Extract YouTube video ID from URL
const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const WahalaCard: React.FC<{ 
    wahala: Wahala; 
    isVisible: boolean;
    onLike?: () => void;
}> = ({ wahala, isVisible, onLike }) => {
    const { showSuccess, showError } = useToast();
    const [isLiked, setIsLiked] = useState(wahala.isLiked);
    const [likes, setLikes] = useState(wahala.likes);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPlayButton, setShowPlayButton] = useState(true);
    const [videoError, setVideoError] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const youtubeId = useMemo(() => getYouTubeId(wahala.videoUrl), [wahala.videoUrl]);
    const isLocalVideo = !youtubeId && wahala.videoUrl;
    const thumbnailUrl = useMemo(() => 
        youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : null, 
        [youtubeId]
    );

    // Reset state when visibility changes
    useEffect(() => {
        if (isVisible) {
            setVideoError(false);
            setIsPlaying(false);
            setShowPlayButton(true);
        } else {
            setIsPlaying(false);
            if (videoRef.current) {
                videoRef.current.pause();
            }
        }
    }, [isVisible]);

    // Handle video visibility
    useEffect(() => {
        if (videoRef.current) {
            if (isVisible && isPlaying) {
                videoRef.current.play().catch(() => {});
            } else {
                videoRef.current.pause();
            }
        }
    }, [isVisible, isPlaying]);

    const handleLike = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        const wasLiked = isLiked;
        setIsLiked(!wasLiked);
        setLikes(wasLiked ? Math.max(0, likes - 1) : likes + 1);
        
        if (onLike) {
            onLike();
        }
    }, [isLiked, likes, onLike]);

    const handleMuteToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
        }
    }, [isMuted]);

    const handlePlayClick = useCallback(() => {
        if (isLocalVideo && videoRef.current) {
            videoRef.current.play().then(() => {
                setIsPlaying(true);
                setShowPlayButton(false);
            }).catch(() => {
                setVideoError(true);
            });
        } else {
            setIsPlaying(true);
            setShowPlayButton(false);
        }
    }, [isLocalVideo]);

    const handleShare = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (navigator.share) {
            navigator.share({
                title: wahala.caption || 'Check out this Rental Wahala video',
                text: wahala.caption || '',
                url: window.location.href
            }).then(() => showSuccess('Shared!')).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.href);
            showSuccess('Link copied!');
        }
    }, [wahala.caption, showSuccess]);

    const handleBookmark = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        showSuccess('Saved to bookmarks!');
    }, [showSuccess]);

    const handleVideoError = useCallback(() => {
        setVideoError(true);
        setShowPlayButton(true);
        showError('Video failed to load');
    }, [showError]);

    const handleRetry = useCallback(() => {
        setVideoError(false);
        setIsPlaying(false);
        setShowPlayButton(true);
    }, []);

    return (
        <div className="relative w-full h-full bg-dark-card rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border border-dark-border flex items-center justify-center group">
            {/* Video Container */}
            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
                {isVisible ? (
                    <>
                        {videoError ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 bg-gradient-to-br from-gray-900 to-black z-0">
                                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-2">
                                    <PlayCircleIcon className="w-8 h-8 text-red-400" />
                                </div>
                                <p className="text-white/90 text-sm sm:text-base text-center">This video couldn't be loaded.</p>
                                <button
                                    type="button"
                                    onClick={handleRetry}
                                    className="px-5 py-2.5 bg-brand-primary/80 hover:bg-brand-primary text-white rounded-lg text-sm font-medium transition-all transform hover:scale-105 touch-manipulation"
                                >
                                    Try again
                                </button>
                            </div>
                        ) : youtubeId ? (
                            <>
                                <iframe
                                    key={`${youtubeId}-${isMuted ? 'm' : 'u'}-${isPlaying ? 'p' : 's'}`}
                                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&controls=1&rel=0&modestbranding=1&playsinline=1`}
                                    title={wahala.caption || 'Video'}
                                    className="absolute inset-0 w-full h-full pointer-events-auto"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    loading="lazy"
                                    onError={handleVideoError}
                                />
                                
                                {/* Sleek Control Bar */}
                                <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-b from-black/70 to-transparent z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={handleMuteToggle}
                                            className="p-2.5 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all transform hover:scale-110 touch-manipulation"
                                            title={isMuted ? 'Unmute' : 'Mute'}
                                            aria-label={isMuted ? 'Unmute' : 'Mute'}
                                        >
                                            {isMuted ? (
                                                <SpeakerXMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                            ) : (
                                                <SpeakerWaveIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                            )}
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white/80 text-xs font-medium px-2 py-1 bg-black/30 rounded-full backdrop-blur-sm">
                                                YouTube
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Play Button Overlay */}
                                {showPlayButton && (
                                    <div
                                        className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer z-10 group/play"
                                        onClick={handlePlayClick}
                                        onKeyDown={(e) => e.key === 'Enter' && handlePlayClick()}
                                        role="button"
                                        tabIndex={0}
                                        aria-label="Play video"
                                    >
                                        <div className="relative">
                                            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center transform group-hover/play:scale-110 transition-transform duration-300">
                                                <PlayCircleIcon className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white drop-shadow-2xl" />
                                            </div>
                                            <div className="absolute inset-0 rounded-full bg-brand-primary/30 animate-ping opacity-0 group-hover/play:opacity-100"></div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : isLocalVideo ? (
                            <>
                                <video
                                    ref={videoRef}
                                    src={wahala.videoUrl}
                                    muted={isMuted}
                                    loop
                                    playsInline
                                    className="absolute inset-0 w-full h-full object-cover"
                                    onError={handleVideoError}
                                />
                                
                                {/* Sleek Control Bar */}
                                <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-b from-black/70 to-transparent z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={handleMuteToggle}
                                            className="p-2.5 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all transform hover:scale-110 touch-manipulation"
                                            title={isMuted ? 'Unmute' : 'Mute'}
                                            aria-label={isMuted ? 'Unmute' : 'Mute'}
                                        >
                                            {isMuted ? (
                                                <SpeakerXMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                            ) : (
                                                <SpeakerWaveIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                            )}
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white/80 text-xs font-medium px-2 py-1 bg-black/30 rounded-full backdrop-blur-sm">
                                                Video
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Play Button Overlay */}
                                {showPlayButton && (
                                    <div
                                        className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer z-10 group/play"
                                        onClick={handlePlayClick}
                                        role="button"
                                        tabIndex={0}
                                        aria-label="Play video"
                                    >
                                        <div className="relative">
                                            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center transform group-hover/play:scale-110 transition-transform duration-300">
                                                <PlayCircleIcon className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white drop-shadow-2xl" />
                                            </div>
                                            <div className="absolute inset-0 rounded-full bg-brand-primary/30 animate-ping opacity-0 group-hover/play:opacity-100"></div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 bg-gradient-to-br from-gray-900 to-black z-0">
                                <div className="w-16 h-16 rounded-full bg-gray-700/30 flex items-center justify-center mb-2">
                                    <FilmIcon className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-white/90 text-sm text-center">Video format not supported.</p>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {thumbnailUrl ? (
                            <img
                                src={thumbnailUrl}
                                alt={wahala.caption || 'Video'}
                                className="w-full h-full object-contain bg-black"
                                loading="lazy"
                            />
                        ) : isLocalVideo ? (
                            <video
                                src={wahala.videoUrl}
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-dark-bg flex items-center justify-center">
                                <PlayCircleIcon className="w-16 h-16 sm:w-20 sm:h-20 text-white/50" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-center justify-center cursor-pointer group">
                            <div className="relative">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 shadow-lg">
                                    <PlayCircleIcon className="w-14 h-14 sm:w-16 sm:h-16 text-white/80 group-hover:text-white drop-shadow-2xl" />
                                </div>
                                <div className="absolute inset-0 rounded-full bg-brand-primary/20 animate-pulse opacity-0 group-hover:opacity-100"></div>
                            </div>
                        </div>
                    </>
                )}
            </div>
            
            {/* Gradient Overlay - Enhanced */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent pointer-events-none"></div>
            
            {/* Author Info - Bottom Left */}
            <div className="absolute bottom-0 left-0 right-12 sm:right-14 p-3 sm:p-4 text-white z-10 pointer-events-none">
                <div className="flex items-center gap-2 sm:gap-3">
                    <img 
                        src={wahala.author?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256'} 
                        alt={wahala.author?.name || 'Anonymous'} 
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/80 object-cover flex-shrink-0" 
                        loading="lazy"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256';
                        }}
                    />
                    <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs sm:text-sm truncate">@{wahala.author?.handle || 'anonymous'}</p>
                        <p className="text-[10px] sm:text-xs text-gray-300 truncate">{wahala.music || 'Original Audio'}</p>
                    </div>
                </div>
                <p className="text-[11px] sm:text-sm mt-1.5 sm:mt-2 line-clamp-2 break-words">{wahala.caption || ''}</p>
            </div>

            {/* Action Buttons - Bottom Right */}
            <div className="absolute bottom-3 sm:bottom-4 right-2 sm:right-3 flex flex-col items-center gap-3 sm:gap-5 text-white z-10">
                <button 
                    onClick={handleLike} 
                    className="flex flex-col items-center group pointer-events-auto touch-manipulation"
                    aria-label={isLiked ? 'Unlike' : 'Like'}
                >
                    <HeartIcon className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 transition-all active:scale-95 group-hover:scale-110 ${isLiked ? 'text-red-500 fill-current' : 'fill-transparent stroke-white'}`} />
                    <span className="text-[10px] sm:text-xs font-semibold drop-shadow-md">{formatCount(likes)}</span>
                </button>
                
                <button 
                    onClick={handleShare}
                    className="flex flex-col items-center group pointer-events-auto touch-manipulation"
                    aria-label="Share"
                >
                    <ArrowUpTrayIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 drop-shadow-md active:scale-95 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] sm:text-xs font-semibold drop-shadow-md">{formatCount(wahala.shares || 0)}</span>
                </button>
                
                <button 
                    onClick={handleBookmark}
                    className="flex flex-col items-center group pointer-events-auto touch-manipulation"
                    aria-label="Bookmark"
                >
                    <BookmarkIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 drop-shadow-md active:scale-95 group-hover:scale-110 transition-transform fill-transparent stroke-white" />
                </button>
            </div>
        </div>
    );
};

// Professional Upload Modal with File and YouTube options
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
        setYoutubeUrl('');
        setCaption('');
        setMusic('');
        setVideoFile(null);
        setUploadProgress(0);
        setUploadMethod('youtube');
    }, []);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [resetForm, onClose]);

    const handleFileSelect = useCallback((file: File) => {
        // Validate file type
        const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
        if (!validTypes.includes(file.type)) {
            showError('Invalid file type. Please upload MP4, WebM, OGG, or MOV files.');
            return;
        }

        // Validate file size (50MB max for videos)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            showError(`File too large. Maximum size is 50MB. Your file is ${formatFileSize(file.size)}.`);
            return;
        }

        setVideoFile(file);
    }, [showError]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    }, [handleFileSelect]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        let videoUrl = '';

        if (uploadMethod === 'youtube') {
            if (!youtubeUrl.trim()) {
                showError('Please enter a YouTube URL');
                return;
            }
            const videoId = getYouTubeId(youtubeUrl.trim());
            if (!videoId) {
                showError('Please enter a valid YouTube URL');
                return;
            }
            videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        } else {
            if (!videoFile) {
                showError('Please select a video file to upload');
                return;
            }

            // Upload video file
            try {
                setUploadProgress(10);
                const response: any = await uploadAPI.uploadVideo(videoFile, true, (progress) => {
                    setUploadProgress(10 + Math.round(progress * 0.8)); // 10-90%
                });
                
                if (response.success && response.data?.url) {
                    videoUrl = response.data.url;
                    setUploadProgress(95);
                } else {
                    showError(response.message || 'Failed to upload video');
                    setUploadProgress(0);
                    return;
                }
            } catch (error: any) {
                showError(error.message || 'Failed to upload video');
                setUploadProgress(0);
                return;
            }
        }

        setUploadProgress(100);
        
        await onUpload({
            videoUrl,
            caption: caption.trim() || undefined,
            music: music.trim() || undefined
        });

        resetForm();
    }, [uploadMethod, youtubeUrl, videoFile, caption, music, onUpload, resetForm, showError]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4 sm:p-4 bg-black/70 backdrop-blur-sm">
            <div className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl w-full max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto animate-scale-in">
                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary touch-manipulation"
                    aria-label="Close"
                >
                    <CloseIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                <div className="mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">Upload Rental Wahala Video</h2>
                    <p className="mt-1 text-xs sm:text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        Share your funniest rental moments with the community
                    </p>
                </div>

                {/* Upload Method Tabs */}
                <div className="flex gap-2 mb-4 sm:mb-6">
                    <button
                        type="button"
                        onClick={() => setUploadMethod('youtube')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium text-xs sm:text-sm transition-all touch-manipulation ${
                            uploadMethod === 'youtube'
                                ? 'bg-brand-primary text-white'
                                : 'bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary'
                        }`}
                    >
                        <LinkIcon className="w-4 h-4" />
                        YouTube URL
                    </button>
                    <button
                        type="button"
                        onClick={() => setUploadMethod('file')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium text-xs sm:text-sm transition-all touch-manipulation ${
                            uploadMethod === 'file'
                                ? 'bg-brand-primary text-white'
                                : 'bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary'
                        }`}
                    >
                        <FilmIcon className="w-4 h-4" />
                        Upload File
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* YouTube URL Input */}
                    {uploadMethod === 'youtube' && (
                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1.5">
                                YouTube URL <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="url"
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-3 sm:px-4 py-2.5 text-xs sm:text-sm text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                            />
                            <p className="mt-1 text-[10px] sm:text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                Paste a YouTube video link
                            </p>
                        </div>
                    )}

                    {/* File Upload */}
                    {uploadMethod === 'file' && (
                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1.5">
                                Video File <span className="text-red-500">*</span>
                            </label>

                            {!videoFile ? (
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-all ${
                                        dragOver
                                            ? 'border-brand-primary bg-brand-primary/10'
                                            : 'border-light-border dark:border-dark-border hover:border-brand-primary/50'
                                    }`}
                                >
                                    <FilmIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-light-text-secondary dark:text-dark-text-secondary mb-3" />
                                    <p className="text-xs sm:text-sm text-light-text-primary dark:text-dark-text-primary font-medium">
                                        Drag and drop your video here
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                                        or click to browse
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-light-text-secondary dark:text-dark-text-secondary mt-3">
                                        MP4, WebM, OGG, MOV • Max 20MB
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-3 sm:p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-primary/20 rounded-lg flex items-center justify-center">
                                            <FilmIcon className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs sm:text-sm font-medium text-light-text-primary dark:text-dark-text-primary truncate">
                                                {videoFile.name}
                                            </p>
                                            <p className="text-[10px] sm:text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                                {formatFileSize(videoFile.size)}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setVideoFile(null)}
                                            className="p-1.5 text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500 transition-colors touch-manipulation"
                                        >
                                            <CloseIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                    )}

                    {/* Upload Progress */}
                    {uploading && uploadProgress > 0 && (
                        <div className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
                                    <span className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></span>
                                    Uploading your video...
                                </span>
                                <span className="text-xs font-bold text-brand-primary">{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-light-border dark:bg-dark-border rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-brand-primary to-cyan-400 h-2.5 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-light-text-secondary dark:text-dark-text-secondary mt-2 text-center">
                                {uploadProgress < 30 ? 'Preparing upload...' : uploadProgress < 70 ? 'Uploading... Almost there!' : 'Finalizing...'}
                            </p>
                        </div>
                    )}

                    {/* Caption */}
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1.5">
                            Caption
                        </label>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="What's the wahala about?"
                            rows={2}
                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-3 sm:px-4 py-2.5 text-xs sm:text-sm text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none resize-none"
                        />
                    </div>

                    {/* Music Credit */}
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1.5">
                            Music / Sound Credit
                        </label>
                        <input
                            type="text"
                            value={music}
                            onChange={(e) => setMusic(e.target.value)}
                            placeholder="e.g., Dramatic Sound - Nollywood FX"
                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-3 sm:px-4 py-2.5 text-xs sm:text-sm text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                        />
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={uploading || (uploadMethod === 'youtube' ? !youtubeUrl.trim() : !videoFile)}
                            className="flex-1 bg-brand-primary text-white py-2.5 sm:py-3 rounded-lg text-sm font-semibold hover:bg-brand-secondary disabled:bg-brand-secondary/50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                        >
                            {uploading ? 'Uploading...' : 'Upload Video'}
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={uploading}
                            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary rounded-lg text-sm hover:bg-light-border dark:hover:bg-dark-border disabled:opacity-50 transition-colors touch-manipulation"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface RentalWahalaPageProps {
    isAuthenticated?: boolean;
    isAdmin?: boolean;
    currentUser?: any;
}

const RentalWahalaPage: React.FC<RentalWahalaPageProps> = ({ isAuthenticated = false, isAdmin = false, currentUser }) => {
    const [visibleCard, setVisibleCard] = useState<string | null>(null);
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { showSuccess, showError } = useToast();

    useEffect(() => {
        loadVideos();
    }, []);

    const loadVideos = useCallback(async () => {
        try {
            setLoading(true);
            const response = await rentalWahalaAPI.getAll();
            if (response.success && response.data) {
                setVideos(Array.isArray(response.data) ? response.data : []);
                if (response.data.length > 0) {
                    setVisibleCard(response.data[0].id);
                }
            } else {
                setVideos([]);
            }
        } catch (error) {
            console.error('Failed to load videos:', error);
            setVideos([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleUpload = useCallback(async (data: { videoUrl: string; caption?: string; music?: string }) => {
        setUploading(true);
        try {
            const response = await rentalWahalaAPI.create(data);
            if (response.success) {
                showSuccess('Video uploaded successfully!');
                setShowUploadModal(false);
                loadVideos();
            } else {
                showError(response.message || 'Failed to upload video');
            }
        } catch (error: any) {
            showError(error.message || 'Failed to upload video');
        } finally {
            setUploading(false);
        }
    }, [loadVideos, showSuccess, showError]);

    // Scroll observer
    useEffect(() => {
        if (videos.length === 0) return;

        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const containerRect = container.getBoundingClientRect();
            const containerCenter = containerRect.top + containerRect.height / 2;
            
            let closestCard: Element | null = null;
            let closestDistance = Infinity;

            const cards = Array.from(container.querySelectorAll('[data-id]')) as Element[];
            cards.forEach((card) => {
                const cardRect = card.getBoundingClientRect();
                const cardCenter = cardRect.top + cardRect.height / 2;
                const distance = Math.abs(cardCenter - containerCenter);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestCard = card;
                }
            });

            if (closestCard) {
                const cardId = (closestCard as Element).getAttribute('data-id');
                if (cardId) {
                    setVisibleCard(cardId);
                }
            }
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [videos]);

    // Normalize video data from API response
    const normalizeVideo = useCallback((video: any): Wahala => {
        if (video.user) {
            return {
                id: video.id || String(Date.now()),
                author: {
                    name: video.user.fullName || video.user.email?.split('@')[0] || 'Anonymous',
                    handle: video.user.email?.split('@')[0] || 'anonymous',
                    avatarUrl: video.user.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256'
                },
                videoUrl: video.videoUrl || '',
                caption: video.caption || '',
                music: video.music || 'Original Audio',
                likes: video.likes || 0,
                shares: video.shares || 0,
                isLiked: false
            };
        }
        
        return {
            id: video.id || String(Date.now()),
            author: {
                name: 'Anonymous',
                handle: 'anonymous',
                avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256'
            },
            videoUrl: video.videoUrl || '',
            caption: video.caption || '',
            music: video.music || 'Original Audio',
            likes: video.likes || 0,
            shares: video.shares || 0,
            isLiked: false
        };
    }, []);

    const handleLikeVideo = useCallback(async (videoId: string) => {
        try {
            await rentalWahalaAPI.like(videoId);
            loadVideos();
        } catch (error) {
            console.error('Failed to like video:', error);
        }
    }, [loadVideos]);

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-scale-in { animation: scaleIn 0.3s ease-out forwards; }
                
                [data-wahala-container] {
                    scroll-snap-type: y mandatory;
                    -webkit-overflow-scrolling: touch;
                    overscroll-behavior: contain;
                    scroll-padding: 0;
                }
                
                [data-wahala-container] > * {
                    scroll-snap-align: start;
                    scroll-snap-stop: always;
                    min-height: 100%;
                }
                
                @media (max-width: 640px) {
                    [data-wahala-container] {
                        height: calc(100vh - 160px);
                        padding-bottom: env(safe-area-inset-bottom);
                    }
                    [data-wahala-container] > * { height: calc(100vh - 160px); }
                }
                
                @media (min-width: 641px) and (max-width: 1023px) {
                    [data-wahala-container] { height: calc(100vh - 180px); }
                    [data-wahala-container] > * { height: calc(100vh - 180px); }
                }
                
                @media (min-width: 1024px) {
                    [data-wahala-container] { height: calc(100vh - 140px); }
                    [data-wahala-container] > * { height: calc(100vh - 140px); }
                }
            `}</style>
            
            {/* Hero Section */}
            <div className="relative h-48 sm:h-56 md:h-72 lg:h-80 rounded-xl overflow-hidden mb-4 sm:mb-6 md:mb-8 shadow-lg mx-2 sm:mx-0">
                <img 
                    src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200" 
                    alt="Apartment building" 
                    className="w-full h-full object-cover" 
                    loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 text-center">
                    <span className="inline-block px-3 py-1 mb-2 text-[11px] sm:text-xs font-bold tracking-widest uppercase bg-white/10 backdrop-blur-sm text-white/80 rounded-full border border-white/20">
                        Community Videos
                    </span>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-orange-100 to-amber-200 drop-shadow-lg">
                        Rental Wahala
                    </h1>
                    <p className="mt-1 sm:mt-2 text-sm sm:text-base text-white/80 drop-shadow-md px-4 max-w-sm">
                        Funniest and most relatable rental moments, captured on video.
                    </p>
                    {isAuthenticated && (
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="mt-3 sm:mt-4 inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 font-semibold text-white bg-brand-primary rounded-full shadow-lg hover:bg-brand-secondary transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm sm:text-base touch-manipulation"
                        >
                            <CloudArrowUpIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            Upload Video
                        </button>
                    )}
                </div>
            </div>
            
            {/* Video Feed */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-brand-primary mx-auto mb-3"></div>
                    <p className="text-sm sm:text-base text-light-text-secondary dark:text-dark-text-secondary">Loading videos...</p>
                </div>
            ) : videos.length === 0 ? (
                <div className="text-center py-12 px-4">
                    <PlayCircleIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-light-text-secondary dark:text-dark-text-secondary mb-3 sm:mb-4" />
                    <p className="text-base sm:text-lg text-light-text-secondary dark:text-dark-text-secondary">No videos yet. Be the first to share!</p>
                    {isAuthenticated && (
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="mt-4 px-5 sm:px-6 py-2 sm:py-2.5 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary text-sm sm:text-base touch-manipulation"
                        >
                            Upload First Video
                        </button>
                    )}
                </div>
            ) : (
                <div 
                    ref={containerRef} 
                    data-wahala-container
                    className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-xl mx-auto overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
                >
                    {videos.map((video: any, index: number) => {
                        const normalized = normalizeVideo(video);
                        const id = normalized.id || String(index);
                        return (
                            <div 
                                key={id} 
                                data-id={id}
                                className="w-full flex-shrink-0 snap-start flex items-center justify-center px-1.5 sm:px-2 md:px-4"
                            >
                                <WahalaCard 
                                    wahala={normalized} 
                                    isVisible={visibleCard === id}
                                    onLike={() => handleLikeVideo(id)}
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Upload Modal */}
            <UploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onUpload={handleUpload}
                uploading={uploading}
            />
        </div>
    );
};

export default RentalWahalaPage;
