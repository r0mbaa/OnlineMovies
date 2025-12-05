using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using OnlineMovies.Database;
using OnlineMovies.DTO;
using OnlineMovies.Models;
using OnlineMovies.Responses;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(UserRegisterDto request)
    {
        if (await _context.Users.AnyAsync(u => u.Username == request.Username))
        {
            return BadRequest(new ApiResponse { Status = "Ошибка", Message = "Пользователь с таким именем уже существует." });
        }

        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            return BadRequest(new ApiResponse { Status = "Ошибка", Message = "Пользователь с такой почтой уже существует." });
        }

        string hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            HashedPassword = hashedPassword,
            Role = "user"
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        string token = CreateToken(user);

        var cookieOptions = BuildAuthCookieOptions();

        Response.Cookies.Append("jwt-token-online-movies", token, cookieOptions);

        var userData = new { id = user.UserId, username = user.Username, role = user.Role };
        return Ok(new ApiResponse<object>
        {
            Status = "Успешно",
            Message = "Вы успешно зарегистрировались",
            Data = userData
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(UserLoginDto request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.HashedPassword))
        {
            return BadRequest(new ApiResponse { Status = "Ошибка", Message = "Неверное имя пользователя или пароль." });
        }

        string token = CreateToken(user);

        var cookieOptions = BuildAuthCookieOptions();

        Response.Cookies.Append("jwt-token-online-movies", token, cookieOptions);

        var userData = new { id = user.UserId, username = user.Username, role = user.Role };
        return Ok(new ApiResponse<object>
        {
            Status = "Успешно",
            Message = "Вход в систему выполнен",
            Data = userData
        });
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(UserChangePasswordDto request)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);

        if (user == null)
        {
            return NotFound(new ApiResponse { Status = "Ошибка", Message = "Пользователь не найден." });
        }

        if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.HashedPassword))
        {
            return BadRequest(new ApiResponse { Status = "Ошибка", Message = "Неверный старый пароль." });
        }

        user.HashedPassword = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();

        var userData = new { id = user.UserId, username = user.Username, role = user.Role };
        return Ok(new ApiResponse<object>
        {
            Status = "Успешно",
            Message = "Пароль успешно изменен",
            Data = userData
        });
    }

    [HttpGet("check-auth")]
    [Authorize]
    public async Task<IActionResult> CheckAuth()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdValue) || !int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized(new ApiResponse<object>
            {
                Status = "Ошибка",
                Message = "Не удалось определить пользователя.",
                Data = null
            });
        }

        // Проверяем, существует ли пользователь в базе данных
        // Это обрабатывает случай, когда админ удалил пользователя, но его токен еще валиден
        var userExists = await _context.Users.AnyAsync(u => u.UserId == userId);
        if (!userExists)
        {
            return Unauthorized(new ApiResponse<object>
            {
                Status = "Ошибка",
                Message = "Пользователь не найден. Возможно, ваш аккаунт был удален.",
                Data = null
            });
        }

        var username = User.FindFirstValue(ClaimTypes.Name);
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        var userData = new { id = userId, username = username, role = userRole };
        return Ok(new ApiResponse<object>
        {
            Status = "Успешно",
            Message = "Вы активны в системе",
            Data = userData
        });
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("jwt-token-online-movies", new CookieOptions
        {
            Path = "/",
            Secure = true,
            SameSite = SameSiteMode.None
        });

        return Ok(new ApiResponse
        {
            Status = "Успешно",
            Message = "Вы успешно вышли из системы"
        });
    }

    private static CookieOptions BuildAuthCookieOptions()
    {
        return new CookieOptions
        {
            HttpOnly = true,
            Expires = DateTime.Now.AddDays(1),
            Secure = true,
            SameSite = SameSiteMode.None,
            Path = "/"
        };
    }

    private string CreateToken(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration.GetSection("AppSettings:Token").Value));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.Now.AddDays(1),
            SigningCredentials = creds
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}