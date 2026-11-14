<?php

namespace App\Http\Controllers\Ecommerce;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class CustomerAuthController extends Controller
{
    /**
     * Mengambil data Customer tanpa password dan sidebar.
     */
    private function customerData(User $user, ?string $token = null): array
    {
        $data = $user->only([
            'id',
            'name',
            'email',
            'phone',
            'address',
            'status',
            'role',
        ]);

        if ($token !== null) {
            $data['token'] = $token;
        }

        return $data;
    }

    /**
     * Register Customer.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
        ]);

        $user = new User();

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->password = Hash::make($validated['password']);
        $user->phone = $validated['phone'] ?? null;
        $user->address = $validated['address'] ?? null;

        // Register melalui Ecommerce selalu Customer.
        // Role tidak boleh ditentukan oleh input pengguna.
        $user->role = User::ROLE_CUSTOMER;
        $user->status = 0;

        $user->save();

        return response()->json(
            $this->customerData($user),
            201
        );
    }

    /**
     * Login khusus Customer.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (
            !$user ||
            !Hash::check($validated['password'], $user->password)
        ) {
            return response()->json([
                'message' => 'Email atau password tidak sesuai.',
            ], 401);
        }

        if (!$user->isCustomer()) {
            return response()->json([
                'message' => 'Endpoint login ini khusus untuk Customer.',
            ], 403);
        }

        $token = $user->createToken('customer-auth-token')
            ->plainTextToken;

        return response()->json(
            $this->customerData($user, $token)
        );
    }

    /**
     * Logout Customer.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isCustomer()) {
            return response()->json([
                'message' => 'Akun ini bukan akun Customer.',
            ], 403);
        }

        $currentToken = $user->currentAccessToken();

        if ($currentToken && method_exists($currentToken, 'delete')) {
            $currentToken->delete();
        }

        return response()->json([
            'message' => 'Logout berhasil.',
        ]);
    }

    /**
     * Melihat profil Customer yang sedang login.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isCustomer()) {
            return response()->json([
                'message' => 'Akun ini bukan akun Customer.',
            ], 403);
        }

        return response()->json(
            $this->customerData($user)
        );
    }

    /**
     * Memperbarui profil Customer.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isCustomer()) {
            return response()->json([
                'message' => 'Akun ini bukan akun Customer.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'phone' => 'sometimes|nullable|string|max:255',
            'address' => 'sometimes|nullable|string|max:255',
        ]);

        $user->fill($validated);
        $user->save();

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user' => $this->customerData($user),
        ]);
    }
}
