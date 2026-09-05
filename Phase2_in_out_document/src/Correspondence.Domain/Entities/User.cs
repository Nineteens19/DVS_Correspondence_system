using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Correspondence.Domain.Entities;

[Table("USER")]
public class User
{
    [Key]
    [Column("UserId")]
    [StringLength(100)]
    public string UserId { get; set; } = string.Empty; // AD sAMAccountName, e.g. somchai.p, sutthichok.t, wichai.t, admin

    [Column("DisplayName")]
    [StringLength(200)]
    public string DisplayName { get; set; } = string.Empty;

    [Column("Email")]
    [StringLength(256)]
    public string? Email { get; set; }

    [Column("DepartmentRef")]
    [StringLength(100)]
    public string? DepartmentRef { get; set; }

    [Column("RoleId")]
    [StringLength(50)]
    public string? RoleId { get; set; }

    [Column("Source")]
    [StringLength(50)]
    public string Source { get; set; } = "LDAP"; // LDAP, Local

    [Column("Status")]
    [StringLength(20)]
    public string Status { get; set; } = "Active"; // Active, Inactive

    [Column("ProvisionedBy")]
    [StringLength(100)]
    public string? ProvisionedBy { get; set; }

    [Column("ProvisionedAt")]
    public DateTime? ProvisionedAt { get; set; }

    [Column("LastLoginAt")]
    public DateTime? LastLoginAt { get; set; }

    // Navigation
    [ForeignKey(nameof(DepartmentRef))]
    public virtual Department? Department { get; set; }

    [ForeignKey(nameof(RoleId))]
    public virtual Role? Role { get; set; }
}
