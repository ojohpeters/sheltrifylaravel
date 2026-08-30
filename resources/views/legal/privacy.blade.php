@extends('legal.layout')
@section('title', 'Privacy Policy')
@section('description', 'How ShelTrify collects, uses, shares, and protects your personal data.')

@section('body')
<p>This policy explains what {{ config('legal.company') }} (&ldquo;ShelTrify&rdquo;, &ldquo;we&rdquo;) collects
when you use our website and Android app, why we collect it, who we share it with, and the control you
have over it. It applies to every ShelTrify service.</p>

<p>We process personal data under the <strong>Nigeria Data Protection Act 2023 (NDPA)</strong> and are
accountable to the Nigeria Data Protection Commission (NDPC).</p>

<div class="note">
    <strong>The short version.</strong> We collect what we need to run a marketplace where people can
    trust each other: your account details, and — only if you apply to be verified or to list property —
    identity documents. We never sell your data. Your AI chat messages are processed by Google to
    generate replies. You can delete your account at any time.
</div>

<h2>1. Data we collect</h2>

<table>
    <tr><th>Category</th><th>What it includes</th><th>When</th></tr>
    <tr>
        <td><strong>Account</strong></td>
        <td>Full name, email address, phone number, WhatsApp number, password (stored only as a bcrypt hash), profile photo, bio, referral code</td>
        <td>On sign-up</td>
    </tr>
    <tr>
        <td><strong>Identity verification</strong></td>
        <td>National Identification Number (NIN), photographs of a government-issued ID, a verification selfie, and — for professionals — a licence or certification document</td>
        <td>Only if you request verification, professional status, or permission to list property</td>
    </tr>
    <tr>
        <td><strong>Transactions</strong></td>
        <td>SWC wallet balance and history, deposits, withdrawals, bank account details for payouts, purchases, premium status</td>
        <td>When you transact</td>
    </tr>
    <tr>
        <td><strong>Content you publish</strong></td>
        <td>Listings, marketplace products, photographs and videos (including Feels), community and Global Tales posts, comments, reviews, service area and location shown on your profile</td>
        <td>When you post</td>
    </tr>
    <tr>
        <td><strong>Messages</strong></td>
        <td>Messages to our AI assistant, and messages exchanged with other users through the platform</td>
        <td>When you send them</td>
    </tr>
    <tr>
        <td><strong>Technical</strong></td>
        <td>IP address, device and browser type, session cookies, last-seen timestamp, pages viewed</td>
        <td>Automatically</td>
    </tr>
</table>

<div class="note">
    <strong>Sensitive documents.</strong> Your NIN, ID images, and verification selfie are used
    <em>only</em> to confirm you are who you say you are, and are visible only to authorised ShelTrify
    staff reviewing your application. They are never shown on your public profile, never shared with
    other users, and never used for advertising.
</div>

<h2>2. Why we use it</h2>
<ul>
    <li><strong>To run your account</strong> — authentication, your dashboard, wallet, and preferences.</li>
    <li><strong>To keep the marketplace trustworthy</strong> — verifying identity, approving listings, detecting fraud, and investigating abuse. Property and money attract bad actors; verification is how we reduce that risk for everyone.</li>
    <li><strong>To process payments</strong> — deposits, withdrawals, purchases, and premium access.</li>
    <li><strong>To provide AI assistance</strong> — answering your property questions.</li>
    <li><strong>To notify you</strong> — transactions, listing status, messages, and (only with consent) product updates.</li>
    <li><strong>To meet legal obligations</strong> — record-keeping, and responding to lawful requests.</li>
</ul>
<p>We do <strong>not</strong> sell your personal data, and we do not use your identity documents or
private messages for advertising.</p>

<h2>3. Who we share it with</h2>
<table>
    <tr><th>Recipient</th><th>What they receive</th><th>Why</th></tr>
    <tr><td><strong>Paystack</strong></td><td>Name, email, amount, payment or bank details</td><td>To process payments and payouts. Card details go directly to Paystack and never touch our servers.</td></tr>
    <tr><td><strong>Google (Gemini API)</strong></td><td>The content of your messages to the AI assistant</td><td>To generate replies. Do not put sensitive personal details into AI chat.</td></tr>
    <tr><td><strong>Our hosting provider</strong></td><td>All data, stored at rest</td><td>To operate the service.</td></tr>
    <tr><td><strong>Other users</strong></td><td>Only your public profile and what you choose to publish</td><td>So buyers, renters, and clients can find and contact you.</td></tr>
    <tr><td><strong>Authorities</strong></td><td>Only what is legally required</td><td>To comply with valid legal process.</td></tr>
</table>
<p>Some of these providers process data outside Nigeria. Where that happens we rely on the transfer
conditions permitted under the NDPA.</p>

<h2>4. How long we keep it</h2>
<ul>
    <li><strong>Account data</strong> — while your account is open.</li>
    <li><strong>Identity documents</strong> — retained while your verification is active, then deleted. Rejected applications are deleted within 90 days.</li>
    <li><strong>Transaction records</strong> — kept for up to 7 years after the transaction, as financial record-keeping law requires. This is why some records survive account deletion.</li>
    <li><strong>Content you published</strong> — removed when you delete it or close your account, though copies may persist briefly in backups.</li>
</ul>

<h2>5. Security</h2>
<p>Passwords are hashed with bcrypt and are never recoverable in plain text — not even by us. Traffic is
encrypted with HTTPS. Identity documents are stored outside the public web root and access is limited to
staff who need it for review. No system is perfectly secure, so please use a strong, unique password and
tell us immediately if you suspect your account has been accessed.</p>

<h2>6. Your rights</h2>
<p>Under the NDPA you may:</p>
<ul>
    <li>Ask what personal data we hold about you, and get a copy.</li>
    <li>Correct anything inaccurate — most of it directly in your profile settings.</li>
    <li>Delete your account and personal data — see <a href="/account-deletion">Account &amp; Data Deletion</a>.</li>
    <li>Withdraw consent for marketing at any time.</li>
    <li>Object to processing, or ask us to restrict it.</li>
    <li>Complain to the Nigeria Data Protection Commission if you believe we have mishandled your data.</li>
</ul>
<p>Write to <a href="mailto:{{ config('legal.privacy_email') }}">{{ config('legal.privacy_email') }}</a>
and we will respond within 30 days.</p>

<h2>7. Cookies</h2>
<p>We use a session cookie to keep you signed in and a CSRF cookie to protect forms against forgery.
Both are strictly necessary — the service cannot work without them. We do not use advertising or
cross-site tracking cookies.</p>

<h2>8. Children</h2>
<p>ShelTrify is for adults aged 18 and over. We do not knowingly collect data from children. If you
believe a child has created an account, contact us and we will remove it.</p>

<h2>9. Changes</h2>
<p>If we make a material change to this policy we will notify you in the app or by email before it takes
effect. The date at the top always reflects the current version.</p>

<h2>10. Contact</h2>
<div class="contact">
    <strong>{{ config('legal.company') }}</strong><br>
    Privacy enquiries: <a href="mailto:{{ config('legal.privacy_email') }}">{{ config('legal.privacy_email') }}</a><br>
    General support: <a href="mailto:{{ config('legal.contact_email') }}">{{ config('legal.contact_email') }}</a><br>
    {{ config('legal.address') }}
</div>
@endsection
