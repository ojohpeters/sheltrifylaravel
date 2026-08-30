<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#00B8B8">
    <meta name="description" content="@yield('description')">
    <title>@yield('title') — ShelTrify</title>
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" href="/icons/icon.svg" type="image/svg+xml">
    {{-- Deliberately self-contained: no Vite, no JS. Google Play's reviewers
         and crawlers must be able to read this page even if the SPA bundle
         fails to load, and it must never sit behind authentication. --}}
    <style>
        :root {
            --bg:#EEF2F7; --card:#FFF; --text:#1A2040; --muted:#5A6B8C;
            --border:#D8E0EC; --brand:#00B8B8; --brand-dark:#008A8A; --warn-bg:#FFF7E6; --warn-br:#F0C36D;
        }
        @media (prefers-color-scheme: dark) {
            :root {
                --bg:#07090F; --card:#0C1018; --text:#E2E8F0; --muted:#8B9EC7;
                --border:#1B2440; --warn-bg:#241C08; --warn-br:#6B5424;
            }
        }
        *{box-sizing:border-box}
        body{margin:0;background:var(--bg);color:var(--text);line-height:1.7;
             font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:16px}
        header{background:var(--brand);padding:28px 24px}
        header a{display:flex;align-items:center;gap:12px;max-width:800px;margin:0 auto;
                 color:#fff;text-decoration:none;font-weight:700;font-size:1.25rem}
        header img{width:34px;height:34px}
        main{max-width:800px;margin:0 auto;padding:40px 24px 80px}
        .card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:32px 28px}
        h1{font-size:1.9rem;margin:0 0 6px;line-height:1.25}
        .eyebrow{color:var(--muted);font-size:.9rem;margin:0 0 28px}
        h2{font-size:1.2rem;margin:36px 0 10px;padding-top:20px;border-top:1px solid var(--border)}
        h2:first-of-type{border-top:0;padding-top:0;margin-top:28px}
        h3{font-size:1rem;margin:22px 0 6px}
        p,li{color:var(--text)}
        ul{padding-left:20px}li{margin:7px 0}
        a{color:var(--brand-dark)}
        @media (prefers-color-scheme:dark){a{color:#33CCCC}}
        table{width:100%;border-collapse:collapse;margin:16px 0;font-size:.92rem;display:block;overflow-x:auto}
        th,td{border:1px solid var(--border);padding:10px 12px;text-align:left;vertical-align:top}
        th{background:var(--bg);font-weight:600}
        .note{background:var(--warn-bg);border:1px solid var(--warn-br);border-radius:10px;padding:14px 16px;margin:20px 0;font-size:.94rem}
        .contact{background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:16px 18px;margin-top:14px}
        footer{max-width:800px;margin:0 auto;padding:0 24px 48px;color:var(--muted);font-size:.85rem}
        footer a{margin-right:16px}
    </style>
</head>
<body>
<header>
    <a href="/"><img src="/icons/icon.svg" alt="">ShelTrify</a>
</header>
<main>
    <div class="card">
        <h1>@yield('title')</h1>
        <p class="eyebrow">Effective {{ config('legal.effective_date') }} &middot; {{ config('legal.company') }}</p>
        @yield('body')
    </div>
</main>
<footer>
    <a href="/privacy">Privacy Policy</a>
    <a href="/terms">Terms of Service</a>
    <a href="/account-deletion">Delete Account</a>
    <a href="/">Back to ShelTrify</a>
</footer>
</body>
</html>
