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

async function runTests() {
  console.log('====================================================');
  console.log('STARTING REAL HTTP TESTS AGAINST LARAVEL API');
  console.log(`Target: ${BASE_URL}`);
  console.log('====================================================\n');

  // 1. Setup Test Database Records
  console.log('1. Setting up test catalog records in database...');
  const fixtureStr = getTag(runHelper('setup'), 'FIXTURE');
  const fixture = JSON.parse(fixtureStr);
  console.log('Setup records:', fixture);

  // 2. Register/Login Customer & Add Address via HTTP
  const uniqueEmail = `test_customer_${Date.now()}@example.com`;
  console.log(`\n2. Registering customer: ${uniqueEmail} via HTTP...`);
  const regRes = await fetch(`${BASE_URL}/api/ecommerce/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      name: 'Pembeli Real Test',
      email: uniqueEmail,
      password: 'password123',
      password_confirmation: 'password123',
      phone: '08123456789',
    }),
  });
  const regData = await cleanJson(regRes);
  console.log('Register response:', regRes.status, regData);
  const customerToken = regData.token;
  console.log('Customer registered, token obtained.');

  console.log('Adding shipping address for customer via HTTP...');
  const addrRes = await fetch(`${BASE_URL}/api/ecommerce/addresses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      label: 'Rumah',
      recipient_name: 'Budi Santoso',
      whatsapp: '081234567890',
      address: 'Jl. Merdeka No. 45',
      district: 'Klojen',
      city: 'Kota Malang',
      province: 'Jawa Timur',
      postal_code: '65119',
      is_default: true,
    }),
  });
  const addrData = await cleanJson(addrRes);
  console.log('addrData response:', addrRes.status, addrData);
  const addressId = addrData.data?.id;
  console.log(`Address created with ID: ${addressId}\n`);

  // -------------------------------------------------------------
  // TEST A: Variant Merah Rp70.000 × 2 + Variant Biru Rp75.000 × 1 = Subtotal Rp215.000
  // -------------------------------------------------------------
  console.log('--- TEST A: Variant Merah Rp70.000 × 2, Variant Biru Rp75.000 × 1 ---');
  const resA = await fetch(`${BASE_URL}/api/ecommerce/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      address_id: addressId,
      shipping_method: 'jnt',
      items: [
        { product_id: fixture.prodA_id, variant_id: fixture.varMerah_id, quantity: 2 },
        { product_id: fixture.prodA_id, variant_id: fixture.varBiru_id, quantity: 1 },
      ],
    }),
  });
  const dataA = await cleanJson(resA);
  if (resA.status !== 201) throw new Error(`TEST A failed with status ${resA.status}: ${JSON.stringify(dataA)}`);
  if (dataA.data.subtotal !== 215000 || dataA.data.total !== 215000) {
    throw new Error(`TEST A subtotal mismatch: expected 215000, got ${dataA.data.subtotal}`);
  }
  console.log('✓ TEST A PASSED: Subtotal Rp215.000 correctly calculated by backend');

  // -------------------------------------------------------------
  // TEST B: Stock 2, Request quantity 3 -> Expected rejected (422), stock remains 2
  // -------------------------------------------------------------
  console.log('\n--- TEST B: Stock 2, Request 3 -> Expected Rejected (422) ---');
  const resB = await fetch(`${BASE_URL}/api/ecommerce/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      address_id: addressId,
      shipping_method: 'jne',
      items: [
        { product_id: fixture.prodB_id, variant_id: fixture.varStock2_id, quantity: 3 },
      ],
    }),
  });
  const dataB = await cleanJson(resB);
  if (resB.status !== 422) throw new Error(`TEST B expected 422, got ${resB.status}`);
  // Check DB stock
  const stockCheckB = getTag(runHelper('get_stock', fixture.varStock2_id), 'STOCK');
  if (stockCheckB !== '2') throw new Error(`TEST B stock was not preserved! Got: ${stockCheckB}`);
  console.log(`✓ TEST B PASSED: 422 Returned ("${dataB.message}"), Stock remains 2`);

  // -------------------------------------------------------------
  // TEST C: Stock 2, Request quantity 2 -> Expected Success (201), Stock becomes 0
  // -------------------------------------------------------------
  console.log('\n--- TEST C: Stock 2, Request 2 -> Expected Success (201), Stock becomes 0 ---');
  const resC = await fetch(`${BASE_URL}/api/ecommerce/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      address_id: addressId,
      shipping_method: 'jnt',
      items: [
        { product_id: fixture.prodB_id, variant_id: fixture.varStock2_id, quantity: 2 },
      ],
    }),
  });
  const dataC = await cleanJson(resC);
  if (resC.status !== 201) throw new Error(`TEST C failed with status ${resC.status}: ${JSON.stringify(dataC)}`);
  const stockCheckC = getTag(runHelper('get_stock', fixture.varStock2_id), 'STOCK');
  if (stockCheckC !== '0') throw new Error(`TEST C stock expected 0! Got: ${stockCheckC}`);
  console.log('✓ TEST C PASSED: 201 Created, Stock reduced to 0');

  // -------------------------------------------------------------
  // TEST D: Simulated failure in one item -> Expected Rollback
  // -------------------------------------------------------------
  console.log('\n--- TEST D: Transaction Rollback on Failure ---');
  const ordersBeforeD = parseInt(getTag(runHelper('get_order_count'), 'COUNT'));
  const resD = await fetch(`${BASE_URL}/api/ecommerce/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      address_id: addressId,
      shipping_method: 'jnt',
      items: [
        { product_id: fixture.prodD_id, variant_id: fixture.varD1_id, quantity: 1 }, // valid
        { product_id: fixture.prodD_id, variant_id: fixture.varD2_id, quantity: 5 }, // exceeds stock (1)
      ],
    }),
  });
  const dataD = await cleanJson(resD);
  if (resD.status !== 422) throw new Error(`TEST D expected 422, got ${resD.status}`);
  const ordersAfterD = parseInt(getTag(runHelper('get_order_count'), 'COUNT'));
  if (ordersBeforeD !== ordersAfterD) throw new Error(`TEST D failed: order was not rolled back!`);
  const stockD1 = getTag(runHelper('get_stock', fixture.varD1_id), 'STOCK');
  if (stockD1 !== '5') throw new Error(`TEST D failed: stock of item 1 was altered! Got: ${stockD1}`);
  console.log('✓ TEST D PASSED: Transaction rolled back completely, no order created, stock intact');

  // -------------------------------------------------------------
  // TEST E: Product without variant
  // -------------------------------------------------------------
  console.log('\n--- TEST E: Product Without Variant Checkout ---');
  const resE = await fetch(`${BASE_URL}/api/ecommerce/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      address_id: addressId,
      shipping_method: 'jnt',
      items: [
        { product_id: fixture.prodE_id, variant_id: null, quantity: 3 },
      ],
    }),
  });
  const dataE = await cleanJson(resE);
  if (resE.status !== 201) throw new Error(`TEST E failed: ${JSON.stringify(dataE)}`);
  const itemE = dataE.data.items[0];
  if (itemE.variant_id !== null || itemE.variant_name !== null) {
    throw new Error(`TEST E failed: variant_id or variant_name is not null: ${JSON.stringify(itemE)}`);
  }
  if (itemE.unit_price !== 15000 || itemE.subtotal !== 45000) {
    throw new Error(`TEST E failed: base_price calculation wrong: ${JSON.stringify(itemE)}`);
  }
  console.log('✓ TEST E PASSED: variant_id = null, variant_name = null, base_price used (3 × 15.000 = 45.000)');

  // -------------------------------------------------------------
  // TEST F: Product with variant snapshot saved
  // -------------------------------------------------------------
  console.log('\n--- TEST F: Product With Variant Snapshot Saved ---');
  const itemA = dataA.data.items.find(i => i.variant_id === fixture.varMerah_id);
  if (!itemA || itemA.variant_name !== 'Merah' || itemA.unit_price !== 70000 || itemA.sku !== 'HTTP-AUR-RED') {
    throw new Error(`TEST F failed: snapshot incomplete: ${JSON.stringify(itemA)}`);
  }
  console.log('✓ TEST F PASSED: variant_id, variant_name ("Merah"), sku ("HTTP-AUR-RED"), and unit_price snapshot saved');

  // -------------------------------------------------------------
  // TEST G: Checkout Order Number Format
  // -------------------------------------------------------------
  console.log('\n--- TEST G: Backend Order Number Format ---');
  const orderNum = dataA.data.order_number;
  const regex = /^KREZOEMA-\d{8}-[A-Z0-9]{4}$/;
  if (!regex.test(orderNum)) {
    throw new Error(`TEST G failed: order_number ${orderNum} does not match format KREZOEMA-YYYYMMDD-XXXX`);
  }
  console.log(`✓ TEST G PASSED: Backend generated valid order_number: ${orderNum}`);

  // -------------------------------------------------------------
  // TEST H: Error Clarity on Stock Out
  // -------------------------------------------------------------
  console.log('\n--- TEST H: Clear Error Message on Stock Insufficiency ---');
  if (!dataB.message || !dataB.message.toLowerCase().includes('stok tidak mencukupi')) {
    throw new Error(`TEST H failed: message lacks clarity: "${dataB.message}"`);
  }
  console.log(`✓ TEST H PASSED: Clear user error returned: "${dataB.message}"`);

  // -------------------------------------------------------------
  // ADMIN ORDER API TESTS
  // -------------------------------------------------------------
  console.log('\n--- ADMIN ORDER API TESTS ---');
  const adminTokenRaw = getTag(runHelper('get_admin_token'), 'TOKEN');

  // 1. GET /api/ecommerce/admin/orders
  console.log('Testing GET /api/ecommerce/admin/orders...');
  const resAdminList = await fetch(`${BASE_URL}/api/ecommerce/admin/orders`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${adminTokenRaw}` },
  });
  const dataAdminList = await cleanJson(resAdminList);
  if (resAdminList.status !== 200 || !Array.isArray(dataAdminList.data)) {
    throw new Error(`Admin list failed: ${JSON.stringify(dataAdminList)}`);
  }
  console.log(`✓ GET /api/ecommerce/admin/orders returned ${dataAdminList.data.length} orders`);

  // 2. GET /api/ecommerce/admin/orders/{id}
  const createdOrderId = dataA.data.id;
  console.log(`Testing GET /api/ecommerce/admin/orders/${createdOrderId}...`);
  const resAdminShow = await fetch(`${BASE_URL}/api/ecommerce/admin/orders/${createdOrderId}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${adminTokenRaw}` },
  });
  const dataAdminShow = await cleanJson(resAdminShow);
  if (resAdminShow.status !== 200 || dataAdminShow.data.id !== createdOrderId) {
    throw new Error(`Admin show failed: ${JSON.stringify(dataAdminShow)}`);
  }
  console.log(`✓ GET /api/ecommerce/admin/orders/${createdOrderId} returned order successfully`);

  // 3. PUT /api/ecommerce/admin/orders/{id} - Status Transitions
  console.log(`Testing PUT /api/ecommerce/admin/orders/${createdOrderId} -> 'confirmed'...`);
  const resStatusConfirm = await fetch(`${BASE_URL}/api/ecommerce/admin/orders/${createdOrderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${adminTokenRaw}` },
    body: JSON.stringify({ status: 'confirmed' }),
  });
  const dataStatusConfirm = await cleanJson(resStatusConfirm);
  if (resStatusConfirm.status !== 200 || dataStatusConfirm.data.status !== 'confirmed') {
    throw new Error(`Admin update confirmed failed: ${JSON.stringify(dataStatusConfirm)}`);
  }
  console.log(`✓ Order status updated to 'confirmed'`);

  console.log(`Testing PUT /api/ecommerce/admin/orders/${createdOrderId} -> 'processing'...`);
  const resStatusProc = await fetch(`${BASE_URL}/api/ecommerce/admin/orders/${createdOrderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${adminTokenRaw}` },
    body: JSON.stringify({ status: 'processing', notes: 'Pesanan sedang dirakit' }),
  });
  const dataStatusProc = await cleanJson(resStatusProc);
  if (resStatusProc.status !== 200 || dataStatusProc.data.status !== 'processing') {
    throw new Error(`Admin update processing failed: ${JSON.stringify(dataStatusProc)}`);
  }
  console.log(`✓ Order status updated to 'processing'`);

  console.log(`Testing PUT /api/ecommerce/admin/orders/${createdOrderId} -> 'shipped'...`);
  const resStatusShip = await fetch(`${BASE_URL}/api/ecommerce/admin/orders/${createdOrderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${adminTokenRaw}` },
    body: JSON.stringify({ status: 'shipped' }),
  });
  const dataStatusShip = await cleanJson(resStatusShip);
  if (resStatusShip.status !== 200 || dataStatusShip.data.status !== 'shipped') {
    throw new Error(`Admin update shipped failed: ${JSON.stringify(dataStatusShip)}`);
  }
  console.log(`✓ Order status updated to 'shipped'`);

  console.log(`Testing PUT /api/ecommerce/admin/orders/${createdOrderId} -> 'completed'...`);
  const resStatusComp = await fetch(`${BASE_URL}/api/ecommerce/admin/orders/${createdOrderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${adminTokenRaw}` },
    body: JSON.stringify({ status: 'completed' }),
  });
  const dataStatusComp = await cleanJson(resStatusComp);
  if (resStatusComp.status !== 200 || dataStatusComp.data.status !== 'completed') {
    throw new Error(`Admin update completed failed: ${JSON.stringify(dataStatusComp)}`);
  }
  console.log(`✓ Order status updated to 'completed'`);

  console.log('\n====================================================');
  console.log('ALL REAL HTTP TESTS PASSED WITH 100% SUCCESS!');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
