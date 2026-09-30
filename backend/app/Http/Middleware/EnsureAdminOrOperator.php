<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminOrOperator
{
    /**
     * Handle an incoming request.
     * Ensure the authenticated user has back-office admin or operator privileges.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Status 1 = SuperAdmin, 2 = Admin, 3 = Visitor / Operator
        // Customers have status = 0 (or null) and must be rejected with 403 Forbidden
        if (!in_array((int) $user->status, [1, 2, 3], true)) {
            return response()->json([
                'message' => 'Anda tidak memiliki hak akses ke halaman admin ini.',
            ], 403);
        }

        return $next($request);
    }
}
