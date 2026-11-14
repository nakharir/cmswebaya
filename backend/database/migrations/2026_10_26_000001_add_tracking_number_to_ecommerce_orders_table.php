<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tambahkan kolom hanya jika belum tersedia.
        if (!Schema::hasColumn('ecommerce_orders', 'tracking_number')) {
            Schema::table('ecommerce_orders', function (Blueprint $table) {
                $table->string('tracking_number', 100)
                    ->nullable()
                    ->after('transfer_proof');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('ecommerce_orders', 'tracking_number')) {
            Schema::table('ecommerce_orders', function (Blueprint $table) {
                $table->dropColumn('tracking_number');
            });
        }
    }
};