using Correspondence.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Text;

namespace Correspondence.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _baseStoragePath;

    public FileStorageService(IConfiguration configuration)
    {
        _baseStoragePath = configuration["Storage:BasePath"] 
            ?? Path.Combine(AppContext.BaseDirectory, "App_Data", "uploads");

        if (!Directory.Exists(_baseStoragePath))
        {
            Directory.CreateDirectory(_baseStoragePath);
        }
    }

    public async Task<(string storagePath, long sizeBytes)> SaveFileAsync(string fileName, byte[] data, string subDirectory)
    {
        var targetDir = Path.Combine(_baseStoragePath, subDirectory);
        if (!Directory.Exists(targetDir))
        {
            Directory.CreateDirectory(targetDir);
        }

        var uniqueFileName = $"{Guid.NewGuid():N}_{fileName}";
        var fullPath = Path.Combine(targetDir, uniqueFileName);

        await File.WriteAllBytesAsync(fullPath, data);
        return (Path.Combine(subDirectory, uniqueFileName), data.Length);
    }

    public async Task<byte[]> ReadFileAsync(string storagePath)
    {
        var fullPath = Path.Combine(_baseStoragePath, storagePath);
        if (!File.Exists(fullPath))
        {
            return Array.Empty<byte>();
        }

        return await File.ReadAllBytesAsync(fullPath);
    }

    public async Task<byte[]> GenerateWatermarkedPreviewAsync(string storagePath, string contentType, string watermarkText)
    {
        var data = await ReadFileAsync(storagePath);
        if (data.Length == 0) return data;

        // If SVG or HTML or plaintext preview, or binary image, apply watermark header/footer or overlay
        if (contentType.StartsWith("image/svg", StringComparison.OrdinalIgnoreCase))
        {
            var svgContent = Encoding.UTF8.GetString(data);
            var watermarkedSvg = svgContent.Replace("</svg>", 
                $"<text x='50%' y='50%' font-size='24' fill='red' opacity='0.3' text-anchor='middle' transform='rotate(-30 150,150)'>{watermarkText}</text></svg>");
            return Encoding.UTF8.GetBytes(watermarkedSvg);
        }

        return data;
    }

    public Task DeleteFileAsync(string storagePath)
    {
        var fullPath = Path.Combine(_baseStoragePath, storagePath);
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }
        return Task.CompletedTask;
    }
}
