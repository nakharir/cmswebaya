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
        Schema::create('ecommerce_shipping_rates', function (Blueprint $table) {
            $table->id();
            $table->string('courier', 50)->index();
            $table->string('courier_name', 100);
            $table->string('service_code', 50)->index();
            $table->string('service_name', 100);
            $table->string('province', 100)->default('*')->index();
            $table->string('city', 100)->nullable()->index();
            $table->decimal('cost_per_kg', 12, 2);
            $table->decimal('min_cost', 12, 2)->default(0);
            $table->string('etd', 50)->default('2-3 hari');
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ecommerce_shipping_rates');
    }
};
