<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EcommerceCustomerAuthTest extends TestCase
{
    use DatabaseTransactions;

    /**
     * Test successful registration.
     */
    public function test_customer_can_register_successfully(): void
    {
        $payload = [
            'name' => 'Budi Prakoso',
            'email' => 'budi.' . uniqid() . '@example.com',
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
            'phone' => '081234567890',
        ];

        $response = $this->postJson('/api/ecommerce/auth/register', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => ['id', 'name', 'email'],
                'token',
            ])
            ->assertJson([
                'data' => [
                    'name' => 'Budi Prakoso',
                    'email' => $payload['email'],
                ]
            ]);

        $this->assertNotEmpty($response->json('token'));

        // Verify password is not plaintext
        $user = User::where('email', $payload['email'])->first();
        $this->assertNotNull($user);
        $this->assertNotEquals('secret1234', $user->password);
        $this->assertTrue(Hash::check('secret1234', $user->password));
    }

    /**
     * Test registration rejects duplicate email.
     */
    public function test_customer_registration_rejects_duplicate_email(): void
    {
        $existing = User::factory()->create([
            'email' => 'existing.' . uniqid() . '@example.com',
        ]);

        $payload = [
            'name' => 'Another User',
            'email' => $existing->email,
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
        ];

        $response = $this->postJson('/api/ecommerce/auth/register', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test registration rejects password confirmation mismatch.
     */
    public function test_customer_registration_rejects_password_mismatch(): void
    {
        $payload = [
            'name' => 'Mismatched User',
            'email' => 'mismatch.' . uniqid() . '@example.com',
            'password' => 'secret1234',
            'password_confirmation' => 'different_pass',
        ];

        $response = $this->postJson('/api/ecommerce/auth/register', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /**
     * Test successful login returns token.
     */
    public function test_customer_can_login_with_correct_credentials(): void
    {
        $email = 'login.' . uniqid() . '@example.com';
        $user = User::factory()->create([
            'email' => $email,
            'password' => Hash::make('mypassword123'),
        ]);

        $response = $this->postJson('/api/ecommerce/auth/login', [
            'email' => $email,
            'password' => 'mypassword123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => ['id', 'name', 'email'],
                'token',
            ])
            ->assertJson([
                'data' => [
                    'id' => $user->id,
                    'email' => $email,
                ]
            ]);

        $this->assertNotEmpty($response->json('token'));
    }

    /**
     * Test login fails with invalid password.
     */
    public function test_customer_login_fails_with_wrong_password(): void
    {
        $email = 'wrongpass.' . uniqid() . '@example.com';
        User::factory()->create([
            'email' => $email,
            'password' => Hash::make('correct_pass'),
        ]);

        $response = $this->postJson('/api/ecommerce/auth/login', [
            'email' => $email,
            'password' => 'wrong_pass',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Invalid email or password',
            ]);
    }

    /**
     * Test /me endpoint requires authentication.
     */
    public function test_me_endpoint_requires_auth(): void
    {
        $response = $this->getJson('/api/ecommerce/auth/me');
        $response->assertStatus(401);
    }

    /**
     * Test /me endpoint returns authenticated user.
     */
    public function test_me_endpoint_returns_authenticated_customer(): void
    {
        $user = User::factory()->create([
            'name' => 'Current User',
            'email' => 'current.' . uniqid() . '@example.com',
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/ecommerce/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $user->id,
                    'name' => 'Current User',
                    'email' => $user->email,
                ]
            ]);
    }

    /**
     * Test logout revokes token.
     */
    public function test_customer_can_logout_and_revoke_token(): void
    {
        $user = User::factory()->create();
        $tokenResult = $user->createToken('logout-token');
        $plainToken   = $tokenResult->plainTextToken;
        $tokenId      = $tokenResult->accessToken->id;

        $logoutResponse = $this->withHeader('Authorization', 'Bearer ' . $plainToken)
            ->postJson('/api/ecommerce/auth/logout');

        $logoutResponse->assertStatus(200)
            ->assertJson(['message' => 'Logged out successfully']);

        // Assert the token record has been deleted from the database.
        // (A second HTTP call with the same token is not reliable under
        //  DatabaseTransactions because Sanctum may re-use the cached
        //  token object from the first request's lifecycle.)
        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $tokenId,
        ]);
    }

    /**
     * Test customer can update their own profile.
     */
    public function test_customer_can_update_profile(): void
    {
        $user = User::factory()->create([
            'name' => 'Original Name',
            'email' => 'orig.' . uniqid() . '@example.com',
        ]);

        $token = $user->createToken('test-token')->plainTextToken;
        $newEmail = 'updated.' . uniqid() . '@example.com';

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/ecommerce/auth/profile', [
                'name' => 'Updated Name',
                'email' => $newEmail,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'name' => 'Updated Name',
                    'email' => $newEmail,
                ]
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
            'email' => $newEmail,
        ]);
    }

    /**
     * Test profile update rejects duplicate email from another user.
     */
    public function test_profile_update_rejects_duplicate_email(): void
    {
        $user1 = User::factory()->create(['email' => 'user1.' . uniqid() . '@example.com']);
        $user2 = User::factory()->create(['email' => 'user2.' . uniqid() . '@example.com']);

        $token = $user1->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/ecommerce/auth/profile', [
                'email' => $user2->email,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }
}
