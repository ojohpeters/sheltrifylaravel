<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('artisan_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('artisan_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reviewer_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');           // 1-5, enforced in the request
            $table->text('comment')->nullable();
            $table->timestamps();

            // One review per person per artisan. A second submission updates the
            // first rather than letting one account inflate a rating.
            $table->unique(['artisan_id', 'reviewer_id']);

            // The listing reads reviews newest-first per artisan.
            $table->index(['artisan_id', 'created_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'artisan_experience_years')) {
                $table->unsignedSmallInteger('artisan_experience_years')->nullable()->after('artisan_bio');
            }
            // Denormalised so the listing does not aggregate on every request.
            if (! Schema::hasColumn('users', 'artisan_reviews_count')) {
                $table->unsignedInteger('artisan_reviews_count')->default(0)->after('artisan_rating');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('artisan_reviews');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['artisan_experience_years', 'artisan_reviews_count']);
        });
    }
};
