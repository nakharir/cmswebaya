<?php

namespace App\Http\Controllers;

use App\Models\User;
use DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;
use Log;

class UserController extends Controller
{
    public function register(Request $req)
    {
        $req->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        $user = new User;
        $user->name = $req->input('name');
        $user->email = $req->input('email');
        $user->password = Hash::make($req->input('password'));
        $user->phone = $req->input('phone');
        $user->address = $req->input('address');
        $user->status = $req->input('status', 1);

        $sidebars = [];
        if (class_exists('App\Models\Sidebar')) {
            $sidebars = \App\Models\Sidebar::all(['sidebar_id', 'label', 'to_path', 'status', 'children'])
                ->map(function ($sidebar) {
                    $sidebar->children = $sidebar->children ?: [];
                    return $sidebar;
                })->toArray();
        }

        $user->sidebars = $sidebars;
        $user->save();

        return response()->json($user, 201);
    }

    public function update(Request $req, $id)
    {
        $user = User::findOrFail($id);

        $req->validate([
            'status' => 'nullable|integer|in:0,1,2',
        ]);

        $authUser = $req->user('sanctum') ?? $req->user();

        // Validasi hak akses: hanya Superadmin (status = 1) yang dapat mengubah role
        if ($req->has('status') && $req->input('status') !== null) {
            $newStatus = (int) $req->input('status');
            if ($newStatus !== (int) $user->status) {
                if (!$authUser || (int) $authUser->status !== 1) {
                    return response()->json([
                        'message' => 'Hanya Superadmin yang dapat mengubah role pengguna.',
                    ], 403);
                }
                $user->status = $newStatus;
            }
        }

        if ($req->has('name')) {
            $user->name = $req->input('name');
        }
        if ($req->has('email')) {
            $user->email = $req->input('email');
        }
        
        $sidebars = $req->input('sidebars');
    
        if (!is_array($sidebars)) {
            $sidebars = json_decode($sidebars, true);
        }
        $validatedSidebars = is_array($sidebars) ? array_map(function ($sidebar) {
            return [
                'sidebar_id' => $sidebar['sidebar_id'] ?? null,
                'label' => $sidebar['label'] ?? '',
                'to_path' => $sidebar['to_path'] ?? '',
                'status' => $sidebar['status'] ?? 1,
                'children' => $sidebar['children'] ?? []
            ];
        }, $sidebars) : [];

        $user->sidebars = $validatedSidebars;
        $user->save();
        
        return response()->json($user);
    }

    public function getUserWithSidebars($userId)
    {
        $user = User::find($userId);

        if (!$user) {
            return response()->json(["Error" => "User not found"], 404);
        }

        return response()->json($user);
    }

    public function login(Request $req)
    {
        $req->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $req->email)->first();

        if (!$user || !Hash::check($req->password, $user->password)) {
            return response()->json(["Error" => "Sorry, email or password doesn't match"], 401);
        }

        $token = $user->createToken('admin-token')->plainTextToken;
        $user->token = $token;

