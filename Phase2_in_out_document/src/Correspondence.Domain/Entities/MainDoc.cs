using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Correspondence.Domain.Entities;

[Table("MAIN_DOC")]
public class MainDoc
{
    [Key]
    [Column("DocRef")]
    [StringLength(100)]
    public string DocRef { get; set; } = string.Empty; // e.g. IN-2026-0001

    [Column("DocDirection")]
    [StringLength(20)]
    public string DocDirection { get; set; } = "incoming"; // incoming, outgoing

    [Column("DocType")]
    [StringLength(50)]
    public string DocType { get; set; } = "General";

    [Column("Channel")]
    [StringLength(50)]
    public string? Channel { get; set; } = "email"; // email, physical

    [Column("Urgency")]
    [StringLength(20)]
    public string Urgency { get; set; } = "normal"; // normal, urgent, very-urgent

    [Column("ConfidentialityLevel")]
    [StringLength(20)]
    public string ConfidentialityLevel { get; set; } = "normal"; // normal, confidential, top-secret

    [Column("Deadline")]
    public DateTime? Deadline { get; set; }

    [Column("Status")]
    [StringLength(30)]
    public string Status { get; set; } = "registered"; // registered, pending-acceptance, in-progress, awaiting-physical-return, completed, cancelled

    [Column("DeadlineFlag")]
    [StringLength(20)]
    public string DeadlineFlag { get; set; } = "on-track"; // on-track, due-soon, overdue, cleared

    [Column("ProgressPercent", TypeName = "decimal(5,2)")]
    public decimal ProgressPercent { get; set; } = 0;

    [Column("OriginDepartmentRef")]
    [StringLength(100)]
    public string? OriginDepartmentRef { get; set; }

    [Column("ResponsibleDepartmentRef")]
    [StringLength(100)]
    public string? ResponsibleDepartmentRef { get; set; }

    [Column("RegistrarRef")]
    [StringLength(100)]
    public string? RegistrarRef { get; set; }

    [Column("CreatedAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Extra metadata for convenient application logic (Title, Sender, OriginNumber)
    [NotMapped]
    public string Title { get; set; } = string.Empty;

    [NotMapped]
    public string? SenderAgency { get; set; }

    [NotMapped]
    public string? OriginNumber { get; set; }

    [NotMapped]
    public string? Description { get; set; }

    [NotMapped]
    public string? CurrentHolderRef { get; set; }

    // Navigation
    [ForeignKey(nameof(OriginDepartmentRef))]
    public virtual Department? OriginDepartment { get; set; }

    [ForeignKey(nameof(ResponsibleDepartmentRef))]
    public virtual Department? ResponsibleDepartment { get; set; }

    public virtual ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
    public virtual ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}
