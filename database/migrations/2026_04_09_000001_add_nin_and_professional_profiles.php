<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Add NIN + listing approval to users ─────────────────────────────
        Schema::table('users', function (Blueprint $table) {
            $table->string('nin_number', 20)->nullable()->after('artisan_bio');
            $table->boolean('nin_verified')->default(false)->after('nin_number');
            $table->string('listing_approval_status', 32)->nullable()->after('nin_verified'); // pending|approved|rejected
            $table->text('listing_approval_rejection_reason')->nullable()->after('listing_approval_status');
            $table->timestamp('listing_approved_at')->nullable()->after('listing_approval_rejection_reason');
            $table->string('professional_license_url', 2048)->nullable()->after('listing_approved_at');
            $table->string('professional_type', 64)->nullable()->after('professional_license_url'); // SURVEYOR|DEVELOPER
        });

        // ── Professional profiles table (Surveyors, Developers) ─────────────
        Schema::create('professional_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('professional_type', 64); // SURVEYOR|DEVELOPER
            $table->string('company_name')->nullable();
            $table->string('license_number')->nullable();
            $table->string('license_url', 2048)->nullable();
            $table->string('nin_number', 20);
            $table->string('cac_number', 64)->nullable();       // Corporate Affairs Commission
            $table->string('cac_document_url', 2048)->nullable();
            $table->string('professional_body')->nullable();    // e.g. NIESV, NIA
            $table->string('membership_id')->nullable();
            $table->string('membership_doc_url', 2048)->nullable();
            $table->text('business_address')->nullable();
            $table->string('years_experience')->nullable();
            $table->text('bio')->nullable();
            $table->string('status', 32)->default('pending');   // pending|approved|rejected
            $table->text('rejection_reason')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamps();
            $table->index(['professional_type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('professional_profiles');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'nin_number', 'nin_verified', 'listing_approval_status',
                'listing_approval_rejection_reason', 'listing_approved_at',
                'professional_license_url', 'professional_type',
            ]);
        });
    }
};
