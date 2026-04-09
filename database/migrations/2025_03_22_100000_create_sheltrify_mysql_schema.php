<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('password');
            $table->string('full_name')->nullable();
            $table->string('phone')->nullable();
            $table->string('whatsapp')->nullable();
            $table->string('role', 32)->default('SEEKER')->index();
            $table->boolean('is_premium')->default(false);
            $table->timestamp('premium_expiry_date')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->string('avatar_url', 2048)->nullable();
            $table->string('verification_photo_url', 2048)->nullable();
            $table->string('verification_id_url', 2048)->nullable();
            $table->string('verification_id_type')->nullable();
            $table->string('verification_status')->nullable();
            $table->timestamp('verification_rejected_at')->nullable();
            $table->text('verification_rejection_reason')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->string('artisan_service', 32)->nullable()->index();
            $table->string('artisan_location')->nullable();
            $table->double('artisan_rating')->default(0);
            $table->text('artisan_bio')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->double('swc_balance')->default(0);
            $table->unsignedInteger('credibility_score')->default(0);
            $table->string('tier', 32)->default('bronze');
            $table->unsignedInteger('referrals')->default(0);
            $table->timestamps();
        });

        Schema::create('listings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('price');
            $table->string('location');
            $table->unsignedInteger('bedrooms')->nullable();
            $table->string('property_type', 64)->nullable();
            $table->string('image_url', 2048)->nullable();
            $table->string('video_url', 2048)->nullable();
            $table->json('amenities')->nullable();
            $table->string('landlord_name')->nullable();
            $table->string('landlord_email')->nullable();
            $table->string('landlord_phone')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->boolean('is_boosted')->default(false)->index();
            $table->timestamp('boosted_until')->nullable();
            $table->timestamp('boosted_at')->nullable();
            $table->double('boost_cost')->nullable();
            $table->timestamps();
        });

        Schema::create('favorites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('listing_id')->constrained('listings')->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['user_id', 'listing_id']);
            $table->index('user_id');
        });

        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('listing_id')->constrained('listings')->cascadeOnDelete();
            $table->timestamp('date_time');
            $table->string('status', 32)->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'listing_id']);
        });

        Schema::create('referrals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referrer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('referred_user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('status', 32)->default('pending');
            $table->double('reward_earned')->default(0);
            $table->timestamps();
            $table->index('referrer_id');
        });

        Schema::create('artisans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('service');
            $table->string('email');
            $table->string('phone');
            $table->string('location');
            $table->string('avatar_url', 2048)->nullable();
            $table->double('rating')->default(0);
            $table->boolean('is_verified')->default(false);
            $table->timestamps();
            $table->index(['service', 'location']);
        });

        Schema::create('marketplace_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->double('price');
            $table->double('old_price')->nullable();
            $table->string('category', 64);
            $table->string('image_url', 2048)->nullable();
            $table->string('video_url', 2048)->nullable();
            $table->boolean('is_active')->default(false)->index();
            $table->boolean('is_approved')->default(false)->index();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index('user_id');
        });

        Schema::create('community_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('content')->nullable();
            $table->string('category')->default('General');
            $table->string('image_url', 2048)->nullable();
            $table->string('video_url', 2048)->nullable();
            $table->unsignedInteger('likes')->default(0);
            $table->unsignedInteger('loves')->default(0);
            $table->unsignedInteger('reposts')->default(0);
            $table->unsignedInteger('replies')->default(0);
            $table->timestamps();
            $table->index(['user_id', 'category']);
        });

        Schema::create('community_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained('community_posts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('text');
            $table->timestamp('created_at')->useCurrent();
            $table->index(['post_id', 'user_id']);
        });

        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('marketplace_products')->cascadeOnDelete();
            $table->unsignedInteger('quantity')->default(1);
            $table->timestamps();
            $table->unique(['user_id', 'product_id']);
            $table->index('user_id');
        });

        Schema::create('rental_wahala_videos', function (Blueprint $table) {
            $table->id();
            $table->string('video_url', 2048);
            $table->text('caption')->nullable();
            $table->string('music')->nullable();
            $table->unsignedInteger('likes')->default(0);
            $table->unsignedInteger('comments')->default(0);
            $table->unsignedInteger('shares')->default(0);
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('feels_videos', function (Blueprint $table) {
            $table->id();
            $table->string('video_url', 2048);
            $table->text('caption')->nullable();
            $table->string('music')->nullable();
            $table->unsignedInteger('likes')->default(0);
            $table->unsignedInteger('comments')->default(0);
            $table->unsignedInteger('shares')->default(0);
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('feels_video_comments', function (Blueprint $table) {
            $table->id();
            $table->text('text');
            $table->foreignId('feels_video_id')->constrained('feels_videos')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['feels_video_id', 'user_id']);
        });

        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('reference')->unique();
            $table->double('amount');
            $table->double('swc_amount');
            $table->string('type');
            $table->string('status', 32)->default('pending')->index();
            $table->text('paystack_data')->nullable();
            $table->timestamps();
            $table->index('user_id');
        });

        Schema::create('investment_opportunities', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type');
            $table->double('min_investment');
            $table->double('max_investment')->nullable();
            $table->double('expected_roi');
            $table->string('duration');
            $table->string('status', 32)->default('Open')->index();
            $table->string('image_url', 2048)->nullable();
            $table->double('total_raised')->default(0);
            $table->double('target_amount')->nullable();
            $table->timestamps();
        });

        Schema::create('investments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('opportunity_id')->constrained('investment_opportunities')->cascadeOnDelete();
            $table->double('amount');
            $table->string('status', 32)->default('active')->index();
            $table->double('profit_earned')->default(0);
            $table->double('roi_percentage')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'opportunity_id']);
        });

        Schema::create('large_transaction_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->double('amount');
            $table->json('cart_items');
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone')->nullable();
            $table->string('customer_address')->nullable();
            $table->string('status', 32)->default('pending')->index();
            $table->text('admin_notes')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
        });

        Schema::create('global_tales', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content');
            $table->string('image_url', 2048)->nullable();
            $table->string('video_url', 2048)->nullable();
            $table->string('category')->default('General');
            $table->unsignedInteger('read_time')->default(5);
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->index(['user_id', 'category', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('global_tales');
        Schema::dropIfExists('large_transaction_requests');
        Schema::dropIfExists('investments');
        Schema::dropIfExists('investment_opportunities');
        Schema::dropIfExists('payment_transactions');
        Schema::dropIfExists('feels_video_comments');
        Schema::dropIfExists('feels_videos');
        Schema::dropIfExists('rental_wahala_videos');
        Schema::dropIfExists('carts');
        Schema::dropIfExists('community_comments');
        Schema::dropIfExists('community_posts');
        Schema::dropIfExists('marketplace_products');
        Schema::dropIfExists('artisans');
        Schema::dropIfExists('referrals');
        Schema::dropIfExists('appointments');
        Schema::dropIfExists('favorites');
        Schema::dropIfExists('listings');
        Schema::dropIfExists('wallets');
        Schema::dropIfExists('users');
    }
};
