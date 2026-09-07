<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Referral rewards
    |--------------------------------------------------------------------------
    |
    | Paid in SWC when someone completes signup through an invite link. SWC is
    | pegged 1:1 to the naira on top-up, so these are real money — confirm the
    | amounts with the business before launch rather than shipping the
    | defaults.
    |
    | Set either to 0 to disable that side of the reward.
    |
    */

    'referrer_reward' => (float) env('REFERRAL_REFERRER_REWARD', 100),

    'invitee_bonus' => (float) env('REFERRAL_INVITEE_BONUS', 50),

];
