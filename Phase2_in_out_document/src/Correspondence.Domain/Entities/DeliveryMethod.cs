using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Correspondence.Domain.Entities;

[Table("DELIVERY_METHOD")]
public class DeliveryMethod
{
    [Key]
    [Column("DeliveryMethodId")]
    [StringLength(50)]
    public string DeliveryMethodId { get; set; } = string.Empty; // e.g. dm-01, dm-02, dm-03, etc.

    [Column("Label")]
    [StringLength(200)]
    public string Label { get; set; } = string.Empty;

    [Column("IsPostalPickup")]
    public bool IsPostalPickup { get; set; } = false;

    [Column("IsActive")]
    public bool IsActive { get; set; } = true;

    // Navigation
    public virtual ICollection<OutDoc> OutDocs { get; set; } = new List<OutDoc>();
}
