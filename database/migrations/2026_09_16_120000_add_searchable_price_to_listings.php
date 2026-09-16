<?php

use App\Support\NigerianStates;
use App\Support\PriceText;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // listings.price is free text ("2.5M/Year"), which no query can filter
        // or sort on. These columns carry the same figure in a usable shape;
        // the original string stays the one shown to seekers.
        Schema::table('listings', function (Blueprint $table) {
            if (! Schema::hasColumn('listings', 'price_amount')) {
                $table->decimal('price_amount', 14, 2)->nullable()->index();
            }
        });

        // Separate call: MySQL cannot always position a column after one being
        // added in the same ALTER statement.
        Schema::table('listings', function (Blueprint $table) {
            if (! Schema::hasColumn('listings', 'price_period')) {
                $table->string('price_period', 12)->nullable();
            }
        });

        DB::table('listings')
            ->orderBy('id')
            ->chunkById(200, function ($listings) {
                foreach ($listings as $listing) {
                    $update = [];

                    $parsed = PriceText::parse($listing->price ?? null);

                    if ($parsed['amount'] !== null) {
                        $update['price_amount'] = $parsed['amount'];
                    }
                    if ($parsed['period'] !== null) {
                        $update['price_period'] = $parsed['period'];
                    }

                    // Every listing was captured through a single free-text
                    // location field, leaving the state column — the one a
                    // filter needs — empty on every row.
                    if (blank($listing->state ?? null)) {
                        $state = NigerianStates::detect($listing->location ?? null);

                        if ($state !== null) {
                            $update['state'] = $state;
                        }
                    }

                    if ($update !== []) {
                        DB::table('listings')->where('id', $listing->id)->update($update);
                    }
                }
            });
    }

    public function down(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            if (Schema::hasColumn('listings', 'price_amount')) {
                $table->dropIndex(['price_amount']);
                $table->dropColumn('price_amount');
            }
        });

        Schema::table('listings', function (Blueprint $table) {
            if (Schema::hasColumn('listings', 'price_period')) {
                $table->dropColumn('price_period');
            }
        });
    }
};
