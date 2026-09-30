<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AdminSeeder extends Seeder
{
    /**
     * Seed akun admin pertama.
     */
    public function run(): void
    {
        // Cek apakah admin sudah ada, hindari duplikasi
        if (!User::where('email', 'admin@cms.com')->exists()) {
            User::create([
                'name'     => 'Administrator',
                'email'    => 'admin@cms.com',
                'password' => Hash::make('admin123'),
                'phone'    => '08123456789',
                'address'  => 'Kantor Pusat',
                'status'   => 2, // 2 = admin / approval
                'sidebars' => [],
            ]);

            $this->command->info('✅ Akun admin berhasil dibuat!');
            $this->command->info('   Email    : admin@cms.com');
            $this->command->info('   Password : admin123');
        } else {
            $this->command->warn('⚠️  Akun admin sudah ada, seeder dilewati.');
        }
    }
}
