namespace Correspondence.Domain.Enums;

public enum DocDirection
{
    Incoming = 1, // เอกสารรับเข้า
    Outgoing = 2  // เอกสารส่งออก
}

public enum DocChannel
{
    Email = 1,    // อีเมล
    Physical = 2  // ฉบับจริง (ไปรษณีย์ / Messenger / รับด้วยตนเอง)
}

public enum DocStatus
{
    PendingReceive = 1,   // รอดำเนินการรับ (pending_receive)
    InProgress = 2,       // กำลังดำเนินการ (in_progress)
    Completed = 3,        // ดำเนินการแล้วเสร็จ (completed)
    AwaitingReturn = 4,   // รอนำส่งคืนตัวจริง (awaiting_return)
    AwaitingDelivery = 5, // รอนำส่ง (awaiting_delivery)
    Sent = 6,             // ส่งแล้ว (sent)
    Delivered = 7,        // นำส่งสำเร็จ (delivered)
    Returned = 8,         // นำส่งไม่สำเร็จ / ตีกลับ (returned)
    Recalled = 9,         // ดึงงานกลับ (recalled)
    Cancelled = 10        // ยกเลิก (cancelled)
}

public enum UrgencyLevel
{
    Normal = 1,     // ปกติ (SLA 5 วัน)
    Urgent = 2,     // ด่วน (SLA 3 วัน)
    VeryUrgent = 3  // ด่วนมาก (SLA 1 วัน)
}

public enum ConfidentialityLevel
{
    Normal = 1,        // ปกติ
    Confidential = 2,  // ลับ
    TopSecret = 3      // ลับมาก (ต้องใช้ OTP 6 หลักทาง Email เพื่อดูไฟล์แนบ)
}

public enum SystemRole
{
    Admin = 1,      // ผู้ดูแลระบบ (จัดการ User, Master data, Monitor)
    Registrar = 2,  // ผู้ลงทะเบียนเอกสาร / เจ้าหน้าที่สารบรรณ
    Assignee = 3,   // ผู้รับมอบหมายงาน
    Approver = 4,   // ผู้อนุมัติ / หัวหน้าฝ่าย
    Monitor = 5     // ผู้เฝ้าติดตาม (ดูและติดตามเท่านั้น)
}

public enum ScopeType
{
    Department = 1,
    Workgroup = 2
}

public enum DocumentActionType
{
    Register = 1,
    Accept = 2,
    Delegate = 3,
    Forward = 4,
    Reject = 5,
    Complete = 6,
    AwaitingReturn = 7,
    Deliver = 8,
    Return = 9,
    Recall = 10,
    Cancel = 11,
    AddAttachment = 12,
    DeleteAttachment = 13,
    OtpRequested = 14,
    OtpVerified = 15
}
