import { execSync } from 'child_process';

const BASE_URL = 'http://127.0.0.1:8000';

function runHelper(action, ...args) {
  const argStr = args.join(' ');
  const res = execSync(`php scripts/run_http_test_helper.php ${action} ${argStr}`, {
    cwd: 'D:\\BACKUP\\cms webaya\\backend',
    encoding: 'utf8',
  });
  return res;
}

function getTag(output, tag) {
  const regex = new RegExp(`${tag}:([^\\r\\n]+)`);
  const match = output.match(regex);
  if (!match) {
    throw new Error(`Failed to find tag ${tag} in output: ${output}`);
  }
  return match[1].trim();
}

async function cleanJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    const firstBrace = text.indexOf('{');
    if (firstBrace !== -1) {
      try {
        return JSON.parse(text.slice(firstBrace));
      } catch {
        // ignore
      }
    }
    console.error('Failed to parse JSON, raw response:', text);
    return { raw: text };
  }
}

async function run() {
  console.log('========================================================');
  console.log('TESTING INVENTORY FOR PRODUCTS WITHOUT VARIANTS');
  console.log('Target API:', BASE_URL);
  console.log('========================================================\n');

  // 1. Setup fixture
  console.log('1. Setting up fixtures in database...');
  const fixtureStr = getTag(runHelper('setup'), 'FIXTURE');
  const fixture = JSON.parse(fixtureStr);
  console.log('Fixture loaded:', fixture);

  // 2. Register fresh customer & create address
  const uniqueEmail = `stocktest_${Date.now()}@example.com`;
  console.log(`\n2. Registering customer: ${uniqueEmail}`);
  const regRes = await fetch(`${BASE_URL}/api/ecommerce/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      name: 'Pembeli Stock Test',
      email: uniqueEmail,
      password: 'password123',
      password_confirmation: 'password123',
    }),
  });
  const regData = await cleanJson(regRes);
  const token = regData.token;
  if (!token) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);

  const addrRes = await fetch(`${BASE_URL}/api/ecommerce/addresses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      label: 'Kantor',
      recipient_name: 'Budi Santoso',
      whatsapp: '081234567890',
      address: 'Jl. Merdeka 10',
      district: 'Klojen',
      city: 'Malang',
      province: 'Jawa Timur',
      postal_code: '65111',
      is_default: true,
    }),
  });
  const addrData = await cleanJson(addrRes);
  const addressId = addrData.data?.id;
  console.log(`Customer & address ready (addressId: ${addressId})`);

  // Verify initial non-variant stock
  const initialStock = parseInt(getTag(runHelper('get_product_stock', fixture.prodE_id), 'STOCK'), 10);
  console.log(`Initial non-variant product #${fixture.prodE_id} stock: ${initialStock}`);
  if (initialStock !== 10) {
    throw new Error(`Expected initial stock 10, got ${initialStock}`);
  }

  // -------------------------------------------------------------
  // TEST 1: Non-variant stock CUKUP (Order 3 items from 10 available)
  // -------------------------------------------------------------
  console.log('\n--- TEST 1: Non-variant stock CUKUP (Order qty: 3, stock: 10) ---');
  const res1 = await fetch(`${BASE_URL}/api/ecommerce/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      address_id: addressId,
      shipping_method: 'jnt',
      items: [
        { product_id: fixture.prodE_id, variant_id: null, quantity: 3 },
      ],
    }),
  });
  const data1 = await cleanJson(res1);
  console.log(`Response status: ${res1.status}`);
  if (res1.status !== 201) {
    throw new Error(`TEST 1 FAILED: Expected 201, got ${res1.status}: ${JSON.stringify(data1)}`);
  }
  const stockAfterOrder1 = parseInt(getTag(runHelper('get_product_stock', fixture.prodE_id), 'STOCK'), 10);
  console.log(`Stock after order 1: ${stockAfterOrder1}`);
  if (stockAfterOrder1 !== 7) {
    throw new Error(`TEST 1 FAILED: Expected stock 7, got ${stockAfterOrder1}`);
  }
  console.log('>>> TEST 1 PASS: Non-variant stock cukup successfully created order and decremented stock (10 -> 7)');

  // -------------------------------------------------------------
  // TEST 2: Non-variant stock TIDAK CUKUP (Order 10 items, only 7 available)
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Non-variant stock TIDAK CUKUP (Order qty: 10, available: 7) ---');
  const res2 = await fetch(`${BASE_URL}/api/ecommerce/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      address_id: addressId,
      shipping_method: 'jnt',
      items: [
        { product_id: fixture.prodE_id, variant_id: null, quantity: 10 },
      ],
    }),
  });
  const data2 = await cleanJson(res2);
  console.log(`Response status: ${res2.status}, message: ${data2.message}`);
  if (res2.status !== 422) {
    throw new Error(`TEST 2 FAILED: Expected 422, got ${res2.status}: ${JSON.stringify(data2)}`);
  }
  const stockAfterOrder2 = parseInt(getTag(runHelper('get_product_stock', fixture.prodE_id), 'STOCK'), 10);
  console.log(`Stock after failed order 2: ${stockAfterOrder2}`);
  if (stockAfterOrder2 !== 7) {
    throw new Error(`TEST 2 FAILED: Stock should not change on failure, expected 7, got ${stockAfterOrder2}`);
  }
  console.log('>>> TEST 2 PASS: Non-variant stock tidak cukup correctly rejected with HTTP 422 and stock untouched');

  // -------------------------------------------------------------
  // TEST 3: Variant Order Regression (Stock cukup & tidak cukup)
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Variant Order Regression ---');
  const varStockInit = parseInt(getTag(runHelper('get_stock', fixture.varStock2_id), 'STOCK'), 10);
  console.log(`Initial variant #${fixture.varStock2_id} stock: ${varStockInit}`);

  // Order 1 variant item (sufficient)
  const res3a = await fetch(`${BASE_URL}/api/ecommerce/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      address_id: addressId,
      shipping_method: 'jne',
      items: [
        { product_id: fixture.prodB_id, variant_id: fixture.varStock2_id, quantity: 1 },
      ],
    }),
  });
  const data3a = await cleanJson(res3a);
  console.log(`Variant order (qty 1) response status: ${res3a.status}`);
  if (res3a.status !== 201) {
    throw new Error(`TEST 3A FAILED: Expected 201, got ${res3a.status}: ${JSON.stringify(data3a)}`);
  }
  const varStockAfter3a = parseInt(getTag(runHelper('get_stock', fixture.varStock2_id), 'STOCK'), 10);
  console.log(`Variant stock after order: ${varStockAfter3a}`);
  if (varStockAfter3a !== varStockInit - 1) {
    throw new Error(`TEST 3A FAILED: Expected variant stock ${varStockInit - 1}, got ${varStockAfter3a}`);
  }

  // Order 5 variant items (insufficient, only 1 left)
  const res3b = await fetch(`${BASE_URL}/api/ecommerce/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      address_id: addressId,
      shipping_method: 'jne',
      items: [
        { product_id: fixture.prodB_id, variant_id: fixture.varStock2_id, quantity: 5 },
      ],
    }),
  });
  const data3b = await cleanJson(res3b);
  console.log(`Variant order (qty 5) response status: ${res3b.status}`);
  if (res3b.status !== 422) {
    throw new Error(`TEST 3B FAILED: Expected 422, got ${res3b.status}: ${JSON.stringify(data3b)}`);
  }
  const varStockAfter3b = parseInt(getTag(runHelper('get_stock', fixture.varStock2_id), 'STOCK'), 10);
  console.log(`Variant stock after failed order: ${varStockAfter3b}`);
  if (varStockAfter3b !== varStockAfter3a) {
    throw new Error(`TEST 3B FAILED: Variant stock should remain ${varStockAfter3a}, got ${varStockAfter3b}`);
  }
  console.log('>>> TEST 3 PASS: Variant order regression confirmed working as expected');

  // -------------------------------------------------------------
  // TEST 4: Product API & Admin Product Edit stock
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Product API & Admin Product Edit Stock ---');
  // Public product detail
  const prodRes = await fetch(`${BASE_URL}/api/ecommerce/products/real-test-no-variant`);
  const prodData = await cleanJson(prodRes);
  console.log(`Public product stock: ${prodData.data?.stock}`);
  if (prodData.data?.stock !== 7) {
    throw new Error(`TEST 4 FAILED: Expected public product stock 7, got ${prodData.data?.stock}`);
  }

  // Admin update stock to 25
  const adminToken = getTag(runHelper('get_admin_token'), 'TOKEN');
  const updateRes = await fetch(`${BASE_URL}/api/ecommerce/admin/products/${fixture.prodE_id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      stock: 25,
    }),
  });
  const updateData = await cleanJson(updateRes);
  console.log(`Admin update response status: ${updateRes.status}, new stock: ${updateData.data?.stock}`);
  if (updateRes.status !== 200 || updateData.data?.stock !== 25) {
    throw new Error(`TEST 4 FAILED: Admin update expected stock 25, got ${updateData.data?.stock}`);
  }
  console.log('>>> TEST 4 PASS: Admin product stock updated and read correctly');

  console.log('\n========================================================');
  console.log('ALL INVENTORY REGRESSION TESTS PASSED!');
  console.log('========================================================');
}

run().catch((err) => {
  console.error('\n*** TEST RUN FAILED ***');
  console.error(err);
  process.exit(1);
});
