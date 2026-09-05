using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Correspondence.Domain.Entities;

[Table("DEPARTMENT")]
public class Department
{
    [Key]
    [Column("DepartmentId")]
    [StringLength(100)]
    public string DepartmentId { get; set; } = string.Empty;

    [Column("NameTh")]
    [StringLength(200)]
    public string NameTh { get; set; } = string.Empty;

    [Column("NameEn")]
    [StringLength(200)]
    public string? NameEn { get; set; }

    [Column("DeptCodeTh")]
    [StringLength(50)]
    public string? DeptCodeTh { get; set; }

    [Column("DeptCodeEn")]
    [StringLength(50)]
    public string? DeptCodeEn { get; set; }

    [Column("HeadUserRef")]
    [StringLength(100)]
    public string? HeadUserRef { get; set; }

    [Column("IsActive")]
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual ICollection<Workgroup> Workgroups { get; set; } = new List<Workgroup>();
    public virtual ICollection<User> Users { get; set; } = new List<User>();
    public virtual ICollection<MainDoc> OriginMainDocs { get; set; } = new List<MainDoc>();
    public virtual ICollection<MainDoc> ResponsibleMainDocs { get; set; } = new List<MainDoc>();
    public virtual ICollection<OutDoc> OutDocs { get; set; } = new List<OutDoc>();
}
