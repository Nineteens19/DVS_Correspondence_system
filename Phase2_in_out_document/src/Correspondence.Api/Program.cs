using System.Text;
using Correspondence.Api.Middleware;
using Correspondence.Application.Interfaces;
using Correspondence.Infrastructure.Data;
using Correspondence.Infrastructure.Services;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Database Configuration (SQLite for local testing / SQL Server for real DB)
var dbProvider = builder.Configuration["Database:Provider"] ?? "SQLite";
var sqlServerConn = builder.Configuration.GetConnectionString("SqlServer") ?? builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<CorrespondenceDbContext>(options =>
{
    if (dbProvider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(sqlServerConn))
    {
        options.UseSqlServer(sqlServerConn, sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
        });
    }
    else
    {
        var dbPath = Path.Combine(AppContext.BaseDirectory, "App_Data", "correspondence.db");
        var dir = Path.GetDirectoryName(dbPath);
        if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir)) Directory.CreateDirectory(dir);
        options.UseSqlite($"Data Source={dbPath}");
    }
});

// 2. Register Application Services
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<ILdapService, LdapService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IOtpService, OtpService>();
builder.Services.AddScoped<IDocumentWorkflowService, DocumentWorkflowService>();
builder.Services.AddScoped<IEdrService, EdrService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IMasterDataService, MasterDataService>();

// 3. Register Validators
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Correspondence.Application.Validators.LoginRequestValidator>();

// 4. JWT Authentication
var jwtSecret = builder.Configuration["Jwt:SecretKey"] ?? "DevesCorrespondenceSystemSecureSecretKey2026!#*@$";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "DevesCorrespondenceApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "DevesCorrespondenceApp";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// 5. CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 6. Controllers & JSON Options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// 7. Swagger / OpenAPI Documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Deves Correspondence Monitoring System API",
        Version = "v1",
        Description = "ระบบ Monitor สถานะเอกสารรับเข้า–ส่งออก (Correspondence System) .NET 8 Web API"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// 8. Health Checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<CorrespondenceDbContext>();

var app = builder.Build();

// 9. Database Auto-Migration & Seed on Startup
var autoMigrate = app.Configuration.GetValue<bool>("Database:AutoMigrateAndSeed", true);
if (autoMigrate)
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<CorrespondenceDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    const int maxRetries = 10;
    var delay = TimeSpan.FromSeconds(3);

    for (int retry = 1; retry <= maxRetries; retry++)
    {
        try
        {
            logger.LogInformation("Attempting database initialization (Attempt {Retry}/{MaxRetries})...", retry, maxRetries);
            await DbInitializer.InitializeAsync(db, logger);
            logger.LogInformation("Database initialization completed successfully.");
            break;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Database initialization attempt {Retry}/{MaxRetries} failed: {Message}", retry, maxRetries, ex.Message);
            if (retry == maxRetries)
            {
                logger.LogError(ex, "Failed to initialize the database after {MaxRetries} attempts.", maxRetries);
                throw;
            }
            await Task.Delay(delay);
        }
    }
}

// 10. HTTP Request Pipeline Middleware
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Correspondence API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseRouting();
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

// Serve compiled React Single-Page Application (SPA)
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();
app.MapHealthChecks("/health");

// Fallback to index.html for React SPA Router navigation
app.MapFallbackToFile("index.html");

app.Run();
