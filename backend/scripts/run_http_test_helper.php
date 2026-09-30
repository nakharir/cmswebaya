<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$action = $argv[1] ?? 'setup';

if ($action === 'setup') {
    $cat = \App\Models\Ecommerce\Category::firstOrCreate(
        ['slug' => 'real-test-kategori'],
        ['name' => 'Kategori Real HTTP Test', 'is_active' => true, 'sort_order' => 1]
    );

    $prodA = \App\Models\Ecommerce\Product::updateOrCreate(
        ['slug' => 'real-test-aurora'],
        ['category_id' => $cat->id, 'name' => 'Manik Kaca Aurora HTTP', 'base_price' => 50000, 'is_active' => true]
    );
    $varMerah = \App\Models\Ecommerce\ProductVariant::updateOrCreate(
        ['sku' => 'HTTP-AUR-RED'],
        ['product_id' => $prodA->id, 'name' => 'Merah', 'price' => 70000, 'stock' => 10, 'is_active' => true]
    );
    $varBiru = \App\Models\Ecommerce\ProductVariant::updateOrCreate(
        ['sku' => 'HTTP-AUR-BLU'],
        ['product_id' => $prodA->id, 'name' => 'Biru', 'price' => 75000, 'stock' => 10, 'is_active' => true]
    );

    $prodB = \App\Models\Ecommerce\Product::updateOrCreate(
        ['slug' => 'real-test-stock2'],
        ['category_id' => $cat->id, 'name' => 'Gelang Stock Dua', 'base_price' => 45000, 'is_active' => true]
    );
    $varStock2 = \App\Models\Ecommerce\ProductVariant::updateOrCreate(
        ['sku' => 'HTTP-STK-2'],
        ['product_id' => $prodB->id, 'name' => 'Hitam', 'price' => 45000, 'stock' => 2, 'is_active' => true]
    );

    $prodD = \App\Models\Ecommerce\Product::updateOrCreate(
        ['slug' => 'real-test-rollback'],
        ['category_id' => $cat->id, 'name' => 'Rollback Item Test', 'base_price' => 40000, 'is_active' => true]
    );
    $varD1 = \App\Models\Ecommerce\ProductVariant::updateOrCreate(
        ['sku' => 'HTTP-RB-1'],
        ['product_id' => $prodD->id, 'name' => 'Hijau', 'price' => 40000, 'stock' => 5, 'is_active' => true]
    );
    $varD2 = \App\Models\Ecommerce\ProductVariant::updateOrCreate(
        ['sku' => 'HTTP-RB-2'],
        ['product_id' => $prodD->id, 'name' => 'Kuning', 'price' => 40000, 'stock' => 1, 'is_active' => true]
    );

    $prodE = \App\Models\Ecommerce\Product::updateOrCreate(
        ['slug' => 'real-test-no-variant'],
        ['category_id' => $cat->id, 'name' => 'Benang Nilon Polos', 'base_price' => 15000, 'stock' => 10, 'is_active' => true]
    );

    echo 'FIXTURE:' . json_encode([
        'prodA_id' => $prodA->id,
        'varMerah_id' => $varMerah->id,
        'varBiru_id' => $varBiru->id,
        'prodB_id' => $prodB->id,
        'varStock2_id' => $varStock2->id,
        'prodD_id' => $prodD->id,
        'varD1_id' => $varD1->id,
        'varD2_id' => $varD2->id,
        'prodE_id' => $prodE->id,
    ]) . PHP_EOL;
} elseif ($action === 'get_stock') {
    $varId = (int) $argv[2];
    $v = \App\Models\Ecommerce\ProductVariant::find($varId);
    echo 'STOCK:' . ($v ? $v->stock : 'NOT_FOUND') . PHP_EOL;
} elseif ($action === 'get_product_stock') {
    $prodId = (int) $argv[2];
    $p = \App\Models\Ecommerce\Product::find($prodId);
    echo 'STOCK:' . ($p ? $p->stock : 'NOT_FOUND') . PHP_EOL;
} elseif ($action === 'get_order_count') {
    echo 'COUNT:' . \App\Models\Ecommerce\Order::count() . PHP_EOL;
} elseif ($action === 'get_admin_token') {
    $admin = \App\Models\User::firstOrCreate(
        ['email' => 'admin@krezoema.com'],
        ['name' => 'Krezoema Admin', 'password' => bcrypt('password123'), 'status' => 1]
    );
    echo 'TOKEN:' . $admin->createToken('admin-test')->plainTextToken . PHP_EOL;
} elseif ($action === 'get_operator_token') {
    $operator = \App\Models\User::firstOrCreate(
        ['email' => 'operator@krezoema.com'],
        ['name' => 'Krezoema Operator', 'password' => bcrypt('password123'), 'status' => 2]
    );
    echo 'TOKEN:' . $operator->createToken('operator-test')->plainTextToken . PHP_EOL;
}
