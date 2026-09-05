using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Correspondence.Domain.Entities;

[Table("PERMISSION")]
public class Permission
{
    [Key]
    [Column("PermKey", Order = 0)]
    [StringLength(100)]
    public string PermKey { get; set; } = string.Empty;

    [Key]
    [Column("RoleId", Order = 1)]
    [StringLength(50)]
    public string RoleId { get; set; } = string.Empty;

    // Navigation
    [ForeignKey(nameof(RoleId))]
    public virtual Role? Role { get; set; }
}
