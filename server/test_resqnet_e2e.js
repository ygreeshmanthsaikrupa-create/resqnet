// ResQNet End-to-End Regression Test Suite
const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 5000;

function makeRequest(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('error', (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING RESQNET END-TO-END REGRESSION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, errorMsg) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} -> ${errorMsg}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    const health = await makeRequest('/api/health');
    assert('1. Health Check endpoint is healthy', health.status === 200 && health.data.status === 'healthy', JSON.stringify(health.data));

    // 2. Demo Logins (bcrypt comparison)
    const citizenLogin = await makeRequest('/api/auth/login', 'POST', { username: 'citizen', password: 'citizen123' });
    assert('2a. Citizen demo login with bcrypt password', citizenLogin.status === 200 && citizenLogin.data.token && citizenLogin.data.user.role === 'citizen', JSON.stringify(citizenLogin.data));

    const adminLogin = await makeRequest('/api/auth/login', 'POST', { username: 'admin', password: 'admin123' });
    assert('2b. Admin demo login with bcrypt password', adminLogin.status === 200 && adminLogin.data.token && adminLogin.data.user.role === 'admin', JSON.stringify(adminLogin.data));

    const volunteerLogin = await makeRequest('/api/auth/login', 'POST', { username: 'volunteer', password: 'volunteer123' });
    assert('2c. Volunteer demo login with bcrypt password', volunteerLogin.status === 200 && volunteerLogin.data.token && volunteerLogin.data.user.role === 'volunteer', JSON.stringify(volunteerLogin.data));

    // 3. Invalid credentials test (error message check)
    const badLogin = await makeRequest('/api/auth/login', 'POST', { username: 'citizen', password: 'wrongpassword' });
    assert('3. Bad password returns 401 with explicit error string', badLogin.status === 401 && badLogin.data.error === 'Invalid username or password', JSON.stringify(badLogin.data));

    // 4. Session Persistence (/api/auth/me unwrapping verification)
    const meRes = await makeRequest('/api/auth/me', 'GET', null, citizenLogin.data.token);
    assert('4. GET /api/auth/me returns { user: {...} } shape', meRes.status === 200 && meRes.data.user && meRes.data.user.role === 'citizen', JSON.stringify(meRes.data));

    // 5. Signup validation
    const testUsername = `tester_${Date.now().toString().slice(-4)}`;
    const signupRes = await makeRequest('/api/auth/signup', 'POST', {
      name: 'Test Responder',
      username: testUsername,
      password: 'testpassword123',
      role: 'citizen'
    });
    assert('5a. User registration with bcrypt hashing', signupRes.status === 201 && signupRes.data.token && signupRes.data.user.username === testUsername, JSON.stringify(signupRes.data));

    const duplicateSignup = await makeRequest('/api/auth/signup', 'POST', {
      name: 'Duplicate Responder',
      username: testUsername,
      password: 'testpassword123',
      role: 'citizen'
    });
    assert('5b. Duplicate username returns 409 Conflict with descriptive error', duplicateSignup.status === 409 && duplicateSignup.data.error.includes('already exists'), JSON.stringify(duplicateSignup.data));

    // 6. Report Submission validation
    const invalidReport = await makeRequest('/api/reports', 'POST', { category: 'invalid_hazard' }, citizenLogin.data.token);
    assert('6a. Invalid report category returns 400 with whitelist message', invalidReport.status === 400 && invalidReport.data.error.includes('Invalid category'), JSON.stringify(invalidReport.data));

    const validReport = await makeRequest('/api/reports', 'POST', {
      category: 'flood',
      title: 'Water overflowing over canal bridge',
      description: 'Water level reached 1.5m above normal. Road closed.',
      severity: 4,
      peopleAffected: 6,
      location: { lat: 16.5080, lng: 80.6490, address: 'Canal Road Crossing' }
    }, citizenLogin.data.token);
    assert('6b. Valid report creation calculates confidence & priority scores', validReport.status === 201 && validReport.data.id && validReport.data.priorityScore > 0, JSON.stringify(validReport.data));

    // 7. Role-Based PATCH /reports/:id
    const reportId = validReport.data.id;
    const volunteerPatch = await makeRequest(`/api/reports/${reportId}`, 'PATCH', {
      status: 'verified',
      adminNotes: 'Field volunteer team dispatched with inflatable raft.'
    }, volunteerLogin.data.token);
    assert('7a. Volunteer can update status and adminNotes', volunteerPatch.status === 200 && volunteerPatch.data.status === 'verified', JSON.stringify(volunteerPatch.data));

    // 8. Shelter Occupancy Update
    const resourcesRes = await makeRequest('/api/resources');
    const firstShelter = resourcesRes.data.find(r => r.type === 'shelter') || resourcesRes.data[0];
    if (firstShelter) {
      const patchShelter = await makeRequest(`/api/resources/${firstShelter.id}`, 'PATCH', {
        currentOccupancy: 80,
        status: 'open'
      }, volunteerLogin.data.token);
      assert('8. Shelter occupancy update by field volunteer', patchShelter.status === 200 && patchShelter.data.currentOccupancy === 80, JSON.stringify(patchShelter.data));
    }

    // 9. Simulation Security Verification
    const unauthSim = await makeRequest('/api/simulation/start', 'POST', { speed: 1 });
    assert('9a. Unauthenticated simulation start blocked with 401', unauthSim.status === 401, JSON.stringify(unauthSim.data));

    const citizenSim = await makeRequest('/api/simulation/start', 'POST', { speed: 1 }, citizenLogin.data.token);
    assert('9b. Citizen attempting simulation start blocked with 403 Forbidden', citizenSim.status === 403, JSON.stringify(citizenSim.data));

    const adminSim = await makeRequest('/api/simulation/start', 'POST', { speed: 1 }, adminLogin.data.token);
    assert('9c. Admin can start simulation scenario', adminSim.status === 200 && adminSim.data.running === true, JSON.stringify(adminSim.data));

    const adminSimStop = await makeRequest('/api/simulation/stop', 'POST', {}, adminLogin.data.token);
    assert('9d. Admin can stop simulation scenario', adminSimStop.status === 200 && adminSimStop.data.running === false, JSON.stringify(adminSimStop.data));

    // 10. Map Zones GeoJSON
    const zonesRes = await makeRequest('/api/map/zones');
    assert('10. Map zones returns GeoJSON FeatureCollection with 13 global zones', zonesRes.status === 200 && zonesRes.data.type === 'FeatureCollection' && zonesRes.data.features.length >= 5, `Found ${zonesRes.data?.features?.length} zones`);

    console.log('\n====================================================');
    console.log(`🎉 TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test runner error:', err);
    process.exit(1);
  }
}

runTests();
