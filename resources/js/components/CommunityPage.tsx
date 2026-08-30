import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { communityAPI, uploadAPI } from '../services/api';
import Lightbox, { useLightbox } from './Lightbox';
import { 
    ResidentialHouseIcon, 
    OfficeIcon, 
    LightbulbIcon, 
    MegaphoneIcon, 
    MapIcon,
    ThumbUpIcon,
    ChatBubbleIcon,
    ArrowPathIcon,
    ArrowUpTrayIcon,
    PhotoIcon,
    PollIcon,
    EmojiIcon,
    BookmarkIcon,
    VideoCameraIcon,
    PlayCircleIcon,
    LinkIcon,
    XIcon,
    FacebookIcon,
    LinkedInIcon,
    HeartIcon, // Added HeartIcon
    CloseIcon // Added for removing media preview
} from './icons';

// --- TYPE DEFINITIONS ---
interface User {
    name: string;
    handle: string;
    avatarUrl: string;
}

interface Comment {
    id: string; // Changed to string to match backend UUID
    author: User;
    text: string;
    timestamp: string;
}

interface Post {
    id: string; // Changed to string to match backend UUID
    backendId?: string; // Store backend UUID for API calls
    author: User;
    category: string;
    title: string;
    content?: string;
    imageUrl?: string;
    videoUrl?: string; // This can be a YT ID or a placeholder for uploaded video
    timestamp: string;
    replies: number;
    likes: number;
    loves: number; // New: for love reactions
    reposts: number;
    isLiked: boolean;
    isLoved: boolean; // New: for love reactions
    comments: Comment[];
}

interface NewPostData {
    content: string;
    imageUrl?: string;
    videoUrl?: string;
}


// Helper function to get current user from props or localStorage
const getCurrentUser = (userFromProps?: any): User => {
    if (userFromProps) {
        return {
            name: userFromProps.fullName || 'Guest User',
            handle: userFromProps.email?.split('@')[0] || 'guest',
            avatarUrl: userFromProps.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256'
        };
    }
    // Fallback to mock data if no user provided
    return {
        name: 'Guest User',
        handle: 'guest',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256'
    };
};

// Removed dummy data - all posts and users now come from backend

const channels = [
    { name: 'Rental Experiences', category: 'Rental Experiences', description: 'Real tenant reviews, success & challenge stories', icon: ResidentialHouseIcon, emoji: '🏠' },
    { name: 'Neighborhood Chat', category: 'Neighborhood Chat', description: 'Local life: safety, utilities, transport, events', icon: MapIcon, emoji: '📍' },
    { name: 'Tips & Advice', category: 'Tips & Advice', description: 'Avoiding scams, moving checklists, budgeting', icon: LightbulbIcon, emoji: '💡' },
    { name: 'Landlord Corner', category: 'Landlord Corner', description: 'Best practices, policies, maintenance tips', icon: OfficeIcon, emoji: '🏢' },
    { name: 'Announcements', category: 'Announcements', description: 'Official updates, safety alerts, promotions', icon: MegaphoneIcon, emoji: '📢' },
];

// Removed dummy data - trending topics and top contributors are now calculated from actual posts

