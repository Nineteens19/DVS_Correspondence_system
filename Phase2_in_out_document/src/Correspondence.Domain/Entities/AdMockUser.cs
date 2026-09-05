using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Correspondence.Domain.Entities;

/// <summary>
/// Table [AD_MOCK_USER] - Database table representing Active Directory / LDAP simulated directory
/// Enables testing AD search, synchronization, and user provisioning from real database records.
/// </summary>
[Table("AD_MOCK_USER")]
public class AdMockUser
{
    [Key]
    [Column("SAMAccountName")]
    [StringLength(100)]
    public string SAMAccountName { get; set; } = string.Empty; // e.g. sutthichok.t, wichai.t

    [Column("UserPrincipalName")]
    [StringLength(200)]
    public string UserPrincipalName { get; set; } = string.Empty; // e.g. sutthichok.t@deves.co.th

    [Column("DisplayName")]
    [StringLength(200)]
    public string DisplayName { get; set; } = string.Empty;

    [Column("Email")]
    [StringLength(200)]
    public string Email { get; set; } = string.Empty;

    [Column("EmployeeId")]
    [StringLength(50)]
    public string? EmployeeId { get; set; }

    [Column("Title")]
    [StringLength(150)]
    public string? Title { get; set; }

    [Column("DepartmentName")]
    [StringLength(150)]
    public string? DepartmentName { get; set; }

    [Column("DepartmentRef")]
    [StringLength(100)]
    public string? DepartmentRef { get; set; } // dept-it, dept-fin, dept-legal

    [Column("Company")]
    [StringLength(200)]
    public string Company { get; set; } = "บริษัท เทเวศประกันภัย จำกัด (มหาชน)";

    [Column("TelephoneNumber")]
    [StringLength(50)]
    public string? TelephoneNumber { get; set; }

    [Column("ManagerSAMAccountName")]
    [StringLength(100)]
    public string? ManagerSAMAccountName { get; set; }

    [Column("IsActive")]
    public bool IsActive { get; set; } = true;

    [Column("CreatedAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
