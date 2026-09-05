using System.Security.Cryptography;
using System.Text;
using Correspondence.Application.Common.Exceptions;
using Correspondence.Application.Interfaces;
using Correspondence.Domain.Entities;
using Correspondence.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Correspondence.Infrastructure.Services;

public class OtpService : IOtpService
{
    private readonly CorrespondenceDbContext _db;
    private readonly ILogger<OtpService> _logger;
    private static readonly Dictionary<string, (string docRef, string userId, DateTime expiresAt)> ActiveOtpTokens = new();

    public OtpService(CorrespondenceDbContext db, ILogger<OtpService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<bool> RequestOtpAsync(string documentId, string userId, string userEmail)
    {
        // Generate secure 6-digit numeric OTP
        var randomNum = RandomNumberGenerator.GetInt32(100000, 999999);
        var otpCode = randomNum.ToString();
        var otpRef = "OTP-" + RandomNumberGenerator.GetInt32(1000, 9999);

        // Compute SHA-256 Hash
        using var sha = SHA256.Create();
        var hashBytes = sha.ComputeHash(Encoding.UTF8.GetBytes(otpCode));
        var hashString = Convert.ToHexString(hashBytes);

        var otpTx = new OtpTransaction
        {
            DocRef = documentId,
            UserId = userId,
            OtpCodeHash = hashString,
            OtpRef = otpRef,
            DeliveryChannel = "email",
            TargetDestination = userEmail,
            AttemptCount = 0,
            Status = "issued",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(5)
        };

        _db.OtpTransactions.Add(otpTx);
        await _db.SaveChangesAsync();

        _logger.LogInformation("[SEC-OTP] OTP {OtpCode} (Ref: {OtpRef}) issued for User {UserId} on Document {DocRef} to Email {Email}",
            otpCode, otpRef, userId, documentId, userEmail);

        return true;
    }

    public async Task<string> VerifyOtpAsync(string documentId, string userId, string otpCode)
    {
        using var sha = SHA256.Create();
        var hashBytes = sha.ComputeHash(Encoding.UTF8.GetBytes(otpCode));
        var inputHash = Convert.ToHexString(hashBytes);

        var tx = await _db.OtpTransactions
            .Where(t => t.DocRef == documentId && t.UserId == userId && t.Status == "issued")
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync();

        if (tx == null)
        {
            throw new ValidationException("ไม่พบรายการขอรหัส OTP หรือรหัสหมดอายุแล้ว กรุณาขอรหัสใหม่");
        }

        if (DateTime.UtcNow > tx.ExpiresAt)
        {
            tx.Status = "expired";
            await _db.SaveChangesAsync();
            throw new ValidationException("รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่");
        }

        if (tx.AttemptCount >= 3)
        {
            tx.Status = "locked";
            tx.LockedUntil = DateTime.UtcNow.AddMinutes(15);
            await _db.SaveChangesAsync();
            throw new ForbiddenException("คุณกรอกรหัส OTP ผิดเกิน 3 ครั้ง บัญชีถูกระงับการขอ OTP ชั่วคราว 15 นาที");
        }

        if (tx.OtpCodeHash != inputHash)
        {
            tx.AttemptCount++;
            await _db.SaveChangesAsync();
            throw new ValidationException($"รหัส OTP ไม่ถูกต้อง (เหลือโอกาสอีก {3 - tx.AttemptCount} ครั้ง)");
        }

        // Mark verified
        tx.Status = "verified";
        tx.VerifiedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Issue 15-minute secret access token
        var accessToken = Guid.NewGuid().ToString("N");
        lock (ActiveOtpTokens)
        {
            ActiveOtpTokens[accessToken] = (documentId, userId, DateTime.UtcNow.AddMinutes(15));
        }

        // Log Attachment Access
        _db.AttachmentAccessLogs.Add(new AttachmentAccessLog
        {
            DocRef = documentId,
            AttachmentId = "all",
            UserId = userId,
            AccessType = "otp-verified",
            AccessedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        return accessToken;
    }

    public bool ValidateAccessToken(string token, string documentId, string userId)
    {
        if (string.IsNullOrWhiteSpace(token)) return false;

        lock (ActiveOtpTokens)
        {
            if (ActiveOtpTokens.TryGetValue(token, out var val))
            {
                if (val.docRef == documentId && val.userId.ToLower() == userId.ToLower() && val.expiresAt > DateTime.UtcNow)
                {
                    return true;
                }
            }
        }

        return false;
    }
}
