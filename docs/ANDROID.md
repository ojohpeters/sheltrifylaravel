# Shipping ShelTrify to the Play Store

The Android app is a **Trusted Web Activity (TWA)** — a thin Play Store wrapper
that runs `https://sheltrify.com` in Chrome without browser UI. There is no
separate mobile codebase: whatever is deployed to the web is what the app shows,
so ordinary web deploys reach Android users instantly with no Play review.

---

## Part 1 — What is already built

| Piece | Location |
|---|---|
| Web manifest | [`public/manifest.webmanifest`](../public/manifest.webmanifest) |
| Service worker | [`public/sw.js`](../public/sw.js) — registered in [`resources/js/app.tsx`](../resources/js/app.tsx) |
| Offline fallback | [`public/offline.html`](../public/offline.html) |
| Icons + feature graphic | [`public/icons/`](../public/icons/) — sources in [`resources/brand/`](../resources/brand/) |
| PWA `<head>` tags | [`resources/views/app.blade.php`](../resources/views/app.blade.php) |
| Digital Asset Links | `/.well-known/assetlinks.json` → [`routes/web.php`](../routes/web.php) |
| Play-billing gating | [`resources/js/platform.ts`](../resources/js/platform.ts) |
| Privacy policy | `/privacy` → [`resources/views/legal/privacy.blade.php`](../resources/views/legal/privacy.blade.php) |
| Terms of service | `/terms` → [`resources/views/legal/terms.blade.php`](../resources/views/legal/terms.blade.php) |
| Account deletion | `/account-deletion` → [`AccountDeletionController`](../app/Http/Controllers/AccountDeletionController.php) |

The legal pages are plain server-rendered Blade with no Vite, no JavaScript, and
no auth — a Play reviewer must be able to read them with JS disabled.

### Regenerating brand assets

```bash
for s in 192 512; do
  rsvg-convert -w $s -h $s resources/brand/icon.svg          -o public/icons/icon-$s.png
  rsvg-convert -w $s -h $s resources/brand/icon-maskable.svg -o public/icons/maskable-$s.png
done
rsvg-convert -w 180 -h 180 resources/brand/icon.svg -o public/icons/apple-touch-icon.png
rsvg-convert -w 512 -h 512 resources/brand/icon.svg -o public/icons/play-store-512.png
rsvg-convert -w 1024 -h 500 -b '#07090F' resources/brand/feature-graphic.svg -o public/icons/play-feature-graphic.png
magick public/icons/play-feature-graphic.png -background '#07090F' -alpha remove -alpha off public/icons/play-feature-graphic.png
```

---

## Part 2 — Google Play billing

Google requires **Play Billing** for digital goods, taking 15–30%. Real-world
goods and services are exempt. That splits ShelTrify's payments in two:

| Flow | Play Billing? | In the app |
|---|---|---|
| Marketplace cart checkout | Exempt — physical goods | **Works**, Paystack |
| Wallet withdrawal | Exempt — cash-out, not a purchase | **Works**, Paystack |
| Listing boost | Exempt — spends pre-owned SWC on real-world promotion | **Works** |
| Wallet top-up (buys SWC) | Required — digital currency | **Hidden** |
| Premium tier | Required — digital content | **Hidden** |
| Chat upgrade | Required — digital content | **Hidden** |

`digitalPurchasesAllowed()` in [`platform.ts`](../resources/js/platform.ts) is the
single switch. It returns `false` only inside the TWA — detected via the
`android-app://` referrer Chrome sets on the launch navigation, memoised in
`sessionStorage` because later reloads do not carry it.

It deliberately returns `true` for a **browser-installed PWA**: only Play Store
distribution is subject to the billing policy, so an install from Chrome keeps
the full payment flow.

To preview the app-mode UI in a desktop browser, append `?source=twa` to any URL.

### Why listing boost stays enabled

Play Billing attaches at the point of **purchase**. Boost does not buy anything
new — it spends SWC the user already owns, on promotion of a real-world property
listing. Since SWC cannot be bought inside the app at all, no purchase occurs
there to bill. If you want zero risk, gate it the same way as the others:

```tsx
// WalletPage.tsx — wrap the "Boost a Listing" button and BoostListingModal
{digitalPurchasesAllowed() && ( ... )}
```

### Why the chat paywall is lifted in the app

The chat upgrade cannot be sold in the Play build, so leaving the 10-message
paywall in place would strand users at a wall with no way past it — which reads
as a broken app to a reviewer, and earns nothing either way. In the Play build
the limit is not enforced and the Upgrade button is hidden.

To restore the paywall and accept the dead end, set
`LIFT_CHAT_PAYWALL_IN_APP = false` in [`platform.ts`](../resources/js/platform.ts).

### Anti-steering

The hidden flows say only that a feature is unavailable in the app. They do
**not** point users to an external purchase path, which Google has historically
restricted. Keep that wording unless you have checked the current policy for
your distribution regions.

---

## Part 3 — Before you touch Play Console

- [ ] Set the `LEGAL_*` variables in the production `.env` (see `.env.production.example`)
- [ ] Create the mailboxes they name — `privacy@`, `support@`. **A bouncing
      privacy contact is a rejection.**
- [ ] Confirm the registered company name and business address are accurate
- [ ] `npm run build`, commit `public/build`, deploy
- [ ] Verify live: `/privacy`, `/terms`, `/account-deletion` all load over HTTPS
- [ ] Submit the deletion form once on production and confirm the email arrives

---

## Part 4 — Building the Android app

### 1. Deploy the web app first