// --- COMPONENTS ---
const CreatePost: React.FC<{ onPost: (data: NewPostData) => void; currentUser: User; selectedCategory?: string }> = ({ onPost, currentUser, selectedCategory }) => {
    const [content, setContent] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    
    const selectedChannel = channels.find(c => c.category === selectedCategory);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>, fileType: 'image' | 'video') => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (fileType === 'image') {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                setVideoPreview(null);
                setVideoFile(null);
            };
            reader.readAsDataURL(file);
        } else if (fileType === 'video') {
            setVideoFile(file);
            setVideoPreview(file.name);
            setImagePreview(null);
            setImageFile(null);
        }
    };

    const removeMedia = () => {
        setImagePreview(null);
        setVideoPreview(null);
        setImageFile(null);
        setVideoFile(null);
        if(imageInputRef.current) imageInputRef.current.value = '';
        if(videoInputRef.current) videoInputRef.current.value = '';
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        
        setIsSubmitting(true);
        try {
            let imageUrl: string | undefined;
            let videoUrl: string | undefined;

            // Upload files if provided
            if (imageFile || videoFile) {
                const uploadResponse = await uploadAPI.uploadMedia(imageFile || undefined, videoFile || undefined);
                if (uploadResponse.success) {
                    imageUrl = uploadResponse.data.imageUrl;
                    videoUrl = uploadResponse.data.videoUrl;
                }
            }

            onPost({
                content,
                imageUrl: imageUrl || imagePreview || undefined,
                videoUrl: videoUrl || (videoPreview ? 'https://images.unsplash.com/photo-1526948531399-320e7e40f0ca?q=80&w=800' : undefined)
            });
            setContent('');
            removeMedia();
        } catch (error: any) {
            alert(error.message || 'Failed to upload files. Please login first.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-3 md:p-4 mb-4 md:mb-6">
            {selectedChannel && (
                <div className="mb-3 flex items-center gap-2 text-xs md:text-sm px-2">
                    <span className="text-lg md:text-xl">{selectedChannel.emoji}</span>
                    <span className="text-brand-primary font-semibold truncate">Posting to: {selectedChannel.name}</span>
                </div>
            )}
             <input type="file" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} accept="image/*" className="hidden" />
            <input type="file" ref={videoInputRef} onChange={(e) => handleFileChange(e, 'video')} accept="video/*" className="hidden" />
            <form onSubmit={handleSubmit}>
                <div className="flex items-start gap-2 md:gap-4">
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover flex-shrink-0" />
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={selectedChannel ? `Share your ${selectedChannel.name.toLowerCase()}...` : "What's on your mind?"}
                        className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-2 md:p-3 text-sm md:text-base text-light-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none transition resize-none"
                        rows={3}
                    />
                </div>

                {(imagePreview || videoPreview) && (
                     <div className="mt-3 pl-12 md:pl-16 relative">
                        {imagePreview && <img src={imagePreview} alt="Preview" className="rounded-lg max-h-48 md:max-h-60 w-auto border border-light-border dark:border-dark-border" />}
                        {videoPreview && (
                            <div className="p-2 md:p-3 bg-light-bg dark:bg-dark-bg rounded-lg border border-light-border dark:border-dark-border flex items-center gap-2 md:gap-3">
                                <VideoCameraIcon className="w-5 h-5 md:w-6 md:h-6 text-brand-primary flex-shrink-0" />
                                <span className="text-xs md:text-sm text-light-text-secondary dark:text-dark-text-secondary truncate">{videoPreview}</span>
                            </div>
                        )}
                        <button onClick={removeMedia} className="absolute -top-2 -right-2 bg-light-card dark:bg-dark-card rounded-full p-1 border border-light-border dark:border-dark-border hover:scale-110 transition-transform">
                            <CloseIcon className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                    </div>
                )}
                
                <div className="flex flex-wrap justify-between items-center mt-3 pl-12 md:pl-16 gap-2">
                    <div className="flex items-center gap-1 md:gap-2 text-light-text-secondary dark:text-dark-text-secondary">
                        <button type="button" onClick={() => imageInputRef.current?.click()} className="p-1.5 md:p-2 rounded-full hover:bg-light-bg dark:hover:bg-dark-bg hover:text-brand-primary"><PhotoIcon className="w-4 h-4 md:w-5 md:h-5" /></button>
                        <button type="button" onClick={() => videoInputRef.current?.click()} className="p-1.5 md:p-2 rounded-full hover:bg-light-bg dark:hover:bg-dark-bg hover:text-brand-primary"><VideoCameraIcon className="w-4 h-4 md:w-5 md:h-5" /></button>
                        <button type="button" className="p-1.5 md:p-2 rounded-full hover:bg-light-bg dark:hover:bg-dark-bg hover:text-brand-primary hidden sm:inline-flex"><PollIcon className="w-4 h-4 md:w-5 md:h-5" /></button>
                        <button type="button" className="p-1.5 md:p-2 rounded-full hover:bg-light-bg dark:hover:bg-dark-bg hover:text-brand-primary hidden sm:inline-flex"><EmojiIcon className="w-4 h-4 md:w-5 md:h-5" /></button>
                    </div>
                    <button
                        type="submit"
                        disabled={!content.trim() || isSubmitting}
                        className="px-4 md:px-5 py-1.5 md:py-2 text-sm md:text-base font-bold text-white bg-brand-primary rounded-full disabled:bg-brand-secondary disabled:cursor-not-allowed hover:bg-brand-secondary transition-all"
                    >
                        {isSubmitting ? 'Posting...' : 'Post'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const CommentSection: React.FC<{ comments: Comment[], onAddComment: (text: string) => void; currentUser: User }> = ({ comments, onAddComment, currentUser }) => {
    const [newComment, setNewComment] = useState('');
    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        onAddComment(newComment);
        setNewComment('');
    };

    return (
        <div className="mt-4 pt-4 border-t border-light-border dark:border-dark-border">
            {comments.map(comment => (
                <div key={comment.id} className="flex items-start gap-3 mt-3">
                    <img src={comment.author.avatarUrl} alt={comment.author.name} className="w-8 h-8 rounded-full object-cover" />
                    <div className="flex-1 bg-light-bg dark:bg-dark-bg rounded-lg p-3">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-light-text-primary dark:text-dark-text-primary">{comment.author.name}</span>
                            <span className="text-light-text-secondary dark:text-dark-text-secondary">@{comment.author.handle}</span>
                            <span className="text-light-text-secondary dark:text-dark-text-secondary">·</span>
                            <span className="text-light-text-secondary dark:text-dark-text-secondary">{comment.timestamp}</span>
                        </div>
                        <p className="text-sm text-light-text-primary dark:text-dark-text-primary mt-1">{comment.text}</p>
                    </div>
                </div>
            ))}
            <form onSubmit={handleCommentSubmit} className="flex items-start gap-2 md:gap-3 mt-4">
                 <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover flex-shrink-0" />
                 <div className="flex-1 min-w-0">
                     <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Post your reply"
                        className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-full px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                     />
                 </div>
                 <button type="submit" disabled={!newComment.trim()} className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-bold text-white bg-brand-primary rounded-full disabled:bg-brand-secondary hover:bg-brand-secondary transition-all flex-shrink-0">Reply</button>
            </form>
        </div>
    );
};


const PostCard: React.FC<{ 
    post: Post;
    onToggleLike: (postId: number) => void;
    onToggleLove: (postId: number) => void;
    onAddComment: (postId: number, text: string) => void;
    currentUser: User;
}> = ({ post, onToggleLike, onToggleLove, onAddComment, currentUser }) => {
    const { lightbox, openLightbox, closeLightbox } = useLightbox();
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [likeAnimation, setLikeAnimation] = useState(false);
    const [loveAnimation, setLoveAnimation] = useState(false);
    const shareMenuRef = useRef<HTMLDivElement>(null);

    const postUrl = `${window.location.href.split('?')[0]}#post-${post.id}`;
    const postText = encodeURIComponent(`Check out this post on ShelTrify: "${post.title}"`);

    const handleLikeClick = () => {
        onToggleLike(post.id);
        if (!post.isLiked) {
            setLikeAnimation(true);
        }
    };
    
    const handleLoveClick = () => {
        onToggleLove(post.id);
        if (!post.isLoved) {
            setLoveAnimation(true);
        }
    };

    const shareTo = (platform: 'x' | 'facebook' | 'linkedin') => {
        let url = '';
        switch(platform) {
            case 'x':
                url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${postText}`;
                break;
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
                break;
            case 'linkedin':
                url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(postUrl)}&title=${postText}`;
                break;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
        setIsShareOpen(false);
    };

    const copyLink = () => {
        navigator.clipboard.writeText(postUrl).then(() => {
            alert('Link copied to clipboard!');
            setIsShareOpen(false);
        }).catch(err => {
            console.error('Failed to copy link: ', err);
            alert('Failed to copy link.');
        });
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
                setIsShareOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isYoutube = post.videoUrl && !post.videoUrl.startsWith('https:');

    return (
        <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-3 md:p-5 transition-all duration-300 hover:border-brand-primary/50">
            <div className="flex items-start gap-2 md:gap-4">
                <img src={post.author.avatarUrl} alt={post.author.name} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 md:gap-2 text-xs md:text-sm">
                        <span className="font-bold text-light-text-primary dark:text-dark-text-primary truncate">{post.author.name}</span>
                        <span className="text-light-text-secondary dark:text-dark-text-secondary hidden sm:inline">@{post.author.handle}</span>
                        <span className="text-light-text-secondary dark:text-dark-text-secondary hidden sm:inline">·</span>
                        <span className="text-light-text-secondary dark:text-dark-text-secondary text-xs">{post.timestamp}</span>
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mt-1 break-words">{post.title}</h3>
                    {post.content && <p className="text-sm md:text-base text-light-text-primary dark:text-dark-text-primary mt-2 whitespace-pre-wrap break-words">{post.content}</p>}
                    
                    {post.imageUrl && (
                        <button
                            type="button"
                            onClick={() => openLightbox([post.imageUrl], 0, `Post by ${post.author?.name ?? 'user'}`)}
                            aria-label="View image full screen"
                            className="mt-3 block w-full rounded-lg overflow-hidden border border-light-border dark:border-dark-border cursor-zoom-in"
                        >
                            <img src={post.imageUrl} alt="Post content" className="w-full h-auto object-cover" />
                        </button>
                    )}
                    {post.videoUrl && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-light-border dark:border-dark-border relative group cursor-pointer aspect-video">
                           {isYoutube ? (
                                <iframe
                                    className="w-full h-full"
                                    src={`https://www.youtube.com/embed/${post.videoUrl}`}
                                    title={post.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                           ) : (
                                <>
                                    <img src={post.videoUrl} alt="Video thumbnail" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <PlayCircleIcon className="w-16 h-16 text-white/80 group-hover:scale-110 transition-transform" />
                                    </div>
                                </>
                           )}
                        </div>
                    )}

                    <p className="text-xs text-brand-primary font-medium mt-3">{post.category}</p>
                    
                    <div className="mt-3 md:mt-4 flex items-center justify-between text-light-text-secondary dark:text-dark-text-secondary">
                        <div className="flex items-center gap-2 md:gap-5">
                            <button onClick={() => setIsCommentsOpen(!isCommentsOpen)} className="flex items-center gap-1 md:gap-1.5 group hover:text-blue-500 p-1">
                               <ChatBubbleIcon className="w-4 h-4 md:w-5 md:h-5" /> <span className="text-xs md:text-sm">{post.replies}</span>
                            </button>
                             <button onClick={handleLikeClick} className={`flex items-center gap-1 md:gap-1.5 group hover:text-brand-primary p-1 ${post.isLiked ? 'text-brand-primary' : ''}`}>
                               <ThumbUpIcon onAnimationEnd={() => setLikeAnimation(false)} className={`w-4 h-4 md:w-5 md:h-5 ${likeAnimation ? 'animate-like' : ''}`} /> <span className="text-xs md:text-sm">{post.likes}</span>
                            </button>
                            <button onClick={handleLoveClick} className={`flex items-center gap-1 md:gap-1.5 group hover:text-red-500 p-1 ${post.isLoved ? 'text-red-500' : ''}`}>
                               <HeartIcon onAnimationEnd={() => setLoveAnimation(false)} className={`w-4 h-4 md:w-5 md:h-5 ${loveAnimation ? 'animate-like' : ''} ${post.isLoved ? 'fill-current' : ''}`} /> <span className="text-xs md:text-sm">{post.loves}</span>
                            </button>
                            <button className="flex items-center gap-1 md:gap-1.5 group hover:text-green-500 p-1">
                               <ArrowPathIcon className="w-4 h-4 md:w-5 md:h-5" /> <span className="text-xs md:text-sm hidden sm:inline">{post.reposts}</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2">
                             <button className="p-1.5 md:p-2 rounded-full group hover:bg-light-bg dark:hover:bg-dark-bg hover:text-brand-primary">
                                <BookmarkIcon className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                            <div ref={shareMenuRef} className="relative">
                                <button onClick={() => setIsShareOpen(!isShareOpen)} className="p-1.5 md:p-2 rounded-full group hover:bg-light-bg dark:hover:bg-dark-bg hover:text-brand-primary">
                                    <ArrowUpTrayIcon className="w-4 h-4 md:w-5 md:h-5" />
                                </button>
                                {isShareOpen && (
                                    <div className="absolute bottom-full right-0 mb-2 w-48 md:w-56 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg shadow-lg z-10 py-1">
                                        <button onClick={() => shareTo('x')} className="w-full text-left flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 text-xs md:text-sm text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-border dark:hover:bg-dark-border hover:text-light-text-primary dark:hover:text-dark-text-primary"><XIcon className="w-3 h-3 md:w-4 md:h-4" /> <span className="truncate">Share on X</span></button>
                                        <button onClick={() => shareTo('facebook')} className="w-full text-left flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 text-xs md:text-sm text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-border dark:hover:bg-dark-border hover:text-light-text-primary dark:hover:text-dark-text-primary"><FacebookIcon className="w-3 h-3 md:w-4 md:h-4" /> <span className="truncate">Share on Facebook</span></button>
                                        <button onClick={() => shareTo('linkedin')} className="w-full text-left flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 text-xs md:text-sm text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-border dark:hover:bg-dark-border hover:text-light-text-primary dark:hover:text-dark-text-primary"><LinkedInIcon className="w-3 h-3 md:w-4 md:h-4" /> <span className="truncate">Share on LinkedIn</span></button>
                                        <div className="my-1 border-t border-light-border dark:border-dark-border"></div>
                                        <button onClick={copyLink} className="w-full text-left flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 text-xs md:text-sm text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-border dark:hover:bg-dark-border hover:text-light-text-primary dark:hover:text-dark-text-primary"><LinkIcon className="w-3 h-3 md:w-4 md:h-4" /> <span className="truncate">Copy Link</span></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {isCommentsOpen && <CommentSection comments={post.comments} onAddComment={(text) => onAddComment(post.id, text)} currentUser={currentUser} />}
                </div>
            </div>

            {lightbox && (
                <Lightbox
                    images={lightbox.images}
                    startIndex={lightbox.index}
                    alt={lightbox.alt}
                    onClose={closeLightbox}
                />
            )}
        </div>
    );
};


const SidebarWidget: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-5">
        <h3 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary mb-4">{title}</h3>
        {children}
    </div>
);


interface CommunityPageProps {
    currentUser?: any;
}

const CommunityPage: React.FC<CommunityPageProps> = ({ currentUser }) => {
    const actualCurrentUser = getCurrentUser(currentUser);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
    const [trendingTopics, setTrendingTopics] = useState<Array<{ id: string; text: string }>>([]);
    const [topContributors, setTopContributors] = useState<Array<{ id: string; name: string; points: string; avatarUrl: string }>>([]);

    useEffect(() => {
        loadPosts();
    }, [selectedChannel]);

    const loadPosts = async () => {
        try {
            setLoading(true);
            const response = await communityAPI.getPosts({ 
                limit: 50,
                category: selectedChannel || undefined
            });
            if (response.success) {
                // Transform backend posts to frontend format
                const transformedPosts: Post[] = (response.data.posts || []).map((p: any) => ({
                    id: p.id, // Use backend UUID as ID
                    backendId: p.id, // Store for API calls
                    author: {
                        name: p.user.fullName || p.user.email || 'Anonymous',
                        handle: p.user.email?.split('@')[0] || 'anonymous',
                        avatarUrl: p.user.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256'
                    },
                    category: p.category || 'General',
                    title: p.title,
                    content: p.content,
                    imageUrl: p.imageUrl,
                    videoUrl: p.videoUrl,
                    timestamp: formatTimestamp(p.createdAt),
                    replies: p.replies || p._count?.comments || 0,
                    likes: p.likes || 0,
                    loves: p.loves || 0,
                    reposts: p.reposts || 0,
                    isLiked: false, // TODO: Track user's likes if needed
                    isLoved: false, // TODO: Track user's loves if needed
                    comments: (p.comments || []).map((c: any) => ({
                        id: c.id,
                        author: {
                            name: c.user.fullName || c.user.email || 'Anonymous',
                            handle: c.user.email?.split('@')[0] || 'anonymous',
                            avatarUrl: c.user.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256'
                        },
                        text: c.text,
                        timestamp: formatTimestamp(c.createdAt)
                    }))
                }));
                setPosts(transformedPosts);
                
                // Calculate trending topics from post categories
                const categoryCounts: Record<string, number> = {};
                transformedPosts.forEach(post => {
                    if (post.category) {
                        categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1;
                    }
                });
                const trending = Object.entries(categoryCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([category], index) => ({
                        id: `trending-${index}`,
                        text: category
                    }));
                setTrendingTopics(trending);
                
                // Calculate top contributors from posts
                const contributorCounts: Record<string, { count: number; user: User }> = {};
                transformedPosts.forEach(post => {
                    const userId = post.author.handle;
                    if (!contributorCounts[userId]) {
                        contributorCounts[userId] = {
                            count: 0,
                            user: post.author
                        };
                    }
                    contributorCounts[userId].count += 1;
                });
                const topContribs = Object.entries(contributorCounts)
                    .sort(([, a], [, b]) => b.count - a.count)
                    .slice(0, 3)
                    .map(([userId, data], index) => ({
                        id: `contributor-${index}`,
                        name: `@${data.user.handle}`,
                        points: `${data.count} ${data.count === 1 ? 'post' : 'posts'}`,
                        avatarUrl: data.user.avatarUrl
                    }));
                setTopContributors(topContribs);
            } else {
                setPosts([]);
                setTrendingTopics([]);
                setTopContributors([]);
            }
        } catch (error) {
            console.error('Failed to load posts:', error);
            setPosts([]);
            setTrendingTopics([]);
            setTopContributors([]);
        } finally {
            setLoading(false);
        }
    };

    const formatTimestamp = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-NG', { 
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    const handleCreatePost = async (data: NewPostData) => {
        try {
            const title = data.content.substring(0, 50) + (data.content.length > 50 ? '...' : '');
            const response = await communityAPI.createPost({
                title,
                content: data.content,
                category: selectedChannel || 'General',
                imageUrl: data.imageUrl,
                videoUrl: data.videoUrl
            });

            if (response.success) {
                // Reload posts to get the new post from backend
                await loadPosts();
            } else {
                alert(response.message || 'Failed to create post. Please login first.');
            }
        } catch (error: any) {
            console.error('Create post error:', error);
            alert(error.message || 'Failed to create post. Please login first.');
        }
    };

    const handleToggleLike = async (postId: string) => {
        try {
            const post = posts.find(p => p.id === postId || p.backendId === postId);
            if (!post || !post.backendId) {
                console.error('Post not found or missing backend ID');
                return;
            }

            // Optimistic update
            const wasLiked = post.isLiked;
            setPosts(posts.map(p => {
                if (p.id === postId || p.backendId === postId) {
                    return { 
                        ...p, 
                        isLiked: !p.isLiked, 
                        likes: p.isLiked ? p.likes - 1 : p.likes + 1 
                    };
                }
                return p;
            }));

            // Update backend
            if (!wasLiked) {
                await communityAPI.likePost(post.backendId);
            }
            // Reload to sync with backend
            await loadPosts();
        } catch (error) {
            console.error('Failed to like post:', error);
            // Revert optimistic update on error
            await loadPosts();
        }
    };

    const handleToggleLove = async (postId: string) => {
        try {
            const post = posts.find(p => p.id === postId || p.backendId === postId);
            if (!post || !post.backendId) {
                console.error('Post not found or missing backend ID');
                return;
            }

            // Optimistic update
            const wasLoved = post.isLoved;
            setPosts(posts.map(p => {
                if (p.id === postId || p.backendId === postId) {
                    return { 
                        ...p, 
                        isLoved: !p.isLoved, 
                        loves: p.isLoved ? p.loves - 1 : p.loves + 1 
                    };
                }
                return p;
            }));

            // Update backend
            if (!wasLoved) {
                await communityAPI.lovePost(post.backendId);
            }
            // Reload to sync with backend
            await loadPosts();
        } catch (error) {
            console.error('Failed to love post:', error);
            // Revert optimistic update on error
            await loadPosts();
        }
    };

    const handleAddComment = async (postId: string, text: string) => {
        try {
            const post = posts.find(p => p.id === postId || p.backendId === postId);
            if (!post || !post.backendId) {
                console.error('Post not found or missing backend ID');
                return;
            }

            // Optimistic update
            const newComment: Comment = {
                id: `temp-${Date.now()}`,
                author: actualCurrentUser,
                text: text,
                timestamp: 'Just now',
            };
            setPosts(posts.map(p => {
                 if (p.id === postId || p.backendId === postId) {
                    return { ...p, comments: [...p.comments, newComment], replies: p.replies + 1 };
                }
                return p;
            }));

            // Save to backend
            const response = await communityAPI.addComment(post.backendId, text);
            if (response.success) {
                // Reload to get the actual comment from backend
                await loadPosts();
            } else {
                // Revert optimistic update on error
                await loadPosts();
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
            // Revert optimistic update on error
            await loadPosts();
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-2 px-2 md:px-4 overflow-x-hidden w-full">
            <style>{`
                @keyframes like-animation {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.4) rotate(-15deg); }
                    100% { transform: scale(1) rotate(0deg); }
                }
                .animate-like {
                    animation: like-animation 0.4s ease-in-out;
                }
            `}</style>
            <header className="text-center mb-6 md:mb-10 px-2">
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-light-text-primary dark:text-dark-text-primary">ShelTrify Community Forum</h1>
                <p className="mt-2 text-sm md:text-lg text-light-text-secondary dark:text-dark-text-secondary">Connect. Share. Learn — find trusted rental insights.</p>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
                {/* Left Sidebar */}
                <aside className="hidden lg:block space-y-6">
                     <SidebarWidget title="Channels">
                        <ul className="space-y-1">
                            <li 
                                onClick={() => setSelectedChannel(null)}
                                className={`flex items-center gap-3 p-2 rounded-md hover:bg-light-bg dark:hover:bg-dark-bg cursor-pointer group transition-colors ${
                                    selectedChannel === null ? 'bg-brand-primary/10 text-brand-primary' : ''
                                }`}
                            >
                                <span className="text-xl">🏠</span>
                                <span className={`font-semibold ${
                                    selectedChannel === null 
                                        ? 'text-brand-primary' 
                                        : 'text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text-primary dark:group-hover:text-dark-text-primary'
                                }`}>All Channels</span>
                            </li>
                            {channels.map(channel => (
                                <li 
                                    key={channel.name} 
                                    onClick={() => setSelectedChannel(channel.category)}
                                    className={`flex items-center gap-3 p-2 rounded-md hover:bg-light-bg dark:hover:bg-dark-bg cursor-pointer group transition-colors ${
                                        selectedChannel === channel.category ? 'bg-brand-primary/10 text-brand-primary' : ''
                                    }`}
                                >
                                    <span className="text-xl">{channel.emoji}</span>
                                    <span className={`font-semibold ${
                                        selectedChannel === channel.category 
                                            ? 'text-brand-primary' 
                                            : 'text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text-primary dark:group-hover:text-dark-text-primary'
                                    }`}>{channel.name}</span>
                                </li>
                            ))}
                        </ul>
                    </SidebarWidget>
                </aside>
                
                {/* Main Feed */}
                <main className="lg:col-span-2 order-2 lg:order-none">
                    <CreatePost onPost={handleCreatePost} currentUser={actualCurrentUser} selectedCategory={selectedChannel || undefined} />
                    {loading ? (
                        <div className="text-center py-12 text-light-text-secondary dark:text-dark-text-secondary">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
                            <p className="mt-4">Loading posts...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-12 text-light-text-secondary dark:text-dark-text-secondary">
                            <p className="text-base md:text-lg mb-2">No posts yet</p>
                            <p className="text-sm">Be the first to share something with the community!</p>
                        </div>
                    ) : (
                        <div className="space-y-3 md:space-y-4">
                            {posts.map(post => (
                                <PostCard 
                                    key={post.id} 
                                    post={post} 
                                    onToggleLike={handleToggleLike}
                                    onToggleLove={handleToggleLove}
                                    onAddComment={handleAddComment}
                                    currentUser={actualCurrentUser}
                                />)
                            )}
                        </div>
                    )}
                </main>
                
                {/* Right Sidebar */}
                <aside className="space-y-4 md:space-y-6 order-3 lg:order-none">
                    {trendingTopics.length > 0 && (
                        <SidebarWidget title="Trending">
                            <ul className="space-y-3">
                                {trendingTopics.map(topic => (
                                    <li key={topic.id} className="text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary cursor-pointer">
                                       • {topic.text}
                                    </li>
                                ))}
                            </ul>
                        </SidebarWidget>
                    )}
                    
                    {topContributors.length > 0 && (
                        <SidebarWidget title="Top Contributors">
                            <ul className="space-y-4">
                                {topContributors.map(user => (
                                    <li key={user.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                                            <span className="font-semibold text-light-text-primary dark:text-dark-text-primary text-sm">{user.name}</span>
                                        </div>
                                        <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{user.points}</span>
                                    </li>
                                ))}
                            </ul>
                        </SidebarWidget>
                    )}

                    <p className="text-xs text-center text-light-text-secondary dark:text-dark-text-secondary">&copy; ShelTrify • Community Guidelines • Privacy • Contact</p>
                </aside>
            </div>
        </div>
    );
};

export default CommunityPage;