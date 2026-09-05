namespace Correspondence.Application.Common.Exceptions;

public class AppException : Exception
{
    public int StatusCode { get; }

    public AppException(string message, int statusCode = 400) : base(message)
    {
        StatusCode = statusCode;
    }
}

public class NotFoundException : AppException
{
    public NotFoundException(string message) : base(message, 404) { }
}

public class ForbiddenException : AppException
{
    public ForbiddenException(string message) : base(message, 403) { }
}

public class ValidationException : AppException
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException(string message) 
        : base(message, 422)
    {
        Errors = new Dictionary<string, string[]> { { "Error", new[] { message } } };
    }

    public ValidationException(IDictionary<string, string[]> errors) 
        : base("เกิดข้อผิดพลาดในการตรวจสอบข้อมูล (Validation Error)", 422)
    {
        Errors = errors;
    }
}
