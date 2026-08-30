/**
 * Single source of truth for service taxonomy.
 *
 * "Tipper Driver" was previously hardcoded in four separate components, which
 * is why it drifted. Everything that renders a service name should import from
 * here.
 *
 * Values are the strings persisted in `users.artisan_service`, so they must not
 * be renamed casually — only labels are safe to change.
 */

export interface ServiceOption {
    value: string;
    label: string;
}

/** Local artisans — trades offered to new signups. */
export const ARTISAN_CATEGORIES: ServiceOption[] = [
    { value: 'PLUMBER', label: 'Plumber' },
    { value: 'ELECTRICIAN', label: 'Electrician' },
    { value: 'SOLAR_INSTALLER', label: 'Solar Installer' },
    { value: 'CARPENTER', label: 'Carpenter' },
    { value: 'CCTV_DSTV_INSTALLER', label: 'CCTV / DStv Installer' },
    { value: 'PHONE_REPAIRER', label: 'Phone Repairer' },
    { value: 'LAPTOP_REPAIRER', label: 'Laptop Repairer' },
    { value: 'BARBER', label: 'Barber' },
    { value: 'HAIR_STYLIST', label: 'Hair Stylist' },
    { value: 'BUILDER', label: 'Builder' },
    { value: 'WASTE_DISPOSER', label: 'Waste Disposer' },
    { value: 'PAINTER', label: 'Painter' },
    { value: 'WELDER', label: 'Scanner / Welder' },
];

/**
 * Transportation & logistics.
 *
 * Tipper drivers moved here out of the artisan trades. The stored role value
 * stays `TIPPER_DRIVER` because existing user rows carry it — only the label
 * and the grouping changed.
 */
export const TRANSPORT_CATEGORIES: ServiceOption[] = [
    { value: 'TIPPER_DRIVER', label: 'Tipper Driver' },
    { value: 'MOVER', label: 'Mover' },
    { value: 'TAXI', label: 'Taxi' },
    { value: 'WATER_TANKER', label: 'Water Tanker' },
    { value: 'DISPATCHER', label: 'Dispatcher' },
];

/**
 * Values no longer offered at signup but still present on existing accounts.
 * Kept so those profiles render a real name instead of a blank.
 */
export const LEGACY_SERVICE_LABELS: Record<string, string> = {
    MECHANIC: 'Mechanic',
    MASON: 'Mason',
    TILER: 'Tiler',
    OTHER: 'Other',
};

const ALL_SERVICE_LABELS: Record<string, string> = {
    ...LEGACY_SERVICE_LABELS,
    ...Object.fromEntries(ARTISAN_CATEGORIES.map(s => [s.value, s.label])),
    ...Object.fromEntries(TRANSPORT_CATEGORIES.map(s => [s.value, s.label])),
};

/**
 * Resolve any stored service value to a display label — current, legacy, or
 * unrecognised. Never returns empty for a non-empty input.
 */
export function serviceLabel(value?: string | null): string {
    if (!value) return '';
    return ALL_SERVICE_LABELS[value]
        ?? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/** Roles whose provider is a transport/logistics operator rather than a trade. */
export const TRANSPORT_ROLE = 'TIPPER_DRIVER';

/** Display label for the transport role in role pickers and dashboards. */
export const TRANSPORT_ROLE_LABEL = 'Transport / Logistics';
