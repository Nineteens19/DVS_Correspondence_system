using Correspondence.Application.DTOs;
using Correspondence.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Correspondence.Api.Controllers;

[Authorize]
public class MasterController : BaseApiController
{
    private readonly IMasterDataService _masterService;

    public MasterController(IMasterDataService masterService)
    {
        _masterService = masterService;
    }

    [HttpGet("departments")]
    public async Task<ActionResult<List<DepartmentDto>>> GetDepartments()
    {
        var list = await _masterService.GetDepartmentsAsync();
        return Ok(list);
    }

    [HttpPut("departments/{id}/head")]
    public async Task<ActionResult<DepartmentDto>> UpdateDepartmentHead(string id, [FromBody] UpdateDepartmentHeadRequest request)
    {
        var result = await _masterService.UpdateDepartmentHeadAsync(id, request.HeadUserRef);
        return Ok(result);
    }

    [HttpGet("workgroups")]
    public async Task<ActionResult<List<WorkgroupDto>>> GetWorkgroups([FromQuery] string? departmentId)
    {
        var list = await _masterService.GetWorkgroupsAsync(departmentId);
        return Ok(list);
    }

    [HttpGet("delivery-methods")]
    public async Task<ActionResult<List<DeliveryMethodDto>>> GetDeliveryMethods()
    {
        var list = await _masterService.GetDeliveryMethodsAsync();
        return Ok(list);
    }

    [HttpGet("monitors")]
    public async Task<ActionResult<List<MonitorConfigDto>>> GetMonitors()
    {
        var list = await _masterService.GetMonitorConfigsAsync();
        return Ok(list);
    }

    [HttpPost("monitors")]
    public async Task<ActionResult<MonitorConfigDto>> SaveMonitor([FromBody] SaveMonitorConfigRequest request)
    {
        var result = await _masterService.SaveMonitorConfigAsync(request);
        return Ok(result);
    }

    [HttpDelete("monitors/{id}")]
    public async Task<ActionResult> DeleteMonitor(string id)
    {
        var result = await _masterService.DeleteMonitorConfigAsync(id);
        return result ? NoContent() : NotFound();
    }

    [HttpGet("reminder-intervals")]
    public async Task<ActionResult<ReminderIntervalsDto>> GetReminderIntervals()
    {
        var result = await _masterService.GetReminderIntervalsAsync();
        return Ok(result);
    }

    [HttpPost("reminder-intervals")]
    public async Task<ActionResult<ReminderIntervalsDto>> UpdateReminderIntervals([FromBody] ReminderIntervalsDto dto)
    {
        var result = await _masterService.UpdateReminderIntervalsAsync(dto);
        return Ok(result);
    }
}
