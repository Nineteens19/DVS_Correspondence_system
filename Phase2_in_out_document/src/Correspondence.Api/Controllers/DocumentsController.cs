using Correspondence.Application.DTOs;
using Correspondence.Application.Interfaces;
using Correspondence.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Correspondence.Api.Controllers;

[Authorize]
public class DocumentsController : BaseApiController
{
    private readonly IDocumentWorkflowService _workflowService;
    private readonly IOtpService _otpService;
    private readonly IFileStorageService _storageService;
    private readonly CorrespondenceDbContext _db;

    public DocumentsController(
        IDocumentWorkflowService workflowService,
        IOtpService otpService,
        IFileStorageService storageService,
        CorrespondenceDbContext db)
    {
        _workflowService = workflowService;
        _otpService = otpService;
        _storageService = storageService;
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<DocumentDto>>> GetDocuments(
        [FromQuery] string? direction,
        [FromQuery] string? status,
        [FromQuery] string? urgency,
        [FromQuery] string? search,
        [FromQuery] string? departmentId)
    {
        var docs = await _workflowService.GetDocumentsAsync(CurrentUserId, CurrentUserRole, direction, status, urgency, search, departmentId);
        return Ok(docs);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DocumentDto>> GetDocumentById(
        string id,
        [FromHeader(Name = "X-OTP-Token")] string? otpToken)
    {
        var doc = await _workflowService.GetDocumentByIdAsync(id, CurrentUserId, otpToken);
        return Ok(doc);
    }

    [HttpPost("incoming")]
    public async Task<ActionResult<DocumentDto>> RegisterIncoming([FromBody] RegisterIncomingDocRequest request)
    {
        var doc = await _workflowService.RegisterIncomingAsync(request, CurrentUserId);
        return CreatedAtAction(nameof(GetDocumentById), new { id = doc.Id }, doc);
    }

    [HttpPost("outgoing")]
    public async Task<ActionResult<DocumentDto>> RegisterOutgoing([FromBody] RegisterOutgoingDocRequest request)
    {
        var doc = await _workflowService.RegisterOutgoingAsync(request, CurrentUserId);
        return CreatedAtAction(nameof(GetDocumentById), new { id = doc.Id }, doc);
    }

    [HttpPost("{id}/accept")]
    public async Task<ActionResult<DocumentDto>> AcceptAssignment(string id, [FromBody] ActionRemarkRequest? request) =>
        Ok(await _workflowService.AcceptAssignmentAsync(id, CurrentUserId, request));

    [HttpPost("{id}/delegate")]
    public async Task<ActionResult<DocumentDto>> DelegateAssignment(string id, [FromBody] DelegateDocRequest request) =>
        Ok(await _workflowService.DelegateAssignmentAsync(id, CurrentUserId, request));

    [HttpPost("{id}/forward")]
    public async Task<ActionResult<DocumentDto>> ForwardDocument(string id, [FromBody] ForwardDocRequest request) =>
        Ok(await _workflowService.ForwardDocumentAsync(id, CurrentUserId, request));

    [HttpPost("{id}/reject")]
    public async Task<ActionResult<DocumentDto>> RejectAssignment(string id, [FromBody] ActionRemarkRequest request) =>
        Ok(await _workflowService.RejectAssignmentAsync(id, CurrentUserId, request));

    [HttpPost("{id}/complete")]
    public async Task<ActionResult<DocumentDto>> CompleteDocument(string id, [FromBody] ActionRemarkRequest? request) =>
        Ok(await _workflowService.CompleteDocumentAsync(id, CurrentUserId, request));

    [HttpPost("{id}/deliver")]
    public async Task<ActionResult<DocumentDto>> DeliverDocument(string id, [FromBody] DeliverDocRequest request) =>
        Ok(await _workflowService.DeliverDocumentAsync(id, CurrentUserId, request));

    [HttpPost("{id}/recall")]
    public async Task<ActionResult<DocumentDto>> RecallDocument(string id, [FromBody] ActionRemarkRequest request) =>
        Ok(await _workflowService.RecallDocumentAsync(id, CurrentUserId, request));

    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<DocumentDto>> CancelDocument(string id, [FromBody] ActionRemarkRequest request) =>
        Ok(await _workflowService.CancelDocumentAsync(id, CurrentUserId, request));

    [HttpPost("{id}/otp/request")]
    public async Task<ActionResult> RequestOtp(string id, [FromBody] OtpRequestDto? request)
    {
        var email = !string.IsNullOrEmpty(request?.DeliveryEmail) ? request.DeliveryEmail : CurrentUserEmail;
        if (string.IsNullOrEmpty(email)) email = $"{CurrentUserId}@deves.co.th";
        await _otpService.RequestOtpAsync(id, CurrentUserId, email);
        return Ok(new { message = $"รหัส OTP 6 หลักได้ถูกส่งไปยังอีเมล {email} แล้ว กรุณาตรวจสอบและยืนยันตัวตนภายใน 5 นาที" });
    }

    [HttpPost("{id}/otp/verify")]
    public async Task<ActionResult> VerifyOtp(string id, [FromBody] OtpVerifyDto request)
    {
        var token = await _otpService.VerifyOtpAsync(id, CurrentUserId, request.OtpCode);
        return Ok(new { token, expiresInMinutes = 15, message = "ยืนยันรหัส OTP สำเร็จ สามารถเข้าถึงไฟล์แนบลับมากได้เป็นเวลา 15 นาที" });
    }

    [HttpPost("{id}/attachments")]
    [RequestSizeLimit(25 * 1024 * 1024)]
    public async Task<ActionResult<DocumentAttachmentDto>> AddAttachment(
        string id,
        [FromForm] IFormFile file,
        [FromForm] bool isEvidence = false,
        [FromForm] bool isCameraCapture = false)
    {
        if (file == null || file.Length == 0) return BadRequest(new { message = "กรุณาเลือกไฟล์ที่ต้องการแนบ" });
        await using var stream = file.OpenReadStream();
        await using var buffer = new MemoryStream();
        await stream.CopyToAsync(buffer);
        var attachment = await _workflowService.AddAttachmentAsync(id, CurrentUserId, new AttachmentUploadDto
        {
            FileName = file.FileName,
            ContentType = file.ContentType,
            Data = buffer.ToArray(),
            FileSizeBytes = file.Length,
            IsEvidence = isEvidence,
            IsCameraCapture = isCameraCapture
        });
        return Ok(attachment);
    }

    [HttpGet("{id}/attachments/{attId}/download")]
    public async Task<IActionResult> DownloadAttachment(string id, string attId, [FromHeader(Name = "X-OTP-Token")] string? otpToken)
    {
        await _workflowService.GetDocumentByIdAsync(id, CurrentUserId, otpToken);
        var attachment = await _db.Attachments.FindAsync(attId);
        if (attachment == null || attachment.DocRef != id) return NotFound();
        var data = await _storageService.ReadFileAsync(attachment.FilePath);
        if (data.Length == 0) return NotFound(new { message = "ไม่พบไฟล์แนบบนระบบจัดเก็บ" });
        _db.AttachmentAccessLogs.Add(new() { DocRef = id, AttachmentId = attachment.Id, UserId = CurrentUserId, AccessType = "download" });
        await _db.SaveChangesAsync();
        return File(data, attachment.FileType ?? "application/octet-stream", attachment.FileName);
    }

    [HttpGet("{id}/attachments/{attId}/preview")]
    public async Task<IActionResult> PreviewAttachment(string id, string attId, [FromHeader(Name = "X-OTP-Token")] string? otpToken)
    {
        await _workflowService.GetDocumentByIdAsync(id, CurrentUserId, otpToken);
        var attachment = await _db.Attachments.FindAsync(attId);
        if (attachment == null || attachment.DocRef != id) return NotFound();
        var data = await _storageService.GenerateWatermarkedPreviewAsync(attachment.FilePath, attachment.FileType ?? "application/octet-stream", CurrentUserId);
        if (data.Length == 0) return NotFound(new { message = "ไม่พบไฟล์แนบบนระบบจัดเก็บ" });
        _db.AttachmentAccessLogs.Add(new() { DocRef = id, AttachmentId = attachment.Id, UserId = CurrentUserId, AccessType = "preview" });
        await _db.SaveChangesAsync();
        Response.Headers.ContentDisposition = $"inline; filename=\"{attachment.FileName.Replace("\"", string.Empty)}\"";
        return File(data, attachment.FileType ?? "application/octet-stream");
    }

    [HttpDelete("{id}/attachments/{attId}")]
    public async Task<ActionResult> DeleteAttachment(string id, string attId)
    {
        var result = await _workflowService.DeleteAttachmentAsync(id, attId, CurrentUserId);
        return result ? NoContent() : NotFound();
    }
}
