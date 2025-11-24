namespace OnlineMovies.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineMovies.Database;
using OnlineMovies.DTO;
using OnlineMovies.Responses;
using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

[ApiController]
[Route("api/user/profile")]
[Authorize]
public class UserProfileController : ControllerBase
{
    private const int MaxAvatarSizeBytes = 4 * 1024 * 1024;
    private static readonly string[] AllowedAvatarExtensions = [".jpg", ".jpeg", ".png", ".webp"];

    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public UserProfileController(AppDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<UserProfileResponseDto>>> GetProfile()
    {
        if (!TryGetUserId(out var userId, out var errorResult))
        {
            return errorResult!;
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        if (user == null)
        {
            return Unauthorized(new ApiResponse<UserProfileResponseDto>
            {
                Status = "Ошибка",
                Message = "Пользователь не найден.",
                Data = null
            });
        }

        return Ok(new ApiResponse<UserProfileResponseDto>
        {
            Status = "Успешно",
            Message = "Данные профиля получены",
            Data = MapToResponse(user)
        });
    }

    [HttpPut("description")]
    public async Task<ActionResult<ApiResponse<UserProfileResponseDto>>> UpdateDescription(UserProfileDescriptionDto request)
    {
        if (!ModelState.IsValid)
        {
            var error = ExtractModelStateError();
            return BadRequest(new ApiResponse<UserProfileResponseDto>
            {
                Status = "Ошибка",
                Message = error ?? "Переданы некорректные данные.",
                Data = null
            });
        }

        if (!TryGetUserId(out var userId, out var errorResult))
        {
            return errorResult!;
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        if (user == null)
        {
            return Unauthorized(new ApiResponse<UserProfileResponseDto>
            {
                Status = "Ошибка",
                Message = "Пользователь не найден.",
                Data = null
            });
        }

        user.ProfileDescription = string.IsNullOrWhiteSpace(request.ProfileDescription)
            ? null
            : request.ProfileDescription!.Trim();

        await _context.SaveChangesAsync();

        return Ok(new ApiResponse<UserProfileResponseDto>
        {
            Status = "Успешно",
            Message = "Описание профиля обновлено",
            Data = MapToResponse(user)
        });
    }

    [HttpPost("avatar")]
    [RequestSizeLimit(MaxAvatarSizeBytes)]
    public async Task<ActionResult<ApiResponse<UserProfileResponseDto>>> UploadAvatar([FromForm] UserAvatarUploadDto request)
    {
        if (!TryGetUserId(out var userId, out var errorResult))
        {
            return errorResult!;
        }

        if (!ModelState.IsValid || request.Avatar == null)
        {
            return BadRequest(new ApiResponse<UserProfileResponseDto>
            {
                Status = "Ошибка",
                Message = "Файл аватара не найден.",
                Data = null
            });
        }

        if (request.Avatar.Length == 0 || request.Avatar.Length > MaxAvatarSizeBytes)
        {
            return BadRequest(new ApiResponse<UserProfileResponseDto>
            {
                Status = "Ошибка",
                Message = "Размер файла должен быть больше 0 и не превышать 4 МБ.",
                Data = null
            });
        }

        var extension = Path.GetExtension(request.Avatar.FileName)?.ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(extension) || Array.IndexOf(AllowedAvatarExtensions, extension) < 0)
        {
            return BadRequest(new ApiResponse<UserProfileResponseDto>
            {
                Status = "Ошибка",
                Message = "Допустимые форматы: jpg, jpeg, png, webp.",
                Data = null
            });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        if (user == null)
        {
            return Unauthorized(new ApiResponse<UserProfileResponseDto>
            {
                Status = "Ошибка",
                Message = "Пользователь не найден.",
                Data = null
            });
        }

        var uploadsFolder = Path.Combine(GetWebRoot(), "avatars");
        Directory.CreateDirectory(uploadsFolder);

        var fileName = $"avatar_user_{userId}_{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = System.IO.File.Create(filePath))
        {
            await request.Avatar.CopyToAsync(stream);
        }

        DeleteOldAvatarIfNeeded(user.AvatarUrl);
        user.AvatarUrl = $"/avatars/{fileName}";

        await _context.SaveChangesAsync();

        return Ok(new ApiResponse<UserProfileResponseDto>
        {
            Status = "Успешно",
            Message = "Аватар обновлён",
            Data = MapToResponse(user)
        });
    }

    private bool TryGetUserId(out int userId, out ActionResult<ApiResponse<UserProfileResponseDto>>? errorResult)
    {
        userId = 0;
        errorResult = null;

        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdValue) || !int.TryParse(userIdValue, out userId))
        {
            errorResult = Unauthorized(new ApiResponse<UserProfileResponseDto>
            {
                Status = "Ошибка",
                Message = "Не удалось определить пользователя.",
                Data = null
            });

            return false;
        }

        return true;
    }

    private void DeleteOldAvatarIfNeeded(string? avatarUrl)
    {
        if (string.IsNullOrWhiteSpace(avatarUrl))
        {
            return;
        }

        if (!avatarUrl.StartsWith("/avatars/", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var relativePath = avatarUrl.TrimStart('/')
            .Replace('/', Path.DirectorySeparatorChar);
        var absolutePath = Path.Combine(GetWebRoot(), relativePath);

        if (System.IO.File.Exists(absolutePath))
        {
            System.IO.File.Delete(absolutePath);
        }
    }

    private string GetWebRoot()
    {
        return _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
    }

    private string? ExtractModelStateError()
    {
        var error = ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage) ? e.Exception?.Message : e.ErrorMessage)
            .FirstOrDefault(message => !string.IsNullOrWhiteSpace(message));

        return error;
    }

    private static UserProfileResponseDto MapToResponse(Models.User user)
    {
        return new UserProfileResponseDto
        {
            UserId = user.UserId,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role,
            AvatarUrl = user.AvatarUrl,
            ProfileDescription = user.ProfileDescription
        };
    }
}


