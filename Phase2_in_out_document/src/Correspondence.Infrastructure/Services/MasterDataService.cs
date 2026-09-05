using System.Text.Json;
using Correspondence.Application.Common.Exceptions;
using Correspondence.Application.DTOs;
using Correspondence.Application.Interfaces;
using Correspondence.Domain.Entities;
using Correspondence.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Correspondence.Infrastructure.Services;

public class MasterDataService : IMasterDataService
{
    private readonly CorrespondenceDbContext _db;

    public MasterDataService(CorrespondenceDbContext db)
    {
        _db = db;
    }

    public async Task<List<DepartmentDto>> GetDepartmentsAsync()
    {
        var list = await _db.Departments
            .OrderBy(d => d.NameTh)
            .ToListAsync();

        var users = await _db.Users.ToListAsync();
        var userMap = users.ToDictionary(u => u.UserId, u => u.DisplayName ?? u.UserId);

        return list.Select(d => {
            string headName = d.HeadUserRef ?? string.Empty;
            if (!string.IsNullOrEmpty(d.HeadUserRef) && userMap.TryGetValue(d.HeadUserRef, out var dn))
            {
                headName = dn;
            }

            return new DepartmentDto
            {
                Id = d.DepartmentId,
                Code = d.DeptCodeEn ?? d.DepartmentId,
                NameTh = d.NameTh,
                NameEn = d.NameEn,
                DeptCodeTh = d.DeptCodeTh,
                DeptCodeEn = d.DeptCodeEn,
                HeadUserRef = d.HeadUserRef,
                HeadUserName = headName,
                IsActive = d.IsActive
            };
        }).ToList();
    }

