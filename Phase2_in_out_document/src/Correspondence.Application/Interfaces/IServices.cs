using Correspondence.Application.DTOs;
using Correspondence.Domain.Enums;

namespace Correspondence.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<UserProfileDto> GetCurrentUserProfileAsync(string userId);
    Task<List<UserProfileDto>> GetAllUsersAsync();
    Task<UserProfileDto> ProvisionUserAsync(ProvisionUserRequest request);
    Task<UserProfileDto> UpdateUserAsync(string id, ProvisionUserRequest request);
}

public interface ILdapService
{
    Task<bool> ValidateCredentialsAsync(string username, string password);
    Task<List<LdapSearchUserDto>> SearchUsersAsync(string query);
    Task<LdapSearchUserDto?> GetUserByUsernameAsync(string username);
}

public interface IDocumentWorkflowService
{
    Task<List<DocumentDto>> GetDocumentsAsync(string currentUserId, string role, string? direction, string? status, string? urgency, string? search, string? departmentId);
    Task<DocumentDto> GetDocumentByIdAsync(string documentId, string currentUserId, string? otpToken);
    Task<DocumentDto> RegisterIncomingAsync(RegisterIncomingDocRequest request, string creatorId);
    Task<DocumentDto> RegisterOutgoingAsync(RegisterOutgoingDocRequest request, string creatorId);

    Task<DocumentDto> AcceptAssignmentAsync(string documentId, string userId, ActionRemarkRequest? request);
    Task<DocumentDto> DelegateAssignmentAsync(string documentId, string userId, DelegateDocRequest request);
    Task<DocumentDto> ForwardDocumentAsync(string documentId, string userId, ForwardDocRequest request);
    Task<DocumentDto> RejectAssignmentAsync(string documentId, string userId, ActionRemarkRequest request);
    Task<DocumentDto> CompleteDocumentAsync(string documentId, string userId, ActionRemarkRequest? request);
    Task<DocumentDto> DeliverDocumentAsync(string documentId, string userId, DeliverDocRequest request);
    Task<DocumentDto> RecallDocumentAsync(string documentId, string userId, ActionRemarkRequest request);
    Task<DocumentDto> CancelDocumentAsync(string documentId, string userId, ActionRemarkRequest request);

    Task<DocumentAttachmentDto> AddAttachmentAsync(string documentId, string userId, AttachmentUploadDto upload);
    Task<bool> DeleteAttachmentAsync(string documentId, string attachmentId, string userId);
}

public interface IOtpService
{
    Task<bool> RequestOtpAsync(string documentId, string userId, string userEmail);
    Task<string> VerifyOtpAsync(string documentId, string userId, string otpCode);
    bool ValidateAccessToken(string token, string documentId, string userId);
}

public interface IEdrService
{
    Task<EdrContextDto> GetPreflightContextAsync(string userId);
    Task<EdrNumberResponseDto> RequestOutgoingNumberAsync(EdrNumberRequestDto request, string userId);
    Task<EdrWebhookSyncResponse> ProcessWebhookSyncAsync(EdrWebhookSyncRequest request);
}

public interface IReportService
{
    Task<DashboardMetricsDto> GetDashboardMetricsAsync(string userId, string role);
    Task<ReportResultDto> GenerateReportAsync(ReportFilterRequest filter);
}

public interface IMasterDataService
{
    Task<List<DepartmentDto>> GetDepartmentsAsync();
    Task<DepartmentDto> UpdateDepartmentHeadAsync(string departmentId, string headUserRef);
    Task<List<WorkgroupDto>> GetWorkgroupsAsync(string? departmentId);
    Task<List<DeliveryMethodDto>> GetDeliveryMethodsAsync();
    Task<List<MonitorConfigDto>> GetMonitorConfigsAsync();
    Task<MonitorConfigDto> SaveMonitorConfigAsync(SaveMonitorConfigRequest request);
    Task<bool> DeleteMonitorConfigAsync(string id);
    Task<ReminderIntervalsDto> GetReminderIntervalsAsync();
    Task<ReminderIntervalsDto> UpdateReminderIntervalsAsync(ReminderIntervalsDto dto);
}

public interface IFileStorageService
{
    Task<(string storagePath, long sizeBytes)> SaveFileAsync(string fileName, byte[] data, string subDirectory);
    Task<byte[]> ReadFileAsync(string storagePath);
    Task<byte[]> GenerateWatermarkedPreviewAsync(string storagePath, string contentType, string watermarkText);
    Task DeleteFileAsync(string storagePath);
}