        return response()->json($user);
    }

    public function getAllUsers()
    {
        // Fetch users from the User table (Superadmin dan Admin, tanpa Customer)
        $users = User::whereIn('status', [1, 2])->get();
        $users = $users->map(function ($user) {
            if (is_string($user->sidebars)) {
                $user->sidebars = json_decode($user->sidebars, true);
            }

            return $user;
        });

        return response()->json($users);
    }

    public function syncUserSidebars()
    {
        $users = User::all();

        $sidebarData = [];
        if (class_exists('App\Models\Sidebar')) {
            $sidebars = \App\Models\Sidebar::all(['sidebar_id', 'label', 'to_path', 'status', 'children']);
            $sidebarData = $sidebars->map(function ($sidebar) {
                $sidebar->children = $sidebar->children ?: [];
                return $sidebar;
            })->toArray();
        }

        foreach ($users as $user) {
            $user->sidebars = $sidebarData;
            $user->save();
        }

        return response()->json(['message' => 'User sidebars synced successfully.']);
    }

    public function updateSidebarStatus(Request $request)
    {
        try {
            $request->validate([
                'user_id' => 'required|exists:users,id',
                'sidebar_id' => 'required|integer',
            ]);

            $user = User::findOrFail($request->user_id);
            $sidebars = $user->sidebars ?: [];

            $updated = false;
            foreach ($sidebars as &$sidebar) {
                if ($sidebar['sidebar_id'] == $request->sidebar_id) {
                    $sidebar['status'] = $sidebar['status'] == 2 ? 1 : 2;
                    $updated = true;
                    break;
                }
            }

            if (!$updated) {
                return response()->json(['error' => 'Sidebar not found'], 404);
            }

            $user->sidebars = $sidebars;
            $user->save();

            return response()->json([
                'message' => 'Sidebar status updated successfully',
                'user_id' => $user->id,
                'sidebar_id' => $request->sidebar_id,
                'new_status' => $sidebar['status']
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function verifyUser(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'email' => 'required|email',
                'password' => 'required'
            ]);

            $user = User::where('email', $validatedData['email'])
                       ->where('status', 2)
                       ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak ditemukan atau tidak memiliki akses approval'
                ], 401);
            }

            if (!Hash::check($validatedData['password'], $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Password salah'
                ], 401);
            }

            return response()->json([
                'success' => true,
                'message' => 'Verifikasi berhasil'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 
                'message' => 'Terjadi kesalahan saat verifikasi user'
            ], 500);
        }
    }

    /**
     * Mengambil daftar akun admin (status = 1 Superadmin atau status = 2 Admin)
     * Customer (status = 0) tidak ditampilkan pada daftar Kelola User
     */
    public function getOperators(Request $request)
    {
        try {
            // Jika request membawa token, pastikan bukan customer biasa (status 0)
            $authUser = $request->user('sanctum') ?? $request->user();
            if ($authUser && !in_array((int) $authUser->status, [1, 2, 3], true)) {
                return response()->json([
                    'message' => 'Anda tidak memiliki hak akses ke data admin.',
                ], 403);
            }

            // Hanya mengambil akun Superadmin (status = 1) dan Admin (status = 2)
            $admins = User::whereIn('status', [1, 2])
                ->orderBy('id', 'asc')
                ->get()
                ->makeVisible(['password']);

            return response()->json($admins);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil data admin: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Menambahkan akun admin / pengguna baru
     */
    public function addOperator(Request $request)
    {
        try {
            $authUser = $request->user('sanctum') ?? $request->user();
            if ($authUser && !in_array((int) $authUser->status, [1, 2, 3], true)) {
                return response()->json([
                    'message' => 'Anda tidak memiliki hak akses untuk menambahkan admin.',
                ], 403);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users,email',
                'password' => 'required|string|min:6',
                'phone' => 'nullable|string|max:255',
                'address' => 'nullable|string|max:255',
                'status' => 'nullable|integer|in:0,1,2',
            ]);

            $admin = new User;
            $admin->name = $validated['name'];
            $admin->email = $validated['email'];
            $admin->password = Hash::make($validated['password']);
            $admin->phone = $request->input('phone');
            $admin->address = $request->input('address');

            // Default status ke 2 (Admin) jika tidak ditentukan, atau pastikan status berada pada pilihan role (0, 1, 2)
            $status = $request->has('status') && $request->input('status') !== null ? (int) $request->input('status') : 2;
            $admin->status = in_array($status, [0, 1, 2], true) ? $status : 2;

            $sidebars = [];
            if (class_exists('App\Models\Sidebar')) {
                $sidebars = \App\Models\Sidebar::all(['sidebar_id', 'label', 'to_path', 'status', 'children'])
                    ->map(function ($sidebar) {
                        $sidebar->children = $sidebar->children ?: [];
                        return $sidebar;
                    })->toArray();
            }
            $admin->sidebars = $sidebars;
            $admin->save();

            return response()->json($admin->makeVisible(['password']), 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => $e->validator->errors()->first(),
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menambahkan data admin: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Memperbarui data akun pengguna / admin
     */
    public function updateOperator(Request $request, $id)
    {
        try {
            $authUser = $request->user('sanctum') ?? $request->user();
            if ($authUser && !in_array((int) $authUser->status, [1, 2, 3], true)) {
                return response()->json([
                    'message' => 'Anda tidak memiliki hak akses untuk mengubah data admin.',
                ], 403);
            }

            $admin = User::findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users,email,' . $id,
                'password' => 'nullable|string|min:6',
                'phone' => 'nullable|string|max:255',
                'address' => 'nullable|string|max:255',
                'status' => 'nullable|integer|in:0,1,2',
            ]);

            // Validasi hak akses khusus untuk perubahan role (hanya Superadmin dengan status = 1)
            if ($request->has('status') && $request->input('status') !== null) {
                $newStatus = (int) $request->input('status');
                if ($newStatus !== (int) $admin->status) {
                    if (!$authUser || (int) $authUser->status !== 1) {
                        return response()->json([
                            'message' => 'Hanya Superadmin yang dapat mengubah role pengguna.',
                        ], 403);
                    }
                    $admin->status = $newStatus;
                }
            }

            $admin->name = $validated['name'];
            $admin->email = $validated['email'];
            if (!empty($validated['password'])) {
                $admin->password = Hash::make($validated['password']);
            }
            $admin->phone = $request->input('phone');
            $admin->address = $request->input('address');

            $admin->save();

            return response()->json($admin->makeVisible(['password']));
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => $e->validator->errors()->first(),
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal memperbarui data admin: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Menghapus data admin
     */
    public function deleteOperator(Request $request, $id)
    {
        try {
            $authUser = $request->user('sanctum') ?? $request->user();
            if ($authUser && !in_array((int) $authUser->status, [1, 2, 3], true)) {
                return response()->json([
                    'message' => 'Anda tidak memiliki hak akses untuk menghapus data admin.',
                ], 403);
            }

            $admin = User::findOrFail($id);
            $admin->delete();

            return response()->json(['message' => 'Data admin berhasil dihapus']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menghapus data admin: ' . $e->getMessage(),
            ], 500);
        }
    }
}
