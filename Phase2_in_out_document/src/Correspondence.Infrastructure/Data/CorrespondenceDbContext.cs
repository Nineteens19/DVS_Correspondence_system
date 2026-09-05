using Correspondence.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Correspondence.Infrastructure.Data;

public class CorrespondenceDbContext : DbContext
{
    public CorrespondenceDbContext(DbContextOptions<CorrespondenceDbContext> options) : base(options)
    {
    }

    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Workgroup> Workgroups => Set<Workgroup>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<DeliveryMethod> DeliveryMethods => Set<DeliveryMethod>();
    public DbSet<User> Users => Set<User>();
    public DbSet<MainDoc> MainDocs => Set<MainDoc>();
    public DbSet<OutDoc> OutDocs => Set<OutDoc>();
    public DbSet<OutItem> OutItems => Set<OutItem>();
    public DbSet<OutRecipient> OutRecipients => Set<OutRecipient>();
    public DbSet<OutSigner> OutSigners => Set<OutSigner>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<ForwardLog> ForwardLogs => Set<ForwardLog>();
    public DbSet<CustodyLog> CustodyLogs => Set<CustodyLog>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<AttachmentAccessLog> AttachmentAccessLogs => Set<AttachmentAccessLog>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<MonitorAssignment> MonitorAssignments => Set<MonitorAssignment>();
    public DbSet<OtpTransaction> OtpTransactions => Set<OtpTransaction>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<NotificationDeliveryLog> NotificationDeliveryLogs => Set<NotificationDeliveryLog>();
    public DbSet<PendingReminder> PendingReminders => Set<PendingReminder>();
    public DbSet<AdMockUser> AdMockUsers => Set<AdMockUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // DEPARTMENT
        modelBuilder.Entity<Department>(entity =>
        {
            entity.ToTable("DEPARTMENT");
            entity.HasKey(e => e.DepartmentId);
        });

        // WORKGROUP
        modelBuilder.Entity<Workgroup>(entity =>
        {
            entity.ToTable("WORKGROUP");
            entity.HasKey(e => e.WorkgroupId);
            entity.HasOne(e => e.Department)
                  .WithMany(d => d.Workgroups)
                  .HasForeignKey(e => e.DepartmentId)
                  .OnDelete(DeleteBehavior.NoAction);
        });

