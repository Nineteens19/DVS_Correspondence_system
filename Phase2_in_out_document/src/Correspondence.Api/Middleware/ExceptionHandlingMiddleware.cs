using Correspondence.Application.Common.Exceptions;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace Correspondence.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        _logger.LogError(ex, "An unhandled error occurred during request processing: {Path}", context.Request.Path);

        context.Response.ContentType = "application/problem+json";

        var statusCode = StatusCodes.Status500InternalServerError;
        var title = "เกิดข้อผิดพลาดภายในระบบ";
        var detail = ex.Message;
        IDictionary<string, string[]>? errors = null;

        if (ex is ValidationException valEx)
        {
            statusCode = valEx.StatusCode;
            title = "การตรวจสอบข้อมูลไม่ถูกต้อง";
            detail = valEx.Message;
            errors = valEx.Errors;
        }
        else if (ex is AppException appEx)
        {
            statusCode = appEx.StatusCode;
            title = appEx switch
            {
                NotFoundException => "ไม่พบข้อมูล",
                ForbiddenException => "ไม่มีสิทธิ์เข้าถึง",
                _ => "ข้อผิดพลาดทางธุรกิจ"
            };
        }

        context.Response.StatusCode = statusCode;

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path
        };

        if (errors != null)
        {
            problemDetails.Extensions["errors"] = errors;
        }

        var json = JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        await context.Response.WriteAsync(json);
    }
}
