<?php

namespace App\Http\Controllers\Ecommerce;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ecommerce\LoginCustomerRequest;
use App\Http\Requests\Ecommerce\RegisterCustomerRequest;
use App\Http\Requests\Ecommerce\UpdateCustomerProfileRequest;
use App\Http\Resources\Ecommerce\CustomerResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class CustomerAuthController extends Controller
{
    /**
     * Register a new customer and issue Sanctum token.
     */
    public function register(RegisterCustomerRequest $request): JsonResponse
    {
        $user = new User();
        $user->name = $request->name;
        $user->email = $request->email;
        $user->password = Hash::make($request->password);
        $user->status = 0; // Customer role status
        $user->created_at = now();
        $user->updated_at = now();
        $user->save();

        $token = $user->createToken('customer-token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful',
            'data' => new CustomerResource($user),
            'customer' => new CustomerResource($user),
            'token' => $token,
        ], 201);
    }

    /**
     * Authenticate customer credentials and return token.
     */
    public function login(LoginCustomerRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid email or password',
            ], 401);
        }

        $token = $user->createToken('customer-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'data' => new CustomerResource($user),
            'customer' => new CustomerResource($user),
            'token' => $token,
        ], 200);
    }

    /**
     * Log out authenticated customer by revoking current access token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ], 200);
    }

    /**
     * Get authenticated customer profile.
     */
    public function me(Request $request): CustomerResource
    {
        $user = $request->user();
        $user->load('defaultAddress');

        return new CustomerResource($user);
    }

    /**
     * Update customer profile.
     */
    public function updateProfile(UpdateCustomerProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->fill($request->validated());
        $user->updated_at = now();
        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'data' => new CustomerResource($user),
        ], 200);
    }
}
