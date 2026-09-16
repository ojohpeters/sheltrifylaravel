<?php

namespace App\Support;

final class NigerianStates
{
    /**
     * The 36 states and the Federal Capital Territory.
     *
     * Used to validate the artisan state field so the directory filter works
     * on clean values — free text would split one state across "Lagos",
     * "lagos state" and "Lagos, Nigeria". Mirrored in
     * resources/js/constants/locations.ts; keep the two in step.
     */
    public const ALL = [
        'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
        'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
        'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
        'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
        'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
    ];

    /**
     * Aliases and major cities that stand in for a state in everyday writing,
     * so free-text locations ("Lekki", "Lasgidi", "Port Harcourt") still land
     * on the right filter value. Only unambiguous ones belong here.
     */
    private const HINTS = [
        'Lagos' => ['lasgidi', 'eko', 'ikeja', 'lekki', 'ajah', 'yaba', 'surulere', 'ikoyi', 'victoria island', 'ikorodu', 'badagry', 'epe', 'agege', 'festac', 'magodo', 'gbagada', 'oshodi', 'mushin', 'apapa', 'ojota', 'alimosho'],
        'FCT (Abuja)' => ['abuja', 'fct', 'gwarinpa', 'wuse', 'maitama', 'garki', 'kubwa', 'lugbe', 'asokoro', 'jabi', 'utako', 'lokogoma', 'gudu', 'nyanya', 'karu', 'durumi'],
        'Rivers' => ['port harcourt', 'portharcourt', 'phc'],
        'Benue' => ['makurdi', 'gboko', 'otukpo'],
        'Oyo' => ['ibadan', 'ogbomosho', 'bodija'],
        'Kano' => ['kano'],
        'Kaduna' => ['kaduna', 'zaria'],
        'Enugu' => ['enugu', 'nsukka'],
        'Anambra' => ['awka', 'onitsha', 'nnewi'],
        'Delta' => ['asaba', 'warri', 'sapele'],
        'Edo' => ['benin city', 'auchi'],
        'Ogun' => ['abeokuta', 'sagamu', 'ijebu', 'ota'],
        'Plateau' => ['jos'],
        'Akwa Ibom' => ['uyo', 'eket'],
        'Cross River' => ['calabar'],
        'Imo' => ['owerri'],
        'Abia' => ['aba', 'umuahia'],
        'Osun' => ['osogbo', 'ile ife', 'ife'],
        'Ondo' => ['akure', 'ondo town'],
        'Kwara' => ['ilorin'],
        'Borno' => ['maiduguri'],
        'Nasarawa' => ['lafia', 'keffi', 'mararaba'],
        'Niger' => ['minna', 'suleja'],
    ];

    /**
     * The state a free-text location refers to, or null when nothing matches.
     *
     * Listings were captured with a single free-text location field, so the
     * state column they could have filtered on is empty. This recovers it
     * where the text is unambiguous and leaves the rest alone rather than
     * guessing.
     */
    public static function detect(?string $text): ?string
    {
        $haystack = strtolower(trim((string) $text));

        if ($haystack === '') {
            return null;
        }

        // An explicit state name always wins over a city hint.
        foreach (self::ALL as $state) {
            $needle = strtolower($state === 'FCT (Abuja)' ? 'fct' : $state);

            if (preg_match('/\\b'.preg_quote($needle, '/').'\\b/', $haystack)) {
                return $state;
            }
        }

        foreach (self::HINTS as $state => $hints) {
            foreach ($hints as $hint) {
                if (preg_match('/\\b'.preg_quote($hint, '/').'\\b/', $haystack)) {
                    return $state;
                }
            }
        }

        return null;
    }
}
