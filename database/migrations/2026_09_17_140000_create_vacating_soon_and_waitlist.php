<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tenants who have given notice, captured either by the tenant or by an
        // agent going door to door. The point is to know about a flat before it
        // is empty, which is the window the seekers on the waitlist are waiting
        // through.
        if (! Schema::hasTable('vacating_soon_listings')) {
            Schema::create('vacating_soon_listings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                // Set when an agent captures the flat on a tenant's behalf.
                $table->foreignId('captured_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('listing_id')->nullable()->constrained('listings')->nullOnDelete();

                $table->string('address', 255)->nullable();
                $table->string('state', 40);
                $table->string('lga', 80)->nullable();
                $table->string('area', 120);
                $table->string('apartment_type', 40);

                // Normalised copies, so "Makurdi LGA" can match "makurdi".
                $table->string('state_key', 40)->index();
                $table->string('lga_key', 80)->nullable()->index();
                $table->string('area_key', 120)->index();

                // Not asked for in the brief, but a budget filter needs
                // something to compare against; optional so it never blocks a
                // capture at someone's door.
                $table->decimal('rent_amount', 14, 2)->nullable();

                $table->date('vacate_date')->index();
                $table->text('reason')->nullable();
                $table->string('contact_name', 120)->nullable();
                $table->string('whatsapp', 24);
                $table->string('image_url', 512)->nullable();

                // available → reserved → taken. Not payment-driven: the client
                // asked that seekers pay landlords directly, so a person moves
                // this along, not a transaction.
                $table->string('status', 20)->default('available')->index();
                $table->text('admin_notes')->nullable();
                $table->unsignedInteger('contact_views')->default(0);
                $table->timestamps();
            });
        }

        // Seekers waiting for an area. Thirty of these went unserved in one
        // month, which is the reason this exists.
        if (! Schema::hasTable('waitlist_entries')) {
            Schema::create('waitlist_entries', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

                $table->string('full_name', 120);
                $table->string('whatsapp', 24);
                $table->string('email', 191)->nullable();

                $table->string('state', 40);
                $table->string('lga', 80)->nullable();
                // Several areas per seeker — "High Level or Wurukum" is one
                // person, not two waitlist entries.
                $table->json('areas');
                $table->string('apartment_type', 40);

                $table->string('state_key', 40)->index();
                $table->string('lga_key', 80)->nullable()->index();
                $table->json('area_keys');

                $table->decimal('budget_min', 14, 2)->nullable();
                $table->decimal('budget_max', 14, 2)->nullable();
                $table->date('move_in_date')->nullable();

                $table->string('status', 20)->default('active')->index();
                $table->timestamp('last_notified_at')->nullable();
                $table->timestamps();
            });
        }

        // One row per (vacating flat, waiting seeker) so the same person is
        // never told about the same flat twice, and so the admin has a list of
        // who has been contacted.
        if (! Schema::hasTable('vacating_matches')) {
            Schema::create('vacating_matches', function (Blueprint $table) {
                $table->id();
                $table->foreignId('vacating_soon_listing_id')->constrained()->cascadeOnDelete();
                $table->foreignId('waitlist_entry_id')->constrained()->cascadeOnDelete();
                $table->timestamp('notified_at')->nullable();
                $table->string('status', 20)->default('new')->index();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->unique(['vacating_soon_listing_id', 'waitlist_entry_id'], 'vacating_match_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('vacating_matches');
        Schema::dropIfExists('waitlist_entries');
        Schema::dropIfExists('vacating_soon_listings');
    }
};
