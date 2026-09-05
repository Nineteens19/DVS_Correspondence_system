/* Idempotent UAT master data and mock-login seed. Requires 001 + 002. */
SET NOCOUNT ON;
SET XACT_ABORT ON;
GO
IF OBJECT_ID(N'[DEPARTMENT]', N'U') IS NULL OR OBJECT_ID(N'[ROLE]', N'U') IS NULL OR OBJECT_ID(N'[USER]', N'U') IS NULL
    THROW 51000, 'Base schema is missing. Run DB/001_InitialCreate.sql first.', 1;
GO
IF OBJECT_ID(N'[AD_MOCK_USER]', N'U') IS NULL
BEGIN
    CREATE TABLE [AD_MOCK_USER] (
        [SAMAccountName] nvarchar(100) NOT NULL,
        [UserPrincipalName] nvarchar(256) NOT NULL,
        [DisplayName] nvarchar(200) NOT NULL,
        [Email] nvarchar(256) NOT NULL,
        [EmployeeId] nvarchar(100) NULL,
        [Title] nvarchar(200) NULL,
        [DepartmentName] nvarchar(200) NULL,
        [DepartmentRef] nvarchar(100) NULL,
        [Company] nvarchar(200) NOT NULL,
        [TelephoneNumber] nvarchar(100) NULL,
        [ManagerSAMAccountName] nvarchar(100) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_AD_MOCK_USER] PRIMARY KEY ([SAMAccountName])
    );
END;
GO
BEGIN TRANSACTION;
MERGE [ROLE] AS t USING (VALUES
 (N'ROLE-01',N'ผู้ Register',N'own',1),(N'ROLE-02',N'เจ้าของงานปลายทาง (ผู้ใช้ปกติ)',N'own',1),(N'ROLE-03',N'หัวหน้าฝ่าย / ผู้กำกับดูแล',N'dept',1),(N'ROLE-04',N'Viewer สูงสุด (ผู้บริหาร/ส่วนกลาง)',N'all',1),(N'ROLE-05',N'Admin',N'all',1),(N'ROLE-06',N'ผู้ส่งเอกสารออก',N'own',1),(N'ROLE-07',N'Monitor (ผู้เฝ้าติดตามงานตาม Scope)',N'own',1)
) AS s(RoleId,[Name],DataScope,IsActive) ON t.RoleId=s.RoleId
WHEN MATCHED THEN UPDATE SET [Name]=s.[Name],DataScope=s.DataScope,IsActive=s.IsActive
WHEN NOT MATCHED THEN INSERT (RoleId,[Name],DataScope,IsActive) VALUES(s.RoleId,s.[Name],s.DataScope,s.IsActive);
MERGE [DEPARTMENT] AS t USING (VALUES
 (N'dept-admin',N'ฝ่ายบริหาร',N'Administration Department',N'บห',N'AD',N'wilai.p',1),(N'dept-eng',N'ฝ่ายวิศวกรรม',N'Engineering Department',N'วก',N'EN',N'prasit.m',1),(N'dept-fin',N'ฝ่ายการเงิน',N'Finance Department',N'กง',N'FN',N'wichai.c',1),(N'dept-hr',N'ฝ่ายทรัพยากรบุคคล',N'Human Resources Department',N'บค',N'HR',N'preeya.w',1),(N'dept-it',N'ฝ่ายสารสนเทศ',N'IT Department',N'สท',N'IT',N'wichai.t',1),(N'dept-legal',N'ฝ่ายกฎหมาย',N'Legal Department',N'กม',N'LG',N'veera.c',1),(N'dept-mkt',N'ฝ่ายการตลาด',N'Marketing Department',N'กต',N'MK',N'somchai.j',1),(N'dept-proc',N'ฝ่ายพัสดุและจัดซื้อ',N'Procurement Department',N'พด',N'PC',N'pimchanok.t',1),(N'dept-records',N'งานสารบรรณ',N'Records / Correspondence',N'สบ',N'RC',N'somchai.p',1)
) AS s(DepartmentId,NameTh,NameEn,DeptCodeTh,DeptCodeEn,HeadUserRef,IsActive) ON t.DepartmentId=s.DepartmentId
WHEN MATCHED THEN UPDATE SET NameTh=s.NameTh,NameEn=s.NameEn,DeptCodeTh=s.DeptCodeTh,DeptCodeEn=s.DeptCodeEn,HeadUserRef=s.HeadUserRef,IsActive=s.IsActive
WHEN NOT MATCHED THEN INSERT(DepartmentId,NameTh,NameEn,DeptCodeTh,DeptCodeEn,HeadUserRef,IsActive) VALUES(s.DepartmentId,s.NameTh,s.NameEn,s.DeptCodeTh,s.DeptCodeEn,s.HeadUserRef,s.IsActive);
MERGE [DELIVERY_METHOD] AS t USING (VALUES
 (N'dm-01',N'ไปรษณีย์ลงทะเบียน',0,1),(N'dm-02',N'ไปรษณีย์ด่วนพิเศษ (EMS)',0,1),(N'dm-03',N'ให้ไปรษณีย์มารับ (ปณ. มารับ)',1,1),(N'dm-04',N'Messenger บริษัท',0,1),(N'dm-05',N'รับด้วยตนเอง (มารับเอง)',0,1),(N'dm-06',N'จัดส่งอิเล็กทรอนิกส์ / อีเมล',0,1)
) AS s(DeliveryMethodId,Label,IsPostalPickup,IsActive) ON t.DeliveryMethodId=s.DeliveryMethodId
WHEN MATCHED THEN UPDATE SET Label=s.Label,IsPostalPickup=s.IsPostalPickup,IsActive=s.IsActive
WHEN NOT MATCHED THEN INSERT(DeliveryMethodId,Label,IsPostalPickup,IsActive) VALUES(s.DeliveryMethodId,s.Label,s.IsPostalPickup,s.IsActive);

