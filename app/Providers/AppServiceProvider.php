<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // The app sits behind LiteSpeed on cPanel, which terminates TLS and
        // forwards over plain HTTP. Without this, url() generates http:// links
        // even on an HTTPS request — which breaks og:image:secure_url (Facebook
        // rejects a non-HTTPS secure_url), makes the canonical tag point at the
        // insecure origin, and downgrades every other generated URL.
        //
        // Forcing the scheme is used in preference to trusting proxy headers,
        // because it cannot be influenced by a spoofed X-Forwarded-Proto.
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }
    }
}
