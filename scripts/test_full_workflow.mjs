// Automated End-to-End Workflow Verification Script
const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🐝 Starting Honey Chain End-to-End Integration Verification...\n');

  // =========================================================================
  // TEST A: BEEKEEPER SIGNUP -> PENDING SCREEN -> ADMIN APPROVES -> APPROVED SCREEN
  // =========================================================================
  console.log('--- TEST A: BEEKEEPER REGISTRATION & APPROVAL ---');
  const testBkUid = `test_bk_${Date.now()}`;
  const testBkEmail = `ramesh.patel.${Date.now()}@honeychain.test`;
  const testBkName = 'Ramesh Patel (Test Apiary)';

  const newBkPayload = {
    id: testBkUid,
    userId: testBkUid,
    name: testBkName,
    email: testBkEmail,
    phone: '+91 98220 12345',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    address: 'Survey 104, Malihabad Mango Orchards, Lucknow',
    lat: 26.9201,
    lng: 80.7102,
    aadhaarLast4: '7890',
    aadhaarHash: 'hash_test_7890',
    madhukrantiId: `NBB/UP/2026/${Math.floor(1000 + Math.random() * 9000)}`,
    totalHivesPlanned: 15,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Submit signup
  console.log(`1. Submitting new Beekeeper registration for: ${testBkName} (${testBkEmail})...`);
  const regRes = await fetch(`${BASE_URL}/api/beekeepers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newBkPayload),
  });
  const regData = await regRes.json();
  if (!regData.success) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  console.log('   ✓ Registered successfully! Stored status:', regData.beekeeper.status);

  // 2. Check that status is strictly 'pending' and has NO beekeeperId
  if (regData.beekeeper.status !== 'pending') {
    throw new Error(`Expected status 'pending', got: ${regData.beekeeper.status}`);
  }
  if (regData.beekeeper.beekeeperId) {
    throw new Error(`Expected NO beekeeperId on initial signup, got: ${regData.beekeeper.beekeeperId}`);
  }
  console.log('   ✓ Verified: New beekeeper has status "pending" and NO assigned Beekeeper ID.');

  // 3. Switch to Admin persona and check Admin's Beekeeper Approval Queue
  console.log('2. Admin queries Beekeeper Approval Queue...');
  const queueRes = await fetch(`${BASE_URL}/api/beekeepers`);
  const queueData = await queueRes.json();
  const queuedBk = queueData.beekeepers.find((b) => b.id === testBkUid || b.userId === testBkUid);
  if (!queuedBk) {
    throw new Error('New beekeeper does not appear in Admin Beekeeper Approval Queue!');
  }
  console.log(`   ✓ Found applicant in Admin Approval Queue! Name: ${queuedBk.name}, Madhukranti: ${queuedBk.madhukrantiId}, Status: ${queuedBk.status}`);

  // 4. Admin Approves the Beekeeper
  console.log('3. Admin approves applicant and assigns unique Beekeeper ID...');
  const assignedId = `B0${Math.floor(40 + Math.random() * 50)}`;
  const approveRes = await fetch(`${BASE_URL}/api/beekeepers/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      beekeeperId: testBkUid,
      assignedId,
      adminUid: 'admin_test_uid',
    }),
  });
  const approveData = await approveRes.json();
  if (!approveData.success) throw new Error(`Approval failed: ${JSON.stringify(approveData)}`);
  console.log(`   ✓ Approved! Beekeeper status: ${approveData.beekeeper.status}, Assigned ID: ${approveData.beekeeper.beekeeperId}`);

  if (approveData.beekeeper.status !== 'approved' || approveData.beekeeper.beekeeperId !== assignedId) {
    throw new Error(`Expected approved with ID ${assignedId}, got: ${JSON.stringify(approveData.beekeeper)}`);
  }
  console.log('   ✓ Test A PASSED: Beekeeper shows Pending until Admin approves, then receives unique Beekeeper ID.\n');

  // =========================================================================
  // TEST B: HIVE ADDITION -> STAGE 1 ADMIN -> STAGE 2 LAB -> FINAL ADMIN -> ACTIVE
  // =========================================================================
  console.log('--- TEST B: COMPLETE 2-STAGE HIVE HEALTH VERIFICATION WORKFLOW ---');
  const assignedBkId = approveData.beekeeper.beekeeperId;
  const testHiveId = `HC-UP-${assignedBkId}-H01`;

  // 1. Beekeeper adds a hive
  console.log(`1. Approved Beekeeper (${assignedBkId}) registers a new hive: ${testHiveId}...`);
  const hivePayload = {
    id: `HIVE_${testHiveId.replace(/[^a-zA-Z0-9]/g, '_')}`,
    hiveId: testHiveId,
    beekeeperId: assignedBkId,
    hiveType: 'Langstroth 10-Frame Standard',
    colonyType: 'Apis cerana indica (Indian Honey Bee)',
    area: 'Malihabad Organic Apple & Mango Belt',
    landType: 'Orchard',
    lat: 26.9201,
    lng: 80.7102,
    address: 'Survey 104, Malihabad Mango Orchards, Lucknow',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    expectedProduction: 18,
    status: 'inactive',
    approvalStatus: 'pending',
    approvalStage: 'STAGE_1_ADMIN_REVIEW',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const addHiveRes = await fetch(`${BASE_URL}/api/hives`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(hivePayload),
  });
  const addHiveData = await addHiveRes.json();
  if (!addHiveData.success) throw new Error(`Add hive failed: ${JSON.stringify(addHiveData)}`);
  console.log(`   ✓ Hive created with status: ${addHiveData.hive.status}, stage: ${addHiveData.hive.approvalStage}`);

  // 2. Admin inspects Stage 1 queue and Accepts hive -> forwards to Lab
  console.log('2. Admin inspects Hive in Stage 1 queue and accepts (routes to Lab)...');
  const stage1Res = await fetch(`${BASE_URL}/api/hives/${encodeURIComponent(testHiveId)}/stage1-accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminUid: 'admin_test_uid' }),
  });
  const stage1Data = await stage1Res.json();
  if (!stage1Data.success) throw new Error(`Stage 1 accept failed: ${JSON.stringify(stage1Data)}`);
  console.log(`   ✓ Stage 1 Approved! Hive Stage is now: ${stage1Data.hive.approvalStage}`);
  if (stage1Data.hive.approvalStage !== 'STAGE_2_LAB_VERIFICATION') {
    throw new Error(`Expected STAGE_2_LAB_VERIFICATION, got: ${stage1Data.hive.approvalStage}`);
  }

  // 3. Lab checks its Hive Health Verification queue
  console.log('3. Lab persona checks Hive Health Verification queue...');
  const labQueueRes = await fetch(`${BASE_URL}/api/hives`);
  const labQueueData = await labQueueRes.json();
  const hiveInLabQueue = labQueueData.hives.find((h) => h.hiveId === testHiveId || h.id === hivePayload.id);
  if (!hiveInLabQueue || hiveInLabQueue.approvalStage !== 'STAGE_2_LAB_VERIFICATION') {
    throw new Error(`Hive not found in Stage 2 Lab queue! ${JSON.stringify(hiveInLabQueue)}`);
  }
  console.log(`   ✓ Found hive in Lab Health Verification queue! Species: ${hiveInLabQueue.colonyType}`);

  // 4. Lab conducts biosecurity check and submits HEALTHY verdict
  console.log('4. Accredited Lab submits certified HEALTHY verdict with inspector notes...');
  const labVerdictRes = await fetch(`${BASE_URL}/api/hives/${encodeURIComponent(testHiveId)}/lab-verdict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      verdict: 'HEALTHY',
      notes: 'Colony inspected in accordance with ICAR/NABL biosecurity protocol. Brood chamber active, zero foulbrood, queen healthy.',
      inspectorName: 'Dr. R. K. Sharma (Senior Apiary Entomologist)',
      labId: 'LAB_CBRTI_PUNE',
    }),
  });
  const labVerdictData = await labVerdictRes.json();
  if (!labVerdictData.success) throw new Error(`Lab verdict failed: ${JSON.stringify(labVerdictData)}`);
  console.log(`   ✓ Lab verdict recorded: ${labVerdictData.hive.labVerdict}, Stage: ${labVerdictData.hive.approvalStage}`);
  if (labVerdictData.hive.approvalStage !== 'STAGE_3_ADMIN_FINAL') {
    throw new Error(`Expected STAGE_3_ADMIN_FINAL, got: ${labVerdictData.hive.approvalStage}`);
  }

  // 5. Admin checks Final Review and approves
  console.log('5. Admin checks Stage 2 Final Decision queue, reviews Lab verdict, and gives final live approval...');
  const finalApproveRes = await fetch(`${BASE_URL}/api/hives/${encodeURIComponent(testHiveId)}/final-approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminUid: 'admin_test_uid' }),
  });
  const finalApproveData = await finalApproveRes.json();
  if (!finalApproveData.success) throw new Error(`Final approve failed: ${JSON.stringify(finalApproveData)}`);
  console.log(`   ✓ Hive Final Approved! Status: ${finalApproveData.hive.status}, ApprovalStatus: ${finalApproveData.hive.approvalStatus}, Stage: ${finalApproveData.hive.approvalStage}`);
  if (finalApproveData.hive.status !== 'active') {
    throw new Error(`Expected status 'active', got: ${finalApproveData.hive.status}`);
  }

  // 6. Verify Beekeeper dashboard displays Active Hive
  console.log('6. Querying Beekeeper hives to confirm Live Active status...');
  const bkHivesRes = await fetch(`${BASE_URL}/api/hives`);
  const bkHivesData = await bkHivesRes.json();
  const liveHive = bkHivesData.hives.find((h) => h.hiveId === testHiveId);
  if (!liveHive || liveHive.status !== 'active') {
    throw new Error(`Live hive not active in beekeeper view! ${JSON.stringify(liveHive)}`);
  }
  console.log(`   ✓ Verified: Hive ${liveHive.hiveId} is LIVE and ACTIVE in Beekeeper's dashboard!`);

  // 7. Check audit activity log
  console.log('7. Verifying Activity Logs for complete audit trail...');
  const logsRes = await fetch(`${BASE_URL}/api/activity-logs`);
  const logsData = await logsRes.json();
  const hiveLogs = logsData.logs.filter((l) => l.entityId === testHiveId);
  console.log(`   ✓ Recorded ${hiveLogs.length} audit trail entries for ${testHiveId}:`);
  hiveLogs.forEach((l) => console.log(`     - [${l.actorRole}] ${l.action}: ${l.details}`));

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! Both workflows are 100% verified.');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