MERGE [AD_MOCK_USER] AS t USING (VALUES
 (N'sutthichok.t',N'นายสุทธิโชค ทองคำ (System Admin)',N'sutthichok.t@deves.co.th',N'dept-it',N'System Administrator'),
 (N'admin',N'ผู้ดูแลระบบ เทเวศประกันภัย (Admin)',N'admin@deves.co.th',N'dept-it',N'System Administrator'),
 (N'somchai.p',N'นายสมชาย พัฒนาการ (สารบรรณ)',N'somchai.p@deves.co.th',N'dept-records',N'เจ้าหน้าที่สารบรรณ'),
 (N'anong.s',N'นางอนงค์ สุขใจ (หัวหน้าสารบรรณ)',N'anong.s@deves.co.th',N'dept-records',N'หัวหน้างานสารบรรณ'),
 (N'wichai.t',N'นายวิชัย ตั้งใจดี (ผอ. IT)',N'wichai.t@deves.co.th',N'dept-it',N'ผู้อำนวยการฝ่าย IT'),
 (N'kanda.m',N'น.ส. กานดา มั่นคง (Senior Dev)',N'kanda.m@deves.co.th',N'dept-it',N'Senior Developer'),
 (N'wichai.c',N'นายวิชัย ชาญณรงค์ (ผอ. การเงิน)',N'wichai.c@deves.co.th',N'dept-fin',N'ผู้อำนวยการฝ่ายการเงิน'),
 (N'siriporn.w',N'น.ส. ศิริพร วงศ์สว่าง (เจ้าหน้าที่การเงิน)',N'siriporn.w@deves.co.th',N'dept-fin',N'เจ้าหน้าที่การเงินอาวุโส'),
 (N'prapat.k',N'นายประภัสสร เกียรติสกุล (ผู้บริหารระดับสูง)',N'prapat.k@deves.co.th',N'dept-admin',N'ผู้บริหารระดับสูง'),
 (N'prasit.m',N'นายประสิทธิ์ มั่นคง (ผอ. วิศวกรรม)',N'prasit.m@deves.co.th',N'dept-eng',N'ผู้อำนวยการฝ่ายวิศวกรรม'),
 (N'preeya.w',N'นางปรียา วัฒนา (ผอ. HR)',N'preeya.w@deves.co.th',N'dept-hr',N'ผู้อำนวยการฝ่ายทรัพยากรบุคคล'),
 (N'veera.c',N'นายวีระ ชาญวิทย์ (ผอ. กฎหมาย)',N'veera.c@deves.co.th',N'dept-legal',N'ผู้อำนวยการฝ่ายกฎหมาย'),
 (N'somchai.j',N'นายสมชาย ใจดี (ผอ. การตลาด)',N'somchai.j@deves.co.th',N'dept-mkt',N'ผู้อำนวยการฝ่ายการตลาด'),
 (N'pimchanok.t',N'น.ส. พิมพ์ชนก ทรัพย์เจริญ (ผอ. พัสดุ)',N'pimchanok.t@deves.co.th',N'dept-proc',N'ผู้อำนวยการฝ่ายพัสดุและจัดซื้อ'),
 (N'wilai.p',N'นางวิไล พรประเสริฐ (ผอ. บริหาร)',N'wilai.p@deves.co.th',N'dept-admin',N'ผู้อำนวยการฝ่ายบริหารทั่วไป'),
 (N'monitor.auditor',N'ผู้ตรวจการ ปฏิบัติตามกฎเกณฑ์ (Internal Auditor)',N'auditor@deves.co.th',N'dept-admin',N'Compliance & Internal Audit Manager'),
 (N'nattawut.s',N'นายณัฐวุฒิ สมบูรณ์ (วิศวกรโยธา)',N'nattawut.s@deves.co.th',N'dept-eng',N'วิศวกรโยธาอาวุโส'),
 (N'chutima.k',N'น.ส. ชุติมา เกียรติสกุล (นิติกรอาวุโส)',N'chutima.k@deves.co.th',N'dept-legal',N'นิติกรอาวุโส'),
 (N'boonchai.l',N'นายบุญชัย เลิศล้ำ (เจ้าหน้าที่จัดซื้อ)',N'boonchai.l@deves.co.th',N'dept-proc',N'เจ้าหน้าที่จัดซื้อ'),
 (N'thanaporn.r',N'น.ส. ธนาภรณ์ รุ่งเรือง (เจ้าหน้าที่บุคคล)',N'thanaporn.r@deves.co.th',N'dept-hr',N'เจ้าหน้าที่พัฒนาทรัพยากรบุคคล'),
 (N'ekkachai.p',N'นายเอกชัย พิทักษ์ธรรม (DBA)',N'ekkachai.p@deves.co.th',N'dept-it',N'Database Administrator'),
 (N'jintana.t',N'น.ส. จินตนา ทวีสุข (ธุรการสารบรรณ)',N'jintana.t@deves.co.th',N'dept-records',N'เจ้าหน้าที่ธุรการสารบรรณ'),
 (N'kittisak.n',N'นายกิตติศักดิ์ นิรันดร์ (เจ้าหน้าที่ตรวจสอบสินไหม)',N'kittisak.n@deves.co.th',N'dept-admin',N'เจ้าหน้าที่ตรวจสอบสินไหม'),
 (N'porntip.s',N'นางพรทิพย์ สถิตพันธุ์ (ผอ. อาวุโส)',N'porntip.s@deves.co.th',N'dept-admin',N'ผู้อำนวยการอาวุโสสายงานบริหาร'),
 (N'worawan.d',N'น.ส. วรวรรณ ดารารัตน์ (การตลาดดิจิทัล)',N'worawan.d@deves.co.th',N'dept-mkt',N'Digital Marketing Specialist')
) AS s(SAMAccountName,DisplayName,Email,DepartmentRef,Title) ON t.SAMAccountName=s.SAMAccountName
WHEN MATCHED THEN UPDATE SET UserPrincipalName=s.Email,DisplayName=s.DisplayName,Email=s.Email,Title=s.Title,DepartmentRef=s.DepartmentRef,IsActive=1,Company=N'บริษัท เทเวศประกันภัย จำกัด (มหาชน)'
WHEN NOT MATCHED THEN INSERT(SAMAccountName,UserPrincipalName,DisplayName,Email,Title,DepartmentRef,Company,IsActive,CreatedAt) VALUES(s.SAMAccountName,s.Email,s.DisplayName,s.Email,s.Title,s.DepartmentRef,N'บริษัท เทเวศประกันภัย จำกัด (มหาชน)',1,SYSUTCDATETIME());

