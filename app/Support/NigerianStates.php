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
}
