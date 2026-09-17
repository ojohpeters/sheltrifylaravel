<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The seller form has always asked for a location ("e.g. Ikeja, Lagos"),
        // but the API validated it away and there was no column to put it in —
        // so every address a seller typed was discarded, and searching for a
        // place could only match sellers who happened to repeat it in the
        // title. This is where it goes.
        Schema::table('marketplace_products', function (Blueprint $table) {
            if (! Schema::hasColumn('marketplace_products', 'location')) {
                $table->string('location', 160)->nullable()->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('marketplace_products', function (Blueprint $table) {
            if (Schema::hasColumn('marketplace_products', 'location')) {
                $table->dropIndex(['location']);
                $table->dropColumn('location');
            }
        });
    }
};