    public async Task<DepartmentDto> UpdateDepartmentHeadAsync(string departmentId, string headUserRef)
    {
        var dept = await _db.Departments.FirstOrDefaultAsync(d => d.DepartmentId == departmentId || d.NameTh == departmentId || d.NameEn == departmentId);
        if (dept == null)
        {
            throw new NotFoundException($"Department '{departmentId}' not found.");
        }

        dept.HeadUserRef = headUserRef;

        if (!string.IsNullOrEmpty(headUserRef))
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == headUserRef);
            if (user != null && user.RoleId == "ROLE-02")
            {
                user.RoleId = "ROLE-03";
            }
        }

        await _db.SaveChangesAsync();

        var headUser = await _db.Users.FirstOrDefaultAsync(u => u.UserId == dept.HeadUserRef);

        return new DepartmentDto
        {
            Id = dept.DepartmentId,
            Code = dept.DeptCodeEn ?? dept.DepartmentId,
            NameTh = dept.NameTh,
            NameEn = dept.NameEn,
            DeptCodeTh = dept.DeptCodeTh,
            DeptCodeEn = dept.DeptCodeEn,
            HeadUserRef = dept.HeadUserRef,
            HeadUserName = headUser?.DisplayName ?? headUser?.UserId ?? dept.HeadUserRef,
            IsActive = dept.IsActive
        };
    }

    public async Task<List<WorkgroupDto>> GetWorkgroupsAsync(string? departmentId)
    {
        var query = _db.Workgroups.AsQueryable();
        if (!string.IsNullOrEmpty(departmentId))
        {
            query = query.Where(w => w.DepartmentId == departmentId);
        }

        var list = await query.OrderBy(w => w.Name).ToListAsync();
        return list.Select(w => new WorkgroupDto
        {
            Id = w.WorkgroupId,
            DepartmentId = w.DepartmentId,
            Name = w.Name,
            IsActive = w.IsActive
        }).ToList();
    }

    public async Task<List<DeliveryMethodDto>> GetDeliveryMethodsAsync()
    {
        var list = await _db.DeliveryMethods
            .OrderBy(d => d.DeliveryMethodId)
            .ToListAsync();

        return list.Select(d => new DeliveryMethodDto
        {
            Id = d.DeliveryMethodId,
            Label = d.Label,
            IsPostalPickup = d.IsPostalPickup,
            IsActive = d.IsActive
        }).ToList();
    }

    public async Task<List<MonitorConfigDto>> GetMonitorConfigsAsync()
    {
        var list = await _db.MonitorAssignments
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();

        var users = await _db.Users.ToListAsync();
        var userMap = users.ToDictionary(u => u.UserId, u => u.DisplayName ?? u.UserId);

        return list.Select(m => {
            string displayName = m.MonitorUserRef;
            if (userMap.TryGetValue(m.MonitorUserRef, out var dn)) displayName = dn;

            var scopeRefs = string.IsNullOrEmpty(m.ScopeRefs) ? new List<string>() : JsonSerializer.Deserialize<List<string>>(m.ScopeRefs) ?? new List<string>();

            return new MonitorConfigDto
            {
                Id = m.MonitorId,
                UserId = m.MonitorUserRef,
                UserName = displayName,
                ScopeType = m.ScopeType,
                ScopeRefs = scopeRefs,
                AllDepartments = m.AllDepartments,
                DocDirectionFilter = m.DocDirectionFilter,
                NotifyEnabled = m.NotifyEnabled,
                Status = m.Status
            };
        }).ToList();
    }

    public async Task<MonitorConfigDto> SaveMonitorConfigAsync(SaveMonitorConfigRequest request)
    {
        MonitorAssignment? entity = null;
        if (!string.IsNullOrEmpty(request.Id))
        {
            entity = await _db.MonitorAssignments.FirstOrDefaultAsync(m => m.MonitorId == request.Id);
        }

        if (entity == null)
        {
            entity = new MonitorAssignment
            {
                MonitorId = Guid.NewGuid().ToString(),
                MonitorUserRef = request.UserId,
                ScopeType = request.AllDepartments ? "all" : request.ScopeType,
                ScopeRefs = JsonSerializer.Serialize(request.ScopeRefs),
                AllDepartments = request.AllDepartments,
                DocDirectionFilter = request.DocDirectionFilter,
                NotifyEnabled = request.NotifyEnabled,
                Status = "Active",
                CreatedBy = "admin",
                CreatedAt = DateTime.UtcNow
            };
            _db.MonitorAssignments.Add(entity);

            var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == request.UserId);
            if (user != null && user.RoleId == "ROLE-02")
            {
                user.RoleId = "ROLE-07";
            }
        }
        else
        {
            entity.MonitorUserRef = request.UserId;
            entity.ScopeType = request.AllDepartments ? "all" : request.ScopeType;
            entity.ScopeRefs = JsonSerializer.Serialize(request.ScopeRefs);
            entity.AllDepartments = request.AllDepartments;
            entity.DocDirectionFilter = request.DocDirectionFilter;
            entity.NotifyEnabled = request.NotifyEnabled;
        }

        await _db.SaveChangesAsync();

        var userObj = await _db.Users.FirstOrDefaultAsync(u => u.UserId == entity.MonitorUserRef);

        return new MonitorConfigDto
        {
            Id = entity.MonitorId,
            UserId = entity.MonitorUserRef,
            UserName = userObj?.DisplayName ?? userObj?.UserId ?? entity.MonitorUserRef,
            ScopeType = entity.ScopeType,
            ScopeRefs = request.ScopeRefs,
            AllDepartments = entity.AllDepartments,
            DocDirectionFilter = entity.DocDirectionFilter,
            NotifyEnabled = entity.NotifyEnabled,
            Status = entity.Status
        };
    }

    public async Task<bool> DeleteMonitorConfigAsync(string id)
    {
        var entity = await _db.MonitorAssignments.FirstOrDefaultAsync(m => m.MonitorId == id);
        if (entity == null) return false;

        _db.MonitorAssignments.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    private static ReminderIntervalsDto _reminderIntervals = new() { Normal = 5, Urgent = 3, VeryUrgent = 1 };

    public Task<ReminderIntervalsDto> GetReminderIntervalsAsync()
    {
        return Task.FromResult(_reminderIntervals);
    }

    public Task<ReminderIntervalsDto> UpdateReminderIntervalsAsync(ReminderIntervalsDto dto)
    {
        if (dto.Normal > 0) _reminderIntervals.Normal = dto.Normal;
        if (dto.Urgent > 0) _reminderIntervals.Urgent = dto.Urgent;
        if (dto.VeryUrgent > 0) _reminderIntervals.VeryUrgent = dto.VeryUrgent;
        return Task.FromResult(_reminderIntervals);
    }
}
