<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::prefix('api')->group(base_path('routes/api_web.php'));

$shell = fn (string $view) => Inertia::render('Shell', ['view' => $view]);

Route::get('/', fn () => $shell('landing'))->name('home');
Route::get('/chat', fn () => $shell('chat'))->name('chat');
Route::get('/community', fn () => $shell('community'))->name('community');
Route::get('/wallet', fn () => $shell('wallet'))->name('wallet');
Route::get('/marketplace', fn () => $shell('marketplace'))->name('marketplace');
Route::get('/feels', fn () => $shell('feels'))->name('feels');
Route::get('/rental-wahala', fn () => $shell('rentalWahala'))->name('rental-wahala');
Route::get('/cart', fn () => $shell('cart'))->name('cart');
Route::get('/global-tales', fn () => $shell('globalTales'))->name('global-tales');
Route::get('/about', fn () => $shell('about'))->name('about');
Route::get('/contact', fn () => $shell('contact'))->name('contact');
Route::get('/premium', fn () => $shell('premium'))->name('premium');
Route::get('/admin-dashboard', fn () => $shell('adminDashboard'))->name('admin-dashboard');
Route::get('/user-dashboard', fn () => $shell('userDashboard'))->name('user-dashboard');
Route::get('/profile', fn () => $shell('profile'))->name('profile');
Route::get('/payments/verify', fn () => $shell('paymentVerify'))->name('payments.verify');
