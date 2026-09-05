const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:5005';
const OUTPUT_DIR = path.resolve(__dirname, '../../docs/images/correspondence');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function seedDocuments() {
  console.log('Seeding documents via API...');
  
  // Login as anong.s (Head of Records)
  const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'anong.s', password: 'password' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  // 1. Doc 2: Email Normal In-Progress
  const doc2Res = await fetch(`${BASE_URL}/api/v1/documents/incoming`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: 'email',
      urgency: 'normal',
      confidentiality: 'normal',
      title: 'แจ้งการปรับปรุงมาตรฐานความปลอดภัยสารสนเทศ ISO/IEC 27001:2022',
      description: 'บริษัท บีเอสไอ กรุ๊ป (ประเทศไทย) แจ้งกำหนดการตรวจประเมินติดตามระบบรักษาความมั่นคงปลอดภัยสารสนเทศ',
      senderAgency: 'BSI Group (Thailand) Co., Ltd.',
      originNumber: 'BSI-TH-2026/089',
      originDepartmentId: 'dept-records',
      responsibleDepartmentId: 'dept-it',
      assignedUserIds: ['kanda.m'],
      assignedDepartmentIds: ['dept-it'],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString()
    })
  });
  const doc2 = await doc2Res.json();

  // Accept doc2
  if (doc2 && doc2.id) {
    // Login as kanda.m to accept
    const kandaLogin = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'kanda.m', password: 'password' })
    }).then(r => r.json());
    
    if (kandaLogin.token) {
      await fetch(`${BASE_URL}/api/v1/documents/${doc2.id}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${kandaLogin.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: 'รับเรื่องเรียบร้อย เตรียมจัดทำแผนรองรับการตรวจประเมิน' })
      });
    }
  }

  // 2. Doc 3: Top Secret Physical Document
  const doc3Res = await fetch(`${BASE_URL}/api/v1/documents/incoming`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: 'physical',
      urgency: 'very-urgent',
      confidentiality: 'top-secret',
      title: 'รายงานการตรวจสอบข้อเท็จจริงกรณีการทุจริตเคลมสินไหมรถยนต์สาขาภาคใต้ (ลับมาก)',
      description: 'รายงานผลการสอบสวนข้อเท็จจริงและพยานหลักฐานการเบิกจ่ายสินไหมอันเป็นเท็จ',
      senderAgency: 'คณะกรรมการตรวจสอบภายใน (Audit Committee)',
      originNumber: 'ลับมาก ที่ 004/2569',
      originDepartmentId: 'dept-records',
      responsibleDepartmentId: 'dept-legal',
      assignedUserIds: ['veera.c'],
      assignedDepartmentIds: ['dept-legal'],
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString()
    })
  });
  const doc3 = await doc3Res.json();

  // 3. Doc 4: Outgoing Flow A (EMS)
  await fetch(`${BASE_URL}/api/v1/documents/outgoing`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      urgency: 'normal',
      confidentiality: 'normal',
      title: 'นำส่งแบบรายงานฐานะการเงินและผลการดำเนินงานไตรมาส 2/2569',
      description: 'ส่งรายงานสรุปงบการเงินและสัดส่วนเงินกองทุนตามเกณฑ์ความเสี่ยง (RBC)',
      destinationAgency: 'สำนักงาน คปภ.',
      edrOutgoingNumberTh: 'ทด 0842/2569',
      edrOutgoingNumberEn: 'DVS 0842/2026',
      originDepartmentId: 'dept-fin',
      deliveryMethodId: 'dm-02',
      trackingNumber: 'ED849201948TH',
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString()
    })
  });

  // 4. Doc 5: Outgoing Delivered
  const doc5Res = await fetch(`${BASE_URL}/api/v1/documents/outgoing`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      urgency: 'urgent',
      confidentiality: 'normal',
      title: 'หนังสือแจ้งบอกเลิกสัญญาตัวแทนประกันวินาศภัย',
      description: 'แจ้งบอกเลิกสัญญาตัวแทนเนื่องจากไม่ปฏิบัติตามหลักเกณฑ์การนำส่งเบี้ยประกันภัย',
      destinationAgency: 'บริษัท ทีเอ็นพี โบรกเกอร์ จำกัด',
      edrOutgoingNumberTh: 'พ 0129/2569',
      edrOutgoingNumberEn: 'SP 0129/2026',
      originDepartmentId: 'dept-legal',
      deliveryMethodId: 'dm-01',
      trackingNumber: 'RG992817263TH',
      dueDate: new Date(Date.now() - 1 * 86400000).toISOString()
    })
  });
  const doc5 = await doc5Res.json();
  if (doc5 && doc5.id) {
    await fetch(`${BASE_URL}/api/v1/documents/${doc5.id}/deliver`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trackingNumber: 'RG992817263TH',
        deliveredToPerson: 'นายพิชัย รัตนวงศ์ (ผู้จัดการ)',
        remarks: 'ปลายทางลงนามรับเอกสารฉบับจริงเรียบร้อยแล้ว'
      })
    });
  }

  console.log('Document seeding completed.');
  return { doc2Id: doc2?.id, doc3Id: doc3?.id };
}

async function captureScreens() {
  const { doc2Id, doc3Id } = await seedDocuments();

  console.log('Launching browser for screenshot capture...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2 // High DPI Retina capture
  });
  const page = await context.newPage();

  // 1. Login Page
  console.log('Capturing 01_login_page.png...');
  await page.goto(`${BASE_URL}/`);
  await page.waitForSelector('input[type="text"]', { timeout: 10000 });
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_login_page.png') });

  // Perform Login as anong.s (Director of Records)
  console.log('Logging in as anong.s...');
  await page.fill('input[type="text"]', 'anong.s');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // 2. Dashboard Page
  console.log('Capturing 02_dashboard_overview.png...');
  await page.waitForSelector('text=ระบบสารบรรณอิเล็กทรอนิกส์', { timeout: 10000 });
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_dashboard_overview.png') });

  // 3. Incoming Document List Page
  console.log('Capturing 03_incoming_document_list.png...');
  await page.goto(`${BASE_URL}/document-list/incoming`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_incoming_document_list.png') });

  // 4. Outgoing Document List Page
  console.log('Capturing 04_outgoing_document_list.png...');
  await page.goto(`${BASE_URL}/document-list/outgoing`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_outgoing_document_list.png') });

  // 5. Register Incoming Form
  console.log('Capturing 05_register_incoming_form.png...');
  await page.goto(`${BASE_URL}/register`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_register_incoming_form.png') });

  // 6. Register Outgoing Form
  console.log('Capturing 06_register_outgoing_form.png...');
  const outgoingTab = await page.$('button:has-text("เอกสารส่งออก")');
  if (outgoingTab) {
    await outgoingTab.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_register_outgoing_form.png') });

  // 7. Document Detail Page (Story Line)
  console.log('Capturing 07_document_detail_storyline.png...');
  const targetDocId = doc2Id || 'IN-2026-0001';
  await page.goto(`${BASE_URL}/document-detail/${targetDocId}`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_document_detail_storyline.png') });

  // 8. Document Detail Page (Chain of Custody)
  console.log('Capturing 08_document_detail_custody.png...');
  const custodyTab = await page.$('button:has-text("การถือครองตัวจริง")');
  if (custodyTab) {
    await custodyTab.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_document_detail_custody.png') });

  // 9. Document Detail Page (Attachments Card & Direct Upload)
  console.log('Capturing 09_document_detail_attachments.png...');
  // Scroll down to attachments section or capture full page
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_document_detail_attachments.png') });

  // 10. Camera Capture Modal
  console.log('Capturing 10_modal_camera_capture.png...');
  const cameraBtn = await page.$('button:has-text("ถ่ายภาพแนบเพิ่ม")');
  if (cameraBtn) {
    await cameraBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '10_modal_camera_capture.png') });
    // Close camera modal
    const closeBtn = await page.$('button:has-text("ยกเลิก")') || await page.$('button[aria-label="Close"]');
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(500);
  }

  // 11. Top Secret OTP Gate Modal
  console.log('Capturing 11_modal_otp_verification.png...');
  const secretDocId = doc3Id || 'IN-2026-0003';
  await page.goto(`${BASE_URL}/document-detail/${secretDocId}`);
  await page.waitForTimeout(1500);
  const requestOtpBtn = await page.$('button:has-text("ขอรหัส OTP")') || await page.$('button:has-text("ยืนยันตัวตนด้วยรหัส OTP")');
  if (requestOtpBtn) {
    await requestOtpBtn.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, '11_modal_otp_verification.png') });

  // 12. Document Detail Page (Audit Log)
  console.log('Capturing 12_document_detail_audit.png...');
  await page.goto(`${BASE_URL}/document-detail/${targetDocId}`);
  await page.waitForTimeout(1000);
  const auditTab = await page.$('button:has-text("ประวัติย้อนหลัง")') || await page.$('button:has-text("Audit Log")');
  if (auditTab) {
    await auditTab.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, '12_document_detail_audit.png') });

  // 13. Task Inbox Page
  console.log('Capturing 13_task_inbox.png...');
  await page.goto(`${BASE_URL}/task-inbox`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '13_task_inbox.png') });

  // 14. Admin User Management & LDAP Provisioning
  console.log('Capturing 14_admin_user_provisioning.png...');
  await page.goto(`${BASE_URL}/admin`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '14_admin_user_provisioning.png') });

  // 15. Admin Monitor Watcher Config
  console.log('Capturing 15_admin_monitor_config.png...');
  const monitorTab = await page.$('button:has-text("ผู้เฝ้าติดตาม (Monitor)")') || await page.$('button:has-text("Monitor")');
  if (monitorTab) {
    await monitorTab.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, '15_admin_monitor_config.png') });

  // 16. Admin Reminder Interval Settings
  console.log('Capturing 16_admin_reminder_intervals.png...');
  const reminderTab = await page.$('button:has-text("รอบการแจ้งเตือน")') || await page.$('button:has-text("Reminder")');
  if (reminderTab) {
    await reminderTab.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, '16_admin_reminder_intervals.png') });

  // 17. Reports Page
  console.log('Capturing 17_reports_management.png...');
  await page.goto(`${BASE_URL}/reports`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '17_reports_management.png') });

  await browser.close();
  console.log('All 17 screenshots captured successfully and saved in:', OUTPUT_DIR);
}

captureScreens().catch(err => {
  console.error('Error during screen capture:', err);
  process.exit(1);
});
