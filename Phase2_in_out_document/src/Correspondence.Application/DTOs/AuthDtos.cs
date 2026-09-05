namespace Correspondence.Application.DTOs;

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserProfileDto User { get; set; } = null!;
}

public class UserProfileDto
{
    public string Id { get; set; } = string.Empty; // UserId (e.g. somchai.p, sutthichok.t)
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? EmployeeId { get; set; }
    public string? Position { get; set; }
    public string Role { get; set; } = string.Empty;
    public string RoleId { get; set; } = string.Empty;
    public string? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public string? DeptCodeTh { get; set; }
    public string? DeptCodeEn { get; set; }
    public string? WorkgroupId { get; set; }
    public string? WorkgroupName { get; set; }
    public bool IsHead { get; set; }
}

public class ProvisionUserRequest
{
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string RoleId { get; set; } = "ROLE-02";
    public string DepartmentId { get; set; } = "dept-it";
    public string? WorkgroupId { get; set; }
}

public class LdapSearchUserDto
{
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? EmployeeId { get; set; }
    public string? Position { get; set; }
    public string? DepartmentName { get; set; }
    public bool IsAlreadyProvisioned { get; set; }
}
