namespace Correspondence.Application.DTOs;

public class DepartmentDto
{
    public string Id { get; set; } = string.Empty; // DepartmentId (e.g. dept-it, dept-fin)
    public string Code { get; set; } = string.Empty; // DeptCodeEn
    public string NameTh { get; set; } = string.Empty;
    public string? NameEn { get; set; }
    public string? DeptCodeTh { get; set; }
    public string? DeptCodeEn { get; set; }
    public string? HeadUserRef { get; set; }
    public string? HeadUserName { get; set; }
    public bool IsActive { get; set; }
}

public class WorkgroupDto
{
    public string Id { get; set; } = string.Empty;
    public string DepartmentId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class DeliveryMethodDto
{
    public string Id { get; set; } = string.Empty; // DeliveryMethodId (e.g. dm-01, dm-02)
    public string Label { get; set; } = string.Empty;
    public bool IsPostalPickup { get; set; }
    public bool IsActive { get; set; }
}

public class MonitorConfigDto
{
    public string Id { get; set; } = string.Empty; // MonitorId
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string ScopeType { get; set; } = "all"; // all, department, workgroup
    public List<string> ScopeRefs { get; set; } = new();
    public List<string> ScopeNames { get; set; } = new();
    public bool AllDepartments { get; set; }
    public string DocDirectionFilter { get; set; } = "all";
    public bool NotifyEnabled { get; set; } = true;
    public string Status { get; set; } = "Active";
}

public class SaveMonitorConfigRequest
{
    public string? Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ScopeType { get; set; } = "all";
    public List<string> ScopeRefs { get; set; } = new();
    public bool AllDepartments { get; set; } = false;
    public string DocDirectionFilter { get; set; } = "all";
    public bool NotifyEnabled { get; set; } = true;
}

public class ReminderIntervalsDto
{
    public int Normal { get; set; } = 5;
    public int Urgent { get; set; } = 3;
    public int VeryUrgent { get; set; } = 1;
}

public class UpdateDepartmentHeadRequest
{
    public string HeadUserRef { get; set; } = string.Empty;
}


