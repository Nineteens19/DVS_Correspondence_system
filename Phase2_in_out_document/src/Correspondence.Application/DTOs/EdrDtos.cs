namespace Correspondence.Application.DTOs;

public class EdrContextDto
{
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string DeptCodeTh { get; set; } = string.Empty; // e.g. สอ
    public string DeptCodeEn { get; set; } = string.Empty; // e.g. IT
    public string DepartmentName { get; set; } = string.Empty;
    public string CurrentYearTh { get; set; } = string.Empty; // e.g. 2569
    public string CurrentYearEn { get; set; } = string.Empty; // e.g. 2026
    public int NextRunningSequence { get; set; } = 1;
    public bool IsDepartmentCodeValid { get; set; } = true;
    public string? ValidationMessage { get; set; }
}

public class EdrNumberRequestDto
{
    public string RequestType { get; set; } = "normal"; // normal, special
    public string Title { get; set; } = string.Empty;
    public string DestinationAgency { get; set; } = string.Empty;
    public string DeptCodeTh { get; set; } = string.Empty;
    public string DeptCodeEn { get; set; } = string.Empty;
    public string YearTh { get; set; } = string.Empty;
    public string YearEn { get; set; } = string.Empty;
    public string? Justification { get; set; }
    public string? DesiredNumber { get; set; }
    public string? IdempotencyKey { get; set; }
}

public class EdrNumberResponseDto
{
    public string RequestId { get; set; } = string.Empty;
    public string RequestNumber { get; set; } = string.Empty;
    public string Status { get; set; } = "issued"; // issued, pending_approval
    public string GeneratedDocNumberTh { get; set; } = string.Empty; // e.g. พ001สอ/2569
    public string GeneratedDocNumberEn { get; set; } = string.Empty; // e.g. S001CC/2026
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public string Message { get; set; } = "ออกเลขที่เอกสารสำเร็จ";
}

public class EdrWebhookSyncRequest
{
    public string EventType { get; set; } = "DOCUMENT_APPROVED"; // DOCUMENT_APPROVED, NUMBER_ISSUED
    public string RequestId { get; set; } = string.Empty;
    public string RequestNumber { get; set; } = string.Empty;
    public string GeneratedDocNumberTh { get; set; } = string.Empty;
    public string GeneratedDocNumberEn { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string DestinationAgency { get; set; } = string.Empty;
    public string DeptCodeTh { get; set; } = string.Empty;
    public string CreatorUsername { get; set; } = string.Empty;
    public string IdempotencyKey { get; set; } = string.Empty;
}

public class EdrWebhookSyncResponse
{
    public bool Success { get; set; }
    public string SyncedDocumentId { get; set; } = string.Empty;
    public string DocumentNumber { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
