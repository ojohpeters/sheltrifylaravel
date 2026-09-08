<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('testimonials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');       // 1-5, enforced in the request
            $table->text('body');
            $table->string('location', 120)->nullable();

            // Nothing reaches the landing page unreviewed. This is public
            // marketing copy on the front door of the business, so it is opt-in
            // by an admin rather than opt-out.
            $table->string('status', 20)->default('pending')->index();

            $table->timestamps();

            // One testimonial per person; a second submission replaces it
            // rather than letting one account fill the section.
            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('testimonials');
    }
};
