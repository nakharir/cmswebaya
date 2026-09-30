<?php

namespace App\Services\Ecommerce;

use Illuminate\Support\Facades\DB;

class OrderNumberGenerator
{
    /**
     * Generate the next atomic, collision-safe sequential order number for today.
     * Format: KREZOEMA-YYYYMMDD-XXXX (e.g. KREZOEMA-20260929-0001)
     *
     * @return string
     */
    public static function generate(): string
    {
        $doGenerate = function () {
            $todayDate = date('Y-m-d');
            $dateStr = date('Ymd');

            // Ensure sequence row exists for today (ignore if already exists)
            DB::table('ecommerce_order_sequences')->insertOrIgnore([
                'order_date' => $todayDate,
                'last_number' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Lock row for update to guarantee concurrency safety across simultaneous requests
            $seq = DB::table('ecommerce_order_sequences')
                ->where('order_date', $todayDate)
                ->lockForUpdate()
                ->first();

            $currentNumber = $seq ? (int) $seq->last_number : 0;

            // If current sequence is 0, check if any existing orders already use the sequential format today
            if ($currentNumber === 0) {
                $existingMax = DB::table('ecommerce_orders')
                    ->where('order_number', 'like', "KREZOEMA-{$dateStr}-%")
                    ->get()
                    ->map(function ($order) use ($dateStr) {
                        if (preg_match("/^KREZOEMA-{$dateStr}-(\\d{4})$/", $order->order_number, $matches)) {
                            return (int) $matches[1];
                        }
                        return 0;
                    })
                    ->max() ?? 0;

                $currentNumber = $existingMax;
            }

            $nextNumber = $currentNumber + 1;

            // Double check against existing orders in case of any collision
            do {
                $formatted = str_pad((string) $nextNumber, 4, '0', STR_PAD_LEFT);
                $orderNumber = "KREZOEMA-{$dateStr}-{$formatted}";

                $exists = DB::table('ecommerce_orders')
                    ->where('order_number', $orderNumber)
                    ->exists();

                if ($exists) {
                    $nextNumber++;
                }
            } while ($exists);

            // Update the sequence record with the newly reserved number
            DB::table('ecommerce_order_sequences')
                ->where('order_date', $todayDate)
                ->update([
                    'last_number' => $nextNumber,
                    'updated_at' => now(),
                ]);

            return $orderNumber;
        };

        if (DB::transactionLevel() > 0) {
            return $doGenerate();
        }

        return DB::transaction($doGenerate);
    }
}
