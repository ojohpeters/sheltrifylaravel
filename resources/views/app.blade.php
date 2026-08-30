<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="description" content="ShelTrify — Nigeria's trusted marketplace for property, homes, shortlets, land, building materials, tipper drivers, and local services. Buy, rent, invest, and connect with verified professionals.">
    <meta name="keywords" content="ShelTrify, Nigeria real estate, property listing, rent in Nigeria, buy land Nigeria, shortlet apartment, building materials, tipper driver, local artisans, property investment">
    <meta name="author" content="ShelTrify">

    {{-- Social sharing.
         og:image must be an absolute URL — scrapers do not resolve relative
         paths — and carries the file's mtime so Facebook, X, and WhatsApp
         re-fetch it after the artwork changes instead of serving a cached
         copy indefinitely. --}}
    @php
        $ogImage = url('/icons/og-image.png').'?v='.(@filemtime(public_path('icons/og-image.png')) ?: 1);
        $ogTitle = "ShelTrify — Nigeria's Property & Marketplace Platform";
        $ogDesc  = 'Find homes, shortlets, land, building materials, and trusted local services in one place. Verified listings, AI property search, and secure payments.';
    @endphp

    <link rel="canonical" href="{{ url()->current() }}">

    <meta property="og:site_name" content="ShelTrify">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="en_NG">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:title" content="{{ $ogTitle }}">
    <meta property="og:description" content="{{ $ogDesc }}">
    <meta property="og:image" content="{{ $ogImage }}">
    <meta property="og:image:secure_url" content="{{ $ogImage }}">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="ShelTrify — homes, shortlets, land and trusted local services in Nigeria">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@sheltrifyai">
    <meta name="twitter:creator" content="@sheltrifyai">
    <meta name="twitter:title" content="{{ $ogTitle }}">
    <meta name="twitter:description" content="{{ $ogDesc }}">
    <meta name="twitter:image" content="{{ $ogImage }}">
    <meta name="twitter:image:alt" content="ShelTrify — homes, shortlets, land and trusted local services in Nigeria">

    {{-- PWA / Android TWA --}}
    <link rel="manifest" href="/manifest.webmanifest">
    <meta name="theme-color" content="#00B8B8">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="ShelTrify">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" href="/icons/icon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">

    {{-- Structured data. Drives the brand panel and sitelinks search box in
         Google, and is used by some link unfurlers as a fallback.

         Built as a plain PHP block rather than with Blade's json directive:
         Blade treats the schema.org keys (context, graph, type) as directives
         when they are written with a leading at-sign, and dies with a
         ParseError. Mentioning those directive names in a Blade comment does
         the same thing, which is why this note spells them out in words.

         The Facebook page is deliberately absent from sameAs until the new URL
         replaces the old one — a stale profile in structured data is worse
         than an absent one. --}}
    @php
        $structuredData = json_encode([
            '@context' => 'https://schema.org',
            '@graph' => [
                [
                    '@type' => 'Organization',
                    '@id' => url('/') . '#organization',
                    'name' => 'ShelTrify',
                    'legalName' => config('legal.company'),
                    'url' => url('/'),
                    'logo' => url('/icons/icon-512.png'),
                    'image' => url('/icons/og-image.png'),
                    'description' => "Nigeria's marketplace for property, homes, shortlets, land, building materials, and trusted local services.",
                    'email' => config('legal.contact_email'),
                    'areaServed' => ['@type' => 'Country', 'name' => 'Nigeria'],
                    'sameAs' => [
                        'https://x.com/sheltrifyai',
                        'https://www.linkedin.com/company/sheltrify-ai/',
                        'https://m.youtube.com/@ShelTrifyAI-j3v',
                    ],
                ],
                [
                    '@type' => 'WebSite',
                    '@id' => url('/') . '#website',
                    'url' => url('/'),
                    'name' => 'ShelTrify',
                    'publisher' => ['@id' => url('/') . '#organization'],
                    'inLanguage' => 'en-NG',
                ],
            ],
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    @endphp
    <script type="application/ld+json">{!! $structuredData !!}</script>

    <title inertia>{{ config('app.name', 'ShelTrify') }}</title>
    @routes
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/css/sheltrify.css', 'resources/js/app.tsx'])
    @inertiaHead
</head>
<body class="antialiased">

{{-- Boot splash. Painted by the server before any JavaScript runs, so the
     window is branded instead of blank while the bundle downloads — the gap is
     most visible in the Android app, right after the TWA splash hands over, and
     on a slow mobile connection. Removed by app.tsx once React mounts, with a
     CSS-only fallback so a JS failure cannot leave it covering the page. --}}
<style>
    #app-boot {
        position: fixed; inset: 0; z-index: 9999;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 18px; background: #EEF2F7;
        transition: opacity .35s ease;
    }
    #app-boot.is-done { opacity: 0; pointer-events: none; }
    /* Failsafe: if the bundle never executes — blocked script, parse error, dead
       network — this retires the splash anyway. A spinner that spins forever
       reads as a hung app; whatever is underneath is more honest. */
    #app-boot { animation: boot-failsafe 1s ease 15s forwards; }
    @keyframes boot-failsafe { to { opacity: 0; visibility: hidden; pointer-events: none; } }
    @media (prefers-color-scheme: dark) { #app-boot { background: #07090F; } }
    #app-boot .mark {
        width: 68px; height: 68px; border-radius: 18px;
        background: linear-gradient(135deg, #00D4D4, #008A8A);
        display: flex; align-items: center; justify-content: center;
        animation: boot-pulse 1.6s ease-in-out infinite;
    }
    #app-boot .ring {
        width: 26px; height: 26px; border-radius: 50%;
        border: 2.5px solid rgba(0,184,184,.25); border-top-color: #00B8B8;
        animation: boot-spin .8s linear infinite;
    }
    #app-boot .word {
        font: 600 14px/1 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        letter-spacing: .14em; text-transform: uppercase; color: #8B9EC7;
    }
    @keyframes boot-spin { to { transform: rotate(360deg); } }
    @keyframes boot-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
    @media (prefers-reduced-motion: reduce) {
        #app-boot .mark, #app-boot .ring { animation: none; }
    }
</style>
<div id="app-boot" role="status" aria-live="polite" aria-label="Loading ShelTrify">
    <div class="mark">
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff"
             stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">
            <path d="M3 9.5L12 2L21 9.5V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V9.5Z" stroke-width="2"/>
            <path d="M12 18C13.1046 18 14 17.1046 14 16C14 14.8954 13.1046 14 12 14C10.8954 14 10 14.8954 10 16C10 17.1046 10.8954 18 12 18Z" stroke-width="1.6"/>
            <path d="M12 14V11" stroke-width="2"/>
        </svg>
    </div>
    <div class="ring"></div>
    <div class="word">ShelTrify</div>
</div>

@inertia
</body>
</html>
