<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Memeriksa autentikasi dan hak akses.
     */
    private function authorizeRoles(
        Request $request,
        array $roles
    ): ?JsonResponse {
        $authUser = $request->user('sanctum') ?? $request->user();

        if (!$authUser) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (!$authUser->hasRole($roles)) {
            return response()->json([
                'message' => 'Anda tidak memiliki hak akses.',
            ], 403);
        }

        return null;
    }

    /**
     * Menyesuaikan status lama agar tetap kompatibel.
     */
    private function legacyStatusForRole(string $role): int
    {
        return match ($role) {
            User::ROLE_CUSTOMER => 0,
            User::ROLE_OPERATOR => 3,
            default => 1,
        };
    }

    /**
     * Mengambil sidebar default.
     */
    private function getDefaultSidebars(): array
    {
        if (!class_exists('App\Models\Sidebar')) {
            return [];
        }

        return \App\Models\Sidebar::all([
            'sidebar_id',
            'label',
            'to_path',
            'status',
            'children',
        ])->map(function ($sidebar) {
            $sidebar->children = $sidebar->children ?: [];
            return $sidebar;
        })->toArray();
    }

    /**
     * Register Customer.
     */
    public function register(Request $request)
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

        // Register publik selalu menjadi Customer.
        $user->role = User::ROLE_CUSTOMER;
        $user->status = 0;
        $user->sidebars = $this->getDefaultSidebars();

        $user->save();

        return response()->json($user, 201);
    }

    /**
     * Login semua pengguna.
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check(
            $validated['password'],
            $user->password
        )) {
            return response()->json([
                'message' => 'Email atau password tidak sesuai.',
            ], 401);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        $user->makeHidden([
            'password',
            'remember_token',
        ]);

        $user->token = $token;

        return response()->json($user);
    }

    /**
     * Mengambil user beserta sidebar.
     * User hanya boleh mengambil datanya sendiri,
     * kecuali Admin dan Super Admin.
     */
    public function getUserWithSidebars(Request $request, $userId)
    {
        $authUser = $request->user('sanctum') ?? $request->user();

        if (!$authUser) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (
            !$authUser->isAdmin() &&
            (int) $authUser->id !== (int) $userId
        ) {
            return response()->json([
                'message' => 'Anda tidak boleh mengakses data pengguna lain.',
            ], 403);
        }

        $user = User::find($userId);

        if (!$user) {
            return response()->json([
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        return response()->json($user);
    }

    /**
     * Mengambil seluruh pengguna.
     * Hanya Admin dan Super Admin.
     */
    public function getAllUsers(Request $request)
    {
        $denied = $this->authorizeRoles($request, [
            User::ROLE_SUPER_ADMIN,
            User::ROLE_ADMIN,
        ]);

        if ($denied) {
            return $denied;
        }

        $users = User::orderBy('id', 'asc')->get();

        return response()->json($users);
    }

    /**
     * Memperbarui data pengguna.
     * Perubahan Role hanya boleh dilakukan Super Admin.
     */
    public function update(Request $request, $id)
    {
        $denied = $this->authorizeRoles($request, [
            User::ROLE_SUPER_ADMIN,
            User::ROLE_ADMIN,
        ]);

        if ($denied) {
            return $denied;
        }

        $authUser = $request->user('sanctum') ?? $request->user();
        $user = User::findOrFail($id);

        if ($user->isSuperAdmin() && !$authUser->isSuperAdmin()) {
            return response()->json([
                'message' => 'Admin tidak boleh mengubah akun Super Admin.',
            ], 403);
        }

        // Mendukung frontend lama yang mengirim sidebar berbentuk JSON.
        if ($request->has('sidebars') && is_string($request->sidebars)) {
            $decoded = json_decode($request->sidebars, true);

            if (!is_array($decoded)) {
                return response()->json([
                    'message' => 'Format sidebar tidak valid.',
                ], 422);
            }

            $request->merge([
                'sidebars' => $decoded,
            ]);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:users,email,' . $id,
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'sidebars' => 'sometimes|nullable|array',
            'status' => 'sometimes|integer|in:0,1,2,3',
            'role' => 'sometimes|string|in:super_admin,admin,operator,customer',
        ]);

        // Admin biasa tidak boleh mengubah Role atau status lama.
        if (
            ($request->has('role') || $request->has('status')) &&
            !$authUser->isSuperAdmin()
        ) {
            return response()->json([
                'message' => 'Hanya Super Admin yang boleh mengubah Role.',
            ], 403);
        }

        foreach (['name', 'email', 'phone', 'address'] as $field) {
            if (array_key_exists($field, $validated)) {
                $user->{$field} = $validated[$field];
            }
        }

        if (array_key_exists('sidebars', $validated)) {
            $user->sidebars = $validated['sidebars'] ?? [];
        }

        if (isset($validated['role'])) {
            $user->role = $validated['role'];
            $user->status = $this->legacyStatusForRole($validated['role']);
        } elseif (isset($validated['status'])) {
            $legacyRole = match ((int) $validated['status']) {
                0 => User::ROLE_CUSTOMER,
                1, 2 => User::ROLE_ADMIN,
                3 => User::ROLE_OPERATOR,
            };

            $user->role = $legacyRole;
            $user->status = $this->legacyStatusForRole($legacyRole);
        }

        $user->save();

        return response()->json($user);
    }

    /**
     * Menyamakan sidebar seluruh pengguna.
     * Hanya Super Admin.
     */
    public function syncUserSidebars(Request $request)
    {
        $denied = $this->authorizeRoles($request, [
            User::ROLE_SUPER_ADMIN,
        ]);

        if ($denied) {
            return $denied;
        }

        $sidebarData = $this->getDefaultSidebars();

        User::query()->update([
            'sidebars' => json_encode($sidebarData),
        ]);

        return response()->json([
            'message' => 'User sidebars berhasil disinkronkan.',
        ]);
    }

    /**
     * Mengubah status sidebar pengguna.
     */
    public function updateSidebarStatus(Request $request)
    {
        $denied = $this->authorizeRoles($request, [
            User::ROLE_SUPER_ADMIN,
            User::ROLE_ADMIN,
        ]);

        if ($denied) {
            return $denied;
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'sidebar_id' => 'required|integer',
        ]);

        $user = User::findOrFail($validated['user_id']);
        $authUser = $request->user();

        if ($user->isSuperAdmin() && !$authUser->isSuperAdmin()) {
            return response()->json([
                'message' => 'Admin tidak boleh mengubah sidebar Super Admin.',
            ], 403);
        }

        $sidebars = $user->sidebars ?? [];
        $updated = false;
        $newStatus = null;

        foreach ($sidebars as &$sidebar) {
            if ((int) ($sidebar['sidebar_id'] ?? 0) ===
                (int) $validated['sidebar_id']) {

                $sidebar['status'] =
                    (int) ($sidebar['status'] ?? 1) === 2 ? 1 : 2;

                $newStatus = $sidebar['status'];
                $updated = true;
                break;
            }
        }

        unset($sidebar);

        if (!$updated) {
            return response()->json([
                'message' => 'Sidebar tidak ditemukan.',
            ], 404);
        }

        $user->sidebars = $sidebars;
        $user->save();

        return response()->json([
            'message' => 'Status sidebar berhasil diperbarui.',
            'user_id' => $user->id,
            'sidebar_id' => $validated['sidebar_id'],
            'new_status' => $newStatus,
        ]);
    }

    /**
     * Memverifikasi identitas Admin atau Super Admin.
     */
    public function verifyUser(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (
            !$user ||
            !$user->isAdmin() ||
            !Hash::check($validated['password'], $user->password)
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Verifikasi gagal atau Anda tidak memiliki hak approval.',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'message' => 'Verifikasi berhasil.',
        ]);
    }

    /**
     * Mengambil daftar Admin dan Operator.
     */
    public function getOperators(Request $request)
    {
        $denied = $this->authorizeRoles($request, [
            User::ROLE_SUPER_ADMIN,
            User::ROLE_ADMIN,
        ]);

        if ($denied) {
            return $denied;
        }

        $users = User::whereIn('role', [
            User::ROLE_ADMIN,
            User::ROLE_OPERATOR,
        ])->orderBy('id', 'asc')->get();

        return response()->json($users);
    }

    /**
     * Menambahkan Admin atau Operator.
     * Admin biasa hanya boleh menambahkan Operator.
     */
    public function addOperator(Request $request)
    {
        $denied = $this->authorizeRoles($request, [
            User::ROLE_SUPER_ADMIN,
            User::ROLE_ADMIN,
        ]);

        if ($denied) {
            return $denied;
        }

        $authUser = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'role' => 'nullable|in:admin,operator',
            'status' => 'nullable|integer|in:1,2,3',
        ]);

        $role = $validated['role'] ?? null;

        if (!$role) {
            if (isset($validated['status']) &&
                (int) $validated['status'] === 3) {
                $role = User::ROLE_OPERATOR;
            } else {
                $role = $authUser->isSuperAdmin()
                    ? User::ROLE_ADMIN
                    : User::ROLE_OPERATOR;
            }
        }

        if (!$authUser->isSuperAdmin() &&
            $role !== User::ROLE_OPERATOR) {
            return response()->json([
                'message' => 'Admin hanya boleh membuat akun Operator.',
            ], 403);
        }

        $user = new User();
        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->password = Hash::make($validated['password']);
        $user->phone = $validated['phone'] ?? null;
        $user->address = $validated['address'] ?? null;
        $user->role = $role;
        $user->status = $this->legacyStatusForRole($role);
        $user->sidebars = $this->getDefaultSidebars();
        $user->save();

        return response()->json($user, 201);
    }

    /**
     * Memperbarui data Admin atau Operator.
     */
    public function updateOperator(Request $request, $id)
    {
        $denied = $this->authorizeRoles($request, [
            User::ROLE_SUPER_ADMIN,
            User::ROLE_ADMIN,
        ]);

        if ($denied) {
            return $denied;
        }

        $authUser = $request->user();
        $user = User::findOrFail($id);

        if (!in_array($user->role, [
            User::ROLE_ADMIN,
            User::ROLE_OPERATOR,
        ], true)) {
            return response()->json([
                'message' => 'Akun ini tidak dapat diubah melalui menu Admin/Operator.',
            ], 403);
        }

        if (!$authUser->isSuperAdmin() &&
            $user->role !== User::ROLE_OPERATOR) {
            return response()->json([
                'message' => 'Admin hanya boleh mengubah data Operator.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $id,
            'password' => 'nullable|string|min:6',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'role' => 'nullable|in:admin,operator',
            'status' => 'nullable|integer|in:1,2,3',
        ]);

        if (
            (isset($validated['role']) || isset($validated['status'])) &&
            !$authUser->isSuperAdmin()
        ) {
            return response()->json([
                'message' => 'Hanya Super Admin yang boleh mengubah Role.',
            ], 403);
        }

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->phone = $validated['phone'] ?? null;
        $user->address = $validated['address'] ?? null;

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        if (isset($validated['role'])) {
            $user->role = $validated['role'];
            $user->status = $this->legacyStatusForRole($validated['role']);
        } elseif (isset($validated['status'])) {
            $legacyRole = (int) $validated['status'] === 3
                ? User::ROLE_OPERATOR
                : User::ROLE_ADMIN;

            $user->role = $legacyRole;
            $user->status = $this->legacyStatusForRole($legacyRole);
        }

        $user->save();

        return response()->json($user);
    }

    /**
     * Menghapus Admin atau Operator.
     */
    public function deleteOperator(Request $request, $id)
    {
        $denied = $this->authorizeRoles($request, [
            User::ROLE_SUPER_ADMIN,
            User::ROLE_ADMIN,
        ]);

        if ($denied) {
            return $denied;
        }

        $authUser = $request->user();
        $user = User::findOrFail($id);

        if ((int) $authUser->id === (int) $user->id) {
            return response()->json([
                'message' => 'Anda tidak boleh menghapus akun sendiri.',
            ], 403);
        }

        if (!in_array($user->role, [
            User::ROLE_ADMIN,
            User::ROLE_OPERATOR,
        ], true)) {
            return response()->json([
                'message' => 'Akun ini tidak dapat dihapus melalui menu Admin/Operator.',
            ], 403);
        }

        if (!$authUser->isSuperAdmin() &&
            $user->role !== User::ROLE_OPERATOR) {
            return response()->json([
                'message' => 'Admin hanya boleh menghapus akun Operator.',
            ], 403);
        }

        $user->delete();

        return response()->json([
            'message' => 'Data pengguna berhasil dihapus.',
        ]);
    }
}
