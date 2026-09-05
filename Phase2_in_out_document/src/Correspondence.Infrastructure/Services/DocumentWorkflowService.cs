using Correspondence.Application.Common.Exceptions;
using Correspondence.Application.DTOs;
using Correspondence.Application.Interfaces;
using Correspondence.Domain.Entities;
using Correspondence.Domain.Enums;
using Correspondence.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Correspondence.Infrastructure.Services;

public class DocumentWorkflowService : IDocumentWorkflowService
{
    private readonly CorrespondenceDbContext _db;
    private readonly IFileStorageService _storageService;
    private readonly IOtpService _otpService;

    public DocumentWorkflowService(
        CorrespondenceDbContext db,
        IFileStorageService storageService,
        IOtpService otpService)
    {
        _db = db;
        _storageService = storageService;
        _otpService = otpService;
    }

    public async Task<List<DocumentDto>> GetDocumentsAsync(
        string currentUserId,
        string role,
        string? direction,
        string? status,
        string? urgency,
        string? search,
        string? departmentId)
    {
        var result = new List<DocumentDto>();

        // ตรวจสอบข้อมูลผู้ใช้และสถานะหัวหน้าฝ่ายตาม Master Data
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == currentUserId);
        string userRoleId = user?.RoleId ?? role ?? "ROLE-02";
        string userDeptId = user?.DepartmentRef ?? "";

        var headDept = await _db.Departments.FirstOrDefaultAsync(d => d.HeadUserRef == currentUserId);
        bool isDeptHead = headDept != null || userRoleId == "ROLE-03";
        string managedDeptId = headDept?.DepartmentId ?? (isDeptHead ? userDeptId : "");

        // สิทธิ์เห็นทุกฝ่ายระดับองค์กร:
        // - ROLE-05 (Admin)
        // - ROLE-04 (Executive)
        // - ROLE-07 (Auditor / Monitor)
        // - ROLE-01 (สารบรรณกลาง) หรือ หน่วยงานสารบรรณ dept-records
        bool isSystemWideScope = userRoleId == "ROLE-05" || 
                                 userRoleId == "ROLE-04" || 
                                 userRoleId == "ROLE-07" || 
                                 userRoleId == "ROLE-01" ||
                                 userDeptId == "dept-records";

        // 1. Query MAIN_DOC (Incoming)
        if (string.IsNullOrEmpty(direction) || direction.Equals("incoming", StringComparison.OrdinalIgnoreCase))
        {
            var mainQuery = _db.MainDocs
                .Include(d => d.OriginDepartment)
                .Include(d => d.ResponsibleDepartment)
                .Include(d => d.Assignments).ThenInclude(a => a.AssigneeDepartment)
                .Include(d => d.Assignments).ThenInclude(a => a.SubAssignments)
                .Include(d => d.Attachments)
                .AsQueryable();

            if (!isSystemWideScope)
            {
                if (isDeptHead && !string.IsNullOrEmpty(managedDeptId))
                {
                    // หัวหน้าฝ่าย: เห็นเอกสารทั้งหมดของฝ่ายตนเอง (ทั้งต้นทาง/ปลายทาง/มอบหมายในฝ่าย)
                    mainQuery = mainQuery.Where(d =>
                        d.OriginDepartmentRef == managedDeptId ||
                        d.ResponsibleDepartmentRef == managedDeptId ||
                        d.RegistrarRef == currentUserId ||
                        d.Assignments.Any(a => a.AssigneeDepartmentRef == managedDeptId || a.AssigneeRef == currentUserId)
                    );
                }
                else
                {
                    // เจ้าหน้าที่ / User ทั่วไป (ไม่ใช่หัวหน้าฝ่าย): เห็นเฉพาะเอกสารของตนเองเท่านั้น
                    mainQuery = mainQuery.Where(d =>
                        d.RegistrarRef == currentUserId ||
                        d.Assignments.Any(a => a.AssigneeRef == currentUserId)
                    );
                }
            }

            if (!string.IsNullOrEmpty(status) && status != "all")
                mainQuery = mainQuery.Where(d => d.Status.ToLower() == status.ToLower());

            if (!string.IsNullOrEmpty(urgency) && urgency != "all")
                mainQuery = mainQuery.Where(d => d.Urgency.ToLower() == urgency.ToLower());

            if (!string.IsNullOrEmpty(departmentId) && departmentId != "all")
                mainQuery = mainQuery.Where(d => d.OriginDepartmentRef == departmentId || d.ResponsibleDepartmentRef == departmentId);

            if (!string.IsNullOrEmpty(search))
                mainQuery = mainQuery.Where(d => d.DocRef.Contains(search) || d.Title.Contains(search));

            var mainDocs = await mainQuery.OrderByDescending(d => d.CreatedAt).ToListAsync();
            foreach (var doc in mainDocs)
            {
                result.Add(MapMainDocToDto(doc, currentUserId, null));
            }
        }

        // 2. Query OUT_DOC (Outgoing)
        if (string.IsNullOrEmpty(direction) || direction.Equals("outgoing", StringComparison.OrdinalIgnoreCase))
        {
            var outQuery = _db.OutDocs
                .Include(d => d.OriginDepartment)
                .Include(d => d.DeliveryMethod)
                .Include(d => d.Items)
                .Include(d => d.Recipients)
                .Include(d => d.Signers)
                .Include(d => d.Attachments)
                .AsQueryable();

            if (!isSystemWideScope)
            {
                if (isDeptHead && !string.IsNullOrEmpty(managedDeptId))
                {
                    // หัวหน้าฝ่าย: เห็นเอกสารส่งออกทั้งหมดของฝ่ายตนเอง
                    outQuery = outQuery.Where(d =>
                        d.OriginDepartmentRef == managedDeptId ||
                        d.SenderRef == currentUserId
                    );
                }
                else
                {
                    // เจ้าหน้าที่ / User ทั่วไป: เห็นเฉพาะเอกสารส่งออกที่ตนเองสร้างหรือส่ง
                    outQuery = outQuery.Where(d =>
                        d.SenderRef == currentUserId
                    );
                }
            }

            if (!string.IsNullOrEmpty(status) && status != "all")
                outQuery = outQuery.Where(d => d.Status.ToLower() == status.ToLower());

            if (!string.IsNullOrEmpty(urgency) && urgency != "all")
                outQuery = outQuery.Where(d => d.Urgency.ToLower() == urgency.ToLower());

            if (!string.IsNullOrEmpty(departmentId) && departmentId != "all")
                outQuery = outQuery.Where(d => d.OriginDepartmentRef == departmentId);

            if (!string.IsNullOrEmpty(search))
                outQuery = outQuery.Where(d => d.DocNo.Contains(search) || d.DocumentNumberTh.Contains(search) || d.DocumentNumberEn.Contains(search) || d.CustomOrgName!.Contains(search));

            var outDocs = await outQuery.OrderByDescending(d => d.SentAt ?? DateTime.UtcNow).ToListAsync();
            foreach (var doc in outDocs)
            {
                result.Add(MapOutDocToDto(doc));
            }
        }

