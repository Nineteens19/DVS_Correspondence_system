using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Correspondence.Domain.Entities;

[Table("OUT_DOC")]
public class OutDoc
{
    [Key]
    [Column("DocNo")]
    [StringLength(100)]
    public string DocNo { get; set; } = string.Empty; // e.g. OUT-2026-0001

    [Column("DocumentNumberTh")]
    [StringLength(100)]
    public string DocumentNumberTh { get; set; } = string.Empty; // e.g. พ001สอ/2569

    [Column("DocumentNumberEn")]
    [StringLength(100)]
    public string DocumentNumberEn { get; set; } = string.Empty; // e.g. S001GA/2026

    [Column("EdrRequestId")]
    [StringLength(100)]
    public string? EdrRequestId { get; set; }

    [Column("DocDirection")]
    [StringLength(20)]
    public string DocDirection { get; set; } = "outgoing";

    [Column("OrgType")]
    [StringLength(50)]
    public string? OrgType { get; set; } = "general"; // general, special

    [Column("ExternalOrgRef")]
    [StringLength(100)]
    public string? ExternalOrgRef { get; set; }

    [Column("CustomOrgName")]
    [StringLength(200)]
    public string? CustomOrgName { get; set; }

    [Column("Urgency")]
    [StringLength(20)]
    public string Urgency { get; set; } = "normal";

    [Column("ConfidentialityLevel")]
    [StringLength(20)]
    public string ConfidentialityLevel { get; set; } = "normal";

    [Column("DeliveryMethodId")]
    [StringLength(50)]
    public string? DeliveryMethodId { get; set; }

    [Column("Deadline")]
    public DateTime? Deadline { get; set; }

    [Column("Status")]
    [StringLength(30)]
    public string Status { get; set; } = "registered"; // registered, attached, ready-to-send, sent, delivered, completed, cancelled

    [Column("DeadlineFlag")]
    [StringLength(20)]
    public string DeadlineFlag { get; set; } = "on-track";

    [Column("OriginDepartmentRef")]
    [StringLength(100)]
    public string? OriginDepartmentRef { get; set; }

    [Column("SenderRef")]
    [StringLength(100)]
    public string? SenderRef { get; set; }

    [Column("SentAt")]
    public DateTime? SentAt { get; set; }

    [Column("DeliveredAt")]
    public DateTime? DeliveredAt { get; set; }

    [NotMapped]
    public string Title { get; set; } = string.Empty;

    // Navigation
    [ForeignKey(nameof(DeliveryMethodId))]
    public virtual DeliveryMethod? DeliveryMethod { get; set; }

    [ForeignKey(nameof(OriginDepartmentRef))]
    public virtual Department? OriginDepartment { get; set; }

    public virtual ICollection<OutItem> Items { get; set; } = new List<OutItem>();
    public virtual ICollection<OutRecipient> Recipients { get; set; } = new List<OutRecipient>();
    public virtual ICollection<OutSigner> Signers { get; set; } = new List<OutSigner>();
    public virtual ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}
