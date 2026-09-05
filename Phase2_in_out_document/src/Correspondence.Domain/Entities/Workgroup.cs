using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Correspondence.Domain.Entities;

[Table("WORKGROUP")]
public class Workgroup
{
    [Key]
    [Column("WorkgroupId")]
    [StringLength(100)]
    public string WorkgroupId { get; set; } = string.Empty;

    [Column("DepartmentId")]
    [StringLength(100)]
    public string DepartmentId { get; set; } = string.Empty;

    [Column("Name")]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [Column("IsActive")]
    public bool IsActive { get; set; } = true;

    // Navigation
    [ForeignKey(nameof(DepartmentId))]
    public virtual Department? Department { get; set; }
}