        return result;
    }

    public async Task<DocumentDto> GetDocumentByIdAsync(string documentId, string currentUserId, string? otpToken)
    {
        var custodyLogs = await _db.CustodyLogs.Where(c => c.DocRef == documentId).OrderBy(c => c.HeldAt).ToListAsync();
        var auditLogs = await _db.AuditLogs.Where(a => a.DocRef == documentId).OrderBy(a => a.ActionTime).ToListAsync();

        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == currentUserId);
        string userRoleId = user?.RoleId ?? "ROLE-02";
        string userDeptId = user?.DepartmentRef ?? "";

        var headDept = await _db.Departments.FirstOrDefaultAsync(d => d.HeadUserRef == currentUserId);
        bool isDeptHead = headDept != null || userRoleId == "ROLE-03";
        string managedDeptId = headDept?.DepartmentId ?? (isDeptHead ? userDeptId : "");

        bool isSystemWideScope = userRoleId == "ROLE-05" || 
                                 userRoleId == "ROLE-04" || 
                                 userRoleId == "ROLE-07" || 
                                 userRoleId == "ROLE-01" ||
                                 userDeptId == "dept-records";

        // Check MAIN_DOC first
        var mainDoc = await _db.MainDocs
            .Include(d => d.OriginDepartment)
            .Include(d => d.ResponsibleDepartment)
            .Include(d => d.Assignments).ThenInclude(a => a.AssigneeDepartment)
            .Include(d => d.Assignments).ThenInclude(a => a.SubAssignments).ThenInclude(s => s.AssigneeDepartment)
            .Include(d => d.Attachments)
            .FirstOrDefaultAsync(d => d.DocRef == documentId);

        if (mainDoc != null)
        {
            if (!isSystemWideScope)
            {
                bool hasAccess = mainDoc.RegistrarRef == currentUserId ||
                                 mainDoc.Assignments.Any(a => a.AssigneeRef == currentUserId) ||
                                 (isDeptHead && !string.IsNullOrEmpty(managedDeptId) && (
                                     mainDoc.OriginDepartmentRef == managedDeptId ||
                                     mainDoc.ResponsibleDepartmentRef == managedDeptId ||
                                     mainDoc.Assignments.Any(a => a.AssigneeDepartmentRef == managedDeptId)
                                 ));

                if (!hasAccess)
                {
                    throw new ForbiddenException("คุณไม่มีสิทธิ์เข้าถึงเอกสารนี้ (เข้าถึงได้เฉพาะผู้ได้รับมอบหมายหรือหัวหน้าฝ่ายเท่านั้น)");
                }
            }

            var dto = MapMainDocToDto(mainDoc, currentUserId, otpToken);
            dto.CustodyLogs = custodyLogs.Select(c => new CustodyLogDto
            {
                Id = c.Id,
                DocumentId = c.DocRef,
                HolderId = c.HolderRef,
                HolderName = c.HolderRef,
                DepartmentName = mainDoc.ResponsibleDepartment?.NameTh ?? "ฝ่ายงาน",
                Action = c.Action,
                HeldAt = c.HeldAt,
                Remarks = c.Note
            }).ToList();
            dto.Histories = auditLogs.Select(a => new DocumentHistoryDto
            {
                Id = a.LogId,
                DocumentId = a.DocRef ?? string.Empty,
                ActorId = a.ActorRef,
                ActorName = a.ActorRef,
                Action = a.Action,
                FromStatus = a.FromState,
                ToStatus = a.ToState,
                ActionSummaryTh = a.Action,
                Remarks = a.Note,
                CreatedAt = a.ActionTime
            }).ToList();
            return dto;
        }

        // Check OUT_DOC
        var outDoc = await _db.OutDocs
            .Include(d => d.OriginDepartment)
            .Include(d => d.DeliveryMethod)
            .Include(d => d.Items)
            .Include(d => d.Recipients)
            .Include(d => d.Signers)
            .Include(d => d.Attachments)
            .FirstOrDefaultAsync(d => d.DocNo == documentId || d.DocumentNumberTh == documentId || d.DocumentNumberEn == documentId);

        if (outDoc != null)
        {
            if (!isSystemWideScope)
            {
                bool hasAccess = outDoc.SenderRef == currentUserId ||
                                 (isDeptHead && !string.IsNullOrEmpty(managedDeptId) && outDoc.OriginDepartmentRef == managedDeptId);

                if (!hasAccess)
                {
                    throw new ForbiddenException("คุณไม่มีสิทธิ์เข้าถึงเอกสารนี้ (เข้าถึงได้เฉพาะผู้ส่งหรือหัวหน้าฝ่ายเท่านั้น)");
                }
            }

            var dto = MapOutDocToDto(outDoc);
            dto.Histories = auditLogs.Select(a => new DocumentHistoryDto
            {
                Id = a.LogId,
                DocumentId = a.DocRef ?? string.Empty,
                ActorId = a.ActorRef,
                ActorName = a.ActorRef,
                Action = a.Action,
                FromStatus = a.FromState,
                ToStatus = a.ToState,
                ActionSummaryTh = a.Action,
                Remarks = a.Note,
                CreatedAt = a.ActionTime
            }).ToList();
            return dto;
        }

        throw new NotFoundException("ไม่พบเอกสาร");
    }

    private async Task<string> ResolveDepartmentIdAsync(string? departmentId, string? fallback = null)
    {
        var value = string.IsNullOrWhiteSpace(departmentId) ? fallback : departmentId;
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ValidationException("กรุณาระบุรหัสฝ่ายที่รับผิดชอบ");
        }

        var department = await _db.Departments.FirstOrDefaultAsync(d =>
            d.DepartmentId.ToLower() == value.ToLower() && d.IsActive);
        if (department == null)
        {
            throw new ValidationException($"ไม่พบฝ่ายงาน '{value}' หรือฝ่ายถูกปิดใช้งาน");
        }

        return department.DepartmentId;
    }

    private async Task<User> ResolveActiveUserAsync(string? userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ValidationException("กรุณาระบุรหัสผู้ใช้งาน");
        }

        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.UserId.ToLower() == userId.ToLower() && u.Status == "Active");
        if (user == null)
        {
            throw new ValidationException($"ไม่พบผู้ใช้งาน '{userId}' หรือบัญชีถูกปิดใช้งาน");
        }

        return user;
    }

    private async Task<List<string>> GetManagedDepartmentIdsAsync(string userId)
    {
        return await _db.Departments
            .Where(d => d.IsActive && d.HeadUserRef == userId)
            .Select(d => d.DepartmentId)
            .ToListAsync();
    }

    public async Task<DocumentDto> RegisterIncomingAsync(RegisterIncomingDocRequest request, string creatorId)
    {
        var creator = await ResolveActiveUserAsync(creatorId);
        var originDept = await ResolveDepartmentIdAsync(request.OriginDepartmentId, creator.DepartmentRef);
        var requestedDepartmentIds = (request.AssignedDepartmentIds ?? new List<string>())
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        var requestedUserIds = (request.AssignedUserIds ?? new List<string>())
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var assignedDepartmentIds = new List<string>();
        foreach (var departmentId in requestedDepartmentIds)
        {
            assignedDepartmentIds.Add(await ResolveDepartmentIdAsync(departmentId));
        }

        var selectedUsers = new List<User>();
        foreach (var userId in requestedUserIds)
        {
            selectedUsers.Add(await ResolveActiveUserAsync(userId));
        }

        // MAIN_DOC ยังเก็บฝ่ายรับผิดชอบหลักไว้เพื่อเข้ากันได้กับข้อมูลเดิม แต่แต่ละ Assignment
        // คือ branch อิสระ จึงสามารถมอบหมายพร้อมกันข้ามหลายฝ่ายหรือหลายบุคคลได้.
        var responsibleDepartmentId = await ResolveDepartmentIdAsync(
            request.ResponsibleDepartmentId
            ?? assignedDepartmentIds.FirstOrDefault()
            ?? selectedUsers.FirstOrDefault()?.DepartmentRef,
            originDept);

        // การระบุ "ฝ่าย" ต้อง route ไปยังหัวหน้าฝ่ายที่กำหนดใน Master Data เสมอ
        // เพื่อไม่สร้าง assignment ที่ไม่มีผู้รับงานตามสายงาน.
        var departmentRootIds = assignedDepartmentIds.Count > 0
            ? assignedDepartmentIds
            : selectedUsers.Count == 0 ? new List<string> { responsibleDepartmentId } : new List<string>();
        foreach (var departmentId in departmentRootIds)
        {
            var department = await _db.Departments.FirstAsync(d => d.DepartmentId == departmentId);
            if (string.IsNullOrWhiteSpace(department.HeadUserRef))
            {
                throw new ValidationException($"ฝ่าย '{department.NameTh}' ยังไม่ได้กำหนดหัวหน้าฝ่ายสำหรับรับงาน");
            }
            await ResolveActiveUserAsync(department.HeadUserRef);
        }

        var count = await _db.MainDocs.CountAsync() + 1;
        var docRef = $"IN-{DateTime.UtcNow.Year}-{count:D4}";
        var mainDoc = new MainDoc
        {
            DocRef = docRef,
            DocDirection = "incoming",
            DocType = "General",
            Channel = request.Channel,
            Urgency = request.Urgency,
            ConfidentialityLevel = request.Confidentiality,
            Deadline = request.DueDate,
            Status = "pending-acceptance",
            DeadlineFlag = "on-track",
            ProgressPercent = 0,
            OriginDepartmentRef = originDept,
            ResponsibleDepartmentRef = responsibleDepartmentId,
            RegistrarRef = creator.UserId,
            CreatedAt = DateTime.UtcNow,
            Title = request.Title,
            SenderAgency = request.SenderAgency,
            OriginNumber = request.OriginNumber,
            Description = request.Description
        };
        _db.MainDocs.Add(mainDoc);

        // หนึ่งฝ่ายต่อหนึ่ง root assignment: หัวหน้าฝ่ายแต่ละฝ่ายรับและมอบหมายต่อได้อย่างอิสระ.
        foreach (var departmentId in departmentRootIds)
        {
            _db.Assignments.Add(new Assignment
            {
                DocRef = docRef,
                KeyReference = docRef,
                AssigneeRef = departmentId,
                AssigneeType = "department",
                AssigneeDepartmentRef = departmentId,
                Status = "pending",
                Deadline = request.DueDate
            });
        }

        // การระบุบุคคลสร้าง root assignment แยกตามคน และอนุญาตให้ผู้รับอยู่คนละฝ่ายได้.
        foreach (var assignee in selectedUsers)
        {
            var assigneeDepartmentId = await ResolveDepartmentIdAsync(assignee.DepartmentRef);
            _db.Assignments.Add(new Assignment
            {
                DocRef = docRef,
                KeyReference = docRef,
                AssigneeRef = assignee.UserId,
                AssigneeType = "person",
                AssigneeDepartmentRef = assigneeDepartmentId,
                Status = "pending",
                Deadline = request.DueDate
            });
        }

        var assignmentSummary = string.Join(", ", departmentRootIds.Select(id => $"ฝ่าย {id}")
            .Concat(selectedUsers.Select(user => $"บุคคล {user.UserId}")));
        _db.AuditLogs.Add(new AuditLog
        {
            DocRef = docRef,
            ActorRef = creator.UserId,
            Action = "register-incoming",
            ToState = "pending-acceptance",
            ActionTime = DateTime.UtcNow,
            Note = $"ลงทะเบียนเอกสารรับเข้า {docRef} และมอบหมาย {assignmentSummary}"
        });

        await _db.SaveChangesAsync();
        return await GetDocumentByIdAsync(docRef, creator.UserId, null);
    }

    public async Task<DocumentDto> RegisterOutgoingAsync(RegisterOutgoingDocRequest request, string creatorId)
    {
        var count = await _db.OutDocs.CountAsync() + 1;
        var docNo = $"OUT-{DateTime.UtcNow.Year}-{count:D4}";
        var docNumTh = request.EdrOutgoingNumberTh ?? $"พ{count:D3}สอ/2569";
        var docNumEn = request.EdrOutgoingNumberEn ?? $"S{count:D3}GA/2026";

        var sender = await ResolveActiveUserAsync(creatorId);
        var originDept = await ResolveDepartmentIdAsync(request.OriginDepartmentId, sender.DepartmentRef);
        var validSender = sender.UserId;

        var outDoc = new OutDoc
        {
            DocNo = docNo,
            DocumentNumberTh = docNumTh,
            DocumentNumberEn = docNumEn,
            DocDirection = "outgoing",
            OrgType = "general",
            CustomOrgName = request.DestinationAgency,
            Urgency = request.Urgency,
            ConfidentialityLevel = request.Confidentiality,
            DeliveryMethodId = request.DeliveryMethodId ?? "dm-01",
            Deadline = request.DueDate,
            Status = "ready-to-send",
            DeadlineFlag = "on-track",
            OriginDepartmentRef = originDept,
            SenderRef = validSender,
            SentAt = DateTime.UtcNow,
            Title = request.Title
        };

        _db.OutDocs.Add(outDoc);

        // ไฟล์แนบต้องอัปโหลดผ่าน POST /documents/{id}/attachments หลังสร้างเอกสาร
        // เพื่อให้ bytes ถูกจัดเก็บจริงและใช้ validation เดียวกันทุกช่องทาง.

        _db.AuditLogs.Add(new AuditLog
        {
            DocRef = docNo,
            ActorRef = validSender,
            Action = "register-outgoing",
            ToState = "ready-to-send",
            ActionTime = DateTime.UtcNow,
            Note = $"ลงทะเบียนเอกสารส่งออก {docNo} ({docNumTh})"
        });

        await _db.SaveChangesAsync();
        return await GetDocumentByIdAsync(docNo, creatorId, null);
    }

    public async Task<DocumentDto> AcceptAssignmentAsync(string documentId, string userId, ActionRemarkRequest? request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        string userDeptId = user?.DepartmentRef ?? "";

        var doc = await _db.MainDocs.FirstOrDefaultAsync(d => d.DocRef == documentId);
        if (doc != null)
        {
            if (string.IsNullOrWhiteSpace(request?.AssignmentId))
            {
                throw new ValidationException("กรุณาระบุ assignment ที่ต้องการรับงาน");
            }

            var targetAsg = await _db.Assignments.FirstOrDefaultAsync(a =>
                a.DocRef == documentId &&
                a.Id == request.AssignmentId &&
                a.Status == "pending");
            if (targetAsg == null)
            {
                throw new ValidationException("ไม่พบ assignment ที่รอรับงาน หรือ assignment นี้ถูกดำเนินการแล้ว");
            }

            var managedDepts = await GetManagedDepartmentIdsAsync(userId);
            var isDirectAssignee = targetAsg.AssigneeType == "person" && targetAsg.AssigneeRef == userId;
            var isDepartmentHead = targetAsg.AssigneeType == "department" &&
                managedDepts.Contains(targetAsg.AssigneeDepartmentRef ?? targetAsg.AssigneeRef);
            if (targetAsg.AssigneeType == "department")
            {
                if (!isDepartmentHead)
                {
                    throw new ForbiddenException("เฉพาะหัวหน้าฝ่ายของ assignment นี้เท่านั้นที่มอบหมายงานต่อได้");
                }
                throw new ValidationException("งานที่มอบหมายเป็นฝ่ายต้องมอบหมายต่อให้ผู้ปฏิบัติงานก่อน จึงไม่สามารถกดรับงานแทนทีมได้");
            }
            if (!isDirectAssignee)
            {
                throw new ForbiddenException("ผู้ที่มีสิทธิ์รับงานต้องเป็นผู้ได้รับมอบหมายโดยตรงเท่านั้น");
            }

            // Keep the assignment branch independent. The shared MAIN_DOC state
            // is only an aggregate progress indicator and never identifies a
            // different recipient as having accepted this work.
            targetAsg.AssigneeRef = userId;
            targetAsg.Status = "in-progress";
            targetAsg.AcceptedAt = DateTime.UtcNow;

            doc.Status = "in-progress";
            doc.CurrentHolderRef = userId;
            doc.ProgressPercent = Math.Max((int)doc.ProgressPercent, 25);

            _db.CustodyLogs.Add(new CustodyLog
            {
                AssignmentId = targetAsg.Id,
                DocRef = documentId,
                HolderRef = userId,
                Action = "Accept",
                HeldAt = DateTime.UtcNow,
                Note = request?.Remarks ?? "รับงาน — ยืนยันถือครองเอกสารตัวจริง"
            });

            _db.AuditLogs.Add(new AuditLog
            {
                DocRef = documentId,
                ActorRef = userId,
                Action = "Accept",
                FromState = "pending-acceptance",
                ToState = "in-progress",
                HolderRef = userId,
                ActionTime = DateTime.UtcNow,
                Note = request?.Remarks ?? "รับงานเข้าระบบ"
            });

            await _db.SaveChangesAsync();
            return await GetDocumentByIdAsync(documentId, userId, null);
        }

        var outDoc = await _db.OutDocs.FirstOrDefaultAsync(d => d.DocNo == documentId || d.DocumentNumberTh == documentId);
        if (outDoc != null)
        {
            outDoc.Status = "ready-to-send";
            _db.AuditLogs.Add(new AuditLog
            {
                DocRef = documentId,
                ActorRef = userId,
                Action = "Accept",
                ToState = "ready-to-send",
                ActionTime = DateTime.UtcNow,
                Note = request?.Remarks ?? "เตรียมส่งเอกสารออก"
            });
            await _db.SaveChangesAsync();
            return await GetDocumentByIdAsync(documentId, userId, null);
        }

        throw new NotFoundException("ไม่พบเอกสาร");
    }

    public async Task<DocumentDto> DelegateAssignmentAsync(string documentId, string userId, DelegateDocRequest request)
    {
        var actor = await ResolveActiveUserAsync(userId);
        var doc = await _db.MainDocs.FirstOrDefaultAsync(d => d.DocRef == documentId);
        if (doc == null) throw new NotFoundException("ไม่พบเอกสาร");

        var assignments = await _db.Assignments
            .Where(a => a.DocRef == documentId && (a.Status == "pending" || a.Status == "in-progress"))
            .ToListAsync();
        var managedDepartmentIds = await GetManagedDepartmentIdsAsync(actor.UserId);
        var authorizedAssignments = assignments.Where(a =>
            (a.AssigneeType == "person" && a.AssigneeRef == actor.UserId) ||
            (a.AssigneeType == "department" && managedDepartmentIds.Contains(a.AssigneeDepartmentRef ?? a.AssigneeRef)))
            .ToList();
        var parent = !string.IsNullOrWhiteSpace(request.ParentAssignmentId)
            ? authorizedAssignments.FirstOrDefault(a => a.Id == request.ParentAssignmentId)
            : authorizedAssignments.FirstOrDefault();

        if (parent == null)
        {
            throw new ForbiddenException("มอบหมายต่อได้เฉพาะผู้รับมอบหมายโดยตรง หรือหัวหน้าของฝ่ายที่ถูกมอบหมายเท่านั้น");
        }

        var targetDepartmentId = parent.AssigneeDepartmentRef
            ?? throw new ValidationException("ไม่พบฝ่ายของ assignment ต้นทาง");
        var uniqueSubordinateIds = request.SubordinateUserIds
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        if (uniqueSubordinateIds.Count == 0)
        {
            throw new ValidationException("กรุณาเลือกผู้รับมอบหมายอย่างน้อยหนึ่งคน");
        }

        foreach (var subordinateId in uniqueSubordinateIds)
        {
            var subordinate = await ResolveActiveUserAsync(subordinateId);
            if (!string.Equals(subordinate.DepartmentRef, targetDepartmentId, StringComparison.OrdinalIgnoreCase))
            {
                throw new ValidationException($"ผู้รับมอบหมาย {subordinate.DisplayName} ไม่ได้อยู่ในฝ่ายที่รับผิดชอบ");
            }
            if (subordinate.UserId.Equals(actor.UserId, StringComparison.OrdinalIgnoreCase))
            {
                throw new ValidationException("ไม่สามารถมอบหมายงานต่อให้ตนเองได้");
            }
            if (assignments.Any(a => a.ParentId == parent.Id && a.AssigneeRef == subordinate.UserId))
            {
                throw new ValidationException($"ผู้รับมอบหมาย {subordinate.DisplayName} มีงานนี้อยู่แล้ว");
            }

            _db.Assignments.Add(new Assignment
            {
                DocRef = documentId,
                KeyReference = documentId,
                AssigneeRef = subordinate.UserId,
                AssigneeType = "person",
                AssigneeDepartmentRef = targetDepartmentId,
                Status = "pending",
                ParentId = parent.Id,
                Deadline = parent.Deadline ?? doc.Deadline
            });
        }

        // Delegating a department branch means the department head has routed
        // the work to its team. The children, not the department root, now own
        // the actionable work items.
        parent.Status = "delegated";
        doc.Status = "in-progress";
        doc.ProgressPercent = Math.Max((int)doc.ProgressPercent, 25);

        _db.AuditLogs.Add(new AuditLog
        {
            DocRef = documentId,
            ActorRef = actor.UserId,
            Action = "Delegate",
            ActionTime = DateTime.UtcNow,
            Note = request.Remarks ?? "มอบหมายงานต่อให้ทีมงานในฝ่ายเดียวกัน"
        });

        await _db.SaveChangesAsync();
        return await GetDocumentByIdAsync(documentId, actor.UserId, null);
    }

    public async Task<DocumentDto> ForwardDocumentAsync(string documentId, string userId, ForwardDocRequest request)
    {
        var actor = await ResolveActiveUserAsync(userId);
        var targetDept = await ResolveDepartmentIdAsync(request.TargetDepartmentId);

        var doc = await _db.MainDocs.FirstOrDefaultAsync(d => d.DocRef == documentId);
        if (doc != null)
        {
            var activeAssignments = await _db.Assignments
                .Where(a => a.DocRef == documentId && (a.Status == "pending" || a.Status == "in-progress"))
                .ToListAsync();
            var managedDepartmentIds = await GetManagedDepartmentIdsAsync(actor.UserId);
            var canForward = actor.RoleId is "ROLE-01" or "ROLE-05" ||
                doc.RegistrarRef == actor.UserId ||
                doc.CurrentHolderRef == actor.UserId ||
                activeAssignments.Any(a => a.AssigneeType == "person" && a.AssigneeRef == actor.UserId) ||
                activeAssignments.Any(a => a.AssigneeType == "department" && managedDepartmentIds.Contains(a.AssigneeDepartmentRef ?? a.AssigneeRef));
            if (!canForward)
            {
                throw new ForbiddenException("ส่งต่อเอกสารได้เฉพาะผู้ถือครอง ผู้ได้รับมอบหมาย หัวหน้าฝ่ายที่รับงาน หรือสารบรรณต้นทางเท่านั้น");
            }

            var targetUsers = new List<User>();
            foreach (var targetUserId in request.TargetUserIds.Where(id => !string.IsNullOrWhiteSpace(id)).Distinct(StringComparer.OrdinalIgnoreCase))
            {
                var targetUser = await ResolveActiveUserAsync(targetUserId);
                if (!string.Equals(targetUser.DepartmentRef, targetDept, StringComparison.OrdinalIgnoreCase))
                {
                    throw new ValidationException($"ผู้รับส่งต่อ {targetUser.DisplayName} ไม่ได้สังกัดฝ่ายปลายทางที่เลือก");
                }
                targetUsers.Add(targetUser);
            }

            var prevDept = doc.ResponsibleDepartmentRef;
            doc.ResponsibleDepartmentRef = targetDept;
            doc.Status = "pending-acceptance";
            doc.DeadlineFlag = "on-track";

            // Mark previous active assignments as forwarded
            var existingAssignments = await _db.Assignments.Where(a => a.DocRef == documentId && a.Status != "cancelled" && a.Status != "success").ToListAsync();
            foreach (var a in existingAssignments)
            {
                a.Status = "forwarded";
            }

            if (targetUsers.Count > 0)
            {
                foreach (var targetUser in targetUsers)
                {
                    _db.Assignments.Add(new Assignment
                    {
                        DocRef = documentId,
                        KeyReference = documentId,
                        AssigneeRef = targetUser.UserId,
                        AssigneeType = "person",
                        AssigneeDepartmentRef = targetDept,
                        Status = "pending",
                        Deadline = doc.Deadline
                    });
                }
            }
            else
            {
                _db.Assignments.Add(new Assignment
                {
                    DocRef = documentId,
                    KeyReference = documentId,
                    AssigneeRef = targetDept,
                    AssigneeType = "department",
                    AssigneeDepartmentRef = targetDept,
                    Status = "pending",
                    Deadline = doc.Deadline
                });
            }

            if (doc.Channel == "physical")
            {
                _db.CustodyLogs.Add(new CustodyLog
                {
                    DocRef = documentId,
                    HolderRef = actor.UserId,
                    Action = "forward",
                    HeldAt = DateTime.UtcNow,
                    Note = $"ส่งต่อเอกสารฉบับจริงจาก {prevDept} ไปยัง {targetDept}: {request.Remarks ?? "ส่งต่อเพื่อดำเนินการ"}"
                });
            }

            _db.AuditLogs.Add(new AuditLog
            {
                DocRef = documentId,
                ActorRef = actor.UserId,
                Action = "Forward",
                FromState = "in-progress",
                ToState = "pending-acceptance",
                ActionTime = DateTime.UtcNow,
                Note = request.Remarks ?? $"ส่งต่อเอกสารไปยังฝ่าย {targetDept}"
            });

            await _db.SaveChangesAsync();
            return await GetDocumentByIdAsync(documentId, actor.UserId, null);
        }

        var outDoc = await _db.OutDocs.FirstOrDefaultAsync(d => d.DocNo == documentId || d.DocumentNumberTh == documentId);
        if (outDoc != null)
        {
            outDoc.OriginDepartmentRef = targetDept;
            outDoc.Status = "ready-to-send";

            _db.AuditLogs.Add(new AuditLog
            {
                DocRef = documentId,
                ActorRef = actor.UserId,
                Action = "Forward",
                ToState = "ready-to-send",
                ActionTime = DateTime.UtcNow,
                Note = request.Remarks ?? $"ส่งต่อเอกสารส่งออกไปยังฝ่าย {targetDept}"
            });

            await _db.SaveChangesAsync();
            return await GetDocumentByIdAsync(documentId, actor.UserId, null);
        }

        throw new NotFoundException("ไม่พบเอกสาร");
    }

    public async Task<DocumentDto> RejectAssignmentAsync(string documentId, string userId, ActionRemarkRequest request)
    {
        var doc = await _db.MainDocs.FirstOrDefaultAsync(d => d.DocRef == documentId);
        if (doc != null)
        {
            var assignment = await _db.Assignments.FirstOrDefaultAsync(a => a.DocRef == documentId && (a.AssigneeRef == userId || a.AssigneeDepartmentRef == doc.ResponsibleDepartmentRef));
            if (assignment != null)
            {
                assignment.Status = "rejected";
                assignment.RejectNote = request.Remarks;
            }
            doc.Status = "awaiting-physical-return";

            _db.AuditLogs.Add(new AuditLog
            {
                DocRef = documentId,
                ActorRef = userId,
                Action = "Reject",
                FromState = "in-progress",
                ToState = "awaiting-physical-return",
                ActionTime = DateTime.UtcNow,
                Note = request.Remarks ?? "ปฏิเสธและส่งคืนต้นทาง"
            });

            await _db.SaveChangesAsync();
            return await GetDocumentByIdAsync(documentId, userId, null);
        }
        throw new NotFoundException("ไม่พบเอกสาร");
    }

    public async Task<DocumentDto> CompleteDocumentAsync(string documentId, string userId, ActionRemarkRequest? request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        string userDeptId = user?.DepartmentRef ?? "";

        var doc = await _db.MainDocs.FirstOrDefaultAsync(d => d.DocRef == documentId);
        if (doc != null)
        {
            if (string.IsNullOrWhiteSpace(request?.AssignmentId))
            {
                throw new ValidationException("กรุณาระบุ assignment ที่ต้องการปิดงาน");
            }

            var targetAssignment = await _db.Assignments.FirstOrDefaultAsync(a =>
                a.DocRef == documentId &&
                a.Id == request.AssignmentId &&
                (a.Status == "accepted" || a.Status == "in-progress"));
            if (targetAssignment == null || targetAssignment.AssigneeRef != userId)
            {
                throw new ForbiddenException("คุณไม่มี assignment ที่รับงานแล้วสำหรับปิดงานเอกสารนี้");
            }

            // Complete exactly the branch selected by the signed-in assignee.
            // Parallel assignments owned by other users remain unchanged.
            targetAssignment.Status = "success";
            targetAssignment.AcceptedAt ??= DateTime.UtcNow;

            // 4. ตรวจสอบว่าทุก Root Assignment ในเอกสารนี้สำเร็จครบทั้งหมดแล้วหรือไม่
            var activeAssignments = await _db.Assignments
                .Where(a => a.DocRef == documentId && a.Status != "cancelled" && a.Status != "rejected")
                .ToListAsync();

            // A delegated parent is a routing node, not a remaining unit of
            // work. Document completion is determined by the active leaf
            // assignments so all delegated children can close the document.
            var activeLeafAssignments = activeAssignments
                .Where(a => !activeAssignments.Any(candidate => candidate.ParentId == a.Id))
                .ToList();
            bool allCompleted = activeLeafAssignments.Count == 0 || activeLeafAssignments.All(a => a.Status == "success");

            if (allCompleted)
            {
                doc.Status = doc.Channel == "physical" ? "awaiting-physical-return" : "completed";
                doc.ProgressPercent = 100;
                doc.DeadlineFlag = "cleared";
            }
            else
            {
                // Another independent branch is still open.
                doc.Status = "in-progress";
                int totalCount = activeLeafAssignments.Count;
                int successCount = activeLeafAssignments.Count(a => a.Status == "success");
                doc.ProgressPercent = totalCount > 0 ? Math.Min(90, Math.Max(25, (decimal)successCount * 100 / totalCount)) : 50;
            }

            _db.AuditLogs.Add(new AuditLog
            {
                DocRef = documentId,
                ActorRef = userId,
                Action = "Complete",
                ToState = doc.Status,
                ActionTime = DateTime.UtcNow,
                Note = request?.Remarks ?? $"ดำเนินการเสร็จสิ้น (ฝ่าย {userDeptId})"
            });

            await _db.SaveChangesAsync();
            return await GetDocumentByIdAsync(documentId, userId, null);
        }

        var outDoc = await _db.OutDocs.FirstOrDefaultAsync(d => d.DocNo == documentId || d.DocumentNumberTh == documentId);
        if (outDoc != null)
        {
            outDoc.Status = "delivered";
            outDoc.DeliveredAt = DateTime.UtcNow;
            outDoc.DeadlineFlag = "cleared";

            _db.AuditLogs.Add(new AuditLog
            {
                DocRef = documentId,
                ActorRef = userId,
                Action = "Complete",
                ToState = "delivered",
                ActionTime = DateTime.UtcNow,
                Note = request?.Remarks ?? "นำส่งเอกสารสำเร็จ"
            });

            await _db.SaveChangesAsync();
            return await GetDocumentByIdAsync(documentId, userId, null);
        }

        throw new NotFoundException("ไม่พบเอกสาร");
    }

    public async Task<DocumentDto> DeliverDocumentAsync(string documentId, string userId, DeliverDocRequest request)
    {
        var outDoc = await _db.OutDocs.FirstOrDefaultAsync(d => d.DocNo == documentId || d.DocumentNumberTh == documentId);
        if (outDoc != null)
        {
            outDoc.Status = "delivered";
            outDoc.DeliveredAt = DateTime.UtcNow;
            outDoc.DeadlineFlag = "cleared";

            _db.AuditLogs.Add(new AuditLog
            {
                DocRef = documentId,
                ActorRef = userId,
                Action = "Deliver",
                ToState = "delivered",
                ActionTime = DateTime.UtcNow,
                Note = request.Remarks ?? $"นำส่งเรียบร้อย - ผู้รับ: {request.DeliveredToPerson}"
            });

            await _db.SaveChangesAsync();
            return await GetDocumentByIdAsync(documentId, userId, null);
        }

        var mainDoc = await _db.MainDocs.FirstOrDefaultAsync(d => d.DocRef == documentId);
        if (mainDoc != null)
        {
            mainDoc.Status = "completed";
            mainDoc.ProgressPercent = 100;
            mainDoc.DeadlineFlag = "cleared";

            _db.AuditLogs.Add(new AuditLog
            {
                DocRef = documentId,
                ActorRef = userId,
                Action = "Deliver",
                ToState = "completed",
                ActionTime = DateTime.UtcNow,
                Note = request.Remarks ?? "ยืนยันรับเอกสารฉบับจริงคืน"
            });

            await _db.SaveChangesAsync();
            return await GetDocumentByIdAsync(documentId, userId, null);
        }

        throw new NotFoundException("ไม่พบเอกสารส่งออก");
    }

    public async Task<DocumentDto> RecallDocumentAsync(string documentId, string userId, ActionRemarkRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        bool isAdminOrRegistrar = user != null && (user.RoleId == "ROLE-05" || user.RoleId == "ROLE-01" || user.DepartmentRef == "dept-records");

        var doc = await _db.MainDocs.FirstOrDefaultAsync(d => d.DocRef == documentId);
        if (doc != null)
        {
            bool isOrigin = isAdminOrRegistrar || doc.RegistrarRef == userId || (user != null && user.DepartmentRef == doc.OriginDepartmentRef);
            if (!isOrigin)
            {
                throw new ForbiddenException("เฉพาะผู้สร้าง/สารบรรณต้นทาง หรือผู้ดูแลระบบเท่านั้นที่มีสิทธิ์ดึงงานกลับ");
            }

            doc.Status = "registered";
            _db.AuditLogs.Add(new AuditLog { DocRef = documentId, ActorRef = userId, Action = "Recall", ToState = "registered", ActionTime = DateTime.UtcNow, Note = request.Remarks });
            await _db.SaveChangesAsync();
            return await GetDocumentByIdAsync(documentId, userId, null);
        }

        var outDoc = await _db.OutDocs.FirstOrDefaultAsync(d => d.DocNo == documentId);
        if (outDoc != null)
        {
            bool isOrigin = isAdminOrRegistrar || outDoc.SenderRef == userId || (user != null && user.DepartmentRef == outDoc.OriginDepartmentRef);
            if (!isOrigin)
            {
                throw new ForbiddenException("เฉพาะผู้สร้าง/สารบรรณต้นทาง หรือผู้ดูแลระบบเท่านั้นที่มีสิทธิ์ดึงงานกลับ");
            }

            outDoc.Status = "ready-to-send";
            _db.AuditLogs.Add(new AuditLog { DocRef = documentId, ActorRef = userId, Action = "Recall", ToState = "ready-to-send", ActionTime = DateTime.UtcNow, Note = request.Remarks });
            await _db.SaveChangesAsync();
            return await GetDocumentByIdAsync(documentId, userId, null);
        }

        throw new NotFoundException("ไม่พบเอกสาร");
    }

    public async Task<DocumentDto> CancelDocumentAsync(string documentId, string userId, ActionRemarkRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        bool isAdminOrRegistrar = user != null && (user.RoleId == "ROLE-05" || user.RoleId == "ROLE-01" || user.DepartmentRef == "dept-records");

        var doc = await _db.MainDocs.FirstOrDefaultAsync(d => d.DocRef == documentId);
        if (doc != null)
        {
            bool isOrigin = isAdminOrRegistrar || doc.RegistrarRef == userId || (user != null && user.DepartmentRef == doc.OriginDepartmentRef);
            if (!isOrigin)
            {
                throw new ForbiddenException("เฉพาะผู้สร้าง/สารบรรณต้นทาง หรือผู้ดูแลระบบเท่านั้นที่มีสิทธิ์ยกเลิกเอกสาร");
            }

            doc.Status = "cancelled";
            doc.DeadlineFlag = "cleared";
            _db.AuditLogs.Add(new AuditLog { DocRef = documentId, ActorRef = userId, Action = "Cancel", ToState = "cancelled", ActionTime = DateTime.UtcNow, Note = request.Remarks });
            await _db.SaveChangesAsync();
            return await GetDocumentByIdAsync(documentId, userId, null);
        }

        var outDoc = await _db.OutDocs.FirstOrDefaultAsync(d => d.DocNo == documentId);
        if (outDoc != null)
        {
            bool isOrigin = isAdminOrRegistrar || outDoc.SenderRef == userId || (user != null && user.DepartmentRef == outDoc.OriginDepartmentRef);
            if (!isOrigin)
            {
                throw new ForbiddenException("เฉพาะผู้สร้าง/สารบรรณต้นทาง หรือผู้ดูแลระบบเท่านั้นที่มีสิทธิ์ยกเลิกเอกสาร");
            }

            outDoc.Status = "cancelled";
            outDoc.DeadlineFlag = "cleared";
            _db.AuditLogs.Add(new AuditLog { DocRef = documentId, ActorRef = userId, Action = "Cancel", ToState = "cancelled", ActionTime = DateTime.UtcNow, Note = request.Remarks });
            await _db.SaveChangesAsync();
            return await GetDocumentByIdAsync(documentId, userId, null);
        }

        throw new NotFoundException("ไม่พบเอกสาร");
    }

    public async Task<DocumentAttachmentDto> AddAttachmentAsync(string documentId, string userId, AttachmentUploadDto upload)
    {
        if (upload.Data == null || upload.Data.Length == 0)
        {
            throw new ValidationException("กรุณาเลือกไฟล์ที่ต้องการแนบ");
        }
        if (upload.Data.Length > 25 * 1024 * 1024)
        {
            throw new ValidationException("ไฟล์แนบต้องมีขนาดไม่เกิน 25 MB");
        }

        var safeFileName = Path.GetFileName(upload.FileName);
        var extension = Path.GetExtension(safeFileName).ToLowerInvariant();
        var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg", ".webp", ".zip"
        };
        if (string.IsNullOrWhiteSpace(safeFileName) || !allowedExtensions.Contains(extension))
        {
            throw new ValidationException("รองรับเฉพาะไฟล์ PDF, Office, รูปภาพ และ ZIP");
        }

        // ตรวจสิทธิ์ผู้แนบไฟล์ด้วย access policy เดียวกับหน้ารายละเอียดเอกสาร
        var document = await GetDocumentByIdAsync(documentId, userId, null);
        var (storagePath, sizeBytes) = await _storageService.SaveFileAsync(
            safeFileName,
            upload.Data,
            DateTime.UtcNow.ToString("yyyyMM"));

        var att = new Attachment
        {
            DocRef = documentId,
            FileName = safeFileName,
            FilePath = storagePath,
            FileType = string.IsNullOrWhiteSpace(upload.ContentType) ? "application/octet-stream" : upload.ContentType,
            AttachmentSource = upload.IsCameraCapture ? "camera" : "upload",
            IsConfidential = document.Confidentiality is "confidential" or "top-secret",
            IsPrimary = false,
            FileHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(upload.Data)),
            UploadedBy = userId,
            UploadedAt = DateTime.UtcNow,
            FileSizeBytes = sizeBytes
        };

        _db.Attachments.Add(att);
        _db.AuditLogs.Add(new AuditLog
        {
            DocRef = documentId,
            ActorRef = userId,
            Action = "AddAttachment",
            ActionTime = DateTime.UtcNow,
            Note = $"แนบไฟล์ {safeFileName} ({sizeBytes:N0} bytes)"
        });

        await _db.SaveChangesAsync();
        return MapAttachmentToDto(att);
    }

    public async Task<bool> DeleteAttachmentAsync(string documentId, string attachmentId, string userId)
    {
        await GetDocumentByIdAsync(documentId, userId, null);
        var att = await _db.Attachments.FirstOrDefaultAsync(a => a.Id == attachmentId && a.DocRef == documentId);
        if (att == null) return false;

        _db.Attachments.Remove(att);
        _db.AuditLogs.Add(new AuditLog
        {
            DocRef = documentId,
            ActorRef = userId,
            Action = "DeleteAttachment",
            ActionTime = DateTime.UtcNow,
            Note = $"ลบไฟล์แนบ {att.FileName}"
        });
        await _db.SaveChangesAsync();
        await _storageService.DeleteFileAsync(att.FilePath);
        return true;
    }

    private DocumentDto MapMainDocToDto(MainDoc doc, string currentUserId, string? otpToken)
    {
        var isTopSecret = doc.ConfidentialityLevel == "top-secret";
        var isOtpVerified = !string.IsNullOrEmpty(otpToken) && _otpService.ValidateAccessToken(otpToken, doc.DocRef, currentUserId);
        var isRestricted = isTopSecret && !isOtpVerified;

        return new DocumentDto
        {
            Id = doc.DocRef,
            DocumentNumber = doc.DocRef,
            DocDirection = doc.DocDirection,
            DocChannel = doc.Channel ?? "email",
            Status = doc.Status,
            StatusTh = GetStatusTh(doc.Status),
            Urgency = doc.Urgency,
            Confidentiality = doc.ConfidentialityLevel,
            Title = string.IsNullOrEmpty(doc.Title) ? $"เอกสารรับเข้า {doc.DocRef}" : doc.Title,
            Description = doc.Description,
            ExternalSender = doc.SenderAgency,
            OriginNumber = doc.OriginNumber,
            OriginDepartmentId = doc.OriginDepartmentRef,
            OriginDepartmentName = doc.OriginDepartment?.NameTh ?? "ฝ่ายบริหารทั่วไป",
            ResponsibleDepartmentId = doc.ResponsibleDepartmentRef,
            ResponsibleDepartmentName = doc.ResponsibleDepartment?.NameTh ?? "ฝ่ายเทคโนโลยีสารสนเทศ",
            CreatedById = doc.RegistrarRef ?? "admin",
            CreatedByName = doc.RegistrarRef ?? "สารบรรณกลาง",
            CurrentHolderId = doc.CurrentHolderRef,
            CurrentHolderName = doc.CurrentHolderRef ?? "สารบรรณกลาง",
            RegisteredAt = doc.CreatedAt,
            DueDate = doc.Deadline,
            ProgressPercent = (int)doc.ProgressPercent,
            DeadlineFlag = doc.DeadlineFlag,
            IsRestrictedAttachment = isRestricted,
            HasAccessToSecret = !isRestricted,
            Assignments = doc.Assignments.Where(a => a.ParentId == null).Select(MapAssignmentToDto).ToList(),
            Attachments = isRestricted ? new List<DocumentAttachmentDto>() : doc.Attachments.Select(MapAttachmentToDto).ToList()
        };
    }

    private DocumentDto MapOutDocToDto(OutDoc doc)
    {
        return new DocumentDto
        {
            Id = doc.DocNo,
            DocumentNumber = doc.DocumentNumberTh,
            DocumentNumberEn = doc.DocumentNumberEn,
            DocDirection = "outgoing",
            DocChannel = "physical",
            Status = doc.Status,
            StatusTh = GetStatusTh(doc.Status),
            Urgency = doc.Urgency,
            Confidentiality = doc.ConfidentialityLevel,
            Title = string.IsNullOrEmpty(doc.Title) ? doc.CustomOrgName ?? $"เอกสารส่งออก {doc.DocumentNumberTh}" : doc.Title,
            DestinationAgency = doc.CustomOrgName ?? doc.ExternalOrgRef,
            OriginDepartmentId = doc.OriginDepartmentRef,
            OriginDepartmentName = doc.OriginDepartment?.NameTh ?? "ฝ่ายการเงิน",
            DeliveryMethodId = doc.DeliveryMethodId,
            DeliveryMethodName = doc.DeliveryMethod?.Label ?? "ไปรษณีย์ด่วนพิเศษ (EMS)",
            CreatedById = doc.SenderRef ?? "admin",
            CreatedByName = doc.SenderRef ?? "ฝ่ายต้นทาง",
            RegisteredAt = doc.SentAt ?? DateTime.UtcNow,
            DueDate = doc.Deadline,
            DeliveredAt = doc.DeliveredAt,
            ProgressPercent = doc.Status == "delivered" ? 100 : doc.Status == "sent" ? 80 : 40,
            DeadlineFlag = doc.DeadlineFlag,
            Attachments = doc.Attachments.Select(MapAttachmentToDto).ToList()
        };
    }

    private static DocumentAssignmentDto MapAssignmentToDto(Assignment a)
    {
        return new DocumentAssignmentDto
        {
            Id = a.Id,
            DocumentId = a.DocRef,
            AssigneeId = a.AssigneeRef,
            AssigneeName = a.AssigneeRef,
            AssigneeType = a.AssigneeType ?? "person",
            DepartmentId = a.AssigneeDepartmentRef ?? string.Empty,
            DepartmentName = a.AssigneeDepartment?.NameTh ?? "ฝ่ายงาน",
            ParentAssignmentId = a.ParentId,
            Status = a.Status,
            AssignedAt = a.AcceptedAt ?? DateTime.UtcNow,
            AcceptedAt = a.AcceptedAt,
            SubAssignments = a.SubAssignments.Select(MapAssignmentToDto).ToList()
        };
    }

    private static DocumentAttachmentDto MapAttachmentToDto(Attachment a)
    {
        return new DocumentAttachmentDto
        {
            Id = a.Id,
            DocumentId = a.DocRef,
            FileName = a.FileName,
            OriginalFileName = a.FileName,
            ContentType = a.FileType ?? "application/pdf",
            FileSizeBytes = a.FileSizeBytes,
            IsCameraCapture = a.AttachmentSource == "camera",
            UploadedById = a.UploadedBy,
            UploadedByName = a.UploadedBy,
            UploadedAt = a.UploadedAt,
            DownloadUrl = $"/api/v1/documents/{a.DocRef}/attachments/{a.Id}/download",
            PreviewUrl = $"/api/v1/documents/{a.DocRef}/attachments/{a.Id}/preview"
        };
    }

    private static string GetStatusTh(string status)
    {
        return status.ToLower() switch
        {
            "registered" => "ลงทะเบียนแล้ว",
            "pending-acceptance" or "pending" => "รอดำเนินการรับ",
            "in-progress" => "กำลังดำเนินการ",
            "awaiting-physical-return" => "รอรับเอกสารจริงคืน",
            "ready-to-send" => "พร้อมนำส่ง",
            "sent" => "นำส่งแล้ว",
            "delivered" => "ปลายทางรับแล้ว",
            "completed" => "เสร็จสิ้น",
            "cancelled" => "ยกเลิก",
            _ => status
        };
    }
}
