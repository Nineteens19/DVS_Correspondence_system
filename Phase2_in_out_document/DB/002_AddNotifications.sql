BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260831094439_AddNotifications'
)
BEGIN
    CREATE TABLE [NOTIFICATION] (
        [Id] nvarchar(100) NOT NULL,
        [EventCode] nvarchar(20) NOT NULL,
        [DocRef] nvarchar(100) NOT NULL,
        [RecipientRef] nvarchar(100) NOT NULL,
        [Channel] nvarchar(20) NOT NULL,
        [Message] nvarchar(1000) NOT NULL,
        [Urgency] nvarchar(20) NULL,
        [IsRead] bit NOT NULL,
        [IsDone] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [ReadAt] datetime2 NULL,
        CONSTRAINT [PK_NOTIFICATION] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260831094439_AddNotifications'
)
BEGIN
    CREATE TABLE [NOTIFICATION_DELIVERY_LOG] (
        [Id] nvarchar(100) NOT NULL,
        [EventCode] nvarchar(20) NOT NULL,
        [DocRef] nvarchar(100) NOT NULL,
        [RecipientRef] nvarchar(100) NOT NULL,
        [Channel] nvarchar(20) NOT NULL,
        [Status] nvarchar(20) NOT NULL,
        [Detail] nvarchar(1000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_NOTIFICATION_DELIVERY_LOG] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260831094439_AddNotifications'
)
BEGIN
    CREATE TABLE [PENDING_REMINDER] (
        [Id] nvarchar(100) NOT NULL,
        [DocRef] nvarchar(100) NOT NULL,
        [AssignmentId] nvarchar(100) NULL,
        [EventCode] nvarchar(20) NOT NULL,
        [DueAt] datetime2 NOT NULL,
        [Status] nvarchar(20) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [CancelledAt] datetime2 NULL,
        CONSTRAINT [PK_PENDING_REMINDER] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260831094439_AddNotifications'
)
BEGIN
    CREATE INDEX [IX_NOTIFICATION_doc] ON [NOTIFICATION] ([DocRef]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260831094439_AddNotifications'
)
BEGIN
    CREATE INDEX [IX_NOTIFICATION_recipient_channel_done] ON [NOTIFICATION] ([RecipientRef], [Channel], [IsDone]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260831094439_AddNotifications'
)
BEGIN
    CREATE INDEX [IX_NOTIFICATION_DELIVERY_LOG_doc_created] ON [NOTIFICATION_DELIVERY_LOG] ([DocRef], [CreatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260831094439_AddNotifications'
)
BEGIN
    CREATE INDEX [IX_PENDING_REMINDER_doc_status] ON [PENDING_REMINDER] ([DocRef], [Status]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260831094439_AddNotifications'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260831094439_AddNotifications', N'8.0.20');
END;
GO

COMMIT;
GO

