using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Correspondence.Domain.Entities;

[Table("ROLE")]
public class Role
{
    [Key]
    [Column("RoleId")]
    [StringLength(50)]
    public string RoleId { get; set; } = string.Empty; // e.g. ROLE-01, ROLE-02, ROLE-03, ROLE-04, ROLE-05, ROLE-06, ROLE-07

    [Column("Name")]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [Column("DataScope")]
    [StringLength(20)]
    public string DataScope { get; set; } = "own"; // own, dept, all

    [Column("IsActive")]
    public bool IsActive { get; set; } = true;

    // Navigation
    public virtual ICollection<Permission> Permissions { get; set; } = new List<Permission>();
    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
