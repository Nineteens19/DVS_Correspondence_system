using System.Security.Cryptography;
using Correspondence.Application.Common.Exceptions;
using Correspondence.Application.DTOs;
using Correspondence.Application.Interfaces;
using Correspondence.Domain.Entities;
using Correspondence.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Correspondence.Infrastructure.Services;

public class EdrService : IEdrService
{
    private readonly CorrespondenceDbContext _db;
    private readonly ILogger<EdrService> _logger;

    public EdrService(CorrespondenceDbContext db, ILogger<EdrService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<EdrContextDto> GetPreflightContextAsync(string userId)
    {
        var user = await _db.Users
            .Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.UserId.ToLower() == userId.ToLower());

        var dept = user?.Department;
        var currentYearCe = DateTime.UtcNow.Year;
        var currentYearBe = currentYearCe + 543;

        var nextSequence = await _db.OutDocs.CountAsync() + 1;

        return new EdrContextDto
        {
            CurrentYearTh = currentYearBe.ToString(),
            CurrentYearEn = currentYearCe.ToString(),
            DeptCodeTh = dept?.DeptCodeTh ?? "สบ",
            DeptCodeEn = dept?.DeptCodeEn ?? "RC",
            DepartmentName = dept?.NameTh ?? "งานสารบรรณ",
            NextRunningSequence = nextSequence,
            IsDepartmentCodeValid = !string.IsNullOrEmpty(dept?.DeptCodeTh) && !string.IsNullOrEmpty(dept?.DeptCodeEn)
        };
    }

    public async Task<EdrNumberResponseDto> RequestOutgoingNumberAsync(EdrNumberRequestDto request, string userId)
    {
        var user = await _db.Users
            .Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.UserId.ToLower() == userId.ToLower());

        var dept = user?.Department;
        var deptCodeTh = request.DeptCodeTh ?? dept?.DeptCodeTh ?? "สบ";
        var deptCodeEn = request.DeptCodeEn ?? dept?.DeptCodeEn ?? "RC";

        var count = await _db.OutDocs.CountAsync() + 1;
        var currentYearCe = DateTime.UtcNow.Year;
        var currentYearBe = currentYearCe + 543;

        var generatedTh = $"พ{count:D3}{deptCodeTh}/{currentYearBe}";
        var generatedEn = $"S{count:D3}{deptCodeEn}/{currentYearCe}";

        var requestId = "EDR-REQ-" + DateTime.UtcNow.ToString("yyyyMMdd") + "-" + RandomNumberGenerator.GetInt32(1000, 9999);

        _logger.LogInformation("EDR Number Generated: {Th} / {En} for user {UserId}", generatedTh, generatedEn, userId);

        return new EdrNumberResponseDto
        {
            RequestId = requestId,
            GeneratedDocNumberTh = generatedTh,
            GeneratedDocNumberEn = generatedEn,
            IssuedAt = DateTime.UtcNow,
            Status = "issued",
            Message = "สร้างและออกเลขที่เอกสารส่งออกเรียบร้อยแล้ว"
        };
    }

    public async Task<EdrWebhookSyncResponse> ProcessWebhookSyncAsync(EdrWebhookSyncRequest request)
    {
        _logger.LogInformation("Processing EDR Webhook sync for {DocNumberTh}", request.GeneratedDocNumberTh);

        return new EdrWebhookSyncResponse
        {
            Success = true,
            SyncedDocumentId = request.RequestId,
            Message = "ซิงค์สถานะกับระบบ EDR สำเร็จ"
        };
    }
}
