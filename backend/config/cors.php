<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        // CMS Admin (Vercel production)
        'https://cmskrezoema.vercel.app',
        // Public storefront (Vercel production)
        'https://krezoema.vercel.app',
        // Vercel preview deployments (semua subdomain vercel.app)
        // Tambahkan preview URL jika diperlukan, contoh:
        // 'https://cmskrezoema-git-main-youruser.vercel.app',
        // Development lokal
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'http://localhost:3002',
        'http://127.0.0.1:3002',
        'http://localhost:3003',
        'http://127.0.0.1:3003',
    ],

    'allowed_origins_patterns' => [
        // Mengizinkan semua preview deployment Vercel untuk kedua project
        '#^https://cmskrezoema.*\.vercel\.app$#',
        '#^https://krezoema.*\.vercel\.app$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // false karena auth menggunakan Bearer token, bukan cookie/session
    'supports_credentials' => false,

];
