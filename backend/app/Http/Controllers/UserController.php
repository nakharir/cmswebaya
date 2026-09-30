<?php

namespace App\Http\Controllers;

use App\Models\Sidebar;
use App\Models\User;
use DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;
use Log;

class UserController extends Controller
{
    public function register(Request $req)
    {
        $user = new User;
        $user->name = $req->input('name');
        $user->email = $req->input('email');
        $user->password = Hash::make($req->input('password'));
        $user->phone = $req->input('phone');
        $user->address = $req->input('address');
        $user->status = $req->input('status');

        $sidebars = Sidebar::all(['sidebar_id', 'label', 'to_path', 'status', 'children']);

        // Transformasi data sidebar
        $sidebars = $sidebars->map(function ($sidebar) {
            $sidebar->children = $sidebar->children ?: [];
            return $sidebar;
        })->toArray();

        $user->sidebars = $sidebars;

        $user->save();

        return response()->json($user);
    }
    public function update(Request $req, $id)
    {
        $user = User::find($id);
        $user->name = $req->input('name');
        $user->email = $req->input('email');
        $user->status = $req->input('status');
        
        $sidebars = $req->input('sidebars');
    
        if (!is_array($sidebars)) {
            $sidebars = json_decode($sidebars, true);
        }
        $validatedSidebars = array_map(function ($sidebar) {
            return [
                'sidebar_id' => $sidebar['sidebar_id'],
                'label' => $sidebar['label'],
                'to_path' => $sidebar['to_path'],
                'status' => $sidebar['status'],
                'children' => $sidebar['children'] ?? []
            ];
        }, $sidebars);

        // $user->sidebars = json_encode($validatedSidebars);
        $user->sidebars = $validatedSidebars;
        $user->save();
        // $user->sidebars = json_decode($user->sidebars, true);
        
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
        // Fetch all users from the User table
        $users = User::all();
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
        // Fetch all users
        $users = User::all();

        // Fetch all sidebars
        $sidebars = Sidebar::all(['sidebar_id', 'label', 'to_path', 'status', 'children']);

        // Transformasi data sidebar
        $sidebarData = $sidebars->map(function ($sidebar) {
            $sidebar->children = $sidebar->children ?: [];
            return $sidebar;
        })->toArray();

        foreach ($users as $user) {
            // Update user's sidebars with the new sidebar list
            $user->sidebars = $sidebarData;
            $user->save();
        }

        // return response()->json($sidebarData);
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
            $sidebars = $user->sidebars;

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
}
