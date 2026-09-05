using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Correspondence.Domain.Entities;

[Table("ATTACHMENT")]
public class Attachment
{
    [Key]
    [Column("Id")]
    [StringLength(100)]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("DocRef")]
    [StringLength(100)]
    public string DocRef { get; set; } = string.Empty;

    [Column("FilePath")]
    [StringLength(1000)]
    public string FilePath { get; set; } = string.Empty;

    [Column("FileName")]
    [StringLength(400)]
    public string FileName { get; set; } = string.Empty;

    [Column("FileType")]
    [StringLength(100)]
    public string? FileType { get; set; }

    [Column("AttachmentSource")]
    [StringLength(20)]
    public string AttachmentSource { get; set; } = "upload"; // upload, camera, scanner

    [Column("IsMirrored")]
    public bool IsMirrored { get; set; } = false;

    [Column("RotationDeg")]
    public int RotationDeg { get; set; } = 0;

    [Column("IsConfidential")]
    public bool IsConfidential { get; set; } = false;

    [Column("IsPrimary")]
    public bool IsPrimary { get; set; } = false;

    [Column("IsEncrypted")]
    public bool IsEncrypted { get; set; } = false;

    [Column("FileHash")]
    [StringLength(128)]
    public string? FileHash { get; set; }

    [Column("UploadedBy")]
    [StringLength(100)]
    public string UploadedBy { get; set; } = string.Empty;

    [Column("UploadedAt")]
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    [NotMapped]
    public long FileSizeBytes { get; set; } = 10240;
}

[Table("ATTACHMENT_ACCESS_LOG")]
public class AttachmentAccessLog
{
    [Key]
    [Column("AccessId")]
    [StringLength(100)]
    public string AccessId { get; set; } = Guid.NewGuid().ToString();

    [Column("DocRef")]
    [StringLength(100)]
    public string DocRef { get; set; } = string.Empty;

    [Column("AttachmentId")]
    [StringLength(100)]
    public string AttachmentId { get; set; } = string.Empty;

    [Column("UserId")]
    [StringLength(100)]
    public string UserId { get; set; } = string.Empty;

    [Column("AccessType")]
    [StringLength(20)]
    public string AccessType { get; set; } = "view"; // view, download, preview

    [Column("IpAddress")]
    [StringLength(64)]
    public string? IpAddress { get; set; }

    [Column("UserAgent")]
    [StringLength(512)]
    public string? UserAgent { get; set; }

    [Column("AccessedAt")]
    public DateTime AccessedAt { get; set; } = DateTime.UtcNow;
}

[Table("AUDIT_LOG")]
public class AuditLog
{
    [Key]
    [Column("LogId")]
    [StringLength(100)]
    public string LogId { get; set; } = Guid.NewGuid().ToString();

    [Column("DocRef")]
    [StringLength(100)]
    public string? DocRef { get; set; }

    [Column("ActorRef")]
    [StringLength(100)]
    public string ActorRef { get; set; } = string.Empty;

    [Column("Action")]
    [StringLength(100)]
    public string Action { get; set; } = string.Empty;

    [Column("FromState")]
    [StringLength(50)]
    public string? FromState { get; set; }

    [Column("ToState")]
    [StringLength(50)]
    public string? ToState { get; set; }

    [Column("HolderRef")]
    [StringLength(100)]
    public string? HolderRef { get; set; }

    [Column("IpAddress")]
    [StringLength(64)]
    public string? IpAddress { get; set; }

    [Column("ActionTime")]
    public DateTime ActionTime { get; set; } = DateTime.UtcNow;

    [Column("Note")]
    [StringLength(2000)]
    public string? Note { get; set; }
}
