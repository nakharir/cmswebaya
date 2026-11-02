<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add weight (in grams) to products
        Schema::table('ecommerce_products', function (Blueprint $table) {
            $table->unsignedInteger('weight')->default(250)->after('base_price');
        });

        // 2. Add weight override (in grams) to product variants
        Schema::table('ecommerce_product_variants', function (Blueprint $table) {
            $table->unsignedInteger('weight')->nullable()->after('price');
        });

        // 3. Add weight snapshot (in grams) to order items
        Schema::table('ecommerce_order_items', function (Blueprint $table) {
            $table->unsignedInteger('weight')->default(250)->after('unit_price');
        });

        // 4. Add shipping and package details to orders
        Schema::table('ecommerce_orders', function (Blueprint $table) {
            $table->unsignedInteger('total_weight')->default(0)->after('shipping_postal_code');
            $table->string('shipping_courier', 50)->nullable()->after('shipping_method');
            $table->string('shipping_service', 50)->nullable()->after('shipping_courier');
            $table->string('shipping_etd', 50)->nullable()->after('shipping_service');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ecommerce_orders', function (Blueprint $table) {
            $table->dropColumn(['total_weight', 'shipping_courier', 'shipping_service', 'shipping_etd']);
        });

        Schema::table('ecommerce_order_items', function (Blueprint $table) {
            $table->dropColumn('weight');
        });

        Schema::table('ecommerce_product_variants', function (Blueprint $table) {
            $table->dropColumn('weight');
        });

        Schema::table('ecommerce_products', function (Blueprint $table) {
            $table->dropColumn('weight');
        });
    }
};
