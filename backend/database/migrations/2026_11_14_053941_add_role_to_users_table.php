
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Menambahkan kolom role dan memetakan akun lama.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 50)
                ->default('customer')
                ->after('status');
        });

        // Status lama 1 = Admin
        DB::table('users')
            ->where('status', 1)
            ->update(['role' => 'admin']);

        // Status lama 2 dan 3 = Operator
        DB::table('users')
            ->whereIn('status', [2, 3])
            ->update(['role' => 'operator']);

        // Status lama 0 = Customer
        DB::table('users')
            ->where('status', 0)
            ->update(['role' => 'customer']);
    }

    /**
     * Menghapus kolom role jika migration di-rollback.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