;WITH RequiredRoles(UserId,RoleId) AS (SELECT * FROM (VALUES
 (N'sutthichok.t',N'ROLE-05'),(N'admin',N'ROLE-05'),(N'somchai.p',N'ROLE-01'),(N'anong.s',N'ROLE-03'),(N'wichai.t',N'ROLE-03'),(N'kanda.m',N'ROLE-02'),(N'wichai.c',N'ROLE-03'),(N'siriporn.w',N'ROLE-02'),(N'prapat.k',N'ROLE-04'),(N'prasit.m',N'ROLE-03'),(N'preeya.w',N'ROLE-03'),(N'veera.c',N'ROLE-03'),(N'somchai.j',N'ROLE-03'),(N'pimchanok.t',N'ROLE-03'),(N'wilai.p',N'ROLE-03'),(N'monitor.auditor',N'ROLE-07'),(N'nattawut.s',N'ROLE-02'),(N'chutima.k',N'ROLE-02'),(N'boonchai.l',N'ROLE-02'),(N'thanaporn.r',N'ROLE-02'),(N'ekkachai.p',N'ROLE-02'),(N'jintana.t',N'ROLE-01'),(N'kittisak.n',N'ROLE-02'),(N'porntip.s',N'ROLE-03'),(N'worawan.d',N'ROLE-02')
) v(UserId,RoleId))
MERGE [USER] AS t USING (SELECT a.SAMAccountName UserId,a.DisplayName,a.Email,a.DepartmentRef,r.RoleId FROM [AD_MOCK_USER] a JOIN RequiredRoles r ON r.UserId=a.SAMAccountName) AS s ON t.UserId=s.UserId
WHEN MATCHED THEN UPDATE SET DisplayName=s.DisplayName,Email=s.Email,DepartmentRef=s.DepartmentRef,RoleId=s.RoleId,Source=N'LDAP',Status=N'Active'
WHEN NOT MATCHED THEN INSERT(UserId,DisplayName,Email,DepartmentRef,RoleId,Source,Status,ProvisionedBy,ProvisionedAt) VALUES(s.UserId,s.DisplayName,s.Email,s.DepartmentRef,s.RoleId,N'LDAP',N'Active',N'uat-seed',SYSUTCDATETIME());
COMMIT TRANSACTION;
GO
