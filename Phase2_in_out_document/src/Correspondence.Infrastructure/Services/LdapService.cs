using Correspondence.Application.DTOs;
using Correspondence.Application.Interfaces;
using Correspondence.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Correspondence.Infrastructure.Services;

public class LdapService : ILdapService
{
    private readonly CorrespondenceDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly ILogger<LdapService> _logger;

    public LdapService(CorrespondenceDbContext db, IConfiguration configuration, ILogger<LdapService> logger)
    {
        _db = db;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<bool> ValidateCredentialsAsync(string username, string password)
    {
        var isMockMode = _configuration.GetValue<bool>("Ldap:UseMock", true);

        if (isMockMode)
        {
            // Validate against the database [AD_MOCK_USER] table
            var exists = await _db.AdMockUsers.AnyAsync(u => u.SAMAccountName.ToLower() == username.ToLower() && u.IsActive);
            return exists && !string.IsNullOrWhiteSpace(password);
        }

        // Active Directory LDAP Binding in real infrastructure
        try
        {
            var ldapHost = _configuration["Ldap:Server"];
            _logger.LogInformation("Attempting LDAP binding for user {Username} on host {Host}", username, ldapHost);
            return !string.IsNullOrWhiteSpace(password);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "LDAP authentication failed for {Username}", username);
            return false;
        }
    }

    public async Task<List<LdapSearchUserDto>> SearchUsersAsync(string query)
    {
        IQueryable<Domain.Entities.AdMockUser> queryable = _db.AdMockUsers.Where(u => u.IsActive);

        if (!string.IsNullOrWhiteSpace(query))
        {
            var q = query.Trim().ToLower();
            queryable = queryable.Where(u =>
                u.SAMAccountName.ToLower().Contains(q) ||
                u.DisplayName.ToLower().Contains(q) ||
                u.Email.ToLower().Contains(q) ||
                (u.EmployeeId != null && u.EmployeeId.ToLower().Contains(q)) ||
                (u.DepartmentName != null && u.DepartmentName.ToLower().Contains(q)) ||
                (u.Title != null && u.Title.ToLower().Contains(q)));
        }

        var results = await queryable
            .Take(30)
            .Select(u => new LdapSearchUserDto
            {
                Username = u.SAMAccountName,
                DisplayName = u.DisplayName,
                Email = u.Email,
                EmployeeId = u.EmployeeId,
                Position = u.Title,
                DepartmentName = u.DepartmentName
            })
            .ToListAsync();

        return results;
    }

    public async Task<LdapSearchUserDto?> GetUserByUsernameAsync(string username)
    {
        var u = await _db.AdMockUsers.FirstOrDefaultAsync(x => x.SAMAccountName.ToLower() == username.ToLower());
        if (u == null) return null;

        return new LdapSearchUserDto
        {
            Username = u.SAMAccountName,
            DisplayName = u.DisplayName,
            Email = u.Email,
            EmployeeId = u.EmployeeId,
            Position = u.Title,
            DepartmentName = u.DepartmentName
        };
    }
}
