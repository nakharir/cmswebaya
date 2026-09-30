<?php

namespace App\Http\Controllers\Ecommerce;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ecommerce\StoreCustomerAddressRequest;
use App\Http\Requests\Ecommerce\UpdateCustomerAddressRequest;
use App\Http\Resources\Ecommerce\CustomerAddressResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class CustomerAddressController extends Controller
{
    /**
     * Display a listing of addresses for the authenticated customer.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $addresses = $request->user()
            ->addresses()
            ->orderBy('is_default', 'desc')
            ->orderBy('id', 'asc')
            ->get();

        return CustomerAddressResource::collection($addresses);
    }

    /**
     * Store a newly created address for the authenticated customer.
     */
    public function store(StoreCustomerAddressRequest $request): JsonResponse
    {
        $user = $request->user();

        $address = DB::transaction(function () use ($user, $request) {
            $hasExisting = $user->addresses()->exists();

            // First address is always default, otherwise follow input
            $isDefault = !$hasExisting || $request->boolean('is_default');

            if ($isDefault && $hasExisting) {
                $user->addresses()->where('is_default', true)->update(['is_default' => false]);
            }

            return $user->addresses()->create(array_merge(
                $request->validated(),
                ['is_default' => $isDefault]
            ));
        });

        return (new CustomerAddressResource($address))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified address of the authenticated customer.
     */
    public function show(Request $request, int $id): CustomerAddressResource|JsonResponse
    {
        $address = $request->user()->addresses()->find($id);

        if (!$address) {
            return response()->json([
                'message' => 'Address not found',
            ], 404);
        }

        return new CustomerAddressResource($address);
    }

    /**
     * Update the specified address of the authenticated customer.
     */
    public function update(UpdateCustomerAddressRequest $request, int $id): CustomerAddressResource|JsonResponse
    {
        $user = $request->user();
        $address = $user->addresses()->find($id);

        if (!$address) {
            return response()->json([
                'message' => 'Address not found',
            ], 404);
        }

        DB::transaction(function () use ($user, $address, $request, $id) {
            $data = $request->validated();

            if ($request->has('is_default')) {
                if ($request->boolean('is_default')) {
                    $user->addresses()->where('id', '!=', $id)->where('is_default', true)->update(['is_default' => false]);
                    $data['is_default'] = true;
                } else {
                    // If user tries to unset the default address
                    if ($address->is_default) {
                        $next = $user->addresses()->where('id', '!=', $id)->orderBy('id', 'asc')->first();
                        if ($next) {
                            $next->update(['is_default' => true]);
                            $data['is_default'] = false;
                        } else {
                            // Only 1 address, keep it as default
                            $data['is_default'] = true;
                        }
                    }
                }
            }

            $address->update($data);
        });

        return new CustomerAddressResource($address->fresh());
    }

    /**
     * Remove the specified address and deterministically promote another if default was deleted.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $address = $user->addresses()->find($id);

        if (!$address) {
            return response()->json([
                'message' => 'Address not found',
            ], 404);
        }

        DB::transaction(function () use ($user, $address, $id) {
            $wasDefault = (bool) $address->is_default;
            $address->delete();

            if ($wasDefault) {
                // Deterministically promote another address (oldest / lowest id)
                $nextDefault = $user->addresses()->orderBy('id', 'asc')->first();
                if ($nextDefault) {
                    $nextDefault->update(['is_default' => true]);
                }
            }
        });

        return response()->json([
            'message' => 'Address deleted successfully',
        ], 200);
    }

    /**
     * Set the specified address as the default address.
     */
    public function setDefault(Request $request, int $id): CustomerAddressResource|JsonResponse
    {
        $user = $request->user();
        $address = $user->addresses()->find($id);

        if (!$address) {
            return response()->json([
                'message' => 'Address not found',
            ], 404);
        }

        DB::transaction(function () use ($user, $address, $id) {
            $user->addresses()->where('id', '!=', $id)->where('is_default', true)->update(['is_default' => false]);
            $address->update(['is_default' => true]);
        });

        return new CustomerAddressResource($address->fresh());
    }
}
