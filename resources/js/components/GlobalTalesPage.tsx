import React, { useState, useRef, useEffect } from 'react';
import { 
    ChevronLeftIcon,
    ChevronRightIcon,
    CloseIcon,
    PlayCircleIcon,
    PlusIcon,
    CloudArrowUpIcon,
    ImageIcon
} from './icons';
import { globalTalesAPI, uploadAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface GlobalTalesPageProps {
    isAuthenticated?: boolean;
    currentUser?: any;
}

interface Story {
    id: string;
    title: string;
    content: string;
    imageUrl?: string;
    videoUrl?: string;
    author: {
        name: string;
        avatarUrl?: string;
    };
    category: string;
    readTime: number; // in minutes
}

// Sample stories data
const SAMPLE_STORIES: Story[] = [
    {
        id: '1',
        title: 'The Lagos Apartment Hunt',
        content: 'After months of searching, I finally found my dream apartment in Lekki. The journey was filled with ups and downs, from dealing with unreliable agents to discovering hidden gems in unexpected places. Here\'s my story of persistence and hope in the Lagos real estate market.',
        imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800',
        author: {
            name: 'Sarah Johnson',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256'
        },
        category: 'Tenant Stories',
        readTime: 5
    },
    {
        id: '2',
        title: 'From Tenant to Landlord',
        content: 'I started as a tenant in a small apartment, saving every penny. Ten years later, I own three properties and rent them out. This is my journey from paying rent to collecting it, and the lessons I learned along the way.',
        imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800',
        author: {
            name: 'Michael Adebayo',
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256'
        },
        category: 'Success Stories',
        readTime: 7
    },
    {
        id: '3',
        title: 'The Agent Who Changed Everything',
        content: 'I was skeptical about using an agent, but meeting Chika changed my perspective. Her professionalism, knowledge of the market, and genuine care for finding the right home made all the difference. This is how a good agent can transform your property search.',
        imageUrl: 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?q=80&w=800',
        author: {
            name: 'David Okonkwo',
            avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256'
        },
        category: 'Agent Stories',
        readTime: 4
    },
    {
        id: '4',
        title: 'Investing in Real Estate: My First Steps',
        content: 'I had no idea where to start with real estate investment. Through research, mentorship, and taking calculated risks, I made my first property investment. Here\'s what I wish I knew before starting.',
        imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800',
        author: {
            name: 'Amina Hassan',
            avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=256'
        },
        category: 'Investment',
        readTime: 6
    },
    {
        id: '5',
        title: 'The Community That Became Family',
        content: 'Moving to a new neighborhood was daunting, but the community here welcomed me with open arms. From neighbors helping with moving to local businesses becoming my go-to spots, this place truly feels like home.',
        imageUrl: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?q=80&w=800',
        author: {
            name: 'Jennifer Okafor',
            avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256'
        },
        category: 'Community',
        readTime: 5
    }
];

const StorySlide: React.FC<{
    story: Story;
    isActive: boolean;
    onNext: () => void;
    onPrevious: () => void;
    currentSlide: number;
    totalSlides: number;
}> = ({ story, isActive, onNext, onPrevious, currentSlide, totalSlides }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const progressRef = useRef<HTMLDivElement>(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!isActive) {
            setProgress(0);
            setIsPlaying(false);
            return;
        }

        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        onNext();
                        return 0;
                    }
                    return prev + 0.5; // 20 seconds total (100 / 0.5 * 0.1s)
                });
            }, 100);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, isPlaying, onNext]);

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    return (
        <div className={`absolute inset-0 transition-opacity duration-500 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            {/* Progress bar at top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-black/20 z-20">
                <div
                    ref={progressRef}
                    className="h-full bg-white transition-all duration-100"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Story content */}
            <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
                {/* Background image */}
                {story.imageUrl && (
                    <div className="absolute inset-0">
                        <img
                            src={story.imageUrl}
                            alt={story.title}
                            className="w-full h-full object-cover opacity-40"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    </div>
                )}

                {/* Content card */}
                <div className="relative z-10 w-full max-w-3xl px-4 sm:px-6 py-10 sm:py-16 md:py-20 flex flex-col justify-center max-h-full">
                    {/* Header */}
                    <div className="mb-4 sm:mb-6 flex items-center gap-3 text-white">
                        <img
                            src={story.author.avatarUrl || 'https://via.placeholder.com/50'}
                            alt={story.author.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50'; }}
                        />
                        <div className="min-w-0">
                            <p className="font-semibold text-sm sm:text-base truncate">{story.author.name}</p>
                            <p className="text-xs sm:text-sm text-white/70 truncate">
                                {story.category} • {story.readTime} min read
                            </p>
                        </div>
                    </div>

                    {/* Scrollable text area */}
                    <div className="min-h-0 overflow-y-auto pr-1 sm:pr-2 custom-scroll">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-white">
                            {story.title}
                        </h2>
                        <p className="text-sm sm:text-base md:text-lg text-white/90 leading-relaxed whitespace-pre-wrap break-words">
                            {story.content}
                        </p>
                    </div>

                    {/* Play/Pause button */}
                    <div className="mt-4 sm:mt-6 flex items-center gap-4 text-white">
                        <button
                            onClick={handlePlayPause}
                            className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                        >
                            {isPlaying ? (
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                                </svg>
                            ) : (
                                <PlayCircleIcon className="w-6 h-6 text-white" />
                            )}
                        </button>
                        <span className="text-white/70 text-sm">
                            {isPlaying ? 'Playing...' : 'Paused'}
                        </span>
                    </div>
                </div>

                {/* Navigation arrows - positioned to avoid text */}
                <button
                    onClick={onPrevious}
                    disabled={currentSlide === 0}
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-black/10 hover:bg-black/20 backdrop-blur-md rounded-full transition-all disabled:opacity-20 disabled:cursor-not-allowed z-20 border border-white/20"
                    aria-label="Previous story"
                >
                    <ChevronLeftIcon className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow-lg" />
                </button>
                <button
                    onClick={onNext}
                    disabled={currentSlide === totalSlides - 1}
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-black/10 hover:bg-black/20 backdrop-blur-md rounded-full transition-all disabled:opacity-20 disabled:cursor-not-allowed z-20 border border-white/20"
                    aria-label="Next story"
                >
                    <ChevronRightIcon className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow-lg" />
                </button>

                {/* Slide indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {Array.from({ length: totalSlides }).map((_, index) => (
                        <div
                            key={index}
                            className={`h-1 rounded-full transition-all ${
                                index === currentSlide
                                    ? 'w-8 bg-white'
                                    : 'w-1 bg-white/50'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const GlobalTalesPage: React.FC<GlobalTalesPageProps> = ({ isAuthenticated, currentUser }) => {
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        imageUrl: '',
        category: 'General'
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const imageFileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { showSuccess, showError } = useToast();

    const handleNext = () => {
        setCurrentSlide((prev) => (prev < stories.length - 1 ? prev + 1 : prev));
    };

    const handlePrevious = () => {
        setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev));
    };

    // Load stories from API
    useEffect(() => {
        loadStories();
    }, []);

    const loadStories = async () => {
        try {
            setLoading(true);
            const response = await globalTalesAPI.getAll({ limit: 50 });
            if (response.success && response.data && response.data.length > 0) {
                // Map API response to Story format
                const mappedStories = response.data.map((story: any) => ({
                    id: story.id,
                    title: story.title,
                    content: story.content,
                    imageUrl: story.imageUrl,
                    videoUrl: story.videoUrl,
                    author: {
                        name: story.author?.name || story.user?.fullName || story.user?.email?.split('@')[0] || 'Anonymous',
                        avatarUrl: story.author?.avatarUrl || story.user?.avatarUrl || 'https://via.placeholder.com/50'
                    },
                    category: story.category || 'General',
                    readTime: story.readTime || Math.max(1, Math.ceil((story.content?.split(/\s+/) || []).length / 200))
                }));
                setStories(mappedStories);
            } else {
                // Only use sample stories if API returns empty
                setStories([]);
            }
        } catch (error) {
            console.error('Failed to load stories:', error);
            // Don't fallback to sample stories in production
            setStories([]);
        } finally {
            setLoading(false);
        }
    };

    const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showError('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showError('Image size must be less than 5MB');
            return;
        }

        setImageFile(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleCreateStory = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Check if user is authenticated
        if (!isAuthenticated) {
            showError('Please log in to share your story');
            return;
        }

        if (!formData.title.trim() || !formData.content.trim()) {
            showError('Title and content are required');
            return;
        }

        try {
            setCreating(true);
            
            let imageUrl = formData.imageUrl;
            
            // Upload image if file is selected
            if (imageFile) {
                try {
                    const uploadResponse = await uploadAPI.uploadImage(imageFile, true);
                    if (uploadResponse.success && uploadResponse.data?.url) {
                        imageUrl = uploadResponse.data.url;
                    } else {
                        showError(uploadResponse.message || 'Failed to upload image');
                        setCreating(false);
                        return;
                    }
                } catch (uploadError: any) {
                    console.error('Image upload error:', uploadError);
                    showError(uploadError.message || 'Failed to upload image');
                    setCreating(false);
                    return;
                }
            }

            const response = await globalTalesAPI.create({
                title: formData.title,
                content: formData.content,
                imageUrl: imageUrl || undefined,
                category: formData.category
            });

            if (response.success) {
                showSuccess('Story created successfully!');
                setShowCreateModal(false);
                setFormData({ title: '', content: '', imageUrl: '', category: 'General' });
                setImageFile(null);
                setImagePreview(null);
                if (imageFileInputRef.current) {
                    imageFileInputRef.current.value = '';
                }
                loadStories();
            } else {
                showError(response.message || 'Failed to create story');
            }
        } catch (error: any) {
            console.error('Create story error:', error);
            // Handle specific error messages
            if (error.message?.includes('token') || error.message?.includes('Access token')) {
                showError('Your session has expired. Please log in again.');
            } else {
                showError(error.message || 'Failed to create story');
            }
        } finally {
            setCreating(false);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                handlePrevious();
            } else if (e.key === 'Escape') {
                setIsFullscreen(false);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentSlide, stories.length]);

    // Touch/swipe support
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            handleNext();
        } else if (isRightSwipe) {
            handlePrevious();
        }
    };

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
                            Global Tales
                        </h1>
                        <p className="text-light-text-secondary dark:text-dark-text-secondary">
                            Real stories from real people in the real estate world
                        </p>
                    </div>
                    {isAuthenticated && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors font-semibold"
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span>Share Your Story</span>
                        </button>
                    )}
                </div>

                {/* Story cards grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
                        <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">Loading stories...</p>
                    </div>
                ) : stories.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
                            No stories yet. Be the first to share your story!
                        </p>
                        {isAuthenticated && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors"
                            >
                                Share Your Story
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {stories.map((story, index) => (
                        <div
                            key={story.id}
                            onClick={() => {
                                setCurrentSlide(index);
                                setIsFullscreen(true);
                            }}
                            className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                        >
                            {story.imageUrl && (
                                <div className="relative h-48">
                                    <img
                                        src={story.imageUrl}
                                        alt={story.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <span className="text-xs bg-white/90 text-black px-2 py-1 rounded">
                                            {story.category}
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div className="p-4">
                                <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                                    {story.title}
                                </h3>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary line-clamp-2 mb-3">
                                    {story.content}
                                </p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={story.author.avatarUrl || 'https://via.placeholder.com/30'}
                                            alt={story.author.name}
                                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/30'; }}
                                            className="w-6 h-6 rounded-full"
                                        />
                                        <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                            {story.author.name}
                                        </span>
                                    </div>
                                    <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                        {story.readTime} min
                                    </span>
                                </div>
                            </div>
                        </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Fullscreen story viewer */}
            {isFullscreen && (
                <div
                    ref={containerRef}
                    className="fixed inset-0 z-50 bg-black"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <button
                        onClick={() => setIsFullscreen(false)}
                        className="absolute top-4 right-4 z-30 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                    >
                        <CloseIcon className="w-6 h-6 text-white" />
                    </button>

                    <div className="relative w-full h-full">
                        {stories.map((story, index) => (
                            <StorySlide
                                key={story.id}
                                story={story}
                                isActive={index === currentSlide}
                                onNext={handleNext}
                                onPrevious={handlePrevious}
                                currentSlide={currentSlide}
                                totalSlides={stories.length}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Create Story Modal */}
            {showCreateModal && isAuthenticated && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                                Share Your Story
                            </h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setFormData({ title: '', content: '', imageUrl: '', category: 'General' });
                                }}
                                className="p-2 rounded-md hover:bg-light-border dark:hover:bg-dark-border"
                            >
                                <CloseIcon className="w-6 h-6 text-light-text-secondary dark:text-dark-text-secondary" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateStory} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Give your story a compelling title"
                                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                                    Category
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                                >
                                    <option value="General">General</option>
                                    <option value="Tenant Stories">Tenant Stories</option>
                                    <option value="Success Stories">Success Stories</option>
                                    <option value="Agent Stories">Agent Stories</option>
                                    <option value="Investment">Investment</option>
                                    <option value="Community">Community</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                                    Your Story <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Share your real estate experience, tips, or journey..."
                                    rows={8}
                                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none resize-y"
                                    required
                                />
                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                                    {formData.content.split(/\s+/).length} words (approximately {Math.max(1, Math.ceil(formData.content.split(/\s+/).length / 200))} min read)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                                    Story Image (optional)
                                </label>
                                <input
                                    ref={imageFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageFileSelect}
                                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-brand-secondary"
                                />
                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                                    Max size: 5MB | Formats: JPG, PNG, GIF, WebP
                                </p>
                                {imagePreview && (
                                    <div className="mt-3 rounded-lg overflow-hidden border border-light-border dark:border-dark-border">
                                        <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover" />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setFormData({ title: '', content: '', imageUrl: '', category: 'General' });
                                        setImageFile(null);
                                        setImagePreview(null);
                                        if (imageFileInputRef.current) {
                                            imageFileInputRef.current.value = '';
                                        }
                                    }}
                                    className="flex-1 px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary rounded-lg hover:bg-light-border dark:hover:bg-dark-border transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !formData.title.trim() || !formData.content.trim()}
                                    className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
                                >
                                    {creating ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Publishing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CloudArrowUpIcon className="w-5 h-5" />
                                            <span>Publish Story</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalTalesPage;

