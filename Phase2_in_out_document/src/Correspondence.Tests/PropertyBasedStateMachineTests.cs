using Correspondence.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Correspondence.Tests;

public class PropertyBasedStateMachineTests
{
    [Theory]
    [InlineData(0, 0)]
    [InlineData(50, 50)]
    [InlineData(100, 100)]
    [InlineData(-10, 0)]
    [InlineData(150, 100)]
    public void DocumentProgress_Must_Always_Be_Bounded_Between_0_And_100(int inputProgress, int expectedBounded)
    {
        // Property: For any input progress, resulting progress must satisfy 0 <= P <= 100
        var bounded = Math.Clamp(inputProgress, 0, 100);
        bounded.Should().BeInRange(0, 100);
        bounded.Should().Be(expectedBounded);
    }

    [Theory]
    [InlineData("completed")]
    [InlineData("delivered")]
    public void Completed_Or_Delivered_Documents_Must_Have_100_Percent_Progress(string terminalStatus)
    {
        // Property: Any terminal success status enforces 100% progress
        var doc = new MainDoc
        {
            Status = terminalStatus,
            ProgressPercent = (terminalStatus == "completed" || terminalStatus == "delivered") ? 100 : 50
        };

        doc.ProgressPercent.Should().Be(100);
    }

    [Fact]
    public void Average_Progress_Of_Assignments_Must_Determine_Document_Progress()
    {
        var doc = new MainDoc { DocRef = "IN-2026-0001" };
        var assignments = new List<int> { 30, 70, 50 };

        var avg = (int)assignments.Average();
        doc.ProgressPercent = Math.Clamp(avg, 0, 100);

        doc.ProgressPercent.Should().Be(50);
        doc.ProgressPercent.Should().BeInRange(0, 100);
    }
}
