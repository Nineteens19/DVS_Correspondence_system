namespace Correspondence.Api.Middleware;

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;

            // Security Baseline headers (SECURITY-04)
            headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' *;";
            headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
            headers["X-Content-Type-Options"] = "nosniff";
            headers["X-Frame-Options"] = "SAMEORIGIN";
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

            return Task.CompletedTask;
        });

        await _next(context);
    }
}
