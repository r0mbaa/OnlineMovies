namespace OnlineMovies.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineMovies.Database;
using OnlineMovies.DTO;
using OnlineMovies.Responses;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<UserAdminResponseDto>>>> GetUsers()
    {
        var users = await _context.Users
            .OrderBy(u => u.UserId)
            .Select(u => new UserAdminResponseDto
            {
                UserId = u.UserId,
                Username = u.Username,
                Email = u.Email,
                Role = u.Role
            })
            .ToListAsync();

        return Ok(new ApiResponse<IEnumerable<UserAdminResponseDto>>
        {
            Status = "Успешно",
            Message = "Список пользователей получен",
            Data = users
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<UserAdminResponseDto>>> GetUser(int id)
    {
        var user = await _context.Users
            .Where(u => u.UserId == id)
            .Select(u => new UserAdminResponseDto
            {
                UserId = u.UserId,
                Username = u.Username,
                Email = u.Email,
                Role = u.Role
            })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return NotFound(new ApiResponse
            {
                Status = "Ошибка",
                Message = "Пользователь не найден"
            });
        }

        return Ok(new ApiResponse<UserAdminResponseDto>
        {
            Status = "Успешно",
            Message = "Пользователь найден",
            Data = user
        });
    }

    [HttpGet("by-username/{username}")]
    public async Task<ActionResult<ApiResponse<UserAdminResponseDto>>> GetUserByUsername(string username)
    {
        var trimmedUsername = username?.Trim();
        if (string.IsNullOrWhiteSpace(trimmedUsername))
        {
            return BadRequest(new ApiResponse
            {
                Status = "Ошибка",
                Message = "Имя пользователя не может быть пустым."
            });
        }

        var user = await _context.Users
            .Where(u => u.Username == trimmedUsername)
            .Select(u => new UserAdminResponseDto
            {
                UserId = u.UserId,
                Username = u.Username,
                Email = u.Email,
                Role = u.Role
            })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return NotFound(new ApiResponse
            {
                Status = "Ошибка",
                Message = "Пользователь не найден"
            });
        }

        return Ok(new ApiResponse<UserAdminResponseDto>
        {
            Status = "Успешно",
            Message = "Пользователь найден",
            Data = user
        });
    }

    [HttpGet("lookup")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<UserPublicProfileDto>>>> LookupUsers([FromQuery] string? query, [FromQuery] int limit = 12)
    {
        var boundedLimit = Math.Clamp(limit, 1, 30);
        var trimmedQuery = query?.Trim();

        var usersQuery = _context.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(trimmedQuery) && trimmedQuery.Length >= 2)
        {
            usersQuery = usersQuery.Where(u => EF.Functions.Like(u.Username, $"%{trimmedQuery}%"));
        }

        var results = await usersQuery
            .OrderBy(u => u.Username)
            .Take(boundedLimit)
            .Select(u => new UserPublicProfileDto
            {
                UserId = u.UserId,
                Username = u.Username,
                Role = u.Role,
                AvatarUrl = u.AvatarUrl,
                ProfileDescription = u.ProfileDescription
            })
            .ToListAsync();

        return Ok(new ApiResponse<IEnumerable<UserPublicProfileDto>>
        {
            Status = "Успешно",
            Message = "Результаты поиска профилей получены",
            Data = results
        });
    }

    [HttpGet("public/{username}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<UserPublicProfileDto>>> GetPublicProfile(string username)
    {
        var trimmedUsername = username?.Trim();
        if (string.IsNullOrWhiteSpace(trimmedUsername))
        {
            return BadRequest(new ApiResponse
            {
                Status = "Ошибка",
                Message = "Имя пользователя не может быть пустым."
            });
        }

        var user = await _context.Users
            .Where(u => u.Username == trimmedUsername)
            .Select(u => new UserPublicProfileDto
            {
                UserId = u.UserId,
                Username = u.Username,
                Role = u.Role,
                AvatarUrl = u.AvatarUrl,
                ProfileDescription = u.ProfileDescription
            })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return NotFound(new ApiResponse
            {
                Status = "Ошибка",
                Message = "Пользователь не найден"
            });
        }

        return Ok(new ApiResponse<UserPublicProfileDto>
        {
            Status = "Успешно",
            Message = "Профиль найден",
            Data = user
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse<UserAdminResponseDto>>> UpdateUser(int id, UserAdminUpdateDto request)
    {
        if (!ModelState.IsValid)
        {
            var errorMessage = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage) ? e.Exception?.Message : e.ErrorMessage)
                .FirstOrDefault(message => !string.IsNullOrWhiteSpace(message));

            return BadRequest(new ApiResponse
            {
                Status = "Ошибка",
                Message = errorMessage ?? "Переданы некорректные данные."
            });
        }

        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound(new ApiResponse
            {
                Status = "Ошибка",
                Message = "Пользователь не найден"
            });
        }

        var trimmedUsername = request.Username.Trim();
        var trimmedEmail = request.Email.Trim();
        var trimmedRole = request.Role.Trim();

        if (await _context.Users.AnyAsync(u => u.Username == trimmedUsername && u.UserId != id))
        {
            return BadRequest(new ApiResponse
            {
                Status = "Ошибка",
                Message = "Имя пользователя уже занято."
            });
        }

        if (await _context.Users.AnyAsync(u => u.Email == trimmedEmail && u.UserId != id))
        {
            return BadRequest(new ApiResponse
            {
                Status = "Ошибка",
                Message = "Электронная почта уже используется."
            });
        }

        if (!IsRoleAllowed(trimmedRole))
        {
            return BadRequest(new ApiResponse
            {
                Status = "Ошибка",
                Message = "Недопустимая роль. Разрешены: admin, user."
            });
        }

        user.Username = trimmedUsername;
        user.Email = trimmedEmail;
        user.Role = trimmedRole;

        await _context.SaveChangesAsync();

        var response = new UserAdminResponseDto
        {
            UserId = user.UserId,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role
        };

        return Ok(new ApiResponse<UserAdminResponseDto>
        {
            Status = "Успешно",
            Message = "Данные пользователя обновлены",
            Data = response
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse>> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound(new ApiResponse
            {
                Status = "Ошибка",
                Message = "Пользователь не найден"
            });
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new ApiResponse
        {
            Status = "Успешно",
            Message = "Пользователь удалён"
        });
    }

    private static bool IsRoleAllowed(string role)
    {
        return role == "admin" || role == "user";
    }
}


