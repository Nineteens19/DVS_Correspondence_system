namespace Correspondence.Application.DTOs;

public class DashboardMetricsDto
{
    public int TotalIncoming { get; set; }
    public int TotalOutgoing { get; set; }
    public int PendingIncoming { get; set; }
    public int InProgressIncoming { get; set; }
    public int AwaitingPhysicalReturn { get; set; }
    public int CompletedIncoming { get; set; }
    public int ReadyToSendOutgoing { get; set; }
    public int SentOutgoing { get; set; }
    public int DeliveredOutgoing { get; set; }
    public int DueSoonCount { get; set; }
    public int OverdueCount { get; set; }
    public double AverageProcessingDays { get; set; }

    public List<UrgencyBreakdownDto> UrgencyBreakdown { get; set; } = new();
    public List<DepartmentWorkloadDto> DepartmentWorkloads { get; set; } = new();
    public List<MonthlyTrendDto> MonthlyTrends { get; set; } = new();
}

public class UrgencyBreakdownDto
{
    public string Urgency { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class DepartmentWorkloadDto
{
    public string DepartmentName { get; set; } = string.Empty;
    public int PendingCount { get; set; }
    public int InProgressCount { get; set; }
    public int CompletedCount { get; set; }
    public int OverdueCount { get; set; }
}

public class MonthlyTrendDto
{
    public string Month { get; set; } = string.Empty;
    public int IncomingCount { get; set; }
    public int OutgoingCount { get; set; }
}

public class ReportFilterRequest
{
    public string ReportType { get; set; } = "RPT-01"; // RPT-01 to RPT-06
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? DepartmentId { get; set; }
    public string? DocDirection { get; set; }
    public string? Urgency { get; set; }
}

public class ReportResultDto
{
    public string ReportType { get; set; } = "RPT-01";
    public string ReportCode { get; set; } = string.Empty;
    public string ReportTitle { get; set; } = string.Empty;
    public string ReportTitleTh { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public int TotalRecords { get; set; }
    public List<string> Columns { get; set; } = new();
    public List<Dictionary<string, object>> Rows { get; set; } = new();
    public Dictionary<string, object> Summary { get; set; } = new();
}
