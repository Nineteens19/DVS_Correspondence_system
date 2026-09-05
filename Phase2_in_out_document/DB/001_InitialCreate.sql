IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE TABLE [ATTACHMENT_ACCESS_LOG] (
        [AccessId] nvarchar(100) NOT NULL,
        [DocRef] nvarchar(100) NOT NULL,
        [AttachmentId] nvarchar(100) NOT NULL,
        [UserId] nvarchar(100) NOT NULL,
        [AccessType] nvarchar(20) NOT NULL,
        [IpAddress] nvarchar(64) NULL,
        [UserAgent] nvarchar(512) NULL,
        [AccessedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_ATTACHMENT_ACCESS_LOG] PRIMARY KEY ([AccessId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE TABLE [AUDIT_LOG] (
        [LogId] nvarchar(100) NOT NULL,
        [DocRef] nvarchar(100) NULL,
        [ActorRef] nvarchar(100) NOT NULL,
        [Action] nvarchar(100) NOT NULL,
        [FromState] nvarchar(50) NULL,
        [ToState] nvarchar(50) NULL,
        [HolderRef] nvarchar(100) NULL,
        [IpAddress] nvarchar(64) NULL,
        [ActionTime] datetime2 NOT NULL,
        [Note] nvarchar(2000) NULL,
        CONSTRAINT [PK_AUDIT_LOG] PRIMARY KEY ([LogId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE TABLE [CUSTODY_LOG] (
        [Id] nvarchar(100) NOT NULL,
        [AssignmentId] nvarchar(100) NOT NULL,
        [DocRef] nvarchar(100) NOT NULL,
        [HolderRef] nvarchar(100) NOT NULL,
        [Action] nvarchar(50) NOT NULL,
        [HeldAt] datetime2 NOT NULL,
        [Note] nvarchar(1000) NULL,
        CONSTRAINT [PK_CUSTODY_LOG] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE TABLE [DELIVERY_METHOD] (
        [DeliveryMethodId] nvarchar(50) NOT NULL,
        [Label] nvarchar(200) NOT NULL,
        [IsPostalPickup] bit NOT NULL DEFAULT CAST(0 AS bit),
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        CONSTRAINT [PK_DELIVERY_METHOD] PRIMARY KEY ([DeliveryMethodId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE TABLE [DEPARTMENT] (
        [DepartmentId] nvarchar(100) NOT NULL,
        [NameTh] nvarchar(200) NOT NULL,
        [NameEn] nvarchar(200) NULL,
        [DeptCodeTh] nvarchar(50) NULL,
        [DeptCodeEn] nvarchar(50) NULL,
        [HeadUserRef] nvarchar(100) NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        CONSTRAINT [PK_DEPARTMENT] PRIMARY KEY ([DepartmentId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE TABLE [MONITOR_ASSIGNMENT] (
        [MonitorId] nvarchar(100) NOT NULL,
        [MonitorUserRef] nvarchar(100) NOT NULL,
        [ScopeType] nvarchar(30) NOT NULL,
        [ScopeRefs] nvarchar(max) NOT NULL,
        [AllDepartments] bit NOT NULL,
        [DocDirectionFilter] nvarchar(20) NOT NULL,
        [NotifyEnabled] bit NOT NULL,
        [EffectiveFrom] datetime2 NULL,
        [EffectiveTo] datetime2 NULL,
        [Status] nvarchar(20) NOT NULL,
        [CreatedBy] nvarchar(100) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_MONITOR_ASSIGNMENT] PRIMARY KEY ([MonitorId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE TABLE [OTP_TRANSACTION] (
        [OtpId] nvarchar(100) NOT NULL,
        [DocRef] nvarchar(100) NOT NULL,
        [UserId] nvarchar(100) NOT NULL,
        [OtpCodeHash] nvarchar(200) NOT NULL,
        [OtpRef] nvarchar(50) NULL,
        [DeliveryChannel] nvarchar(20) NOT NULL,
        [TargetDestination] nvarchar(256) NULL,
        [AttemptCount] int NOT NULL,
        [Status] nvarchar(30) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [VerifiedAt] datetime2 NULL,
        [LockedUntil] datetime2 NULL,
        CONSTRAINT [PK_OTP_TRANSACTION] PRIMARY KEY ([OtpId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE TABLE [ROLE] (
        [RoleId] nvarchar(50) NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [DataScope] nvarchar(20) NOT NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        CONSTRAINT [PK_ROLE] PRIMARY KEY ([RoleId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE TABLE [MAIN_DOC] (
        [DocRef] nvarchar(100) NOT NULL,
        [DocDirection] nvarchar(20) NOT NULL,
        [DocType] nvarchar(50) NOT NULL,
        [Channel] nvarchar(50) NULL,
        [Urgency] nvarchar(20) NOT NULL,
        [ConfidentialityLevel] nvarchar(20) NOT NULL,
        [Deadline] datetime2 NULL,
        [Status] nvarchar(30) NOT NULL,
        [DeadlineFlag] nvarchar(20) NOT NULL,
        [ProgressPercent] decimal(5,2) NOT NULL,
        [OriginDepartmentRef] nvarchar(100) NULL,
        [ResponsibleDepartmentRef] nvarchar(100) NULL,
        [RegistrarRef] nvarchar(100) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_MAIN_DOC] PRIMARY KEY ([DocRef]),
        CONSTRAINT [FK_MAIN_DOC_DEPARTMENT_OriginDepartmentRef] FOREIGN KEY ([OriginDepartmentRef]) REFERENCES [DEPARTMENT] ([DepartmentId]) ON DELETE NO ACTION,
        CONSTRAINT [FK_MAIN_DOC_DEPARTMENT_ResponsibleDepartmentRef] FOREIGN KEY ([ResponsibleDepartmentRef]) REFERENCES [DEPARTMENT] ([DepartmentId]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE TABLE [OUT_DOC] (
        [DocNo] nvarchar(100) NOT NULL,
        [DocumentNumberTh] nvarchar(100) NOT NULL,
        [DocumentNumberEn] nvarchar(100) NOT NULL,
        [EdrRequestId] nvarchar(100) NULL,
        [DocDirection] nvarchar(20) NOT NULL,
        [OrgType] nvarchar(50) NULL,
        [ExternalOrgRef] nvarchar(100) NULL,
        [CustomOrgName] nvarchar(200) NULL,
        [Urgency] nvarchar(20) NOT NULL,
        [ConfidentialityLevel] nvarchar(20) NOT NULL,
        [DeliveryMethodId] nvarchar(50) NULL,
        [Deadline] datetime2 NULL,
        [Status] nvarchar(30) NOT NULL,
        [DeadlineFlag] nvarchar(20) NOT NULL,
        [OriginDepartmentRef] nvarchar(100) NULL,
        [SenderRef] nvarchar(100) NULL,
        [SentAt] datetime2 NULL,
        [DeliveredAt] datetime2 NULL,
        CONSTRAINT [PK_OUT_DOC] PRIMARY KEY ([DocNo]),
        CONSTRAINT [AK_OUT_DOC_DocumentNumberEn] UNIQUE ([DocumentNumberEn]),
        CONSTRAINT [AK_OUT_DOC_DocumentNumberTh] UNIQUE ([DocumentNumberTh]),
        CONSTRAINT [FK_OUT_DOC_DELIVERY_METHOD_DeliveryMethodId] FOREIGN KEY ([DeliveryMethodId]) REFERENCES [DELIVERY_METHOD] ([DeliveryMethodId]) ON DELETE NO ACTION,
        CONSTRAINT [FK_OUT_DOC_DEPARTMENT_OriginDepartmentRef] FOREIGN KEY ([OriginDepartmentRef]) REFERENCES [DEPARTMENT] ([DepartmentId]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE TABLE [WORKGROUP] (
        [WorkgroupId] nvarchar(100) NOT NULL,
        [DepartmentId] nvarchar(100) NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        CONSTRAINT [PK_WORKGROUP] PRIMARY KEY ([WorkgroupId]),
        CONSTRAINT [FK_WORKGROUP_DEPARTMENT_DepartmentId] FOREIGN KEY ([DepartmentId]) REFERENCES [DEPARTMENT] ([DepartmentId]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE TABLE [PERMISSION] (
        [PermKey] nvarchar(100) NOT NULL,
        [RoleId] nvarchar(50) NOT NULL,
        CONSTRAINT [PK_PERMISSION] PRIMARY KEY ([PermKey], [RoleId]),
        CONSTRAINT [FK_PERMISSION_ROLE_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [ROLE] ([RoleId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE TABLE [USER] (
        [UserId] nvarchar(100) NOT NULL,
        [DisplayName] nvarchar(200) NOT NULL,
        [Email] nvarchar(256) NULL,
        [DepartmentRef] nvarchar(100) NULL,
        [RoleId] nvarchar(50) NULL,
        [Source] nvarchar(50) NOT NULL,
        [Status] nvarchar(20) NOT NULL,
        [ProvisionedBy] nvarchar(100) NULL,
        [ProvisionedAt] datetime2 NULL,
        [LastLoginAt] datetime2 NULL,
        CONSTRAINT [PK_USER] PRIMARY KEY ([UserId]),
        CONSTRAINT [FK_USER_DEPARTMENT_DepartmentRef] FOREIGN KEY ([DepartmentRef]) REFERENCES [DEPARTMENT] ([DepartmentId]) ON DELETE NO ACTION,
        CONSTRAINT [FK_USER_ROLE_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [ROLE] ([RoleId]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE TABLE [ASSIGNMENT] (
        [Id] nvarchar(100) NOT NULL,
        [DocRef] nvarchar(100) NOT NULL,
        [KeyReference] nvarchar(100) NOT NULL,
        [AssigneeRef] nvarchar(100) NOT NULL,
        [AssigneeType] nvarchar(20) NOT NULL,
        [AssigneeDepartmentRef] nvarchar(100) NULL,
        [Status] nvarchar(20) NOT NULL,
        [Deadline] datetime2 NULL,
        [RejectNote] nvarchar(1000) NULL,
        [ParentId] nvarchar(100) NULL,
        [AcceptedAt] datetime2 NULL,
        CONSTRAINT [PK_ASSIGNMENT] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ASSIGNMENT_ASSIGNMENT_ParentId] FOREIGN KEY ([ParentId]) REFERENCES [ASSIGNMENT] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ASSIGNMENT_DEPARTMENT_AssigneeDepartmentRef] FOREIGN KEY ([AssigneeDepartmentRef]) REFERENCES [DEPARTMENT] ([DepartmentId]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ASSIGNMENT_MAIN_DOC_DocRef] FOREIGN KEY ([DocRef]) REFERENCES [MAIN_DOC] ([DocRef]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE TABLE [ATTACHMENT] (
        [Id] nvarchar(100) NOT NULL,
        [DocRef] nvarchar(100) NOT NULL,
        [FilePath] nvarchar(1000) NOT NULL,
        [FileName] nvarchar(400) NOT NULL,
        [FileType] nvarchar(100) NULL,
        [AttachmentSource] nvarchar(20) NOT NULL,
        [IsMirrored] bit NOT NULL,
        [RotationDeg] int NOT NULL,
        [IsConfidential] bit NOT NULL,
        [IsPrimary] bit NOT NULL,
        [IsEncrypted] bit NOT NULL,
        [FileHash] nvarchar(128) NULL,
        [UploadedBy] nvarchar(100) NOT NULL,
        [UploadedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_ATTACHMENT] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ATTACHMENT_MAIN_DOC_DocRef] FOREIGN KEY ([DocRef]) REFERENCES [MAIN_DOC] ([DocRef]) ON DELETE CASCADE,
        CONSTRAINT [FK_ATTACHMENT_OUT_DOC_DocRef] FOREIGN KEY ([DocRef]) REFERENCES [OUT_DOC] ([DocNo]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE TABLE [OUT_ITEM] (
        [Id] nvarchar(100) NOT NULL,
        [DocNo] nvarchar(100) NOT NULL,
        [Description] nvarchar(1000) NOT NULL,
        [RecipientName] nvarchar(200) NULL,
        [Note] nvarchar(1000) NULL,
        CONSTRAINT [PK_OUT_ITEM] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_OUT_ITEM_OUT_DOC_DocNo] FOREIGN KEY ([DocNo]) REFERENCES [OUT_DOC] ([DocNo]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE TABLE [OUT_RECIPIENT] (
        [Id] nvarchar(100) NOT NULL,
        [DocNo] nvarchar(100) NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Position] nvarchar(200) NULL,
        [Department] nvarchar(200) NULL,
        CONSTRAINT [PK_OUT_RECIPIENT] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_OUT_RECIPIENT_OUT_DOC_DocNo] FOREIGN KEY ([DocNo]) REFERENCES [OUT_DOC] ([DocNo]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE TABLE [OUT_SIGNER] (
        [Id] nvarchar(100) NOT NULL,
        [DocNo] nvarchar(100) NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Position] nvarchar(200) NULL,
        CONSTRAINT [PK_OUT_SIGNER] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_OUT_SIGNER_OUT_DOC_DocNo] FOREIGN KEY ([DocNo]) REFERENCES [OUT_DOC] ([DocNo]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE TABLE [FORWARD_LOG] (
        [Id] nvarchar(100) NOT NULL,
        [AssignmentId] nvarchar(100) NOT NULL,
        [FromUser] nvarchar(100) NOT NULL,
        [ToUser] nvarchar(100) NOT NULL,
        [ForwardedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_FORWARD_LOG] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_FORWARD_LOG_ASSIGNMENT_AssignmentId] FOREIGN KEY ([AssignmentId]) REFERENCES [ASSIGNMENT] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'DeliveryMethodId', N'IsActive', N'Label') AND [object_id] = OBJECT_ID(N'[DELIVERY_METHOD]'))
        SET IDENTITY_INSERT [DELIVERY_METHOD] ON;
    EXEC(N'INSERT INTO [DELIVERY_METHOD] ([DeliveryMethodId], [IsActive], [Label])
    VALUES (N''dm-01'', CAST(1 AS bit), N''ไปรษณีย์ลงทะเบียน''),
    (N''dm-02'', CAST(1 AS bit), N''ไปรษณีย์ด่วนพิเศษ (EMS)'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'DeliveryMethodId', N'IsActive', N'Label') AND [object_id] = OBJECT_ID(N'[DELIVERY_METHOD]'))
        SET IDENTITY_INSERT [DELIVERY_METHOD] OFF;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'DeliveryMethodId', N'IsActive', N'IsPostalPickup', N'Label') AND [object_id] = OBJECT_ID(N'[DELIVERY_METHOD]'))
        SET IDENTITY_INSERT [DELIVERY_METHOD] ON;
    EXEC(N'INSERT INTO [DELIVERY_METHOD] ([DeliveryMethodId], [IsActive], [IsPostalPickup], [Label])
    VALUES (N''dm-03'', CAST(1 AS bit), CAST(1 AS bit), N''ให้ไปรษณีย์มารับ (ปณ. มารับ)'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'DeliveryMethodId', N'IsActive', N'IsPostalPickup', N'Label') AND [object_id] = OBJECT_ID(N'[DELIVERY_METHOD]'))
        SET IDENTITY_INSERT [DELIVERY_METHOD] OFF;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'DeliveryMethodId', N'IsActive', N'Label') AND [object_id] = OBJECT_ID(N'[DELIVERY_METHOD]'))
        SET IDENTITY_INSERT [DELIVERY_METHOD] ON;
    EXEC(N'INSERT INTO [DELIVERY_METHOD] ([DeliveryMethodId], [IsActive], [Label])
    VALUES (N''dm-04'', CAST(1 AS bit), N''Messenger บริษัท''),
    (N''dm-05'', CAST(1 AS bit), N''รับด้วยตนเอง (มารับเอง)''),
    (N''dm-06'', CAST(1 AS bit), N''จัดส่งอิเล็กทรอนิกส์ / อีเมล'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'DeliveryMethodId', N'IsActive', N'Label') AND [object_id] = OBJECT_ID(N'[DELIVERY_METHOD]'))
        SET IDENTITY_INSERT [DELIVERY_METHOD] OFF;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'DepartmentId', N'DeptCodeEn', N'DeptCodeTh', N'HeadUserRef', N'IsActive', N'NameEn', N'NameTh') AND [object_id] = OBJECT_ID(N'[DEPARTMENT]'))
        SET IDENTITY_INSERT [DEPARTMENT] ON;
    EXEC(N'INSERT INTO [DEPARTMENT] ([DepartmentId], [DeptCodeEn], [DeptCodeTh], [HeadUserRef], [IsActive], [NameEn], [NameTh])
    VALUES (N''dept-admin'', N''AD'', N''บห'', N''wilai.p'', CAST(1 AS bit), N''Administration Department'', N''ฝ่ายบริหาร''),
    (N''dept-eng'', N''EN'', N''วก'', N''prasit.m'', CAST(1 AS bit), N''Engineering Department'', N''ฝ่ายวิศวกรรม''),
    (N''dept-fin'', N''FN'', N''กง'', N''wichai.c'', CAST(1 AS bit), N''Finance Department'', N''ฝ่ายการเงิน''),
    (N''dept-hr'', N''HR'', N''บค'', N''preeya.w'', CAST(1 AS bit), N''Human Resources Department'', N''ฝ่ายทรัพยากรบุคคล''),
    (N''dept-it'', N''IT'', N''สท'', N''kittipong.s'', CAST(1 AS bit), N''IT Department'', N''ฝ่ายสารสนเทศ''),
    (N''dept-legal'', N''LG'', N''กม'', N''veera.c'', CAST(1 AS bit), N''Legal Department'', N''ฝ่ายกฎหมาย''),
    (N''dept-mkt'', N''MK'', N''กต'', N''somchai.j'', CAST(1 AS bit), N''Marketing Department'', N''ฝ่ายการตลาด''),
    (N''dept-proc'', N''PC'', N''พด'', N''pimchanok.t'', CAST(1 AS bit), N''Procurement Department'', N''ฝ่ายพัสดุและจัดซื้อ''),
    (N''dept-records'', N''RC'', N''สบ'', N''rattana.s'', CAST(1 AS bit), N''Records / Correspondence'', N''งานสารบรรณ'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'DepartmentId', N'DeptCodeEn', N'DeptCodeTh', N'HeadUserRef', N'IsActive', N'NameEn', N'NameTh') AND [object_id] = OBJECT_ID(N'[DEPARTMENT]'))
        SET IDENTITY_INSERT [DEPARTMENT] OFF;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'RoleId', N'DataScope', N'IsActive', N'Name') AND [object_id] = OBJECT_ID(N'[ROLE]'))
        SET IDENTITY_INSERT [ROLE] ON;
    EXEC(N'INSERT INTO [ROLE] ([RoleId], [DataScope], [IsActive], [Name])
    VALUES (N''ROLE-01'', N''own'', CAST(1 AS bit), N''ผู้ Register''),
    (N''ROLE-02'', N''own'', CAST(1 AS bit), N''เจ้าของงานปลายทาง (ผู้ใช้ปกติ)''),
    (N''ROLE-03'', N''dept'', CAST(1 AS bit), N''หัวหน้าฝ่าย / ผู้กำกับดูแล''),
    (N''ROLE-04'', N''all'', CAST(1 AS bit), N''Viewer สูงสุด (ผู้บริหาร/ส่วนกลาง)''),
    (N''ROLE-05'', N''all'', CAST(1 AS bit), N''Admin''),
    (N''ROLE-06'', N''own'', CAST(1 AS bit), N''ผู้ส่งเอกสารออก''),
    (N''ROLE-07'', N''own'', CAST(1 AS bit), N''Monitor (ผู้เฝ้าติดตามงานตาม Scope)'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'RoleId', N'DataScope', N'IsActive', N'Name') AND [object_id] = OBJECT_ID(N'[ROLE]'))
        SET IDENTITY_INSERT [ROLE] OFF;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'PermKey', N'RoleId') AND [object_id] = OBJECT_ID(N'[PERMISSION]'))
        SET IDENTITY_INSERT [PERMISSION] ON;
    EXEC(N'INSERT INTO [PERMISSION] ([PermKey], [RoleId])
    VALUES (N''accept-reject-forward'', N''ROLE-02''),
    (N''accept-reject-forward'', N''ROLE-03''),
    (N''assign'', N''ROLE-01''),
    (N''assign'', N''ROLE-02''),
    (N''assign'', N''ROLE-03''),
    (N''assign'', N''ROLE-05''),
    (N''configure-monitor'', N''ROLE-03''),
    (N''configure-monitor'', N''ROLE-05''),
    (N''confirm-physical-return'', N''ROLE-01''),
    (N''confirm-physical-return'', N''ROLE-03''),
    (N''confirm-physical-return'', N''ROLE-05''),
    (N''export-report'', N''ROLE-01''),
    (N''export-report'', N''ROLE-03''),
    (N''export-report'', N''ROLE-04''),
    (N''export-report'', N''ROLE-05''),
    (N''export-report'', N''ROLE-07''),
    (N''follow-up'', N''ROLE-01''),
    (N''follow-up'', N''ROLE-03''),
    (N''follow-up'', N''ROLE-05''),
    (N''follow-up'', N''ROLE-07''),
    (N''manage-master-data'', N''ROLE-05''),
    (N''manage-roles'', N''ROLE-05''),
    (N''manage-users'', N''ROLE-05''),
    (N''recall-cancel'', N''ROLE-01''),
    (N''recall-cancel'', N''ROLE-03''),
    (N''recall-cancel'', N''ROLE-05''),
    (N''register-document'', N''ROLE-01''),
    (N''register-document'', N''ROLE-02''),
    (N''register-document'', N''ROLE-03''),
    (N''register-document'', N''ROLE-05''),
    (N''register-outgoing'', N''ROLE-06''),
    (N''view-dashboard-all'', N''ROLE-04''),
    (N''view-dashboard-all'', N''ROLE-05''),
    (N''view-dashboard-dept'', N''ROLE-03''),
    (N''view-dashboard-dept'', N''ROLE-04''),
    (N''view-dashboard-dept'', N''ROLE-05''),
    (N''view-dashboard-dept'', N''ROLE-07''),
    (N''view-dashboard-own'', N''ROLE-01''),
    (N''view-dashboard-own'', N''ROLE-02''),
    (N''view-dashboard-own'', N''ROLE-03''),
    (N''view-dashboard-own'', N''ROLE-04''),
    (N''view-dashboard-own'', N''ROLE-05'');
    INSERT INTO [PERMISSION] ([PermKey], [RoleId])
    VALUES (N''view-dashboard-own'', N''ROLE-07'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'PermKey', N'RoleId') AND [object_id] = OBJECT_ID(N'[PERMISSION]'))
        SET IDENTITY_INSERT [PERMISSION] OFF;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'WorkgroupId', N'DepartmentId', N'IsActive', N'Name') AND [object_id] = OBJECT_ID(N'[WORKGROUP]'))
        SET IDENTITY_INSERT [WORKGROUP] ON;
    EXEC(N'INSERT INTO [WORKGROUP] ([WorkgroupId], [DepartmentId], [IsActive], [Name])
    VALUES (N''wg-01'', N''dept-fin'', CAST(1 AS bit), N''สายงานตรวจสอบบัญชี''),
    (N''wg-02'', N''dept-fin'', CAST(1 AS bit), N''สายงานงบประมาณ''),
    (N''wg-03'', N''dept-eng'', CAST(1 AS bit), N''สายงานโครงสร้างและอาคาร''),
    (N''wg-04'', N''dept-legal'', CAST(1 AS bit), N''สายงานนิติกรรมสัญญา''),
    (N''wg-05'', N''dept-hr'', CAST(1 AS bit), N''สายงานสวัสดิการ'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'WorkgroupId', N'DepartmentId', N'IsActive', N'Name') AND [object_id] = OBJECT_ID(N'[WORKGROUP]'))
        SET IDENTITY_INSERT [WORKGROUP] OFF;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ASSIGNMENT_AssigneeDepartmentRef] ON [ASSIGNMENT] ([AssigneeDepartmentRef]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ASSIGNMENT_doc_status] ON [ASSIGNMENT] ([DocRef], [Status]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ASSIGNMENT_parent_id] ON [ASSIGNMENT] ([ParentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ATTACHMENT_DocRef] ON [ATTACHMENT] ([DocRef]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ATTACHMENT_ACCESS_LOG_doc_accessed] ON [ATTACHMENT_ACCESS_LOG] ([DocRef], [AccessedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AUDIT_LOG_doc_action_time] ON [AUDIT_LOG] ([DocRef], [ActionTime]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_CUSTODY_LOG_AssignmentId] ON [CUSTODY_LOG] ([AssignmentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_CUSTODY_LOG_DocRef] ON [CUSTODY_LOG] ([DocRef]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_DEPARTMENT_IsActive] ON [DEPARTMENT] ([IsActive]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_FORWARD_LOG_AssignmentId] ON [FORWARD_LOG] ([AssignmentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_MAIN_DOC_confidentiality_level] ON [MAIN_DOC] ([ConfidentialityLevel]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_MAIN_DOC_OriginDepartmentRef] ON [MAIN_DOC] ([OriginDepartmentRef]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_MAIN_DOC_ResponsibleDepartmentRef] ON [MAIN_DOC] ([ResponsibleDepartmentRef]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_MAIN_DOC_status_deadline_responsible] ON [MAIN_DOC] ([Status], [DeadlineFlag], [ResponsibleDepartmentRef]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_MONITOR_ASSIGNMENT_MonitorUserRef] ON [MONITOR_ASSIGNMENT] ([MonitorUserRef]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_OTP_TRANSACTION_doc_user_status] ON [OTP_TRANSACTION] ([DocRef], [UserId], [Status]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_OUT_DOC_DeliveryMethodId] ON [OUT_DOC] ([DeliveryMethodId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_OUT_DOC_OriginDepartmentRef] ON [OUT_DOC] ([OriginDepartmentRef]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_OUT_DOC_Status_DeadlineFlag] ON [OUT_DOC] ([Status], [DeadlineFlag]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UX_OUT_DOC_edr_request_id] ON [OUT_DOC] ([EdrRequestId]) WHERE [EdrRequestId] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_OUT_ITEM_DocNo] ON [OUT_ITEM] ([DocNo]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_OUT_RECIPIENT_DocNo] ON [OUT_RECIPIENT] ([DocNo]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_OUT_SIGNER_DocNo] ON [OUT_SIGNER] ([DocNo]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_PERMISSION_RoleId] ON [PERMISSION] ([RoleId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_USER_DepartmentRef] ON [USER] ([DepartmentRef]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_USER_RoleId] ON [USER] ([RoleId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_WORKGROUP_DepartmentId] ON [WORKGROUP] ([DepartmentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829100347_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260829100347_InitialCreate', N'8.0.20');
END;
GO

COMMIT;
GO

