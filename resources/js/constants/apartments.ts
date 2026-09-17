/**
 * How Nigerian renters describe a place — by size, not by building type.
 *
 * Deliberately separate from PROPERTY_TYPES, which describes the building. Both
 * the vacating form and the waitlist form pick from this one list, so apartment
 * type is the single criterion the matcher can compare exactly instead of
 * fuzzily. Mirrored in app/Support/ApartmentTypes.php; keep the two in step.
 */
export const APARTMENT_TYPES: readonly string[] = [
    'Self-contain',
    'Single Room',
    'Room & Parlour',
    '1 Bedroom',
    '2 Bedroom',
    '3 Bedroom',
    '4+ Bedroom',
    'Duplex',
    'Shared Apartment',
    'Shop / Office',
];

/** Seekers may wait for anything in an area; a tenant must say what they have. */
export const ANY_APARTMENT_TYPE = 'Any';
