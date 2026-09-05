using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Correspondence.Domain.Entities;

[Table("MONITOR_ASSIGNMENT")]
public class MonitorAssignment
{
    [Key]
    [Column("MonitorId")]
    [StringLength(100)]
    public string MonitorId { get; set; } = Guid.NewGuid().ToString();

    [Column("MonitorUserRef")]
    [StringLength(100)]
    public string MonitorUserRef { get; set; } = string.Empty;

    [Column("ScopeType")]
    [StringLength(30)]
    public string ScopeType { get; set; } = "all"; // all, department, workgroup

    [Column("ScopeRefs")]
    public string ScopeRefs { get; set; } = "[]";

    [Column("AllDepartments")]
    public bool AllDepartments { get; set; } = true;

    [Column("DocDirectionFilter")]
    [StringLength(20)]
    public string DocDirectionFilter { get; set; } = "all"; // all, incoming, outgoing

    [Column("NotifyEnabled")]
    public bool NotifyEnabled { get; set; } = true;

    [Column("EffectiveFrom")]
    public DateTime? EffectiveFrom { get; set; }

    [Column("EffectiveTo")]
    public DateTime? EffectiveTo { get; set; }

    [Column("Status")]
    [StringLength(20)]
    public string Status { get; set; } = "Active";

    [Column("CreatedBy")]
    [StringLength(100)]
    public string CreatedBy { get; set; } = "admin";

    [Column("CreatedAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[Table("OTP_TRANSACTION")]
public class OtpTransaction
{
    [Key]
    [Column("OtpId")]
    [StringLength(100)]
    public string OtpId { get; set; } = Guid.NewGuid().ToString();

    [Column("DocRef")]
    [StringLength(100)]
    public string DocRef { get; set; } = string.Empty;

    [Column("UserId")]
    [StringLength(100)]
    public string UserId { get; set; } = string.Empty;

    [Column("OtpCodeHash")]
    [StringLength(200)]
    public string OtpCodeHash { get; set; } = string.Empty;

    [Column("OtpRef")]
    [StringLength(50)]
    public string? OtpRef { get; set; }

    [Column("DeliveryChannel")]
    [StringLength(20)]
    public string DeliveryChannel { get; set; } = "email";

    [Column("TargetDestination")]
    [StringLength(256)]
    public string? TargetDestination { get; set; }

    [Column("AttemptCount")]
    public int AttemptCount { get; set; } = 0;

    [Column("Status")]
    [StringLength(30)]
    public string Status { get; set; } = "issued"; // issued, verified, expired, locked

    [Column("CreatedAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("ExpiresAt")]
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddMinutes(5);

    [Column("VerifiedAt")]
    public DateTime? VerifiedAt { get; set; }

    [Column("LockedUntil")]
    public DateTime? LockedUntil { get; set; }
}

[Table("NOTIFICATION")]
public class Notification
{
    [Key]
    [Column("Id")]
    [StringLength(100)]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("EventCode")]
    [StringLength(20)]
    public string EventCode { get; set; } = string.Empty;

    [Column("DocRef")]
    [StringLength(100)]
    public string DocRef { get; set; } = string.Empty;

    [Column("RecipientRef")]
    [StringLength(100)]
    public string RecipientRef { get; set; } = string.Empty;

    [Column("Channel")]
    [StringLength(20)]
    public string Channel { get; set; } = "in-app"; // in-app, email

    [Column("Message")]
    [StringLength(1000)]
    public string Message { get; set; } = string.Empty;

    [Column("Urgency")]
    [StringLength(20)]
    public string? Urgency { get; set; }

    [Column("IsRead")]
    public bool IsRead { get; set; } = false;

    [Column("IsDone")]
    public bool IsDone { get; set; } = false;

    [Column("CreatedAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("ReadAt")]
    public DateTime? ReadAt { get; set; }
}

[Table("NOTIFICATION_DELIVERY_LOG")]
public class NotificationDeliveryLog
{
    [Key]
    [Column("Id")]
    [StringLength(100)]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("EventCode")]
    [StringLength(20)]
    public string EventCode { get; set; } = string.Empty;

    [Column("DocRef")]
    [StringLength(100)]
    public string DocRef { get; set; } = string.Empty;

    [Column("RecipientRef")]
    [StringLength(100)]
    public string RecipientRef { get; set; } = string.Empty;

    [Column("Channel")]
    [StringLength(20)]
    public string Channel { get; set; } = "email";

    [Column("Status")]
    [StringLength(20)]
    public string Status { get; set; } = "sent";

    [Column("Detail")]
    [StringLength(1000)]
    public string? Detail { get; set; }

    [Column("CreatedAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[Table("PENDING_REMINDER")]
public class PendingReminder
{
    [Key]
    [Column("Id")]
    [StringLength(100)]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("DocRef")]
    [StringLength(100)]
    public string DocRef { get; set; } = string.Empty;

    [Column("AssignmentId")]
    [StringLength(100)]
    public string? AssignmentId { get; set; }

    [Column("EventCode")]
    [StringLength(20)]
    public string EventCode { get; set; } = string.Empty;

    [Column("DueAt")]
    public DateTime DueAt { get; set; }

    [Column("Status")]
    [StringLength(20)]
    public string Status { get; set; } = "pending";

    [Column("CreatedAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("CancelledAt")]
    public DateTime? CancelledAt { get; set; }
}
