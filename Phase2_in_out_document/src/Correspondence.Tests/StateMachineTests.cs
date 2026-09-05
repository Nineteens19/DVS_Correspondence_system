using Correspondence.Application.DTOs;
using Correspondence.Application.Interfaces;
using Correspondence.Domain.Entities;
using Correspondence.Infrastructure.Data;
using Correspondence.Infrastructure.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace Correspondence.Tests;

public class StateMachineTests
{
    private CorrespondenceDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<CorrespondenceDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new CorrespondenceDbContext(options);
    }

    [Fact]
    public async Task AcceptAssignment_Should_Transition_To_InProgress_And_Update_ChainOfCustody()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var storage = new Mock<IFileStorageService>();
        var otp = new Mock<IOtpService>();
        var workflow = new DocumentWorkflowService(db, storage.Object, otp.Object);

        var user = new User { UserId = "somchai.p", DisplayName = "Somchai", Email = "somchai.p@deves.co.th" };
        var assignee = new User { UserId = "wichai.t", DisplayName = "Wichai", Email = "wichai.t@deves.co.th", DepartmentRef = "dept-it" };
        var dept = new Department { DepartmentId = "dept-it", DeptCodeEn = "IT", NameTh = "ฝ่าย IT" };
        db.Users.AddRange(user, assignee);
        db.Departments.Add(dept);

        var doc = new MainDoc
        {
            DocRef = "IN-2026-0001",
            DocDirection = "incoming",
            Channel = "physical",
            Status = "pending-acceptance",
            OriginDepartmentRef = "dept-it",
            ResponsibleDepartmentRef = "dept-it",
            RegistrarRef = "somchai.p",
            Title = "Test Document"
        };
        db.MainDocs.Add(doc);

        var assignment = new Assignment
        {
            Id = "asg-001",
            DocRef = "IN-2026-0001",
            KeyReference = "IN-2026-0001",
            AssigneeRef = "wichai.t",
            AssigneeType = "person",
            AssigneeDepartmentRef = "dept-it",
            Status = "pending"
        };
        db.Assignments.Add(assignment);
        await db.SaveChangesAsync();

        // Act
        var result = await workflow.AcceptAssignmentAsync("IN-2026-0001", "wichai.t", new ActionRemarkRequest { AssignmentId = "asg-001", Remarks = "Accepting task" });

        // Assert
        result.Status.Should().Be("in-progress");
        result.CurrentHolderId.Should().Be("wichai.t"); // Chain of custody updated to acceptor
        
        var updatedAssignment = await db.Assignments.FindAsync("asg-001");
        updatedAssignment!.Status.Should().Be("in-progress");
        updatedAssignment.AcceptedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task DelegateAssignment_Should_Create_SubAssignment_Under_Parent_In_Hierarchy()
    {
        // Arrange
        using var db = CreateInMemoryDb();
        var storage = new Mock<IFileStorageService>();
        var otp = new Mock<IOtpService>();
        var workflow = new DocumentWorkflowService(db, storage.Object, otp.Object);

        var head = new User { UserId = "wichai.t", DisplayName = "Wichai", Email = "wichai.t@deves.co.th", DepartmentRef = "dept-it" };
        var sub1 = new User { UserId = "kanda.m", DisplayName = "Kanda", Email = "kanda.m@deves.co.th", DepartmentRef = "dept-it" };
        var sub2 = new User { UserId = "dev2", DisplayName = "Dev 2", Email = "dev2@deves.co.th", DepartmentRef = "dept-it" };
        var dept = new Department { DepartmentId = "dept-it", DeptCodeEn = "IT", NameTh = "ฝ่าย IT" };

        db.Users.AddRange(head, sub1, sub2);
        db.Departments.Add(dept);

        var doc = new MainDoc
        {
            DocRef = "IN-2026-0002",
            DocDirection = "incoming",
            Channel = "physical",
            Status = "in-progress",
            OriginDepartmentRef = "dept-it",
            ResponsibleDepartmentRef = "dept-it",
            RegistrarRef = "wichai.t",
            Title = "Test Delegation"
        };
        db.MainDocs.Add(doc);

        var parentAssignment = new Assignment
        {
            Id = "asg-parent",
            DocRef = "IN-2026-0002",
            KeyReference = "IN-2026-0002",
            AssigneeRef = "wichai.t",
            AssigneeType = "person",
            AssigneeDepartmentRef = "dept-it",
            Status = "in-progress",
            AcceptedAt = DateTime.UtcNow
        };
        db.Assignments.Add(parentAssignment);
        await db.SaveChangesAsync();

        // Act
        var result = await workflow.DelegateAssignmentAsync("IN-2026-0002", "wichai.t", new DelegateDocRequest
        {
            SubordinateUserIds = new List<string> { "kanda.m", "dev2" },
            Remarks = "Delegate to team"
        });

        // Assert
        result.Assignments.Should().HaveCount(1); // 1 root assignment
        result.Assignments[0].SubAssignments.Should().HaveCount(2); // 2 children in subtree
        result.Assignments[0].SubAssignments.Select(s => s.AssigneeId).Should().Contain(new[] { "kanda.m", "dev2" });
    }
}
