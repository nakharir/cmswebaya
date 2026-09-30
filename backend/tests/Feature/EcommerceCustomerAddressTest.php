<?php

namespace Tests\Feature;

use App\Models\Ecommerce\CustomerAddress;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class EcommerceCustomerAddressTest extends TestCase
{
    use DatabaseTransactions;

    /**
     * Test first address is automatically set as default.
     */
    public function test_first_address_is_automatically_default(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $payload = [
            'label' => 'Rumah',
            'recipient_name' => 'Amrizal',
            'whatsapp' => '08123456789',
            'address' => 'Jl. Mawar No. 12',
            'district' => 'Kecamatan Klojen',
            'city' => 'Kota Malang',
            'province' => 'Jawa Timur',
            'postal_code' => '65111',
            'is_default' => false, // Even if passed false, first address must be default
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/ecommerce/addresses', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'label' => 'Rumah',
                    'recipient_name' => 'Amrizal',
                    'is_default' => true,
                ]
            ]);

        $this->assertDatabaseHas('ecommerce_customer_addresses', [
            'user_id' => $user->id,
            'label' => 'Rumah',
            'is_default' => 1,
        ]);
    }

    /**
     * Test creating a second non-default address keeps first as default.
     */
    public function test_second_non_default_address_preserves_first_default(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $firstAddress = CustomerAddress::factory()->create([
            'user_id' => $user->id,
            'label' => 'Alamat Pertama',
            'is_default' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/ecommerce/addresses', [
                'label' => 'Kantor',
                'recipient_name' => 'Amrizal Kantor',
                'whatsapp' => '08123456788',
                'address' => 'Jl. Melati No. 45',
                'district' => 'Kecamatan Lowokwaru',
                'city' => 'Kota Malang',
                'province' => 'Jawa Timur',
                'postal_code' => '65141',
                'is_default' => false,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'label' => 'Kantor',
                    'is_default' => false,
                ]
            ]);

        // First address remains default
        $this->assertTrue((bool) $firstAddress->fresh()->is_default);
    }

    /**
     * Test creating a new default address unsets previous default.
     */
    public function test_creating_new_default_unsets_previous_default(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $firstAddress = CustomerAddress::factory()->create([
            'user_id' => $user->id,
            'label' => 'Alamat Lama',
            'is_default' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/ecommerce/addresses', [
                'label' => 'Alamat Baru',
                'recipient_name' => 'Amrizal Baru',
                'whatsapp' => '08123456788',
                'address' => 'Jl. Baru No. 1',
                'district' => 'Kecamatan Sukun',
                'city' => 'Kota Malang',
                'province' => 'Jawa Timur',
                'postal_code' => '65146',
                'is_default' => true,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'label' => 'Alamat Baru',
                    'is_default' => true,
                ]
            ]);

        // First address is no longer default
        $this->assertFalse((bool) $firstAddress->fresh()->is_default);

        // Exactly one default address exists for this user
        $defaultCount = CustomerAddress::where('user_id', $user->id)->where('is_default', true)->count();
        $this->assertEquals(1, $defaultCount);
    }

    /**
     * Test list addresses only returns customer's own addresses ordered by default first.
     */
    public function test_customer_can_list_own_addresses_ordered_by_default(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $addr1 = CustomerAddress::factory()->create(['user_id' => $user1->id, 'label' => 'Secondary', 'is_default' => false]);
        $addr2 = CustomerAddress::factory()->create(['user_id' => $user1->id, 'label' => 'Primary', 'is_default' => true]);

        // Another user's address
        $otherAddr = CustomerAddress::factory()->create(['user_id' => $user2->id, 'label' => 'Other User Addr']);

        $token = $user1->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/ecommerce/addresses');

        $response->assertStatus(200);

        $labels = collect($response->json('data'))->pluck('label')->all();
        $ids = collect($response->json('data'))->pluck('id')->all();

        $this->assertContains($addr1->id, $ids);
        $this->assertContains($addr2->id, $ids);
        $this->assertNotContains($otherAddr->id, $ids);

        // Default address should be first
        $this->assertEquals('Primary', $labels[0]);
    }

    /**
     * Test customer can view own address detail.
     */
    public function test_customer_can_view_own_address(): void
    {
        $user = User::factory()->create();
        $addr = CustomerAddress::factory()->create(['user_id' => $user->id, 'label' => 'Detail Test']);
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson("/api/ecommerce/addresses/{$addr->id}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $addr->id,
                    'label' => 'Detail Test',
                ]
            ]);
    }

    /**
     * Test customer can update own address.
     */
    public function test_customer_can_update_own_address(): void
    {
        $user = User::factory()->create();
        $addr = CustomerAddress::factory()->create(['user_id' => $user->id, 'label' => 'Old Label']);
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson("/api/ecommerce/addresses/{$addr->id}", [
                'label' => 'New Updated Label',
                'recipient_name' => 'Updated Recipient',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'label' => 'New Updated Label',
                    'recipient_name' => 'Updated Recipient',
                ]
            ]);

        $this->assertDatabaseHas('ecommerce_customer_addresses', [
            'id' => $addr->id,
            'label' => 'New Updated Label',
        ]);
    }

    /**
     * Test customer can set address as default via endpoint.
     */
    public function test_customer_can_set_default_address(): void
    {
        $user = User::factory()->create();
        $addr1 = CustomerAddress::factory()->create(['user_id' => $user->id, 'is_default' => true]);
        $addr2 = CustomerAddress::factory()->create(['user_id' => $user->id, 'is_default' => false]);
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson("/api/ecommerce/addresses/{$addr2->id}/default");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $addr2->id,
                    'is_default' => true,
                ]
            ]);

        $this->assertFalse((bool) $addr1->fresh()->is_default);
        $this->assertTrue((bool) $addr2->fresh()->is_default);
    }

    /**
     * Test customer can delete address.
     */
    public function test_customer_can_delete_address(): void
    {
        $user = User::factory()->create();
        $addr1 = CustomerAddress::factory()->create(['user_id' => $user->id, 'is_default' => true]);
        $addr2 = CustomerAddress::factory()->create(['user_id' => $user->id, 'is_default' => false]);
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->deleteJson("/api/ecommerce/addresses/{$addr2->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Address deleted successfully']);

        $this->assertDatabaseMissing('ecommerce_customer_addresses', [
            'id' => $addr2->id,
        ]);
    }

    /**
     * Test deleting default address promotes remaining address deterministically.
     */
    public function test_deleting_default_address_promotes_remaining_address(): void
    {
        $user = User::factory()->create();
        $addr1 = CustomerAddress::factory()->create(['user_id' => $user->id, 'is_default' => true]);
        $addr2 = CustomerAddress::factory()->create(['user_id' => $user->id, 'is_default' => false]);
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->deleteJson("/api/ecommerce/addresses/{$addr1->id}");

        $response->assertStatus(200);

        // Address 2 should now be default
        $this->assertTrue((bool) $addr2->fresh()->is_default);
    }

    /**
     * Test customer cannot access another customer's address.
     */
    public function test_customer_cannot_access_or_modify_other_customers_address(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $addrOfUser2 = CustomerAddress::factory()->create(['user_id' => $user2->id]);
        $tokenOfUser1 = $user1->createToken('test-token')->plainTextToken;

        // 1. Show
        $showResponse = $this->withHeader('Authorization', 'Bearer ' . $tokenOfUser1)
            ->getJson("/api/ecommerce/addresses/{$addrOfUser2->id}");
        $showResponse->assertStatus(404);

        // 2. Update
        $updateResponse = $this->withHeader('Authorization', 'Bearer ' . $tokenOfUser1)
            ->putJson("/api/ecommerce/addresses/{$addrOfUser2->id}", ['label' => 'Hacked']);
        $updateResponse->assertStatus(404);

        // 3. Set Default
        $defaultResponse = $this->withHeader('Authorization', 'Bearer ' . $tokenOfUser1)
            ->postJson("/api/ecommerce/addresses/{$addrOfUser2->id}/default");
        $defaultResponse->assertStatus(404);

        // 4. Delete
        $deleteResponse = $this->withHeader('Authorization', 'Bearer ' . $tokenOfUser1)
            ->deleteJson("/api/ecommerce/addresses/{$addrOfUser2->id}");
        $deleteResponse->assertStatus(404);
    }

    /**
     * Test unauthenticated access is rejected.
     */
    public function test_unauthenticated_request_rejected(): void
    {
        $response = $this->getJson('/api/ecommerce/addresses');
        $response->assertStatus(401);

        $response = $this->postJson('/api/ecommerce/addresses', []);
        $response->assertStatus(401);
    }
}
