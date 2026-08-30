@extends('legal.layout')
@section('title', 'Terms of Service')
@section('description', 'The terms governing your use of ShelTrify.')

@section('body')
<p>These terms are the agreement between you and {{ config('legal.company') }} (&ldquo;ShelTrify&rdquo;).
By creating an account or using the platform, you accept them. If you do not agree, please do not use
ShelTrify.</p>

<h2>1. What ShelTrify is</h2>
<p>ShelTrify is a marketplace connecting people looking for property, shortlets, land, building
materials, and local services with the people who offer them. <strong>We are a venue, not a party to
your deals.</strong> We do not own the listings, employ the artisans, or guarantee any transaction
between users. Verification badges indicate that we checked identity documents — they are not a
warranty of honesty, quality, or legal title.</p>

<div class="note">
    <strong>Protect yourself.</strong> Inspect a property in person, confirm ownership and title
    independently, and be extremely cautious about paying anyone before you have verified what you are
    buying. Property fraud is real, and we cannot recover money you send outside the platform.
</div>

<h2>2. Eligibility and your account</h2>
<ul>
    <li>You must be at least 18 and legally able to enter contracts.</li>
    <li>Give accurate information and keep it current.</li>
    <li>You are responsible for everything done through your account — keep your password secret.</li>
    <li>One person, one account. Do not impersonate anyone or use another person's identity documents.</li>
</ul>

<h2>3. Content you post</h2>
<p>You keep ownership of the listings, photographs, videos, and posts you publish. You grant us a
non-exclusive, royalty-free licence to host, display, and distribute that content for the purpose of
operating and promoting the platform. That licence ends when you delete the content, apart from copies
that remain in backups for a short period.</p>
<p>You promise that what you post is yours to post, is accurate, and does not infringe anyone's rights.</p>

<h2>4. Things you must not do</h2>
<ul>
    <li>List property you do not own or have no authority to offer.</li>
    <li>Post false, misleading, or duplicated listings, or fake reviews.</li>
    <li>Harass, threaten, defraud, or discriminate against other users.</li>
    <li>Upload unlawful, obscene, or infringing material.</li>
    <li>Scrape, reverse-engineer, overload, or attempt to breach the platform.</li>
    <li>Use ShelTrify for money laundering or any other unlawful purpose.</li>
</ul>
<p>We may remove content, suspend, or permanently close accounts that breach these terms — and we will
report criminal conduct to the authorities.</p>

<h2>5. SWC, wallet, and payments</h2>
<ul>
    <li><strong>SWC</strong> is ShelTrify's internal credit unit, valued at 1 SWC = 1 Naira. It is not
        legal tender, not a security, not an investment, and earns no interest.</li>
    <li>Payments are processed by <strong>Paystack</strong>. Your use of that service is also subject to
        Paystack's own terms.</li>
    <li>Withdrawals are paid to the bank account you nominate. Names must match; we may decline
        mismatched payout requests.</li>
    <li>Premium access and boosts are chargeable services. Fees are shown before you confirm.</li>
    <li>Deliberately abusive chargebacks or reversals may result in suspension.</li>
</ul>

<h2>6. Refunds</h2>
<p>Fees for services already delivered — an activated boost, a used premium period — are generally
non-refundable. If you are charged in error, or a service fails through our fault, contact
<a href="mailto:{{ config('legal.contact_email') }}">{{ config('legal.contact_email') }}</a> within
14 days and we will investigate. Disputes about goods or services bought from another user are between
you and that user, though we will help where we reasonably can.</p>

<h2>7. AI assistant</h2>
<p>Our assistant is powered by a third-party AI model and produces information that may be incomplete or
wrong. Treat it as a starting point, never as legal, financial, or property advice, and verify anything
that matters before acting on it.</p>

<h2>8. Availability</h2>
<p>We work to keep ShelTrify running, but we do not guarantee uninterrupted service. We may change,
suspend, or discontinue features at any time. Where a change materially affects paid services we will
give reasonable notice.</p>

<h2>9. Liability</h2>
<p>To the fullest extent Nigerian law allows, ShelTrify is not liable for indirect or consequential
losses, lost profits, or losses arising from your dealings with other users. Our total liability for any
claim is limited to the fees you paid us in the 6 months before the claim arose. Nothing here excludes
liability that cannot lawfully be excluded.</p>

<h2>10. Ending your account</h2>
<p>You may close your account at any time — see <a href="/account-deletion">Account &amp; Data
Deletion</a>. We may suspend or close an account that breaches these terms, or where required by law.
Withdraw your balance and settle open orders before closing.</p>

<h2>11. Governing law</h2>
<p>These terms are governed by the laws of the Federal Republic of Nigeria, and disputes fall to the
Nigerian courts. We would much rather resolve things directly — please contact us first.</p>

<h2>12. Changes</h2>
<p>We may update these terms. Material changes will be notified in the app or by email before taking
effect. Continuing to use ShelTrify after that means you accept the revised terms.</p>

<h2>13. Contact</h2>
<div class="contact">
    <strong>{{ config('legal.company') }}</strong><br>
    <a href="mailto:{{ config('legal.contact_email') }}">{{ config('legal.contact_email') }}</a><br>
    {{ config('legal.address') }}
</div>
@endsection