Digital Asset Links verification fetches over HTTPS from the live domain, so the
site must be deployed before the app can be built. Remember `public/build` is
committed — run `npm run build`, commit it, and push to trigger `.cpanel.yml`.

### 2. Generate the Android project

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://sheltrify.com/manifest.webmanifest
```

Answer the prompts with:

| Prompt | Value |
|---|---|
| Package name | `com.sheltrify.app` (must match `TWA_PACKAGE_NAME`) |
| Display mode | `standalone` |
| Status bar colour | `#00B8B8` |
| Splash colour | `#07090F` |

Bubblewrap generates a signing keystore. **Back it up somewhere durable and
record the passwords.** Losing it means never being able to update the listing
under the same package name again — there is no recovery.

### 3. Publish the signing fingerprints

```bash
keytool -list -v -keystore android.keystore -alias android | grep 'SHA256:'
```

Put the value in the production `.env`:

```
TWA_PACKAGE_NAME=com.sheltrify.app
TWA_SHA256_FINGERPRINTS=AB:CD:...
```

After the first Play upload, add the **Play App Signing** fingerprint too
(Play Console → Release → Setup → App signing), comma-separated:

```
TWA_SHA256_FINGERPRINTS=<upload-key-sha256>,<play-signing-sha256>
```

> Both are required. Google re-signs your upload with its own key, so an app
> that verified fine in local testing will still show the URL bar in the
> Play-distributed build if only the upload fingerprint is listed.

Deploy, then confirm it serves:

```bash
curl -s https://sheltrify.com/.well-known/assetlinks.json | jq
```

### 4. Build the bundle

```bash
bubblewrap build          # produces app-release-bundle.aab
```

---

## Part 5 — Play Console

### 1. Create the account

<https://play.google.com/console> — **$25 one-time**. Choose a *personal* or
*organisation* account. Organisation needs a D-U-N-S number and takes longer, but
personal accounts carry the 12-tester requirement in step 6.

Identity verification takes anywhere from a day to two weeks. Start it early.

### 2. Create the app

**All apps → Create app.** App name `ShelTrify`, English (United Kingdom or
United States), **App**, **Free**.

### 3. Store listing

| Field | Source |
|---|---|
| App icon (512×512) | `public/icons/play-store-512.png` |
| Feature graphic (1024×500) | `public/icons/play-feature-graphic.png` |
| Phone screenshots (min 2, 16:9 or 9:16) | Capture from a device or emulator — see below |
| Short description (80 chars) | *Find homes, shortlets, land, materials and trusted artisans in Nigeria.* |
| Full description (4000 chars) | Expand on listings, marketplace, verified professionals, wallet |

Screenshots have to come from a real render. Install the AAB on a device or run
an emulator, then:

```bash
adb shell screencap -p /sdcard/s1.png && adb pull /sdcard/s1.png
```

Capture at least: the landing page, a property listing, the marketplace, and the
AI chat.

### 4. Data safety form

This is the section most likely to trip you up, because ShelTrify collects
**government ID, national ID (NIN), and verification selfies**. Declare honestly
— mismatches between this form and the privacy policy are a common rejection.

| Data type | Collected | Shared | Purpose |
|---|---|---|---|
| Name, email, phone | Yes | No | Account management, app functionality |
| Government ID / national ID (NIN) | Yes | No | Fraud prevention, identity verification |
| Photos and videos | Yes | No | App functionality (listings, Feels) |
| Approximate location | Yes | No | App functionality (service areas) |
| Payment info | Yes | Yes — Paystack | Purchases, payouts |
| Messages | Yes | Yes — Google (AI replies) | App functionality |
| App interactions / crash logs | Yes | No | Analytics |

Also declare:

- Data is **encrypted in transit** — yes
- Users **can request deletion** — yes, URL: `https://sheltrify.com/account-deletion`
- Privacy policy URL: `https://sheltrify.com/privacy`

### 5. The remaining declarations

- **Content rating** — complete the questionnaire. ShelTrify has user-generated
  content and user-to-user messaging; say so.
- **Target audience** — 18+. Do not tick any child age band.
- **Ads** — declare whether the app shows ads (currently no).
- **App access** — the reviewer needs a working login. Create a demo account and
  put the credentials in *App access → All functionality restricted*. **Reviews
  fail here constantly** because the reviewer cannot get past sign-up.
- **Government apps / financial features** — ShelTrify handles payments; if asked,
  declare it is not a regulated financial institution but facilitates payments
  through a licensed processor (Paystack).

### 6. Closed testing (new personal accounts only)

Personal developer accounts created after November 2023 must run a closed test
with **12+ testers opted in continuously for 14 days** before production access
unlocks. Organisation accounts skip this.

Start this the moment the app builds — it is a two-week wall clock, not work.

### 7. Production release

**Production → Create new release** → upload `app-release-bundle.aab` → write
release notes → **Send for review**. First review typically takes a few days and
can stretch to a week or more.

### 8. After it goes live — verify the URL bar is gone

Install from the Play listing. If a browser address bar is visible, asset link
verification failed. Re-check step 3 in Part 4, and remember Chrome caches the
result — uninstall and reinstall after fixing.

---

## Part 6 — Shipping updates afterwards

For anything that is web code — React, Blade, styling, API, business logic:

```bash
npm run build && git add public/build && git commit && git push
```

That is the whole release. No Play review, no version bump, live immediately.

You only need a new AAB when the **native wrapper** changes: the package name,
app name, icons, splash colours, or the Bubblewrap/`targetSdk` version. Google
raises the minimum `targetSdk` roughly annually, so expect one forced rebuild a
year:

```bash
bubblewrap update && bubblewrap build
```
