<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Structured location, so the artisan directory can filter by state.
        // artisan_location stays as the display string ("Makurdi, Benue").
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'artisan_state')) {
                $table->string('artisan_state', 40)->nullable()->index();
            }
        });

        // Separate call: MySQL cannot always position a column after one being
        // added in the same ALTER statement.
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'artisan_lga')) {
                $table->string('artisan_lga', 80)->nullable();
            }
        });

        // Backfill. The verification form wrote bio and years of experience to
        // professional_profiles, but the directory reads them from users — so
        // every artisan who filled them in still shows no bio. Copy them across
        // where the user row is empty; never overwrite what is already there.
        if (! Schema::hasTable('professional_profiles')) {
            return;
        }

        DB::table('professional_profiles')->orderBy('id')->chunkById(200, function ($profiles) {
            foreach ($profiles as $profile) {
                $user = DB::table('users')
                    ->where('id', $profile->user_id)
                    ->first(['artisan_bio', 'artisan_experience_years']);

                if (! $user) {
                    continue;
                }

                $update = [];

                if (blank($user->artisan_bio) && filled($profile->bio ?? null)) {
                    $update['artisan_bio'] = $profile->bio;
                }

                // Old values are ranges such as "6–10 years"; the lower bound is
                // the honest figure to show.
                if ($user->artisan_experience_years === null
                    && preg_match('/\d+/', (string) ($profile->years_experience ?? ''), $m)) {
                    $update['artisan_experience_years'] = (int) $m[0];
                }

                if ($update !== []) {
                    DB::table('users')->where('id', $profile->user_id)->update($update);
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'artisan_state')) {
                $table->dropIndex(['artisan_state']);
                $table->dropColumn('artisan_state');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'artisan_lga')) {
                $table->dropColumn('artisan_lga');
            }
        });
    }
};
