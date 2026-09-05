using FluentValidation;
using Correspondence.Application.DTOs;

namespace Correspondence.Application.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Username).NotEmpty().WithMessage("กรุณาระบุชื่อผู้ใช้งาน (Username)");
        RuleFor(x => x.Password).NotEmpty().WithMessage("กรุณาระบุรหัสผ่าน (Password)");
    }
}

public class RegisterIncomingDocValidator : AbstractValidator<RegisterIncomingDocRequest>
{
    public RegisterIncomingDocValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(500).WithMessage("กรุณาระบุชื่อเรื่องเอกสาร");
        RuleFor(x => x.SenderAgency).NotEmpty().MaximumLength(300).WithMessage("กรุณาระบุผู้ส่งภายนอก / หน่วยงานต้นทาง");
        RuleFor(x => x.ResponsibleDepartmentId)
            .NotEmpty()
            .When(x => (x.AssignedDepartmentIds == null || x.AssignedDepartmentIds.Count == 0) && (x.AssignedUserIds == null || x.AssignedUserIds.Count == 0))
            .WithMessage("กรุณาเลือกฝ่ายที่รับผิดชอบหรือผู้รับมอบหมาย");
    }
}

public class RegisterOutgoingDocValidator : AbstractValidator<RegisterOutgoingDocRequest>
{
    public RegisterOutgoingDocValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(500).WithMessage("กรุณาระบุชื่อเรื่องเอกสาร");
        RuleFor(x => x.DestinationAgency).NotEmpty().MaximumLength(300).WithMessage("กรุณาระบุหน่วยงานปลายทาง");
        RuleFor(x => x.DeliveryMethodId).NotEmpty().WithMessage("กรุณาเลือกรูปแบบการส่ง");
    }
}

public class DelegateDocValidator : AbstractValidator<DelegateDocRequest>
{
    public DelegateDocValidator()
    {
        RuleFor(x => x.SubordinateUserIds).NotEmpty().WithMessage("กรุณาเลือกผู้ใต้บังคับบัญชาเพื่อมอบหมายต่ออย่างน้อย 1 ท่าน");
    }
}

public class ForwardDocValidator : AbstractValidator<ForwardDocRequest>
{
    public ForwardDocValidator()
    {
        RuleFor(x => x.TargetDepartmentId).NotEmpty().WithMessage("กรุณาเลือกฝ่ายปลายทาง");
        RuleFor(x => x.TargetUserIds).NotEmpty().WithMessage("กรุณาเลือกผู้รับมอบหมายปลายทาง");
    }
}

public class EdrNumberRequestValidator : AbstractValidator<EdrNumberRequestDto>
{
    public EdrNumberRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().WithMessage("กรุณาระบุชื่อเรื่อง");
        RuleFor(x => x.DestinationAgency).NotEmpty().WithMessage("กรุณาระบุหน่วยงานปลายทาง");
        RuleFor(x => x.DeptCodeTh).NotEmpty().WithMessage("ไม่พบรหัสตัวย่อฝ่าย (ไทย)");
        RuleFor(x => x.DeptCodeEn).NotEmpty().WithMessage("ไม่พบรหัสตัวย่อฝ่าย (อังกฤษ)");
    }
}
