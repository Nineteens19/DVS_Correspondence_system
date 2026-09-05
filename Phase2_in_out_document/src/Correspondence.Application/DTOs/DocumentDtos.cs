namespace Correspondence.Application.DTOs;

public class DocumentDto
{
    public string Id { get; set; } = string.Empty; // DocRef or DocNo (e.g. IN-2026-0001 or OUT-2026-0001)
    public string DocumentNumber { get; set; } = string.Empty;
    public string? DocumentNumberEn { get; set; }
    public string DocDirection { get; set; } = string.Empty; // incoming, outgoing
    public string DocChannel { get; set; } = "email";        // email, physical
    public string Status { get; set; } = string.Empty;
    public string StatusTh { get; set; } = string.Empty;
    public string Urgency { get; set; } = string.Empty;
    public string Confidentiality { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ExternalSender { get; set; }
    public string? DestinationAgency { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? OriginNumber { get; set; }
    public string? TrackingNumber { get; set; }

    public string? OriginDepartmentId { get; set; }
    public string? OriginDepartmentName { get; set; }
    public string? ResponsibleDepartmentId { get; set; }
    public string? ResponsibleDepartmentName { get; set; }

    public string CreatedById { get; set; } = string.Empty;
    public string CreatedByName { get; set; } = string.Empty;
    public string? CurrentHolderId { get; set; }
    public string? CurrentHolderName { get; set; }
    public string? DeliveryMethodId { get; set; }
    public string? DeliveryMethodName { get; set; }

    public DateTime RegisteredAt { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public int ProgressPercent { get; set; }
    public string DeadlineFlag { get; set; } = "on-track";

    public bool IsRestrictedAttachment { get; set; }
    public bool HasAccessToSecret { get; set; }

    public List<DocumentAssignmentDto> Assignments { get; set; } = new();
    public List<DocumentAttachmentDto> Attachments { get; set; } = new();
    public List<DocumentHistoryDto> Histories { get; set; } = new();
    public List<CustodyLogDto> CustodyLogs { get; set; } = new();
}

public class CustodyLogDto
{
    public string Id { get; set; } = string.Empty;
    public string DocumentId { get; set; } = string.Empty;
    public string HolderId { get; set; } = string.Empty;
    public string HolderName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public DateTime HeldAt { get; set; }
    public string? Remarks { get; set; }
}

public class DocumentAssignmentDto
{
    public string Id { get; set; } = string.Empty;
    public string DocumentId { get; set; } = string.Empty;
    public string AssigneeId { get; set; } = string.Empty;
    public string AssigneeName { get; set; } = string.Empty;
    public string AssigneeType { get; set; } = "person";
    public string? AssigneePosition { get; set; }
    public string DepartmentId { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string? ParentAssignmentId { get; set; }
    public string AssignedById { get; set; } = string.Empty;
    public string AssignedByName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public DateTime AssignedAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int ProgressPercent { get; set; }

    public List<DocumentAssignmentDto> SubAssignments { get; set; } = new();
}

public class DocumentAttachmentDto
{
    public string Id { get; set; } = string.Empty;
    public string DocumentId { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public bool IsEvidence { get; set; }
    public bool IsCameraCapture { get; set; }
    public bool IsExtraAttachment { get; set; }
    public string UploadedById { get; set; } = string.Empty;
    public string UploadedByName { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
    public string? DownloadUrl { get; set; }
    public string? PreviewUrl { get; set; }
}

public class DocumentHistoryDto
{
    public string Id { get; set; } = string.Empty;
    public string DocumentId { get; set; } = string.Empty;
    public string? AssignmentId { get; set; }
    public string ActorId { get; set; } = string.Empty;
    public string ActorName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? FromStatus { get; set; }
    public string? ToStatus { get; set; }
    public string ActionSummaryTh { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RegisterIncomingDocRequest
{
    public string Channel { get; set; } = "email";
    public string Urgency { get; set; } = "normal";
    public string Confidentiality { get; set; } = "normal";
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string SenderAgency { get; set; } = string.Empty;
    public string? OriginNumber { get; set; }
    public string? OriginDepartmentId { get; set; }
    public string? ResponsibleDepartmentId { get; set; }
    public List<string> AssignedUserIds { get; set; } = new();
    public List<string> AssignedDepartmentIds { get; set; } = new();
    public DateTime? DueDate { get; set; }
    public List<AttachmentUploadDto> Attachments { get; set; } = new();
}

public class RegisterOutgoingDocRequest
{
    public string Urgency { get; set; } = "normal";
    public string Confidentiality { get; set; } = "normal";
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string DestinationAgency { get; set; } = string.Empty;
    public string? EdrOutgoingNumberTh { get; set; }
    public string? EdrOutgoingNumberEn { get; set; }
    public string? OriginDepartmentId { get; set; }
    public string? DeliveryMethodId { get; set; } = "dm-01";
    public string? TrackingNumber { get; set; }
    public DateTime? DueDate { get; set; }
    public List<AttachmentUploadDto> Attachments { get; set; } = new();
}

public class AttachmentUploadDto
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/pdf";
    public long FileSizeBytes { get; set; } = 10240;
    public byte[]? Data { get; set; }
    public bool IsEvidence { get; set; } = false;
    public bool IsCameraCapture { get; set; } = false;
}

public class ActionRemarkRequest
{
    // Accept and complete always target one assignment branch. This prevents
    // a parallel recipient from changing, or appearing to own, another branch.
    public string? AssignmentId { get; set; }
    public string? Remarks { get; set; }
}

public class DelegateDocRequest
{
    public string? ParentAssignmentId { get; set; }
    public List<string> SubordinateUserIds { get; set; } = new();
    public string? Remarks { get; set; }
}

public class ForwardDocRequest
{
    public string TargetDepartmentId { get; set; } = string.Empty;
    public List<string> TargetUserIds { get; set; } = new();
    public string? Remarks { get; set; }
}

public class DeliverDocRequest
{
    public string? TrackingNumber { get; set; }
    public string? DeliveredToPerson { get; set; }
    public string? Remarks { get; set; }
    public AttachmentUploadDto? EvidenceAttachment { get; set; }
}

public class OtpRequestDto
{
    public string? DeliveryEmail { get; set; }
}

public class OtpVerifyDto
{
    public string OtpCode { get; set; } = string.Empty;
}
