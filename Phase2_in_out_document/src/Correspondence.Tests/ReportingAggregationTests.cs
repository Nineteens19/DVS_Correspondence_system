using Correspondence.Application.DTOs;
using Correspondence.Domain.Entities;
using Correspondence.Infrastructure.Data;
using Correspondence.Infrastructure.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Correspondence.Tests;

public class ReportingAggregationTests
{
    private CorrespondenceDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<CorrespondenceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new CorrespondenceDbContext(options);
    }

    [Fact]
    public async Task MultiDepartment_CountingRule_Should_Count_Document_In_All_Involved_Departments()
    {
        // Arrange (Draft 1.8.9 Multi-Department Reporting Rule)
        using var db = CreateInMemoryDb();
        var reportService = new ReportService(db);

        var deptIT = new Department { DepartmentId = "dept-it", DeptCodeEn = "IT", NameTh = "ฝ่าย IT", IsActive = true };
        var deptFinance = new Department { DepartmentId = "dept-fin", DeptCodeEn = "FN", NameTh = "ฝ่ายการเงิน", IsActive = true };
        var deptClaims = new Department { DepartmentId = "dept-clm", DeptCodeEn = "CL", NameTh = "ฝ่ายสินไหม", IsActive = true };

        db.Departments.AddRange(deptIT, deptFinance, deptClaims);

        var user = new User { UserId = "creator", DisplayName = "Creator", Email = "creator@deves.co.th" };
        db.Users.Add(user);

        // Document originated in IT, assigned to Finance and Claims
        var doc = new MainDoc
        {
            DocRef = "IN-2026-0001",
            DocDirection = "incoming",
            Status = "in-progress",
            OriginDepartmentRef = "dept-it",
            ResponsibleDepartmentRef = "dept-fin",
            RegistrarRef = "creator",
            CreatedAt = DateTime.UtcNow
        };
        db.MainDocs.Add(doc);

        var assignClaims = new Assignment
        {
            Id = "asg-clm",
            DocRef = "IN-2026-0001",
            KeyReference = "IN-2026-0001",
            AssigneeDepartmentRef = "dept-clm",
            AssigneeRef = "claims.officer",
            AssigneeType = "person",
            Status = "in-progress"
        };
        db.Assignments.Add(assignClaims);
        await db.SaveChangesAsync();

        // Act
        var report = await reportService.GenerateReportAsync(new ReportFilterRequest { ReportType = "RPT-01" });

        // Assert
        report.Rows.Should().HaveCount(3);
        
        var itRow = report.Rows.First(r => r["departmentName"].ToString() == "ฝ่าย IT");
        var acRow = report.Rows.First(r => r["departmentName"].ToString() == "ฝ่ายการเงิน");
        var clRow = report.Rows.First(r => r["departmentName"].ToString() == "ฝ่ายสินไหม");

        Convert.ToInt32(itRow["totalCount"]).Should().Be(1);
        Convert.ToInt32(acRow["totalCount"]).Should().Be(1);
        Convert.ToInt32(clRow["totalCount"]).Should().Be(1);
    }
}
