using Correspondence.Application.DTOs;
using Correspondence.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Correspondence.Api.Controllers;

public class EdrController : BaseApiController
{
    private readonly IEdrService _edrService;

    public EdrController(IEdrService edrService)
    {
        _edrService = edrService;
    }

    [HttpGet("context")]
    [Authorize]
    public async Task<ActionResult<EdrContextDto>> GetContext()
    {
        var context = await _edrService.GetPreflightContextAsync(CurrentUserId);
        return Ok(context);
    }

    [HttpPost("request-number")]
    [Authorize]
    public async Task<ActionResult<EdrNumberResponseDto>> RequestNumber([FromBody] EdrNumberRequestDto request)
    {
        var result = await _edrService.RequestOutgoingNumberAsync(request, CurrentUserId);
        return Ok(result);
    }

    [HttpPost("webhook/sync")]
    [AllowAnonymous] // Webhook called by external EDR system with shared token/key
    public async Task<ActionResult<EdrWebhookSyncResponse>> WebhookSync(
        [FromBody] EdrWebhookSyncRequest request,
        [FromHeader(Name = "X-EDR-Webhook-Secret")] string? webhookSecret)
    {
        var result = await _edrService.ProcessWebhookSyncAsync(request);
        return Ok(result);
    }
}
