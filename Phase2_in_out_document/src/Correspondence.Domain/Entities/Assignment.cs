using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Correspondence.Domain.Entities;

[Table("ASSIGNMENT")]
public class Assignment
{
    [Key]
    [Column("Id")]
    [StringLength(100)]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("DocRef")]
    [StringLength(100)]
    public string DocRef { get; set; } = string.Empty;

    [Column("KeyReference")]
    [StringLength(100)]
    public string KeyReference { get; set; } = string.Empty;

    [Column("AssigneeRef")]
    [StringLength(100)]
    public string AssigneeRef { get; set; } = string.Empty; // UserId or DeptId

    [Column("AssigneeType")]
    [StringLength(20)]
    public string AssigneeType { get; set; } = "person"; // person, department

    [Column("AssigneeDepartmentRef")]
    [StringLength(100)]
    public string? AssigneeDepartmentRef { get; set; }

    [Column("Status")]
    [StringLength(20)]
    public string Status { get; set; } = "pending"; // pending, accepted, in-progress, completed, rejected

    [Column("Deadline")]
    public DateTime? Deadline { get; set; }

    [Column("RejectNote")]
    [StringLength(1000)]
    public string? RejectNote { get; set; }

    [Column("ParentId")]
    [StringLength(100)]
    public string? ParentId { get; set; }

    [Column("AcceptedAt")]
    public DateTime? AcceptedAt { get; set; }

    // Navigation
    [ForeignKey(nameof(DocRef))]
    public virtual MainDoc? MainDoc { get; set; }

    [ForeignKey(nameof(AssigneeDepartmentRef))]
    public virtual Department? AssigneeDepartment { get; set; }

    [ForeignKey(nameof(ParentId))]
    public virtual Assignment? Parent { get; set; }

    public virtual ICollection<Assignment> SubAssignments { get; set; } = new List<Assignment>();
    public virtual ICollection<ForwardLog> ForwardLogs { get; set; } = new List<ForwardLog>();
}

[Table("FORWARD_LOG")]
public class ForwardLog
{
    [Key]
    [Column("Id")]
    [StringLength(100)]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("AssignmentId")]
    [StringLength(100)]
    public string AssignmentId { get; set; } = string.Empty;

    [Column("FromUser")]
    [StringLength(100)]
    public string FromUser { get; set; } = string.Empty;

    [Column("ToUser")]
    [StringLength(100)]
    public string ToUser { get; set; } = string.Empty;

    [Column("ForwardedAt")]
    public DateTime ForwardedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(AssignmentId))]
    public virtual Assignment? Assignment { get; set; }
}

[Table("CUSTODY_LOG")]
public class CustodyLog
{
    [Key]
    [Column("Id")]
    [StringLength(100)]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("AssignmentId")]
    [StringLength(100)]
    public string AssignmentId { get; set; } = string.Empty;

    [Column("DocRef")]
    [StringLength(100)]
    public string DocRef { get; set; } = string.Empty;

    [Column("HolderRef")]
    [StringLength(100)]
    public string HolderRef { get; set; } = string.Empty;

    [Column("Action")]
    [StringLength(50)]
    public string Action { get; set; } = string.Empty;

    [Column("HeldAt")]
    public DateTime HeldAt { get; set; } = DateTime.UtcNow;

    [Column("Note")]
    [StringLength(1000)]
    public string? Note { get; set; }
}
