<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminOrOperator
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Hanya Super Admin, Admin, dan Operator
        // yang diizinkan mengakses dashboard admin umum.
        if (!$user->hasRole([
            'super_admin',
            'admin',
            'operator',
        ])) {
            return response()->json([
                'message' => 'Anda tidak memiliki hak akses ke halaman admin ini.',
            ], 403);
        }

        return $next($request);
    }
}