        // ROLE
        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("ROLE");
            entity.HasKey(e => e.RoleId);
        });

        // PERMISSION
        modelBuilder.Entity<Permission>(entity =>
        {
            entity.ToTable("PERMISSION");
            entity.HasKey(e => new { e.PermKey, e.RoleId });
            entity.HasOne(e => e.Role)
                  .WithMany(r => r.Permissions)
                  .HasForeignKey(e => e.RoleId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // DELIVERY_METHOD
        modelBuilder.Entity<DeliveryMethod>(entity =>
        {
            entity.ToTable("DELIVERY_METHOD");
            entity.HasKey(e => e.DeliveryMethodId);
        });

        // USER
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("USER");
            entity.HasKey(e => e.UserId);
            entity.HasOne(e => e.Department)
                  .WithMany(d => d.Users)
                  .HasForeignKey(e => e.DepartmentRef)
                  .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(e => e.Role)
                  .WithMany(r => r.Users)
                  .HasForeignKey(e => e.RoleId)
                  .OnDelete(DeleteBehavior.NoAction);
        });

        // MAIN_DOC
        modelBuilder.Entity<MainDoc>(entity =>
        {
            entity.ToTable("MAIN_DOC");
            entity.HasKey(e => e.DocRef);
            entity.HasOne(e => e.OriginDepartment)
                  .WithMany(d => d.OriginMainDocs)
                  .HasForeignKey(e => e.OriginDepartmentRef)
                  .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(e => e.ResponsibleDepartment)
                  .WithMany(d => d.ResponsibleMainDocs)
                  .HasForeignKey(e => e.ResponsibleDepartmentRef)
                  .OnDelete(DeleteBehavior.NoAction);
        });

        // OUT_DOC
        modelBuilder.Entity<OutDoc>(entity =>
        {
            entity.ToTable("OUT_DOC");
            entity.HasKey(e => e.DocNo);
            entity.HasIndex(e => e.DocumentNumberTh).IsUnique();
            entity.HasIndex(e => e.DocumentNumberEn).IsUnique();
            entity.HasOne(e => e.DeliveryMethod)
                  .WithMany(d => d.OutDocs)
                  .HasForeignKey(e => e.DeliveryMethodId)
                  .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(e => e.OriginDepartment)
                  .WithMany(d => d.OutDocs)
                  .HasForeignKey(e => e.OriginDepartmentRef)
                  .OnDelete(DeleteBehavior.NoAction);
        });

        // OUT_ITEM
        modelBuilder.Entity<OutItem>(entity =>
        {
            entity.ToTable("OUT_ITEM");
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.OutDoc)
                  .WithMany(d => d.Items)
                  .HasForeignKey(e => e.DocNo)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // OUT_RECIPIENT
        modelBuilder.Entity<OutRecipient>(entity =>
        {
            entity.ToTable("OUT_RECIPIENT");
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.OutDoc)
                  .WithMany(d => d.Recipients)
                  .HasForeignKey(e => e.DocNo)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // OUT_SIGNER
        modelBuilder.Entity<OutSigner>(entity =>
        {
            entity.ToTable("OUT_SIGNER");
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.OutDoc)
                  .WithMany(d => d.Signers)
                  .HasForeignKey(e => e.DocNo)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ASSIGNMENT (Nested Hierarchy)
        modelBuilder.Entity<Assignment>(entity =>
        {
            entity.ToTable("ASSIGNMENT");
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.MainDoc)
                  .WithMany(d => d.Assignments)
                  .HasForeignKey(e => e.DocRef)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.AssigneeDepartment)
                  .WithMany()
                  .HasForeignKey(e => e.AssigneeDepartmentRef)
                  .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(e => e.Parent)
                  .WithMany(a => a.SubAssignments)
                  .HasForeignKey(e => e.ParentId)
                  .OnDelete(DeleteBehavior.NoAction);
        });

        // FORWARD_LOG
        modelBuilder.Entity<ForwardLog>(entity =>
        {
            entity.ToTable("FORWARD_LOG");
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Assignment)
                  .WithMany(a => a.ForwardLogs)
                  .HasForeignKey(e => e.AssignmentId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // CUSTODY_LOG
        modelBuilder.Entity<CustodyLog>(entity =>
        {
            entity.ToTable("CUSTODY_LOG");
            entity.HasKey(e => e.Id);
        });

        // ATTACHMENT
        modelBuilder.Entity<Attachment>(entity =>
        {
            entity.ToTable("ATTACHMENT");
            entity.HasKey(e => e.Id);
        });

        // ATTACHMENT_ACCESS_LOG
        modelBuilder.Entity<AttachmentAccessLog>(entity =>
        {
            entity.ToTable("ATTACHMENT_ACCESS_LOG");
            entity.HasKey(e => e.AccessId);
        });

        // AUDIT_LOG
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("AUDIT_LOG");
            entity.HasKey(e => e.LogId);
        });

        // MONITOR_ASSIGNMENT
        modelBuilder.Entity<MonitorAssignment>(entity =>
        {
            entity.ToTable("MONITOR_ASSIGNMENT");
            entity.HasKey(e => e.MonitorId);
        });

        // OTP_TRANSACTION
        modelBuilder.Entity<OtpTransaction>(entity =>
        {
            entity.ToTable("OTP_TRANSACTION");
            entity.HasKey(e => e.OtpId);
        });

        // NOTIFICATION
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("NOTIFICATION");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.DocRef);
            entity.HasIndex(e => new { e.RecipientRef, e.Channel, e.IsDone });
        });

        // NOTIFICATION_DELIVERY_LOG
        modelBuilder.Entity<NotificationDeliveryLog>(entity =>
        {
            entity.ToTable("NOTIFICATION_DELIVERY_LOG");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.DocRef, e.CreatedAt });
        });

        // PENDING_REMINDER
        modelBuilder.Entity<PendingReminder>(entity =>
        {
            entity.ToTable("PENDING_REMINDER");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.DocRef, e.Status });
        });
    }
}
