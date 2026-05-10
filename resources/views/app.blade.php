<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="description" content="ShelTrify — Nigeria's trusted marketplace for property, homes, shortlets, land, building materials, tipper drivers, and local services. Buy, rent, invest, and connect with verified professionals.">
    <meta name="keywords" content="ShelTrify, Nigeria real estate, property listing, rent in Nigeria, buy land Nigeria, shortlet apartment, building materials, tipper driver, local artisans, property investment">
    <meta name="author" content="ShelTrify">
    <meta property="og:title" content="ShelTrify — Nigeria's Property &amp; Marketplace Platform">
    <meta property="og:description" content="Find homes, shortlets, land, building materials, and trusted local services all in one place. List your property or products and reach thousands of buyers.">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="ShelTrify">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="ShelTrify — Nigeria's Property &amp; Marketplace Platform">
    <meta name="twitter:description" content="Find homes, shortlets, land, building materials, and trusted local services all in one place.">
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
