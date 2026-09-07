<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referral_clicks', function (Blueprint $table) {
            $table->id();
            $table->string('referral_code', 32)->index();

            // Salted hash of IP + user agent. Enough to tell a repeat visit from
            // a new one without storing an identifier for someone who has not
            // signed up and cannot consent.
            $table->string('visitor_hash', 64);

            $table->timestamp('created_at')->nullable();

            // One row per visitor per code, so refreshing a link cannot inflate
            // the count that conversion is measured against.
            $table->unique(['referral_code', 'visitor_hash']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referral_clicks');
    }
};
