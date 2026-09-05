using Correspondence.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Correspondence.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(CorrespondenceDbContext db, ILogger logger)
    {
        await db.Database.EnsureCreatedAsync();

        // 1. Seed DELIVERY_METHOD (001_InitialCreate.sql)
        if (!await db.DeliveryMethods.AnyAsync())
        {
            var deliveryMethods = new List<DeliveryMethod>
            {
                new() { DeliveryMethodId = "dm-01", Label = "ไปรษณีย์ลงทะเบียน", IsPostalPickup = false, IsActive = true },
                new() { DeliveryMethodId = "dm-02", Label = "ไปรษณีย์ด่วนพิเศษ (EMS)", IsPostalPickup = false, IsActive = true },
                new() { DeliveryMethodId = "dm-03", Label = "ให้ไปรษณีย์มารับ (ปณ. มารับ)", IsPostalPickup = true, IsActive = true },
                new() { DeliveryMethodId = "dm-04", Label = "Messenger บริษัท", IsPostalPickup = false, IsActive = true },
                new() { DeliveryMethodId = "dm-05", Label = "รับด้วยตนเอง (มารับเอง)", IsPostalPickup = false, IsActive = true },
                new() { DeliveryMethodId = "dm-06", Label = "จัดส่งอิเล็กทรอนิกส์ / อีเมล", IsPostalPickup = false, IsActive = true }
            };
            db.DeliveryMethods.AddRange(deliveryMethods);
            await db.SaveChangesAsync();
        }

        // 2. Seed DEPARTMENT (001_InitialCreate.sql)
        if (!await db.Departments.AnyAsync())
        {
            var departments = new List<Department>
            {
                new() { DepartmentId = "dept-admin", DeptCodeEn = "AD", DeptCodeTh = "บห", HeadUserRef = "wilai.p", IsActive = true, NameEn = "Administration Department", NameTh = "ฝ่ายบริหาร" },
                new() { DepartmentId = "dept-eng", DeptCodeEn = "EN", DeptCodeTh = "วก", HeadUserRef = "prasit.m", IsActive = true, NameEn = "Engineering Department", NameTh = "ฝ่ายวิศวกรรม" },
                new() { DepartmentId = "dept-fin", DeptCodeEn = "FN", DeptCodeTh = "กง", HeadUserRef = "wichai.c", IsActive = true, NameEn = "Finance Department", NameTh = "ฝ่ายการเงิน" },
                new() { DepartmentId = "dept-hr", DeptCodeEn = "HR", DeptCodeTh = "บค", HeadUserRef = "preeya.w", IsActive = true, NameEn = "Human Resources Department", NameTh = "ฝ่ายทรัพยากรบุคคล" },
                new() { DepartmentId = "dept-it", DeptCodeEn = "IT", DeptCodeTh = "สท", HeadUserRef = "wichai.t", IsActive = true, NameEn = "IT Department", NameTh = "ฝ่ายสารสนเทศ" },
                new() { DepartmentId = "dept-legal", DeptCodeEn = "LG", DeptCodeTh = "กม", HeadUserRef = "veera.c", IsActive = true, NameEn = "Legal Department", NameTh = "ฝ่ายกฎหมาย" },
                new() { DepartmentId = "dept-mkt", DeptCodeEn = "MK", DeptCodeTh = "กต", HeadUserRef = "somchai.j", IsActive = true, NameEn = "Marketing Department", NameTh = "ฝ่ายการตลาด" },
                new() { DepartmentId = "dept-proc", DeptCodeEn = "PC", DeptCodeTh = "พด", HeadUserRef = "pimchanok.t", IsActive = true, NameEn = "Procurement Department", NameTh = "ฝ่ายพัสดุและจัดซื้อ" },
                new() { DepartmentId = "dept-records", DeptCodeEn = "RC", DeptCodeTh = "สบ", HeadUserRef = "somchai.p", IsActive = true, NameEn = "Records / Correspondence", NameTh = "งานสารบรรณ" }
            };
            db.Departments.AddRange(departments);
            await db.SaveChangesAsync();
        }

        // 3. Seed ROLE (001_InitialCreate.sql)
        if (!await db.Roles.AnyAsync())
        {
            var roles = new List<Role>
            {
                new() { RoleId = "ROLE-01", Name = "ผู้ Register", DataScope = "own", IsActive = true },
                new() { RoleId = "ROLE-02", Name = "เจ้าของงานปลายทาง (ผู้ใช้ปกติ)", DataScope = "own", IsActive = true },
                new() { RoleId = "ROLE-03", Name = "หัวหน้าฝ่าย / ผู้กำกับดูแล", DataScope = "dept", IsActive = true },
                new() { RoleId = "ROLE-04", Name = "Viewer สูงสุด (ผู้บริหาร/ส่วนกลาง)", DataScope = "all", IsActive = true },
                new() { RoleId = "ROLE-05", Name = "Admin", DataScope = "all", IsActive = true },
                new() { RoleId = "ROLE-06", Name = "ผู้ส่งเอกสารออก", DataScope = "own", IsActive = true },
                new() { RoleId = "ROLE-07", Name = "Monitor (ผู้เฝ้าติดตามงานตาม Scope)", DataScope = "own", IsActive = true }
            };
            db.Roles.AddRange(roles);
            await db.SaveChangesAsync();
        }

        // 4. Seed PERMISSION (001_InitialCreate.sql)
        if (!await db.Permissions.AnyAsync())
        {
            var perms = new List<Permission>
            {
                new() { PermKey = "accept-reject-forward", RoleId = "ROLE-02" },
                new() { PermKey = "accept-reject-forward", RoleId = "ROLE-03" },
                new() { PermKey = "assign", RoleId = "ROLE-01" },
                new() { PermKey = "assign", RoleId = "ROLE-02" },
                new() { PermKey = "assign", RoleId = "ROLE-03" },
                new() { PermKey = "assign", RoleId = "ROLE-05" },
                new() { PermKey = "configure-monitor", RoleId = "ROLE-03" },
                new() { PermKey = "configure-monitor", RoleId = "ROLE-05" },
                new() { PermKey = "delegate-down", RoleId = "ROLE-03" },
                new() { PermKey = "manage-users", RoleId = "ROLE-05" },
                new() { PermKey = "monitor-view", RoleId = "ROLE-03" },
                new() { PermKey = "monitor-view", RoleId = "ROLE-04" },
                new() { PermKey = "monitor-view", RoleId = "ROLE-05" },
                new() { PermKey = "monitor-view", RoleId = "ROLE-07" },
                new() { PermKey = "receive-physical", RoleId = "ROLE-01" },
                new() { PermKey = "register-incoming", RoleId = "ROLE-01" },
                new() { PermKey = "register-outgoing", RoleId = "ROLE-06" },
                new() { PermKey = "request-edr-number", RoleId = "ROLE-06" },
                new() { PermKey = "view-all-docs", RoleId = "ROLE-04" },
                new() { PermKey = "view-all-docs", RoleId = "ROLE-05" },
                new() { PermKey = "view-dept-docs", RoleId = "ROLE-03" }
            };
            db.Permissions.AddRange(perms);
            await db.SaveChangesAsync();
        }

        // 5. Seed USER (All Realistic Staff & AD LDAP Accounts)
        if (!await db.Users.AnyAsync())
        {
            var users = new List<User>
            {
                new() { UserId = "sutthichok.t", DisplayName = "นายสุทธิโชค ทองคำ (System Admin)", Email = "sutthichok.t@deves.co.th", DepartmentRef = "dept-it", RoleId = "ROLE-05", Source = "LDAP", Status = "Active", ProvisionedBy = "system", ProvisionedAt = DateTime.UtcNow },
                new() { UserId = "admin", DisplayName = "ผู้ดูแลระบบ (Admin)", Email = "admin@deves.co.th", DepartmentRef = "dept-it", RoleId = "ROLE-05", Source = "LDAP", Status = "Active", ProvisionedBy = "system", ProvisionedAt = DateTime.UtcNow },
                new() { UserId = "somchai.p", DisplayName = "นายสมชาย พัฒนาการ (สารบรรณ)", Email = "somchai.p@deves.co.th", DepartmentRef = "dept-records", RoleId = "ROLE-01", Source = "LDAP", Status = "Active", ProvisionedBy = "admin", ProvisionedAt = DateTime.UtcNow },
                new() { UserId = "anong.s", DisplayName = "นางอนงค์ สุขใจ (หัวหน้าสารบรรณ)", Email = "anong.s@deves.co.th", DepartmentRef = "dept-records", RoleId = "ROLE-03", Source = "LDAP", Status = "Active", ProvisionedBy = "admin", ProvisionedAt = DateTime.UtcNow },
                new() { UserId = "wichai.t", DisplayName = "นายวิชัย ตั้งใจดี (ผอ. IT)", Email = "wichai.t@deves.co.th", DepartmentRef = "dept-it", RoleId = "ROLE-03", Source = "LDAP", Status = "Active", ProvisionedBy = "admin", ProvisionedAt = DateTime.UtcNow },
                new() { UserId = "kanda.m", DisplayName = "น.ส. กานดา มั่นคง (Senior Dev/IT Staff)", Email = "kanda.m@deves.co.th", DepartmentRef = "dept-it", RoleId = "ROLE-02", Source = "LDAP", Status = "Active", ProvisionedBy = "admin", ProvisionedAt = DateTime.UtcNow },
                new() { UserId = "wichai.c", DisplayName = "นายวิชัย ชาญณรงค์ (ผอ. การเงิน & ผู้ส่งออก)", Email = "wichai.c@deves.co.th", DepartmentRef = "dept-fin", RoleId = "ROLE-03", Source = "LDAP", Status = "Active", ProvisionedBy = "admin", ProvisionedAt = DateTime.UtcNow },
                new() { UserId = "siriporn.w", DisplayName = "น.ส. ศิริพร วงศ์สว่าง (เจ้าหน้าที่การเงิน)", Email = "siriporn.w@deves.co.th", DepartmentRef = "dept-fin", RoleId = "ROLE-02", Source = "LDAP", Status = "Active", ProvisionedBy = "admin", ProvisionedAt = DateTime.UtcNow },
                new() { UserId = "prasit.m", DisplayName = "นายประสิทธิ์ มั่นคง (ผอ. วิศวกรรม)", Email = "prasit.m@deves.co.th", DepartmentRef = "dept-eng", RoleId = "ROLE-03", Source = "LDAP", Status = "Active", ProvisionedBy = "admin", ProvisionedAt = DateTime.UtcNow },
                new() { UserId = "preeya.w", DisplayName = "นางปรียา วัฒนา (ผอ. HR)", Email = "preeya.w@deves.co.th", DepartmentRef = "dept-hr", RoleId = "ROLE-03", Source = "LDAP", Status = "Active", ProvisionedBy = "admin", ProvisionedAt = DateTime.UtcNow },
                new() { UserId = "veera.c", DisplayName = "นายวีระ ชาญวิทย์ (ผอ. กฎหมาย)", Email = "veera.c@deves.co.th", DepartmentRef = "dept-legal", RoleId = "ROLE-03", Source = "LDAP", Status = "Active", ProvisionedBy = "admin", ProvisionedAt = DateTime.UtcNow },
                new() { UserId = "somchai.j", DisplayName = "นายสมชาย ใจดี (ผอ. การตลาด)", Email = "somchai.j@deves.co.th", DepartmentRef = "dept-mkt", RoleId = "ROLE-03", Source = "LDAP", Status = "Active", ProvisionedBy = "admin", ProvisionedAt = DateTime.UtcNow },
                new() { UserId = "pimchanok.t", DisplayName = "น.ส. พิมพ์ชนก ทรัพย์เจริญ (ผอ. พัสดุ)", Email = "pimchanok.t@deves.co.th", DepartmentRef = "dept-proc", RoleId = "ROLE-03", Source = "LDAP", Status = "Active", ProvisionedBy = "admin", ProvisionedAt = DateTime.UtcNow },
                new() { UserId = "wilai.p", DisplayName = "นางวิไล พรประเสริฐ (ผอ. บริหาร)", Email = "wilai.p@deves.co.th", DepartmentRef = "dept-admin", RoleId = "ROLE-03", Source = "LDAP", Status = "Active", ProvisionedBy = "admin", ProvisionedAt = DateTime.UtcNow },
                new() { UserId = "prapat.k", DisplayName = "นายประภัสสร เกียรติสกุล (ผู้บริหารระดับสูง)", Email = "prapat.k@deves.co.th", DepartmentRef = "dept-admin", RoleId = "ROLE-04", Source = "LDAP", Status = "Active", ProvisionedBy = "admin", ProvisionedAt = DateTime.UtcNow },
                new() { UserId = "monitor.auditor", DisplayName = "นางดวงใจ ตรวจตรา (Internal Audit & Monitor)", Email = "monitor.auditor@deves.co.th", DepartmentRef = "dept-admin", RoleId = "ROLE-07", Source = "LDAP", Status = "Active", ProvisionedBy = "admin", ProvisionedAt = DateTime.UtcNow },
                new() { UserId = "boonchai.l", DisplayName = "นายบุญชัย เลิศวิริยะ (นิติกรอาวุโส)", Email = "boonchai.l@deves.co.th", DepartmentRef = "dept-legal", RoleId = "ROLE-02", Source = "LDAP", Status = "Active", ProvisionedBy = "admin", ProvisionedAt = DateTime.UtcNow },
                new() { UserId = "chutima.k", DisplayName = "น.ส. ชุติมา ขจรเกียรติ (เจ้าหน้าที่ HR)", Email = "chutima.k@deves.co.th", DepartmentRef = "dept-hr", RoleId = "ROLE-02", Source = "LDAP", Status = "Active", ProvisionedBy = "admin", ProvisionedAt = DateTime.UtcNow },
                new() { UserId = "ekkachai.p", DisplayName = "นายเอกชัย พัฒนกุล (เจ้าหน้าที่จัดซื้อ)", Email = "ekkachai.p@deves.co.th", DepartmentRef = "dept-proc", RoleId = "ROLE-02", Source = "LDAP", Status = "Active", ProvisionedBy = "admin", ProvisionedAt = DateTime.UtcNow },
                new() { UserId = "jintana.t", DisplayName = "น.ส. จินตนา ทรัพย์เจริญ (เจ้าหน้าที่การตลาด)", Email = "jintana.t@deves.co.th", DepartmentRef = "dept-mkt", RoleId = "ROLE-02", Source = "LDAP", Status = "Active", ProvisionedBy = "admin", ProvisionedAt = DateTime.UtcNow },
                new() { UserId = "kittisak.n", DisplayName = "นายกิตติศักดิ์ น้อมเกล้า (เจ้าหน้าที่ธุรการ)", Email = "kittisak.n@deves.co.th", DepartmentRef = "dept-admin", RoleId = "ROLE-02", Source = "LDAP", Status = "Active", ProvisionedBy = "admin", ProvisionedAt = DateTime.UtcNow },
                new() { UserId = "porntip.s", DisplayName = "น.ส. พรทิพย์ สุวรรณ (เจ้าหน้าที่สารบรรณ)", Email = "porntip.s@deves.co.th", DepartmentRef = "dept-records", RoleId = "ROLE-01", Source = "LDAP", Status = "Active", ProvisionedBy = "admin", ProvisionedAt = DateTime.UtcNow },
                new() { UserId = "worawan.d", DisplayName = "น.ส. วรวรรณ ดีเลิศ (วิศวกร IT)", Email = "worawan.d@deves.co.th", DepartmentRef = "dept-it", RoleId = "ROLE-02", Source = "LDAP", Status = "Active", ProvisionedBy = "admin", ProvisionedAt = DateTime.UtcNow }
            };
            db.Users.AddRange(users);
            await db.SaveChangesAsync();
        }

        // Ensure the Engineering test officer is provisioned even when an existing database was seeded before this account was added.
        if (!await db.Users.AnyAsync(u => u.UserId == "nattawut.s"))
        {
            db.Users.Add(new User
            {
                UserId = "nattawut.s",
                DisplayName = "นายณัฐวุฒิ สมบูรณ์ (วิศวกรโยธา)",
                Email = "nattawut.s@deves.co.th",
                DepartmentRef = "dept-eng",
                RoleId = "ROLE-02",
                Source = "LDAP",
                Status = "Active",
                ProvisionedBy = "system",
                ProvisionedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }

        // 6. Seed AD_MOCK_USER (Active Directory Directory Table)
        if (!await db.AdMockUsers.AnyAsync())
        {
            var adUsers = new List<AdMockUser>
            {
                new() { SAMAccountName = "sutthichok.t", UserPrincipalName = "sutthichok.t@deves.co.th", DisplayName = "นายสุทธิโชค ทองคำ (System Admin)", Email = "sutthichok.t@deves.co.th", EmployeeId = "DVS-0000", Title = "System Administrator", DepartmentName = "ฝ่ายสารสนเทศ", DepartmentRef = "dept-it", TelephoneNumber = "02-670-4400 Ext 101" },
                new() { SAMAccountName = "admin", UserPrincipalName = "admin@deves.co.th", DisplayName = "ผู้ดูแลระบบ เทเวศประกันภัย (Admin)", Email = "admin@deves.co.th", EmployeeId = "DVS-0001", Title = "System Administrator", DepartmentName = "ฝ่ายสารสนเทศ", DepartmentRef = "dept-it", TelephoneNumber = "02-670-4400 Ext 100" },
                new() { SAMAccountName = "somchai.p", UserPrincipalName = "somchai.p@deves.co.th", DisplayName = "นายสมชาย พัฒนาการ (สารบรรณ)", Email = "somchai.p@deves.co.th", EmployeeId = "DVS-10021", Title = "เจ้าหน้าที่สารบรรณ", DepartmentName = "งานสารบรรณ", DepartmentRef = "dept-records", TelephoneNumber = "02-670-4400 Ext 201" },
                new() { SAMAccountName = "anong.s", UserPrincipalName = "anong.s@deves.co.th", DisplayName = "นางอนงค์ สุขใจ (หัวหน้าสารบรรณ)", Email = "anong.s@deves.co.th", EmployeeId = "DVS-10022", Title = "หัวหน้างานสารบรรณ", DepartmentName = "งานสารบรรณ", DepartmentRef = "dept-records", TelephoneNumber = "02-670-4400 Ext 200" },
                new() { SAMAccountName = "wichai.t", UserPrincipalName = "wichai.t@deves.co.th", DisplayName = "นายวิชัย ตั้งใจดี (ผอ. IT)", Email = "wichai.t@deves.co.th", EmployeeId = "DVS-10023", Title = "ผู้อำนวยการฝ่าย IT", DepartmentName = "ฝ่ายสารสนเทศ", DepartmentRef = "dept-it", TelephoneNumber = "02-670-4400 Ext 300" },
                new() { SAMAccountName = "kanda.m", UserPrincipalName = "kanda.m@deves.co.th", DisplayName = "น.ส. กานดา มั่นคง (Senior Dev)", Email = "kanda.m@deves.co.th", EmployeeId = "DVS-10024", Title = "Senior Developer", DepartmentName = "ฝ่ายสารสนเทศ", DepartmentRef = "dept-it", TelephoneNumber = "02-670-4400 Ext 305" },
                new() { SAMAccountName = "wichai.c", UserPrincipalName = "wichai.c@deves.co.th", DisplayName = "นายวิชัย ชาญณรงค์ (ผอ. การเงิน)", Email = "wichai.c@deves.co.th", EmployeeId = "DVS-10025", Title = "ผู้อำนวยการฝ่ายการเงิน", DepartmentName = "ฝ่ายการเงิน", DepartmentRef = "dept-fin", TelephoneNumber = "02-670-4400 Ext 400" },
                new() { SAMAccountName = "siriporn.w", UserPrincipalName = "siriporn.w@deves.co.th", DisplayName = "น.ส. ศิริพร วงศ์สว่าง (เจ้าหน้าที่การเงิน)", Email = "siriporn.w@deves.co.th", EmployeeId = "DVS-10026", Title = "เจ้าหน้าที่การเงินอาวุโส", DepartmentName = "ฝ่ายการเงิน", DepartmentRef = "dept-fin", TelephoneNumber = "02-670-4400 Ext 405" },
                new() { SAMAccountName = "prapat.k", UserPrincipalName = "prapat.k@deves.co.th", DisplayName = "นายประภัสร์ เก่งกล้า (หัวหน้า บัญชี/การเงิน)", Email = "prapat.k@deves.co.th", EmployeeId = "DVS-10027", Title = "หัวหน้าแผนกบัญชี", DepartmentName = "ฝ่ายการเงิน", DepartmentRef = "dept-fin", TelephoneNumber = "02-670-4400 Ext 410" },
                new() { SAMAccountName = "prasit.m", UserPrincipalName = "prasit.m@deves.co.th", DisplayName = "นายประสิทธิ์ มั่นคง (ผอ. วิศวกรรม)", Email = "prasit.m@deves.co.th", EmployeeId = "DVS-10028", Title = "ผู้อำนวยการฝ่ายวิศวกรรม", DepartmentName = "ฝ่ายวิศวกรรม", DepartmentRef = "dept-eng", TelephoneNumber = "02-670-4400 Ext 500" },
                new() { SAMAccountName = "preeya.w", UserPrincipalName = "preeya.w@deves.co.th", DisplayName = "นางปรียา วัฒนา (ผอ. HR)", Email = "preeya.w@deves.co.th", EmployeeId = "DVS-10029", Title = "ผู้อำนวยการฝ่ายทรัพยากรบุคคล", DepartmentName = "ฝ่ายทรัพยากรบุคคล", DepartmentRef = "dept-hr", TelephoneNumber = "02-670-4400 Ext 600" },
                new() { SAMAccountName = "veera.c", UserPrincipalName = "veera.c@deves.co.th", DisplayName = "นายวีระ ชาญวิทย์ (ผอ. กฎหมาย)", Email = "veera.c@deves.co.th", EmployeeId = "DVS-10030", Title = "ผู้อำนวยการฝ่ายกฎหมาย", DepartmentName = "ฝ่ายกฎหมาย", DepartmentRef = "dept-legal", TelephoneNumber = "02-670-4400 Ext 700" },
                new() { SAMAccountName = "somchai.j", UserPrincipalName = "somchai.j@deves.co.th", DisplayName = "นายสมชาย ใจดี (ผอ. การตลาด)", Email = "somchai.j@deves.co.th", EmployeeId = "DVS-10031", Title = "ผู้อำนวยการฝ่ายการตลาด", DepartmentName = "ฝ่ายการตลาด", DepartmentRef = "dept-mkt", TelephoneNumber = "02-670-4400 Ext 800" },
                new() { SAMAccountName = "pimchanok.t", UserPrincipalName = "pimchanok.t@deves.co.th", DisplayName = "น.ส. พิมพ์ชนก ทรัพย์เจริญ (ผอ. พัสดุ)", Email = "pimchanok.t@deves.co.th", EmployeeId = "DVS-10032", Title = "ผู้อำนวยการฝ่ายพัสดุและจัดซื้อ", DepartmentName = "ฝ่ายพัสดุและจัดซื้อ", DepartmentRef = "dept-proc", TelephoneNumber = "02-670-4400 Ext 900" },
                new() { SAMAccountName = "wilai.p", UserPrincipalName = "wilai.p@deves.co.th", DisplayName = "นางวิไล พรประเสริฐ (ผอ. บริหาร)", Email = "wilai.p@deves.co.th", EmployeeId = "DVS-10033", Title = "ผู้อำนวยการฝ่ายบริหารทั่วไป", DepartmentName = "ฝ่ายบริหาร", DepartmentRef = "dept-admin", TelephoneNumber = "02-670-4400 Ext 150" },
                new() { SAMAccountName = "monitor.auditor", UserPrincipalName = "auditor@deves.co.th", DisplayName = "ผู้ตรวจการ ปฏิบัติตามกฎเกณฑ์ (Internal Auditor)", Email = "auditor@deves.co.th", EmployeeId = "DVS-90001", Title = "Compliance & Internal Audit Manager", DepartmentName = "ฝ่ายบริหาร", DepartmentRef = "dept-admin", TelephoneNumber = "02-670-4400 Ext 199" },
                
                // New Active Directory accounts available for LDAP Search & Provisioning
                new() { SAMAccountName = "nattawut.s", UserPrincipalName = "nattawut.s@deves.co.th", DisplayName = "นายณัฐวุฒิ สมบูรณ์ (วิศวกรโยธา)", Email = "nattawut.s@deves.co.th", EmployeeId = "DVS-20041", Title = "วิศวกรโยธาอาวุโส", DepartmentName = "ฝ่ายวิศวกรรม", DepartmentRef = "dept-eng", TelephoneNumber = "02-670-4400 Ext 505" },
                new() { SAMAccountName = "chutima.k", UserPrincipalName = "chutima.k@deves.co.th", DisplayName = "น.ส. ชุติมา เกียรติสกุล (นิติกรอาวุโส)", Email = "chutima.k@deves.co.th", EmployeeId = "DVS-20042", Title = "นิติกรอาวุโส", DepartmentName = "ฝ่ายกฎหมาย", DepartmentRef = "dept-legal", TelephoneNumber = "02-670-4400 Ext 705" },
                new() { SAMAccountName = "boonchai.l", UserPrincipalName = "boonchai.l@deves.co.th", DisplayName = "นายบุญชัย เลิศล้ำ (เจ้าหน้าที่จัดซื้อ)", Email = "boonchai.l@deves.co.th", EmployeeId = "DVS-20043", Title = "เจ้าหน้าที่จัดซื้อ", DepartmentName = "ฝ่ายพัสดุและจัดซื้อ", DepartmentRef = "dept-proc", TelephoneNumber = "02-670-4400 Ext 905" },
                new() { SAMAccountName = "thanaporn.r", UserPrincipalName = "thanaporn.r@deves.co.th", DisplayName = "น.ส. ธนาภรณ์ รุ่งเรือง (เจ้าหน้าที่บุคคล)", Email = "thanaporn.r@deves.co.th", EmployeeId = "DVS-20044", Title = "เจ้าหน้าที่พัฒนาทรัพยากรบุคคล", DepartmentName = "ฝ่ายทรัพยากรบุคคล", DepartmentRef = "dept-hr", TelephoneNumber = "02-670-4400 Ext 605" },
                new() { SAMAccountName = "ekkachai.p", UserPrincipalName = "ekkachai.p@deves.co.th", DisplayName = "นายเอกชัย พิทักษ์ธรรม (DBA)", Email = "ekkachai.p@deves.co.th", EmployeeId = "DVS-20045", Title = "Database Administrator", DepartmentName = "ฝ่ายสารสนเทศ", DepartmentRef = "dept-it", TelephoneNumber = "02-670-4400 Ext 310" },
                new() { SAMAccountName = "jintana.t", UserPrincipalName = "jintana.t@deves.co.th", DisplayName = "น.ส. จินตนา ทวีสุข (ธุรการสารบรรณ)", Email = "jintana.t@deves.co.th", EmployeeId = "DVS-20046", Title = "เจ้าหน้าที่ธุรการสารบรรณ", DepartmentName = "งานสารบรรณ", DepartmentRef = "dept-records", TelephoneNumber = "02-670-4400 Ext 205" },
                new() { SAMAccountName = "kittisak.n", UserPrincipalName = "kittisak.n@deves.co.th", DisplayName = "นายกิตติศักดิ์ นิรันดร์ (เจ้าหน้าที่ตรวจสอบสินไหม)", Email = "kittisak.n@deves.co.th", EmployeeId = "DVS-20047", Title = "เจ้าหน้าที่ตรวจสอบสินไหม", DepartmentName = "ฝ่ายบริหาร", DepartmentRef = "dept-admin", TelephoneNumber = "02-670-4400 Ext 155" },
                new() { SAMAccountName = "porntip.s", UserPrincipalName = "porntip.s@deves.co.th", DisplayName = "นางพรทิพย์ สถิตพันธุ์ (ผอ. อาวุโส)", Email = "porntip.s@deves.co.th", EmployeeId = "DVS-20048", Title = "ผู้อำนวยการอาวุโสสายงานบริหาร", DepartmentName = "ฝ่ายบริหาร", DepartmentRef = "dept-admin", TelephoneNumber = "02-670-4400 Ext 105" },
                new() { SAMAccountName = "worawan.d", UserPrincipalName = "worawan.d@deves.co.th", DisplayName = "น.ส. วรวรรณ ดารารัตน์ (การตลาดดิจิทัล)", Email = "worawan.d@deves.co.th", EmployeeId = "DVS-20049", Title = "Digital Marketing Specialist", DepartmentName = "ฝ่ายการตลาด", DepartmentRef = "dept-mkt", TelephoneNumber = "02-670-4400 Ext 805" }
            };
            db.AdMockUsers.AddRange(adUsers);
            await db.SaveChangesAsync();
        }

        await ReconcileMockUatIdentitiesAsync(db);

        logger.LogInformation("Database initialized with reconciled master data, roles, and mock UAT users.");
    }

    /// <summary>
    /// Reconciles every active mock directory identity to an active application user.
    /// The initial seed predates several mock accounts and only ran when tables were empty,
    /// so existing databases could contain valid AD users that could not sign in to the app.
    /// </summary>
    private static async Task ReconcileMockUatIdentitiesAsync(CorrespondenceDbContext db)
    {
        var roleByUserId = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["sutthichok.t"] = "ROLE-05",
            ["admin"] = "ROLE-05",
            ["somchai.p"] = "ROLE-01",
            ["anong.s"] = "ROLE-03",
            ["wichai.t"] = "ROLE-03",
            ["kanda.m"] = "ROLE-02",
            ["wichai.c"] = "ROLE-03",
            ["siriporn.w"] = "ROLE-02",
            ["prapat.k"] = "ROLE-04",
            ["prasit.m"] = "ROLE-03",
            ["preeya.w"] = "ROLE-03",
            ["veera.c"] = "ROLE-03",
            ["somchai.j"] = "ROLE-03",
            ["pimchanok.t"] = "ROLE-03",
            ["wilai.p"] = "ROLE-03",
            ["monitor.auditor"] = "ROLE-07",
            ["nattawut.s"] = "ROLE-02",
            ["chutima.k"] = "ROLE-02",
            ["boonchai.l"] = "ROLE-02",
            ["thanaporn.r"] = "ROLE-02",
            ["ekkachai.p"] = "ROLE-02",
            ["jintana.t"] = "ROLE-01",
            ["kittisak.n"] = "ROLE-02",
            ["porntip.s"] = "ROLE-03",
            ["worawan.d"] = "ROLE-02"
        };

        // The previous mock record described prapat.k as a Finance staff member, while the
        // corresponding application identity is the organisation-wide executive viewer.
        // Keep both mock sources aligned so department-based authorization is deterministic.
        var prapat = await db.AdMockUsers.FindAsync("prapat.k");
        if (prapat is not null)
        {
            prapat.DisplayName = "นายประภัสสร เกียรติสกุล (ผู้บริหารระดับสูง)";
            prapat.Email = "prapat.k@deves.co.th";
            prapat.UserPrincipalName = "prapat.k@deves.co.th";
            prapat.Title = "ผู้บริหารระดับสูง";
            prapat.DepartmentName = "ฝ่ายบริหาร";
            prapat.DepartmentRef = "dept-admin";
            prapat.IsActive = true;
        }

        var identityIds = roleByUserId.Keys.ToList();
        var directoryUsers = await db.AdMockUsers
            .Where(ad => identityIds.Contains(ad.SAMAccountName))
            .ToListAsync();
        var applicationUsers = await db.Users
            .Where(user => identityIds.Contains(user.UserId))
            .ToDictionaryAsync(user => user.UserId, StringComparer.OrdinalIgnoreCase);

        foreach (var directoryUser in directoryUsers)
        {
            directoryUser.IsActive = true;

            if (!applicationUsers.TryGetValue(directoryUser.SAMAccountName, out var applicationUser))
            {
                applicationUser = new User
                {
                    UserId = directoryUser.SAMAccountName,
                    Source = "LDAP",
                    ProvisionedBy = "system",
                    ProvisionedAt = DateTime.UtcNow
                };
                db.Users.Add(applicationUser);
                applicationUsers.Add(applicationUser.UserId, applicationUser);
            }

            applicationUser.DisplayName = directoryUser.DisplayName;
            applicationUser.Email = directoryUser.Email;
            applicationUser.DepartmentRef = directoryUser.DepartmentRef;
            applicationUser.RoleId = roleByUserId[directoryUser.SAMAccountName];
            applicationUser.Source = "LDAP";
            applicationUser.Status = "Active";
        }

        await db.SaveChangesAsync();
    }
}
