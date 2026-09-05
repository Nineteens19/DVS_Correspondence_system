using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Correspondence.Application.Common.Exceptions;
using Correspondence.Application.DTOs;
using Correspondence.Application.Interfaces;
using Correspondence.Domain.Entities;
using Correspondence.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace Correspondence.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly CorrespondenceDbContext _db;
    private readonly ILdapService _ldapService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        CorrespondenceDbContext db,
        ILdapService ldapService,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _db = db;
        _ldapService = ldapService;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ValidationException("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
        }

        // 1. LDAP / AD Authentication
        var isValidLdap = await _ldapService.ValidateCredentialsAsync(request.Username, request.Password);
        if (!isValidLdap)
        {
            throw new ForbiddenException("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (ตรวจกับ LDAP/AD)");
        }

        // 2. Query User in Database
        var user = await _db.Users
            .Include(u => u.Department)
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.UserId.ToLower() == request.Username.ToLower());

        if (user == null)
        {
            throw new ForbiddenException("บัญชียังไม่ได้รับอนุญาตให้ใช้งานระบบ โปรดติดต่อผู้ดูแลระบบ");
        }

        if (user.Status != "Active")
        {
            throw new ForbiddenException("บัญชีถูกปิดการใช้งาน โปรดติดต่อผู้ดูแลระบบ");
        }

        // 3. Update Last Login Time
        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // 4. Generate JWT Token
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:SecretKey"] ?? "DevesCorrespondenceSystemSecureSecretKey2026!#*@$");
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId),
                new Claim(ClaimTypes.Name, user.DisplayName),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                new Claim(ClaimTypes.Role, user.RoleId ?? "ROLE-02"),
                new Claim("DepartmentId", user.DepartmentRef ?? string.Empty),
                new Claim("Role", user.Role?.Name ?? "เจ้าของงานปลายทาง")
            }),
            Expires = DateTime.UtcNow.AddHours(8),
            Issuer = _configuration["Jwt:Issuer"] ?? "DevesCorrespondenceApi",
            Audience = _configuration["Jwt:Audience"] ?? "DevesCorrespondenceApp",
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);

        return new LoginResponse
        {
            Token = tokenString,
            ExpiresAt = tokenDescriptor.Expires!.Value,
            User = MapToProfile(user)
        };
    }

    public async Task<UserProfileDto> GetCurrentUserProfileAsync(string userId)
    {
        var user = await _db.Users
            .Include(u => u.Department)
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.UserId.ToLower() == userId.ToLower());

        if (user == null) throw new NotFoundException("ไม่พบข้อมูลผู้ใช้ในระบบ");
        return MapToProfile(user);
    }

    public async Task<List<UserProfileDto>> GetAllUsersAsync()
    {
        var users = await _db.Users
            .Include(u => u.Department)
            .Include(u => u.Role)
            .OrderBy(u => u.DisplayName)
            .ToListAsync();

        return users.Select(MapToProfile).ToList();
    }

    public async Task<UserProfileDto> ProvisionUserAsync(ProvisionUserRequest request)
    {
        var existing = await _db.Users.FirstOrDefaultAsync(u => u.UserId.ToLower() == request.Username.ToLower());
        if (existing != null)
        {
            existing.RoleId = request.RoleId;
            existing.DepartmentRef = request.DepartmentId;
            existing.Status = "Active";
            await _db.SaveChangesAsync();
            return await GetCurrentUserProfileAsync(existing.UserId);
        }

        var newUser = new User
        {
            UserId = request.Username.ToLower(),
            DisplayName = request.DisplayName,
            Email = request.Email,
            DepartmentRef = request.DepartmentId,
            RoleId = request.RoleId,
            Source = "LDAP",
            Status = "Active",
            ProvisionedBy = "admin",
            ProvisionedAt = DateTime.UtcNow
        };

        _db.Users.Add(newUser);
        await _db.SaveChangesAsync();

        return await GetCurrentUserProfileAsync(newUser.UserId);
    }

    public async Task<UserProfileDto> UpdateUserAsync(string id, ProvisionUserRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId.ToLower() == id.ToLower());
        if (user == null) throw new NotFoundException("ไม่พบผู้ใช้งานที่ต้องการแก้ไข");

        user.RoleId = request.RoleId;
        user.DepartmentRef = request.DepartmentId;
        await _db.SaveChangesAsync();

        return await GetCurrentUserProfileAsync(user.UserId);
    }

    private static UserProfileDto MapToProfile(User u)
    {
        return new UserProfileDto
        {
            Id = u.UserId,
            Username = u.UserId,
            DisplayName = u.DisplayName,
            Email = u.Email ?? string.Empty,
            Role = u.Role?.Name ?? u.RoleId ?? "เจ้าของงานปลายทาง",
            RoleId = u.RoleId ?? "ROLE-02",
            DepartmentId = u.DepartmentRef,
            DepartmentName = u.Department?.NameTh ?? "ฝ่ายงาน",
            DeptCodeTh = u.Department?.DeptCodeTh,
            DeptCodeEn = u.Department?.DeptCodeEn,
            IsHead = u.Department?.HeadUserRef?.Equals(u.UserId, StringComparison.OrdinalIgnoreCase) == true
        };
    }
}
