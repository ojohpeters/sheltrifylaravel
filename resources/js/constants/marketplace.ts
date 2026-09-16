/**
 * Marketplace categories.
 *
 * The values are what sits in marketplace_products.category; the labels are
 * what a shopper should read. Production also holds rows from earlier naming
 * (HOMES_FOR_SALE, FURNITURE), so categoryLabel() falls back to titling the
 * raw value rather than printing SCREAMING_SNAKE_CASE at people.
 */
export interface MarketplaceCategory {
    value: string;
    label: string;
    icon: string;
}

export const MARKETPLACE_CATEGORIES: readonly MarketplaceCategory[] = [
    { value: 'RESIDENTIAL_HOUSE', label: 'Residential House', icon: '🏠' },
    { value: 'SHORTLET', label: 'Shortlet', icon: '🛎️' },
    { value: 'STUDENT_HOSTEL', label: 'Student Hostel', icon: '🎓' },
    { value: 'OFFICE_SPACE', label: 'Office Space', icon: '🏢' },
    { value: 'BUSINESS_SPACE', label: 'Business Space', icon: '🏬' },
    { value: 'EVENT_VENUE', label: 'Event Venue', icon: '🎪' },
    { value: 'WEDDING_MATERIALS', label: 'Wedding Materials', icon: '💍' },
    { value: 'RENT_TO_OWN', label: 'Rent to Own', icon: '🔑' },
    { value: 'LAND_FOR_SALE', label: 'Land for Sale', icon: '🌍' },
    { value: 'HOMES_FOR_SALE', label: 'Homes for Sale', icon: '🏡' },
    { value: 'BUY_PROPERTIES', label: 'Buy Properties', icon: '🏘️' },
    { value: 'SALES_PROPERTIES', label: 'Properties for Sale', icon: '📋' },
    { value: 'PROPERTY_MANAGEMENT', label: 'Property Management', icon: '🗂️' },
    { value: 'INTERIOR_DESIGN', label: 'Interior Design', icon: '🛋️' },
    { value: 'HOME_ELECTRONICS', label: 'Home Electronics', icon: '📱' },
    { value: 'FURNITURE', label: 'Furniture', icon: '🪑' },
    { value: 'BUILDING_MATERIALS', label: 'Building Materials', icon: '🧱' },
    { value: 'TIPPER_DRIVERS', label: 'Transport & Logistics', icon: '🚛' },
    { value: 'LOCAL_ARTISANS', label: 'Local Artisans', icon: '🔧' },
];

const BY_VALUE = new Map(MARKETPLACE_CATEGORIES.map(c => [c.value, c]));

/** "HOME_ELECTRONICS" → "Home Electronics"; unknown values are titled, not shouted. */
export function categoryLabel(value?: string | null): string {
    if (!value) return '';
    const known = BY_VALUE.get(value);
    if (known) return known.label;

    return value
        .toLowerCase()
        .split(/[_\s]+/)
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function categoryIcon(value?: string | null): string {
    return (value && BY_VALUE.get(value)?.icon) || '🏷️';
}
