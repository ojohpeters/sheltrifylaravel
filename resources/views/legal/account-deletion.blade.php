@extends('legal.layout')
@section('title', 'Account & Data Deletion')
@section('description', 'Request permanent deletion of your ShelTrify account and personal data.')

@section('body')
<p>You can ask us to permanently delete your ShelTrify account and the personal data attached to it.
This page works whether or not you have the app installed.</p>

@if (session('status'))
    <div class="note" style="background:#E8F8F0;border-color:#7CC9A6">
        <strong>{{ session('status') }}</strong>
    </div>
@endif

<h2>What gets deleted</h2>
<ul>
    <li>Your profile — name, email, phone, WhatsApp number, photo, and bio</li>
    <li>Your identity verification documents — NIN, ID images, and verification selfie</li>
    <li>Your listings, marketplace products, Feels, posts, comments, and reviews</li>
    <li>Your chat history with the AI assistant and with other users</li>
    <li>Your saved items, favourites, and notification preferences</li>
</ul>

<h2>What we must keep, and why</h2>
<p>Nigerian financial record-keeping law requires us to retain transaction records for up to
<strong>7 years</strong>. After deletion these are detached from your identity and kept only as
accounting records:</p>
<ul>
    <li>Deposit, withdrawal, and purchase records, including amounts and dates</li>
    <li>Invoices and payout records held by our payment processor, Paystack</li>
</ul>

<div class="note">
    <strong>Settle up first.</strong> Withdraw any remaining SWC balance and complete or cancel open
    orders before requesting deletion. We cannot return a balance after the account is erased.
</div>

<h2>How to request deletion</h2>
<p>Submit the form below, or email
<a href="mailto:{{ config('legal.privacy_email') }}">{{ config('legal.privacy_email') }}</a> from the
address on your account. We verify that you own the account before deleting anything, then complete the
request and confirm by email <strong>within 30 days</strong>.</p>

<form method="POST" action="/account-deletion" style="margin-top:22px">
    @csrf

    @error('email')
        <div class="note" style="background:#FDECEC;border-color:#E9A3A3">{{ $message }}</div>
    @enderror

    <label for="email" style="display:block;font-weight:600;margin-bottom:6px">
        Email address on your account
    </label>
    <input id="email" type="email" name="email" required value="{{ old('email') }}"
           placeholder="you@example.com"
           style="width:100%;padding:11px 14px;border:1px solid var(--border);border-radius:9px;
                  background:var(--bg);color:var(--text);font-size:1rem;font-family:inherit">

    <label for="reason" style="display:block;font-weight:600;margin:18px 0 6px">
        Reason <span style="font-weight:400;color:var(--muted)">(optional)</span>
    </label>
    <textarea id="reason" name="reason" rows="3" maxlength="2000"
              placeholder="Anything you'd like us to know"
              style="width:100%;padding:11px 14px;border:1px solid var(--border);border-radius:9px;
                     background:var(--bg);color:var(--text);font-size:1rem;font-family:inherit;
                     resize:vertical">{{ old('reason') }}</textarea>

    {{-- Honeypot: hidden from people, tempting to naive bots. --}}
    <div style="position:absolute;left:-9999px" aria-hidden="true">
        <label for="website">Leave this field blank</label>
        <input id="website" type="text" name="website" tabindex="-1" autocomplete="off">
    </div>

    @error('confirm')
        <div class="note" style="background:#FDECEC;border-color:#E9A3A3">{{ $message }}</div>
    @enderror

    <label style="display:flex;gap:10px;align-items:flex-start;margin:18px 0 22px;font-size:.95rem">
        <input type="checkbox" name="confirm" value="1" required style="margin-top:5px">
        <span>I understand this permanently deletes my ShelTrify account and that any remaining
              SWC balance will be forfeited.</span>
    </label>

    <button type="submit"
            style="width:100%;padding:13px;font-size:1rem;font-weight:600;color:#fff;
                   background:#C0392B;border:0;border-radius:10px;cursor:pointer;font-family:inherit">
        Request account deletion
    </button>
</form>

<h2>Changed your mind?</h2>
<p>Email <a href="mailto:{{ config('legal.privacy_email') }}">{{ config('legal.privacy_email') }}</a>
before the 30 days are up and we will cancel the request.</p>
@endsection
