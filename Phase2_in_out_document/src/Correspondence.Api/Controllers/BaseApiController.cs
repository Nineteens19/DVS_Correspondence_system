using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace Correspondence.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    protected string CurrentUserId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "admin";

    protected string CurrentUsername => User.FindFirst(ClaimTypes.Name)?.Value ?? "admin";

    protected string CurrentUserEmail => User.FindFirst(ClaimTypes.Email)?.Value ?? string.Empty;

    protected string CurrentUserRole => User.FindFirst(ClaimTypes.Role)?.Value ?? "ROLE-02";
}
