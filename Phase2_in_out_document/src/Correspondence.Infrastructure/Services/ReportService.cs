using Correspondence.Application.DTOs;
using Correspondence.Application.Interfaces;
using Correspondence.Domain.Enums;
using Correspondence.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Correspondence.Infrastructure.Services;

public class ReportService : IReportService
{
    private readonly CorrespondenceDbContext _db;

    public ReportService(CorrespondenceDbContext db)
    {
        _db = db;
    }

    public async Task<DashboardMetricsDto> GetDashboardMetricsAsync(string userId, string role)
    {
        var totalIncoming = await _db.MainDocs.CountAsync();
        var totalOutgoing = await _db.OutDocs.CountAsync();

        var pendingIncoming = await _db.MainDocs.CountAsync(d => d.Status == "pending-acceptance" || d.Status == "registered");
        var inProgressIncoming = await _db.MainDocs.CountAsync(d => d.Status == "in-progress");
        var awaitingReturn = await _db.MainDocs.CountAsync(d => d.Status == "awaiting-physical-return");
        var completedIncoming = await _db.MainDocs.CountAsync(d => d.Status == "completed");

        var readyToSend = await _db.OutDocs.CountAsync(d => d.Status == "ready-to-send");
        var sentOutgoing = await _db.OutDocs.CountAsync(d => d.Status == "sent");
        var deliveredOutgoing = await _db.OutDocs.CountAsync(d => d.Status == "delivered");

        var overdueMain = await _db.MainDocs.CountAsync(d => d.DeadlineFlag == "overdue");
        var overdueOut = await _db.OutDocs.CountAsync(d => d.DeadlineFlag == "overdue");

        var dueSoonMain = await _db.MainDocs.CountAsync(d => d.DeadlineFlag == "due-soon");
        var dueSoonOut = await _db.OutDocs.CountAsync(d => d.DeadlineFlag == "due-soon");

        return new DashboardMetricsDto
        {
            TotalIncoming = totalIncoming,
            TotalOutgoing = totalOutgoing,
            PendingIncoming = pendingIncoming,
            InProgressIncoming = inProgressIncoming,
            AwaitingPhysicalReturn = awaitingReturn,
            CompletedIncoming = completedIncoming,
            ReadyToSendOutgoing = readyToSend,
            SentOutgoing = sentOutgoing,
            DeliveredOutgoing = deliveredOutgoing,
            OverdueCount = overdueMain + overdueOut,
            DueSoonCount = dueSoonMain + dueSoonOut,
            AverageProcessingDays = 2.5
        };
    }

    public async Task<ReportResultDto> GenerateReportAsync(ReportFilterRequest filter)
    {
        var departments = await _db.Departments.Where(d => d.IsActive).ToListAsync();
        var rows = new List<Dictionary<string, object>>();

        var mainDocs = await _db.MainDocs.Include(d => d.Assignments).ToListAsync();
        var outDocs = await _db.OutDocs.ToListAsync();

        foreach (var dept in departments)
        {
            // Draft 1.8.9 Multi-Department Reporting Rule
            var relevantMain = mainDocs.Where(d =>
                d.OriginDepartmentRef == dept.DepartmentId ||
                d.ResponsibleDepartmentRef == dept.DepartmentId ||
                d.Assignments.Any(a => a.AssigneeDepartmentRef == dept.DepartmentId)).ToList();

            var relevantOut = outDocs.Where(d => d.OriginDepartmentRef == dept.DepartmentId).ToList();

            var totalCount = relevantMain.Count + relevantOut.Count;
            var completedCount = relevantMain.Count(d => d.Status == "completed") + relevantOut.Count(d => d.Status == "delivered");
            var inProgressCount = relevantMain.Count(d => d.Status == "in-progress" || d.Status == "pending-acceptance");
            var overdueCount = relevantMain.Count(d => d.DeadlineFlag == "overdue") + relevantOut.Count(d => d.DeadlineFlag == "overdue");

            rows.Add(new Dictionary<string, object>
            {
                ["departmentId"] = dept.DepartmentId,
                ["departmentCode"] = dept.DeptCodeEn ?? dept.DepartmentId,
                ["departmentName"] = dept.NameTh,
                ["totalCount"] = totalCount,
                ["completedCount"] = completedCount,
                ["inProgressCount"] = inProgressCount,
                ["overdueCount"] = overdueCount,
                ["completionRate"] = totalCount > 0 ? Math.Round((double)completedCount / totalCount * 100, 1) : 100.0
            });
        }

        return new ReportResultDto
        {
            ReportType = filter.ReportType,
            ReportTitle = $"รายงานสรุปสถานะเอกสาร ({filter.ReportType})",
            GeneratedAt = DateTime.UtcNow,
            TotalRecords = rows.Count,
            Columns = new List<string> { "departmentCode", "departmentName", "totalCount", "completedCount", "inProgressCount", "overdueCount", "completionRate" },
            Rows = rows
        };
    }
}
