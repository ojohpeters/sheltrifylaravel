<?php

use App\Http\Controllers\Api\AdminApiController;
use App\Http\Controllers\Api\AiApiController;
use App\Http\Controllers\Api\AuthApiController;
use App\Http\Controllers\Api\CartApiController;
use App\Http\Controllers\Api\CommunityApiController;
use App\Http\Controllers\Api\ContactApiController;
use App\Http\Controllers\Api\DashboardApiController;
use App\Http\Controllers\Api\FavoriteApiController;
use App\Http\Controllers\Api\FeelsApiController;
use App\Http\Controllers\Api\GlobalTalesApiController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\InvestmentApiController;
use App\Http\Controllers\Api\LargeTransactionApiController;
use App\Http\Controllers\Api\ListingApiController;
use App\Http\Controllers\Api\MarketplaceApiController;
use App\Http\Controllers\Api\NotificationApiController;
use App\Http\Controllers\Api\PaymentApiController;
use App\Http\Controllers\Api\RentalWahalaApiController;
use App\Http\Controllers\Api\UploadApiController;
use App\Http\Controllers\Api\UserApiController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);

Route::post('/auth/signup', [AuthApiController::class, 'signup'])->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class]);
Route::post('/auth/login', [AuthApiController::class, 'login']);
Route::post('/auth/forgot-password', [AuthApiController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthApiController::class, 'resetPassword']);

Route::get('/listings', [ListingApiController::class, 'index']);
Route::get('/listings/user/my-listings', [ListingApiController::class, 'myListings'])->middleware('auth');
Route::get('/listings/{id}', [ListingApiController::class, 'show'])->where('id', '[0-9]+');

Route::get('/marketplace', [MarketplaceApiController::class, 'index']);
Route::get('/marketplace/category/{category}', [MarketplaceApiController::class, 'byCategory']);
Route::get('/marketplace/my-products', [MarketplaceApiController::class, 'myProducts'])->middleware('auth');
Route::get('/marketplace/tipper-drivers', [MarketplaceApiController::class, 'tipperDrivers']);
Route::post('/marketplace/subscribe', [MarketplaceApiController::class, 'subscribe']);

Route::get('/community/posts', [CommunityApiController::class, 'postsIndex']);
Route::get('/community/posts/{id}', [CommunityApiController::class, 'postShow'])->where('id', '[0-9]+');

Route::get('/feels', [FeelsApiController::class, 'index']);
Route::get('/feels/{id}/comments', [FeelsApiController::class, 'commentsIndex'])->where('id', '[0-9]+');

Route::get('/rental-wahala', [RentalWahalaApiController::class, 'index'])->middleware('auth');

Route::get('/global-tales', [GlobalTalesApiController::class, 'index']);
Route::get('/global-tales/{id}', [GlobalTalesApiController::class, 'show'])->where('id', '[0-9]+');

Route::get('/investments/opportunities', [InvestmentApiController::class, 'opportunities']);
Route::get('/investments/opportunities/{id}', [InvestmentApiController::class, 'opportunityShow'])->where('id', '[0-9]+');

Route::get('/payments/verify/{reference}', [PaymentApiController::class, 'verify']);
Route::get('/payments/banks', [PaymentApiController::class, 'banks']);

Route::get('/ai/site-data', [AiApiController::class, 'siteData']);
Route::get('/ai/search-listings', [AiApiController::class, 'searchListings']);

// Gemini proxy — key stays server-side, never reaches the browser bundle
Route::post('/ai/chat', [App\Http\Controllers\Api\AiProxyController::class, 'chat']);
Route::post('/ai/insights', [App\Http\Controllers\Api\AiProxyController::class, 'insights']);
Route::post('/ai/recommendations', [App\Http\Controllers\Api\AiProxyController::class, 'recommendations']);

Route::post('/contact', ContactApiController::class);

// Upload routes (no auth required - used during registration)
Route::post('/upload/image', [UploadApiController::class, 'image'])->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class]);
Route::post('/upload/video', [UploadApiController::class, 'video'])->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class]);
Route::post('/upload/media', [UploadApiController::class, 'media'])->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class]);

