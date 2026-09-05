using Correspondence.Application.DTOs;
using Correspondence.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Correspondence.Api.Controllers;

[Authorize]
public class AdminController : BaseApiController
{
    private readonly IAuthService _authService;
    private readonly ILdapService _ldapService;

    public AdminController(IAuthService authService, ILdapService ldapService)
    {
        _authService = authService;
        _ldapService = ldapService;
    }

    [HttpGet("users")]
    public async Task<ActionResult<List<UserProfileDto>>> GetUsers()
    {
        var users = await _authService.GetAllUsersAsync();
        return Ok(users);
    }

    [HttpGet("ldap/search")]
    public async Task<ActionResult<List<LdapSearchUserDto>>> SearchLdap([FromQuery] string query)
    {
        var results = await _ldapService.SearchUsersAsync(query);
        var existingUsers = await _authService.GetAllUsersAsync();
        var existingUsernames = existingUsers.Select(u => u.Username.ToLower()).ToHashSet();

        foreach (var r in results)
        {
            r.IsAlreadyProvisioned = existingUsernames.Contains(r.Username.ToLower());
        }

        return Ok(results);
    }

    [HttpPost("users/provision")]
    public async Task<ActionResult<UserProfileDto>> ProvisionUser([FromBody] ProvisionUserRequest request)
    {
        var result = await _authService.ProvisionUserAsync(request);
        return CreatedAtAction(nameof(GetUsers), result);
    }

    [HttpPut("users/{id}")]
    public async Task<ActionResult<UserProfileDto>> UpdateUser(string id, [FromBody] ProvisionUserRequest request)
    {
        var result = await _authService.UpdateUserAsync(id, request);
        return Ok(result);
    }
}
