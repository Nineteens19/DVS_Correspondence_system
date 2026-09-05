using Correspondence.Application.DTOs;
using Correspondence.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Correspondence.Api.Controllers;

[Authorize]
public class ReportsController : BaseApiController
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardMetricsDto>> GetDashboard()
    {
        var metrics = await _reportService.GetDashboardMetricsAsync(CurrentUserId, CurrentUserRole);
        return Ok(metrics);
    }

    [HttpPost("generate")]
    public async Task<ActionResult<ReportResultDto>> GenerateReport([FromBody] ReportFilterRequest request)
    {
        var result = await _reportService.GenerateReportAsync(request);
        return Ok(result);
    }
}
