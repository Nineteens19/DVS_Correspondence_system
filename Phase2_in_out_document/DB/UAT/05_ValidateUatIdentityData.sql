/* Post-deployment validation: every active mock AD account must have an active application identity. */
SET NOCOUNT ON;

SELECT N'Role' AS Entity, COUNT(*) AS Total, SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) AS ActiveCount FROM [ROLE]
UNION ALL SELECT N'Department', COUNT(*), SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) FROM [DEPARTMENT]
UNION ALL SELECT N'Application user', COUNT(*), SUM(CASE WHEN [Status] = N'Active' THEN 1 ELSE 0 END) FROM [USER]
UNION ALL SELECT N'Mock AD user', COUNT(*), SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) FROM [AD_MOCK_USER];

SELECT a.SAMAccountName, a.DepartmentRef AS MockAdDepartment, u.DepartmentRef AS ApplicationDepartment,
       u.RoleId, u.Status AS ApplicationStatus, a.IsActive AS MockAdActive
FROM [AD_MOCK_USER] a
LEFT JOIN [USER] u ON u.UserId = a.SAMAccountName
WHERE a.IsActive = 1
  AND (u.UserId IS NULL OR u.Status <> N'Active' OR ISNULL(a.DepartmentRef, N'') <> ISNULL(u.DepartmentRef, N''));

IF EXISTS (
    SELECT 1
    FROM [AD_MOCK_USER] a
    LEFT JOIN [USER] u ON u.UserId = a.SAMAccountName
    WHERE a.IsActive = 1
      AND (u.UserId IS NULL OR u.Status <> N'Active' OR ISNULL(a.DepartmentRef, N'') <> ISNULL(u.DepartmentRef, N''))
)
    THROW 51001, 'UAT mock AD/application identity validation failed.', 1;

PRINT N'UAT mock AD/application identity validation passed.';
