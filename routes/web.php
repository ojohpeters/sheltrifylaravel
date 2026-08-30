<?php

use App\Http\Controllers\AccountDeletionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::prefix('api')->group(base_path('routes/api_web.php'));

// Digital Asset Links — proves this domain and the Play Store app belong to the
// same owner. Without a passing statement here Chrome shows the URL bar inside
// the TWA. Served from a route (not a static dotfile) so the content type is
// guaranteed and the fingerprints stay env-configurable per environment.
Route::get('/.well-known/assetlinks.json', function () {
    $fingerprints = config('twa.fingerprints');

    if (empty($fingerprints)) {
        return response()->json(
            ['error' => 'TWA_SHA256_FINGERPRINTS is not set. See config/twa.php.'],
            404
        );
    }

    return response()->json([[
        'relation' => ['delegate_permission/common.handle_all_urls'],
        'target' => [
            'namespace' => 'android_app',
            'package_name' => config('twa.package'),
            'sha256_cert_fingerprints' => $fingerprints,
        ],
    ]]);
})->name('assetlinks');

$shell = fn (string $view) => Inertia::render('Shell', ['view' => $view]);

Route::get('/', fn () => $shell('landing'))->name('home');
Route::get('/chat', fn () => $shell('chat'))->name('chat');
Route::get('/community', fn () => $shell('community'))->name('community');
Route::get('/wallet', fn () => $shell('wallet'))->name('wallet');
Route::get('/marketplace', fn () => $shell('marketplace'))->name('marketplace');
Route::get('/feels', fn () => $shell('feels'))->name('feels');
Route::get('/rental-wahala', fn () => $shell('rentalWahala'))->name('rental-wahala');
Route::get('/cart', fn () => $shell('cart'))->name('cart');
Route::get('/global-tales', fn () => $shell('globalTales'))->name('global-tales');
Route::get('/about', fn () => $shell('about'))->name('about');
Route::get('/contact', fn () => $shell('contact'))->name('contact');
Route::get('/premium', fn () => $shell('premium'))->name('premium');
Route::get('/admin-dashboard', fn () => $shell('adminDashboard'))->name('admin-dashboard');
Route::get('/user-dashboard', fn () => $shell('userDashboard'))->name('user-dashboard');
Route::get('/profile', fn () => $shell('profile'))->name('profile');
Route::get('/payments/verify', fn () => $shell('paymentVerify'))->name('payments.verify');
Route::get('/listing-dashboard', fn () => $shell('listingDashboard'))->name('listing-dashboard');
Route::get('/professional-profile', fn () => $shell('professionalProfile'))->name('professional-profile');
Route::get('/notifications', fn () => $shell('notifications'))->name('notifications');
Route::get('/product', fn () => $shell('productDetail'))->name('product');

// Referral entry point. Someone opening a shared link lands on the site with
// the code in the query string, where the SPA stashes it until they finish
// signing up. Redirect (not a render) so the code survives client-side routing.
Route::get('/join/{code}', function (string $code) {
    return redirect('/?ref=' . urlencode($code));
})->where('code', '[A-Za-z0-9]{4,32}')->name('join');

/*
| Legal pages — plain Blade, no Inertia, no auth.
|
| Google Play will not accept the listing without a publicly reachable privacy
| policy, and requires apps with account creation to publish an account
| deletion route usable WITHOUT installing the app. Both are rendered server
| side so a reviewer or crawler sees content with JavaScript disabled.
*/
Route::view('/privacy', 'legal.privacy')->name('privacy');
Route::view('/terms', 'legal.terms')->name('terms');

Route::get('/account-deletion', [AccountDeletionController::class, 'show'])->name('account-deletion');
Route::post('/account-deletion', [AccountDeletionController::class, 'submit'])
    ->middleware('throttle:5,60')
    ->name('account-deletion.submit');
