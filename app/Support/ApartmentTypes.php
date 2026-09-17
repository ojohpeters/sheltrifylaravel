<?php

namespace App\Support;

final class ApartmentTypes
{
    /**
     * How Nigerian renters describe a place — by size, not by building.
     *
     * Deliberately separate from the listings' property_type ("Duplex",
     * "Warehouse"), which describes the building. Both sides of the match pick
     * from this same fixed list, so apartment type is the one criterion that
     * can be compared exactly rather than fuzzily.
     *
     * Mirrored in resources/js/constants/apartments.ts; keep the two in step.
     */
    public const ALL = [
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

    /** Seekers may waitlist for anything in an area; tenants must be specific. */
    public const ANY = 'Any';
}
