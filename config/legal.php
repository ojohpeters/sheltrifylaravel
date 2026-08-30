<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Legal entity + contact details
    |--------------------------------------------------------------------------
    |
    | Surfaced on the public privacy policy, terms, and account-deletion pages.
    | Google Play requires a reachable privacy policy URL and a working data
    | deletion request channel, and will reject a listing whose contact address
    | bounces — so these must resolve to mailboxes somebody actually reads.
    |
    */

    'company' => env('LEGAL_COMPANY_NAME', 'Sheltrify Company Limited'),

    'contact_email' => env('LEGAL_CONTACT_EMAIL', 'support@sheltrify.com'),
    'privacy_email' => env('LEGAL_PRIVACY_EMAIL', 'privacy@sheltrify.com'),

    // Play Console requires a registered business address on the listing.
    'address' => env('LEGAL_ADDRESS', 'Lagos, Nigeria'),

    // Where account-deletion requests are delivered.
    'admin_email' => env('LEGAL_ADMIN_EMAIL', env('MAIL_FROM_ADDRESS', 'support@sheltrify.com')),

    'effective_date' => env('LEGAL_EFFECTIVE_DATE', '30 August 2026'),

];
