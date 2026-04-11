import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    ShoppingCartIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    BuildingStorefrontIcon,
    PhotoIcon,
    PhoneIcon,
    CloseIcon
} from './icons';
import { marketplaceAPI, cartAPI, uploadAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

const tipperDrivers = [
  { id: 1, name: 'Babatunde Adekunle', phone: '0801-234-5678', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=256' },
  { id: 2, name: 'Musa Ibrahim', phone: '0802-345-6789', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256' },
  { id: 3, name: 'Chinedu Okoro', phone: '0803-456-7890', image: 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?q=80&w=256' },
  { id: 4, name: 'Suleiman Bello', phone: '0804-567-8901', image: 'https://images.unsplash.com/photo-1614283233556-f35b7c841523?q=80&w=256' },
  { id: 5, name: 'Femi Adeboye', phone: '0806-789-0123', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256' },
  { id: 6, name: 'Ahmed Garba', phone: '0807-890-1234', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=256' },
];

const formatPrice = (price: number): string => {
    if (price >= 1000000) return `₦${(price / 1000000).toFixed(2)}M`;
    return `₦${price.toLocaleString()}`;
};

// Skeleton shimmer card
const SkeletonCard: React.FC = () => (
    <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl overflow-hidden animate-pulse">
        <div className="aspect-[4/3] bg-light-border dark:bg-dark-border" />
        <div className="p-4 space-y-2">
            <div className="h-4 bg-light-border dark:bg-dark-border rounded w-3/4" />
            <div className="h-5 bg-light-border dark:bg-dark-border rounded w-1/2" />
            <div className="h-9 bg-light-border dark:bg-dark-border rounded-xl mt-3" />
        </div>
    </div>
);

const ProductCard: React.FC<{
    product: any;
    category: string;
    onAddToCart?: (productId: string) => void;
    isAuthenticated?: boolean;
}> = ({ product, category, onAddToCart, isAuthenticated }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [imageError, setImageError] = useState(false);
    const { showSuccess, showError } = useToast();
    const isService = product.type === 'service';
    const isProperty = category === 'homesForSale' || category === 'landForSale';
    const productId = product.id || product.productId;

    const handleAddToCart = useCallback(async () => {
        if (!productId || isService) return;
        if (!isAuthenticated) { showError('Please login to add items to cart'); return; }
        setIsAdding(true);
        try {
            if (onAddToCart) { await onAddToCart(productId); }
            else { await cartAPI.add(productId); }
            showSuccess('Added to cart!');
        } catch (error: any) {
            showError(error.message || 'Failed to add to cart');
        } finally { setIsAdding(false); }
    }, [productId, isService, isAuthenticated, onAddToCart, showSuccess, showError]);

    return (
        <div className="group bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="relative overflow-hidden aspect-[4/3]">
                {!imageError ? (
                    <img
                        src={product.image || product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full bg-light-bg dark:bg-dark-bg flex items-center justify-center">
                        <PhotoIcon className="w-10 h-10 text-light-text-muted dark:text-dark-text-muted" />
                    </div>
                )}
                {product.discount && !isProperty && typeof product.discount === 'number' && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        -{product.discount}%
                    </div>
                )}
            </div>
            <div className="p-3 sm:p-4">
                <h3 className="font-semibold text-sm text-light-text-primary dark:text-dark-text-primary truncate">{product.name}</h3>
                <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-base font-bold text-brand-primary">{formatPrice(product.price)}</p>
                    {product.oldPrice && (
                        <p className="text-xs text-light-text-muted dark:text-dark-text-muted line-through">{formatPrice(product.oldPrice)}</p>
                    )}
                </div>
                <button
                    onClick={handleAddToCart}
                    disabled={isAdding || isService}
                    className={`w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-2 font-semibold text-xs rounded-xl transition-all touch-manipulation ${
                        isService
                            ? 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20'
                            : 'bg-brand-primary text-white hover:bg-brand-secondary shadow-sm hover:shadow-brand-sm'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isService ? 'Get Quote' : isAdding ? 'Adding…' : (
                        <><ShoppingCartIcon className="w-3.5 h-3.5" />Add to Cart</>
                    )}
                </button>
            </div>
        </div>
    );
};

const DriverCard: React.FC<{ driver: { id: number; name: string; phone: string; image: string } }> = ({ driver }) => {
    const [imageError, setImageError] = useState(false);
    const cleanPhone = driver.phone.replace(/[^\d+]/g, '');

    return (
        <div className="group bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="relative overflow-hidden aspect-[4/3]">
                {!imageError ? (
                    <img
                        src={driver.image} alt={driver.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy" onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full bg-light-bg dark:bg-dark-bg flex items-center justify-center">
                        <PhotoIcon className="w-10 h-10 text-light-text-muted dark:text-dark-text-muted" />
                    </div>
                )}
            </div>
            <div className="p-3 sm:p-4 text-center">
                <h3 className="font-semibold text-sm text-light-text-primary dark:text-dark-text-primary">{driver.name}</h3>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">{driver.phone}</p>
                <a
                    href={`tel:${cleanPhone}`}
                    className="w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-2 font-semibold text-xs rounded-xl bg-brand-primary text-white hover:bg-brand-secondary transition-all shadow-sm touch-manipulation"
                >
                    <PhoneIcon className="w-3.5 h-3.5" />Contact Driver
                </a>
            </div>
        </div>
    );
};

const SectionGrid: React.FC<{
    title: string;
    items: any[];
    renderItem: (item: any) => React.ReactNode;
    icon?: string;
}> = ({ title, items, renderItem, icon }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const scroll = useCallback((dir: 'left' | 'right') => {
        scrollRef.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
    }, []);
    if (items.length === 0) return null;

    return (
        <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
                    {icon && <span className="text-2xl">{icon}</span>}
                    {title}
                </h2>
                <div className="flex gap-1.5">
                    {[{dir: 'left', icon: <ChevronLeftIcon className="w-4 h-4"/>}, {dir: 'right', icon: <ChevronRightIcon className="w-4 h-4"/>}].map(({dir, icon: ic}) => (
                        <button key={dir} onClick={() => scroll(dir as 'left'|'right')}
                            className="p-1.5 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-full hover:border-brand-primary/40 hover:text-brand-primary transition-all text-light-text-secondary dark:text-dark-text-secondary"
                            aria-label={`Scroll ${dir}`}
                        >{ic}</button>
                    ))}
                </div>
            </div>
            {/* Mobile: horizontal scroll */}
            <div ref={scrollRef} className="flex sm:hidden gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-1 px-1">
                {items.map((item, i) => (
                    <div key={item.id || i} className="flex-shrink-0 w-44 snap-start">{renderItem(item)}</div>
                ))}
            </div>
            {/* sm+: responsive grid */}
            <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item, i) => <div key={item.id || i}>{renderItem(item)}</div>)}
            </div>
        </section>
    );
};

const ListProductSection: React.FC<{ onProductCreated?: () => void; isAuthenticated?: boolean }> = ({ onProductCreated, isAuthenticated }) => {
    const { showSuccess, showError } = useToast();
    const [formData, setFormData] = useState({ name: '', description: '', price: '', category: 'HOMES_FOR_SALE' as string });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { showError('Image must be 10MB or smaller'); return; }
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    }, [showError]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) { showError('Please login to create a listing'); return; }
        setError(null);
        setIsSubmitting(true);
        try {
            let imageUrl: string | undefined;
            if (imageFile) {
                const uploadResponse = await uploadAPI.uploadImage(imageFile, true);
                if (uploadResponse.success && uploadResponse.data?.url) imageUrl = uploadResponse.data.url;
                else { setError(uploadResponse.message || 'Failed to upload image'); return; }
            }
            const response = await marketplaceAPI.create({ name: formData.name, description: formData.description || undefined, price: parseFloat(formData.price), category: formData.category, imageUrl });
            if (response.success) {
                showSuccess('Product submitted! It will be reviewed before going live.');
                setFormData({ name: '', description: '', price: '', category: 'HOMES_FOR_SALE' });
                setImageFile(null); setImagePreview(null); setShowForm(false);
                if (imageInputRef.current) imageInputRef.current.value = '';
                onProductCreated?.();
            }
        } catch (err: any) {
            const msg = err.message || 'Failed to create listing';
            setError(msg); showError(msg);
        } finally { setIsSubmitting(false); }
    }, [formData, imageFile, isAuthenticated, onProductCreated, showError, showSuccess]);

    return (
        <section className="mb-10 rounded-2xl border border-brand-primary/20 bg-gradient-to-br from-brand-primary/5 to-cyan-400/5 p-5 sm:p-7">
            <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-8 items-start">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold mb-3">
                        🏪 Sell on ShelTrify
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
                        Turn your assets into income
                    </h2>
                    <p className="mt-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        List property, furniture, electronics, or building materials and reach thousands of buyers daily.
                    </p>
                    {!showForm && (
                        <button
                            onClick={() => {
                                if (!isAuthenticated) { showError('Please login to create a listing'); return; }
                                setShowForm(true);
                            }}
                            className="mt-5 btn-primary text-sm"
                        >
                            + Create Listing
                        </button>
                    )}
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} className="w-full bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-4 sm:p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-light-text-primary dark:text-dark-text-primary">New Listing</h3>
                            <button type="button" onClick={() => setShowForm(false)} className="p-1 text-light-text-muted dark:text-dark-text-muted hover:text-light-text-primary dark:hover:text-dark-text-primary touch-manipulation" aria-label="Close">
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {error && <div className="p-3 bg-red-500/10 text-red-500 rounded-xl text-xs">{error}</div>}

                        {[
                            { label: "What are you selling?", field: 'name', placeholder: 'e.g., 3-Bedroom Bungalow, 6-Seater Sofa…', type: 'text', required: true },
                        ].map(({ label, field, placeholder, type, required }) => (
                            <div key={field}>
                                <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">{label}</label>
                                <input type={type} placeholder={placeholder} required={required} value={(formData as any)[field]}
                                    onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                                    className="input-base text-sm" />
                            </div>
                        ))}

                        <div>
                            <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Description (optional)</label>
                            <textarea placeholder="Describe your product…" value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="input-base text-sm resize-none" rows={2} />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Category</label>
                            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-base text-sm">
                                <option value="HOMES_FOR_SALE">Homes for Sale</option>
                                <option value="SHORTLET">Shortlet Apartment</option>
                                <option value="STUDENT_HOSTEL">Student Hostel</option>
                                <option value="OFFICE_SPACE">Office Space</option>
                                <option value="BUSINESS_SPACE">Business Space</option>
                                <option value="EVENT_VENUE">Event Venue</option>
                                <option value="WEDDING_MATERIALS">Hire Wedding Materials</option>
                                <option value="RENT_TO_OWN">Rent to Own</option>
                                <option value="LAND_FOR_SALE">Land for Sale</option>
                                <option value="HOME_ELECTRONICS">Home Electronics</option>
                                <option value="INTERIOR_DESIGN">Interior Design / Furniture</option>
                                <option value="BUILDING_MATERIALS">Building Materials</option>
                                <option value="SERVICES">Services</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Price (NGN)</label>
                            <input type="number" placeholder="e.g., 150000" required min="0" step="0.01" value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="input-base text-sm" />
                        </div>

                        <input type="file" ref={imageInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                        <button type="button" onClick={() => imageInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-light-border dark:border-dark-border rounded-xl hover:border-brand-primary/50 text-sm text-light-text-secondary dark:text-dark-text-secondary transition-colors touch-manipulation">
                            <PhotoIcon className="w-4 h-4" />{imagePreview ? 'Change Image' : 'Upload Image (optional)'}
                        </button>

                        {imagePreview && (
                            <div className="relative rounded-xl overflow-hidden">
                                <img src={imagePreview} alt="Preview" className="w-full h-36 object-cover" />
                                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); if (imageInputRef.current) imageInputRef.current.value = ''; }}
                                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors">×</button>
                            </div>
                        )}

                        <button type="submit" disabled={isSubmitting || !formData.name || !formData.price} className="w-full btn-primary text-sm py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Creating…' : 'Create Listing'}
                        </button>
                    </form>
                )}
            </div>
        </section>
    );
};

type FilterKey = 'all' | 'homes' | 'land' | 'electronics' | 'furniture' | 'materials' | 'drivers' | 'office' | 'business' | 'hostel' | 'shortlet' | 'venue' | 'wedding' | 'renttoown';

interface MarketplacePageProps {
    onCartUpdate?: () => void;
    isAuthenticated?: boolean;
}

const MarketplacePage: React.FC<MarketplacePageProps> = ({ onCartUpdate, isAuthenticated = false }) => {
    const { showSuccess } = useToast();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

    useEffect(() => { loadProducts(); }, []);

    const loadProducts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await marketplaceAPI.getAll({ limit: 100 });
            if (response.success && response.data) setProducts(response.data.products || []);
            else setProducts([]);
        } catch { setProducts([]); }
        finally { setLoading(false); }
    }, []);

    const handleAddToCart = useCallback(async (productId: string) => {
        await cartAPI.add(productId);
        onCartUpdate?.();
    }, [onCartUpdate]);

    const productsByCategory = {
        HOMES_FOR_SALE: products.filter(p => p.category === 'HOMES_FOR_SALE'),
        LAND_FOR_SALE: products.filter(p => p.category === 'LAND_FOR_SALE'),
        BUILDING_MATERIALS: products.filter(p => p.category === 'BUILDING_MATERIALS'),
        HOME_ELECTRONICS: products.filter(p => p.category === 'HOME_ELECTRONICS'),
        INTERIOR_DESIGN: products.filter(p => p.category === 'INTERIOR_DESIGN'),
        OFFICE_SPACE: products.filter(p => p.category === 'OFFICE_SPACE'),
        BUSINESS_SPACE: products.filter(p => p.category === 'BUSINESS_SPACE'),
        STUDENT_HOSTEL: products.filter(p => p.category === 'STUDENT_HOSTEL'),
        SHORTLET: products.filter(p => p.category === 'SHORTLET'),
        EVENT_VENUE: products.filter(p => p.category === 'EVENT_VENUE'),
        WEDDING_MATERIALS: products.filter(p => p.category === 'WEDDING_MATERIALS'),
        RENT_TO_OWN: products.filter(p => p.category === 'RENT_TO_OWN'),
    };

    const allProducts = {
        homesForSale: productsByCategory.HOMES_FOR_SALE.map(p => ({ ...p, image: p.imageUrl })),
        landForSale: productsByCategory.LAND_FOR_SALE.map(p => ({ ...p, image: p.imageUrl })),
        tipperShield: productsByCategory.BUILDING_MATERIALS.map(p => ({ ...p, image: p.imageUrl, type: 'product' })),
        homeElectronics: productsByCategory.HOME_ELECTRONICS.map(p => ({ ...p, image: p.imageUrl })),
        interiorDesign: productsByCategory.INTERIOR_DESIGN.map(p => ({ ...p, image: p.imageUrl })),
        officeSpace: productsByCategory.OFFICE_SPACE.map(p => ({ ...p, image: p.imageUrl })),
        businessSpace: productsByCategory.BUSINESS_SPACE.map(p => ({ ...p, image: p.imageUrl })),
        studentHostel: productsByCategory.STUDENT_HOSTEL.map(p => ({ ...p, image: p.imageUrl })),
        shortlet: productsByCategory.SHORTLET.map(p => ({ ...p, image: p.imageUrl })),
        eventVenue: productsByCategory.EVENT_VENUE.map(p => ({ ...p, image: p.imageUrl })),
        weddingMaterials: productsByCategory.WEDDING_MATERIALS.map(p => ({ ...p, image: p.imageUrl })),
        rentToOwn: productsByCategory.RENT_TO_OWN.map(p => ({ ...p, image: p.imageUrl })),
    };

    const filters: { key: FilterKey; label: string; icon: string }[] = [
        { key: 'all', label: 'All', icon: '🏪' },
        { key: 'homes', label: 'Homes', icon: '🏠' },
        { key: 'land', label: 'Land', icon: '🌍' },
        { key: 'shortlet', label: 'Shortlet', icon: '🛎️' },
        { key: 'hostel', label: 'Student Hostels', icon: '🎓' },
        { key: 'office', label: 'Office Space', icon: '🏢' },
        { key: 'business', label: 'Business Space', icon: '🏬' },
        { key: 'venue', label: 'Event Venue', icon: '🎪' },
        { key: 'wedding', label: 'Wedding Hire', icon: '💍' },
        { key: 'renttoown', label: 'Rent to Own', icon: '🔑' },
        { key: 'electronics', label: 'Electronics', icon: '📱' },
        { key: 'furniture', label: 'Furniture', icon: '🛋️' },
        { key: 'materials', label: 'Materials', icon: '🧱' },
        { key: 'drivers', label: 'Drivers', icon: '🚛' },
    ];

    const renderProduct = (category: string) => (product: any) => (
        <ProductCard product={product} category={category} onAddToCart={handleAddToCart} isAuthenticated={isAuthenticated} />
    );

    const shouldShow = (key: FilterKey) => activeFilter === 'all' || activeFilter === key;

    return (
        <div className="min-h-screen">
            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* Hero */}
            <div className="relative rounded-2xl overflow-hidden mb-6 h-44 sm:h-56 md:h-72 shadow-xl">
                <img src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=1200" alt="Marketplace" className="w-full h-full object-cover" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col items-start justify-end p-5 sm:p-8">
                    <div className="inline-flex items-center gap-2 mb-2 px-2.5 py-1 bg-white/10 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                        <BuildingStorefrontIcon className="w-3.5 h-3.5" />ShelTrify Marketplace
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">Your Complete<br />Home & Build Store</h1>
                    <p className="mt-1 text-sm text-white/80">Homes · Shortlet · Office · Hostels · Venues · Rent-to-Own & more</p>
                </div>
            </div>

            {/* Sell CTA */}
            <ListProductSection onProductCreated={loadProducts} isAuthenticated={isAuthenticated} />

            {/* Filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide -mx-1 px-1">
                {filters.map(({ key, label, icon }) => (
                    <button key={key} onClick={() => setActiveFilter(key)}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all touch-manipulation ${
                            activeFilter === key
                                ? 'bg-brand-primary text-white shadow-sm'
                                : 'bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary hover:border-brand-primary/40 hover:text-brand-primary'
                        }`}
                    >
                        <span>{icon}</span>{label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 mx-auto bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
                        <BuildingStorefrontIcon className="w-8 h-8 text-brand-primary" />
                    </div>
                    <p className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">No products yet</p>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">Be the first to list something!</p>
                </div>
            ) : (
                <>
                    {shouldShow('homes') && <SectionGrid title="Homes for Sale" icon="🏠" items={allProducts.homesForSale} renderItem={renderProduct('homesForSale')} />}
                    {shouldShow('shortlet') && <SectionGrid title="Shortlet Apartments" icon="🛎️" items={allProducts.shortlet} renderItem={renderProduct('shortlet')} />}
                    {shouldShow('hostel') && <SectionGrid title="Student Hostels" icon="🎓" items={allProducts.studentHostel} renderItem={renderProduct('studentHostel')} />}
                    {shouldShow('office') && <SectionGrid title="Office Space" icon="🏢" items={allProducts.officeSpace} renderItem={renderProduct('officeSpace')} />}
                    {shouldShow('business') && <SectionGrid title="Business Space" icon="🏬" items={allProducts.businessSpace} renderItem={renderProduct('businessSpace')} />}
                    {shouldShow('venue') && <SectionGrid title="Event Venues" icon="🎪" items={allProducts.eventVenue} renderItem={renderProduct('eventVenue')} />}
                    {shouldShow('wedding') && <SectionGrid title="Hire Wedding Materials" icon="💍" items={allProducts.weddingMaterials} renderItem={renderProduct('weddingMaterials')} />}
                    {shouldShow('renttoown') && <SectionGrid title="Rent to Own" icon="🔑" items={allProducts.rentToOwn} renderItem={renderProduct('rentToOwn')} />}
                    {shouldShow('land') && <SectionGrid title="Land for Sale" icon="🌍" items={allProducts.landForSale} renderItem={renderProduct('landForSale')} />}
                    {shouldShow('furniture') && <SectionGrid title="Home Furniture" icon="🛋️" items={allProducts.interiorDesign} renderItem={renderProduct('interiorDesign')} />}
                    {shouldShow('materials') && <SectionGrid title="Building Materials" icon="🧱" items={allProducts.tipperShield} renderItem={renderProduct('tipperShield')} />}
                    {shouldShow('electronics') && <SectionGrid title="Home Electronics" icon="📱" items={allProducts.homeElectronics} renderItem={renderProduct('homeElectronics')} />}
                    {shouldShow('drivers') && (
                        <SectionGrid title="Tipper Drivers Near You" icon="🚛" items={tipperDrivers} renderItem={(driver) => <DriverCard driver={driver} />} />
                    )}
                </>
            )}
        </div>
    );
};

export default MarketplacePage;
