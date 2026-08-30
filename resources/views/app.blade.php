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
@inertia
</body>
</html>
