<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('marketplace_products', function (Blueprint $table) {
            $table->json('images')->nullable()->after('image_url');
            $table->json('videos')->nullable()->after('video_url');
        });

        Schema::table('listings', function (Blueprint $table) {
            $table->json('images')->nullable()->after('image_url');
            $table->json('videos')->nullable()->after('video_url');
        });
    }

    public function down(): void
    {
        Schema::table('marketplace_products', function (Blueprint $table) {
            $table->dropColumn('images');
            $table->dropColumn('videos');
        });

        Schema::table('listings', function (Blueprint $table) {
            $table->dropColumn('images');
            $table->dropColumn('videos');
        });
    }
};
