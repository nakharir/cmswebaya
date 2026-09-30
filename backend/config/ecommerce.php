<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Manual Bank Transfer Configuration
    |--------------------------------------------------------------------------
    |
    | Destination bank details and payment window for manual transfer orders.
    |
    */
    'manual_transfer' => [
        'bank_name' => env('MANUAL_TRANSFER_BANK_NAME', 'BCA'),
        'account_number' => env('MANUAL_TRANSFER_ACCOUNT_NUMBER', '8290123456'),
        'account_holder' => env('MANUAL_TRANSFER_ACCOUNT_HOLDER', 'KREZOEMA CRAFT'),
        'payment_deadline_hours' => (int) env('MANUAL_TRANSFER_DEADLINE_HOURS', 24),
    ],
];
