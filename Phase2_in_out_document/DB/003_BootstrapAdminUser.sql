-- ============================================================================
-- 003_BootstrapAdminUser.sql
-- ----------------------------------------------------------------------------
-- แก้ปัญหา "ไก่กับไข่": ระบบให้ provision ผู้ใช้ผ่านหน้า Admin แต่หน้า Admin ต้อง
-- login ด้วย user ที่เป็น Admin ก่อน ซึ่งตอนเริ่มต้น DB ยังไม่มีใครเลย.
-- Script นี้ seed "admin คนแรก" (bootstrap) เข้าตาราง [USER] ตรง ๆ เพื่อให้ login
-- ผ่าน AD ได้แล้วเข้าหน้า Admin ไป provision คนอื่นต่อได้.
--
-- วิธีใช้:
--   1) แก้ @AdminUserId ให้ตรงกับ "sAMAccountName" ของบัญชี AD ที่จะเป็น admin คนแรก
--      (เช่น ที่ login Windows ด้วย — ตัวอย่าง log แสดง 'sutthichok.t')
--   2) แก้ @DisplayName / @Email / @Dept ตามจริง (Dept ต้องเป็น id ที่มีอยู่ใน [DEPARTMENT])
--   3) รันบน DB DVS_EDOCUMENTTRACKING (เช่นผ่าน SSMS หรือ sqlcmd)
--
-- idempotent: รันซ้ำได้ (ถ้ามี user นี้แล้วจะ update role/status ให้เป็น admin/active)
-- ============================================================================

SET NOCOUNT ON;

DECLARE @AdminUserId   NVARCHAR(100) = N'sutthichok.t';        -- <-- แก้เป็น AD username จริง
DECLARE @DisplayName   NVARCHAR(200) = N'System Administrator';-- <-- แก้ชื่อแสดงผล
DECLARE @Email         NVARCHAR(256) = NULL;                   -- <-- ใส่อีเมล หรือปล่อย NULL
DECLARE @Dept          NVARCHAR(100) = N'dept-it';             -- ฝ่ายสารสนเทศ (ต้องมีใน [DEPARTMENT])
DECLARE @RoleId        NVARCHAR(50)  = N'ROLE-05';             -- ROLE-05 = Admin (สิทธิ์ครบ)

-- ตรวจว่า role/department ที่อ้างมีจริง (กัน FK error)
IF NOT EXISTS (SELECT 1 FROM [ROLE] WHERE RoleId = @RoleId)
BEGIN
    RAISERROR('RoleId %s ไม่พบใน [ROLE] — รัน seed master data (001_InitialCreate) ก่อน', 16, 1, @RoleId);
    RETURN;
END
IF NOT EXISTS (SELECT 1 FROM [DEPARTMENT] WHERE DepartmentId = @Dept)
BEGIN
    RAISERROR('DepartmentId %s ไม่พบใน [DEPARTMENT] — รัน seed master data ก่อน', 16, 1, @Dept);
    RETURN;
END

IF EXISTS (SELECT 1 FROM [USER] WHERE UserId = @AdminUserId)
BEGIN
    UPDATE [USER]
       SET RoleId = @RoleId,
           DepartmentRef = @Dept,
           Status = N'Active'
     WHERE UserId = @AdminUserId;
    PRINT N'อัปเดตผู้ใช้เดิมให้เป็น Admin/Active: ' + @AdminUserId;
END
ELSE
BEGIN
    INSERT INTO [USER] (UserId, DisplayName, Email, DepartmentRef, RoleId, Source, Status, ProvisionedBy, ProvisionedAt)
    VALUES (@AdminUserId, @DisplayName, @Email, @Dept, @RoleId, N'LDAP', N'Active', N'bootstrap', SYSUTCDATETIME());
    PRINT N'สร้าง admin คนแรกสำเร็จ: ' + @AdminUserId;
END

-- แสดงผลยืนยัน
SELECT UserId, DisplayName, DepartmentRef, RoleId, Source, Status
FROM [USER]
WHERE UserId = @AdminUserId;
