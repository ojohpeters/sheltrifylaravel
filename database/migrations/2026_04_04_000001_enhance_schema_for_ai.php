<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ─── Enhance: users ──────────────────────────────────────────────────
        Schema::table('users', function (Blueprint $table) {
            $table->text('bio')->nullable()->after('avatar_url');
            $table->string('referral_code', 32)->nullable()->unique()->after('bio');
            $table->timestamp('last_seen_at')->nullable()->after('referral_code');
            $table->json('notification_preferences')->nullable()->after('last_seen_at');
            $table->boolean('onboarding_completed')->default(false)->after('notification_preferences');
            $table->boolean('chat_enabled')->default(false)->after('onboarding_completed');
        });

        // ─── Enhance: listings ───────────────────────────────────────────────
        Schema::table('listings', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('id');
            $table->string('listing_type', 32)->default('rent')->after('property_type'); // rent|sale|shortlet
            $table->string('status', 32)->default('active')->after('is_active');         // active|rented|sold|inactive
            $table->string('state')->nullable()->after('location');
            $table->string('city')->nullable()->after('state');
            $table->decimal('lat', 10, 7)->nullable()->after('city');
            $table->decimal('lng', 10, 7)->nullable()->after('lat');
            $table->unsignedInteger('bathrooms')->nullable()->after('bedrooms');
            $table->boolean('furnished')->default(false)->after('bathrooms');
            $table->boolean('parking')->default(false)->after('furnished');
            $table->json('tags')->nullable()->after('amenities');
            $table->unsignedBigInteger('views_count')->default(0)->after('tags');
            $table->unsignedBigInteger('contact_views')->default(0)->after('views_count');
        });

        // ─── Enhance: wallets ────────────────────────────────────────────────
        Schema::table('wallets', function (Blueprint $table) {
            $table->decimal('total_earned', 15, 2)->default(0)->after('swc_balance');
            $table->decimal('total_spent', 15, 2)->default(0)->after('total_earned');
            $table->timestamp('last_transaction_at')->nullable()->after('total_spent');
        });

        // ─── Enhance: marketplace_products ──────────────────────────────────
        Schema::table('marketplace_products', function (Blueprint $table) {
            $table->string('brand')->nullable()->after('name');
            $table->unsignedInteger('stock_quantity')->default(0)->after('old_price');
            $table->json('tags')->nullable()->after('category');
            $table->json('specifications')->nullable()->after('tags');
            $table->boolean('featured')->default(false)->after('is_approved');
            $table->unsignedBigInteger('views_count')->default(0)->after('featured');
        });

        // ─── Enhance: community_posts ────────────────────────────────────────
        Schema::table('community_posts', function (Blueprint $table) {
            $table->json('tags')->nullable()->after('category');
            $table->boolean('pinned')->default(false)->after('tags');
            $table->unsignedBigInteger('views_count')->default(0)->after('pinned');
        });

        // ─── Enhance: investment_opportunities ───────────────────────────────
        Schema::table('investment_opportunities', function (Blueprint $table) {
            $table->string('risk_level', 32)->default('medium')->after('type'); // low|medium|high
            $table->string('sector')->nullable()->after('risk_level');           // real_estate|tech|agriculture|finance
            $table->boolean('featured')->default(false)->after('sector');
            $table->string('returns_frequency', 32)->default('on_maturity')->after('featured'); // monthly|quarterly|on_maturity
            $table->string('documents_url', 2048)->nullable()->after('returns_frequency');
        });

        // ─── Enhance: global_tales ───────────────────────────────────────────
        Schema::table('global_tales', function (Blueprint $table) {
            $table->json('tags')->nullable()->after('category');
            $table->unsignedBigInteger('views_count')->default(0)->after('tags');
            $table->unsignedBigInteger('likes')->default(0)->after('views_count');
            $table->boolean('featured')->default(false)->after('likes');
        });

        // ─── Enhance: feels_videos ───────────────────────────────────────────
        Schema::table('feels_videos', function (Blueprint $table) {
            $table->json('tags')->nullable()->after('caption');
            $table->unsignedBigInteger('views_count')->default(0)->after('tags');
            $table->unsignedInteger('duration')->nullable()->after('views_count'); // seconds
        });

        // ─── Enhance: artisans ───────────────────────────────────────────────
        Schema::table('artisans', function (Blueprint $table) {
            $table->text('bio')->nullable()->after('rating');
            $table->unsignedInteger('reviews_count')->default(0)->after('bio');
            $table->json('portfolio_urls')->nullable()->after('reviews_count');
            $table->json('specialty_tags')->nullable()->after('portfolio_urls');
            $table->string('state')->nullable()->after('location');
            $table->string('city')->nullable()->after('state');
            $table->string('whatsapp')->nullable()->after('phone');
        });

        // ─── New: ai_conversations ───────────────────────────────────────────
        Schema::create('ai_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->string('context', 512)->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'last_message_at']);
        });

        // ─── New: ai_messages ─────────────────────────────────────────────────
        Schema::create('ai_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('ai_conversations')->cascadeOnDelete();
            $table->string('role', 16);                  // user | assistant
            $table->text('content');
            $table->json('intent')->nullable();          // parsed query intent
            $table->json('result_metadata')->nullable(); // entity type, result count, etc.
            $table->timestamps();
            $table->index(['conversation_id', 'created_at']);
        });

        // ─── New: notifications ───────────────────────────────────────────────
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 64);       // listing_viewed|investment_update|product_approved|appointment|payment|system
            $table->string('title');
            $table->text('body');
            $table->json('data')->nullable();  // { entity_type, entity_id, action_url }
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'read_at', 'created_at']);
        });

        // ─── New: user_activities ─────────────────────────────────────────────
        Schema::create('user_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('action', 64);                      // viewed_listing|added_to_cart|made_investment|created_post
            $table->string('entity_type', 64)->nullable();     // listing|product|post|investment
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'action', 'created_at']);
            $table->index(['entity_type', 'entity_id']);
        });

        // ─── New: listing_views ───────────────────────────────────────────────
        Schema::create('listing_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('listing_id')->constrained('listings')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['listing_id', 'created_at']);
            $table->index(['user_id', 'listing_id']);
        });

        // ─── Full-text indexes (MySQL only) ───────────────────────────────────
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE listings ADD FULLTEXT idx_listings_fts (title, description, location)');
            DB::statement('ALTER TABLE marketplace_products ADD FULLTEXT idx_products_fts (name, description)');
            DB::statement('ALTER TABLE community_posts ADD FULLTEXT idx_posts_fts (title, content)');
            DB::statement('ALTER TABLE global_tales ADD FULLTEXT idx_tales_fts (title, content)');
            DB::statement('ALTER TABLE artisans ADD FULLTEXT idx_artisans_fts (name, service, location)');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE listings DROP INDEX idx_listings_fts');
            DB::statement('ALTER TABLE marketplace_products DROP INDEX idx_products_fts');
            DB::statement('ALTER TABLE community_posts DROP INDEX idx_posts_fts');
            DB::statement('ALTER TABLE global_tales DROP INDEX idx_tales_fts');
            DB::statement('ALTER TABLE artisans DROP INDEX idx_artisans_fts');
        }

        Schema::dropIfExists('listing_views');
        Schema::dropIfExists('user_activities');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('ai_messages');
        Schema::dropIfExists('ai_conversations');

        Schema::table('artisans', function (Blueprint $table) {
            $table->dropColumn(['bio', 'reviews_count', 'portfolio_urls', 'specialty_tags', 'state', 'city', 'whatsapp']);
        });
        Schema::table('feels_videos', function (Blueprint $table) {
            $table->dropColumn(['tags', 'views_count', 'duration']);
        });
        Schema::table('global_tales', function (Blueprint $table) {
            $table->dropColumn(['tags', 'views_count', 'likes', 'featured']);
        });
        Schema::table('investment_opportunities', function (Blueprint $table) {
            $table->dropColumn(['risk_level', 'sector', 'featured', 'returns_frequency', 'documents_url']);
        });
        Schema::table('community_posts', function (Blueprint $table) {
            $table->dropColumn(['tags', 'pinned', 'views_count']);
        });
        Schema::table('marketplace_products', function (Blueprint $table) {
            $table->dropColumn(['brand', 'stock_quantity', 'tags', 'specifications', 'featured', 'views_count']);
        });
        Schema::table('wallets', function (Blueprint $table) {
            $table->dropColumn(['total_earned', 'total_spent', 'last_transaction_at']);
        });
        Schema::table('listings', function (Blueprint $table) {
            $table->dropColumn(['slug', 'listing_type', 'status', 'state', 'city', 'lat', 'lng', 'bathrooms', 'furnished', 'parking', 'tags', 'views_count', 'contact_views']);
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['bio', 'referral_code', 'last_seen_at', 'notification_preferences', 'onboarding_completed', 'chat_enabled']);
        });
    }
};