Route::middleware('auth')->group(function () {
    Route::post('/auth/logout', [AuthApiController::class, 'logout']);
    Route::get('/auth/me', [AuthApiController::class, 'me']);

    Route::post('/listings', [ListingApiController::class, 'store']);
    Route::put('/listings/{id}', [ListingApiController::class, 'update'])->where('id', '[0-9]+');
    Route::delete('/listings/{id}', [ListingApiController::class, 'destroy'])->where('id', '[0-9]+');
    Route::post('/listings/{id}/boost', [ListingApiController::class, 'boost'])->where('id', '[0-9]+');

    Route::get('/favorites', [FavoriteApiController::class, 'index']);
    Route::post('/favorites/{listingId}', [FavoriteApiController::class, 'store'])->where('listingId', '[0-9]+');
    Route::delete('/favorites/{listingId}', [FavoriteApiController::class, 'destroy'])->where('listingId', '[0-9]+');

    Route::get('/users/profile', [UserApiController::class, 'profile']);
    Route::put('/users/profile', [UserApiController::class, 'updateProfile']);
    Route::post('/users/upgrade-premium', [UserApiController::class, 'upgradePremium']);
    Route::post('/users/upgrade-chat', [UserApiController::class, 'upgradeChat']);
    Route::post('/users/submit-verification', [UserApiController::class, 'submitVerification']);
    Route::post('/users/professional-profile', [UserApiController::class, 'submitProfessionalProfile']);
    Route::get('/users/professional-profile', [UserApiController::class, 'getProfessionalProfile']);

    Route::get('/cart', [CartApiController::class, 'index']);
    Route::delete('/cart', [CartApiController::class, 'clear']);
    Route::post('/cart/{productId}', [CartApiController::class, 'store'])->where('productId', '[0-9]+');
    Route::put('/cart/{productId}', [CartApiController::class, 'update'])->where('productId', '[0-9]+');
    Route::delete('/cart/{productId}', [CartApiController::class, 'destroyItem'])->where('productId', '[0-9]+');

    Route::post('/marketplace', [MarketplaceApiController::class, 'store']);
    Route::put('/marketplace/{id}', [MarketplaceApiController::class, 'update'])->where('id', '[0-9]+');
    Route::delete('/marketplace/{id}', [MarketplaceApiController::class, 'destroy'])->where('id', '[0-9]+');

    Route::post('/community/posts', [CommunityApiController::class, 'postStore']);
    Route::post('/community/posts/{id}/like', [CommunityApiController::class, 'like'])->where('id', '[0-9]+');
    Route::post('/community/posts/{id}/love', [CommunityApiController::class, 'love'])->where('id', '[0-9]+');
    Route::post('/community/posts/{id}/comments', [CommunityApiController::class, 'comment'])->where('id', '[0-9]+');
    Route::delete('/community/posts/{id}', [CommunityApiController::class, 'postDestroy'])->where('id', '[0-9]+');

    Route::get('/dashboard/stats', [DashboardApiController::class, 'stats']);
    Route::get('/dashboard/earnings', [DashboardApiController::class, 'earnings']);

    Route::post('/feels', [FeelsApiController::class, 'store']);
    Route::put('/feels/{id}', [FeelsApiController::class, 'update'])->where('id', '[0-9]+');
    Route::delete('/feels/{id}', [FeelsApiController::class, 'destroy'])->where('id', '[0-9]+');
    Route::post('/feels/{id}/like', [FeelsApiController::class, 'like'])->where('id', '[0-9]+');
    Route::post('/feels/{id}/comments', [FeelsApiController::class, 'commentsStore'])->where('id', '[0-9]+');

    Route::post('/rental-wahala', [RentalWahalaApiController::class, 'store']);
    Route::put('/rental-wahala/{id}', [RentalWahalaApiController::class, 'update'])->where('id', '[0-9]+');
    Route::delete('/rental-wahala/{id}', [RentalWahalaApiController::class, 'destroy'])->where('id', '[0-9]+');
    Route::post('/rental-wahala/{id}/like', [RentalWahalaApiController::class, 'like'])->where('id', '[0-9]+');

    Route::post('/global-tales', [GlobalTalesApiController::class, 'store']);
    Route::put('/global-tales/{id}', [GlobalTalesApiController::class, 'update'])->where('id', '[0-9]+');
    Route::delete('/global-tales/{id}', [GlobalTalesApiController::class, 'destroy'])->where('id', '[0-9]+');

    Route::post('/investments/invest', [InvestmentApiController::class, 'invest']);
    Route::get('/investments/my-investments', [InvestmentApiController::class, 'myInvestments']);
    Route::get('/investments/stats', [InvestmentApiController::class, 'stats']);

    Route::post('/payments/initialize', [PaymentApiController::class, 'initialize']);
    Route::post('/payments/withdraw', [PaymentApiController::class, 'withdraw']);

    Route::post('/large-transactions', [LargeTransactionApiController::class, 'store']);
    Route::get('/large-transactions/my-requests', [LargeTransactionApiController::class, 'myRequests']);

    // AI Chat (conversational, DB-aware)
    Route::post('/ai/chat', [AiApiController::class, 'chat']);
    Route::get('/ai/conversations', [AiApiController::class, 'conversations']);
    Route::get('/ai/conversations/{id}', [AiApiController::class, 'conversationShow'])->where('id', '[0-9]+');
    Route::delete('/ai/conversations/{id}', [AiApiController::class, 'conversationDestroy'])->where('id', '[0-9]+');

    // Notifications
    Route::get('/notifications', [NotificationApiController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationApiController::class, 'unreadCount']);
    Route::put('/notifications/{id}/read', [NotificationApiController::class, 'markRead'])->where('id', '[0-9]+');
    Route::put('/notifications/read-all', [NotificationApiController::class, 'markAllRead']);
    Route::delete('/notifications/{id}', [NotificationApiController::class, 'destroy'])->where('id', '[0-9]+');

    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/users', [AdminApiController::class, 'usersIndex']);
        Route::get('/users/{id}', [AdminApiController::class, 'userShow'])->where('id', '[0-9]+');
        Route::put('/users/{id}', [AdminApiController::class, 'userUpdate'])->where('id', '[0-9]+');
        Route::delete('/users/{id}', [AdminApiController::class, 'userDestroy'])->where('id', '[0-9]+');

        Route::get('/listings', [AdminApiController::class, 'listingsIndex']);
        Route::get('/listings/{id}', [AdminApiController::class, 'listingShow'])->where('id', '[0-9]+');
        Route::put('/listings/{id}', [AdminApiController::class, 'listingUpdate'])->where('id', '[0-9]+');
        Route::delete('/listings/{id}', [AdminApiController::class, 'listingDestroy'])->where('id', '[0-9]+');

        Route::get('/stats', [AdminApiController::class, 'stats']);
        Route::put('/marketplace/{id}/approve', [AdminApiController::class, 'approveProduct'])->where('id', '[0-9]+');
        Route::put('/marketplace/{id}/reject', [AdminApiController::class, 'rejectProduct'])->where('id', '[0-9]+');
        Route::get('/marketplace/pending', [AdminApiController::class, 'pendingProducts']);
        Route::get('/marketplace', [AdminApiController::class, 'allMarketplaceProducts']);
        Route::get('/appointments', [AdminApiController::class, 'allAppointments']);
        Route::put('/appointments/{id}', [AdminApiController::class, 'updateAppointment'])->where('id', '[0-9]+');

        Route::get('/feels', [AdminApiController::class, 'allFeelsVideos']);
        Route::put('/feels/{id}/toggle', [AdminApiController::class, 'toggleFeelsVideo'])->where('id', '[0-9]+');
        Route::delete('/feels/{id}', [AdminApiController::class, 'deleteFeelsVideo'])->where('id', '[0-9]+');

        Route::get('/rental-wahala', [AdminApiController::class, 'allRentalWahalaVideos']);
        Route::put('/rental-wahala/{id}/toggle', [AdminApiController::class, 'toggleRentalWahalaVideo'])->where('id', '[0-9]+');
        Route::delete('/rental-wahala/{id}', [AdminApiController::class, 'deleteRentalWahalaVideo'])->where('id', '[0-9]+');
        Route::get('/verifications/pending', [AdminApiController::class, 'pendingVerifications']);
        Route::put('/verifications/{id}/approve', [AdminApiController::class, 'approveVerification'])->where('id', '[0-9]+');
        Route::put('/verifications/{id}/reject', [AdminApiController::class, 'rejectVerification'])->where('id', '[0-9]+');
        Route::get('/professional-profiles/pending', [AdminApiController::class, 'pendingProfessionalProfiles']);
        Route::put('/professional-profiles/{id}/approve', [AdminApiController::class, 'approveProfessionalProfile'])->where('id', '[0-9]+');
        Route::put('/professional-profiles/{id}/reject', [AdminApiController::class, 'rejectProfessionalProfile'])->where('id', '[0-9]+');
        Route::get('/analytics', [AdminApiController::class, 'analytics']);
        Route::get('/system-health', [AdminApiController::class, 'systemHealth']);
        Route::get('/transactions', [AdminApiController::class, 'transactions']);
        Route::get('/content', [AdminApiController::class, 'content']);
        Route::get('/ai/stats', [AdminApiController::class, 'aiStats']);
        Route::post('/bulk-action', [AdminApiController::class, 'bulkAction']);
    });
});
