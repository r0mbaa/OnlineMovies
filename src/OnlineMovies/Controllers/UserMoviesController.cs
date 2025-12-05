namespace OnlineMovies.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineMovies.Database;
using OnlineMovies.DTO;
using OnlineMovies.Mappers;
using OnlineMovies.Models;
using OnlineMovies.Responses;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

[ApiController]
[Route("api/user/movies")]
[Authorize]
public class UserMoviesController : ControllerBase
{
    private const string RatedStatusName = "Оценен";

    private readonly AppDbContext _context;

    public UserMoviesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<UserMovieResponseDto>>>> GetUserMovies()
    {
        var (success, userId, errorResult) = await TryGetUserIdAsync<IEnumerable<UserMovieResponseDto>>();
        if (!success)
        {
            return errorResult!;
        }

        var entries = await BuildUserMoviesQuery()
            .Where(um => um.UserId == userId)
            .OrderByDescending(um => um.AddedAt)
            .ToListAsync();

        var response = entries
            .Select(MapToResponse)
            .ToList();

        return Ok(new ApiResponse<IEnumerable<UserMovieResponseDto>>
        {
            Status = "Успешно",
            Message = "Список фильмов пользователя получен",
            Data = response
        });
    }

    [HttpGet("public/{username}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<UserMovieResponseDto>>>> GetPublicUserMovies(string username)
    {
        var trimmedUsername = username?.Trim();
        if (string.IsNullOrWhiteSpace(trimmedUsername))
        {
            return BadRequest(new ApiResponse<IEnumerable<UserMovieResponseDto>>
            {
                Status = "Ошибка",
                Message = "Имя пользователя не может быть пустым."
            });
        }

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Username == trimmedUsername);

        if (user == null)
        {
            return NotFound(new ApiResponse<IEnumerable<UserMovieResponseDto>>
            {
                Status = "Ошибка",
                Message = "Пользователь не найден."
            });
        }

        var entries = await BuildUserMoviesQuery()
            .Where(um => um.UserId == user.UserId)
            .OrderByDescending(um => um.AddedAt)
            .ToListAsync();

        var response = entries
            .Select(MapToResponse)
            .ToList();

        return Ok(new ApiResponse<IEnumerable<UserMovieResponseDto>>
        {
            Status = "Успешно",
            Message = "Список фильмов пользователя получен",
            Data = response
        });
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<UserMovieResponseDto>>> AddOrUpdateUserMovie(UserMovieRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse<UserMovieResponseDto>
            {
                Status = "Ошибка",
                Message = ExtractModelStateError() ?? "Переданы некорректные данные.",
                Data = null
            });
        }

        var (success, userId, errorResult) = await TryGetUserIdAsync<UserMovieResponseDto>();
        if (!success)
        {
            return errorResult!;
        }

        var movie = await _context.Movies.FindAsync(request.MovieId);
        if (movie == null)
        {
            return NotFound(new ApiResponse<UserMovieResponseDto>
            {
                Status = "Ошибка",
                Message = "Фильм не найден.",
                Data = null
            });
        }

        var status = await _context.Statuses.FirstOrDefaultAsync(s => s.StatusId == request.StatusId);
        if (status == null)
        {
            return BadRequest(new ApiResponse<UserMovieResponseDto>
            {
                Status = "Ошибка",
                Message = "Статус не найден.",
                Data = null
            });
        }

        var userMovie = await _context.UserMovies
            .FirstOrDefaultAsync(um => um.UserId == userId && um.MovieId == request.MovieId);

        if (userMovie == null)
        {
            userMovie = new UserMovie
            {
                UserId = userId,
                MovieId = request.MovieId,
                AddedAt = DateTime.UtcNow
            };

            _context.UserMovies.Add(userMovie);
        }

        userMovie.StatusId = request.StatusId;
        userMovie.Comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment!.Trim();

        await _context.SaveChangesAsync();

        var responseEntry = await LoadUserMovieAsync(userId, request.MovieId);

        return Ok(new ApiResponse<UserMovieResponseDto>
        {
            Status = "Успешно",
            Message = "Фильм добавлен в список пользователя",
            Data = MapToResponse(responseEntry!)
        });
    }

    [HttpPost("rate")]
    public async Task<ActionResult<ApiResponse<UserMovieResponseDto>>> RateMovie(UserMovieRateRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse<UserMovieResponseDto>
            {
                Status = "Ошибка",
                Message = ExtractModelStateError() ?? "Переданы некорректные данные.",
                Data = null
            });
        }

        var (success, userId, errorResult) = await TryGetUserIdAsync<UserMovieResponseDto>();
        if (!success)
        {
            return errorResult!;
        }

        var movie = await _context.Movies.FindAsync(request.MovieId);
        if (movie == null)
        {
            return NotFound(new ApiResponse<UserMovieResponseDto>
            {
                Status = "Ошибка",
                Message = "Фильм не найден.",
                Data = null
            });
        }

        var ratedStatus = await _context.Statuses.FirstOrDefaultAsync(s => s.Name == RatedStatusName);
        if (ratedStatus == null)
        {
            return BadRequest(new ApiResponse<UserMovieResponseDto>
            {
                Status = "Ошибка",
                Message = "Статус \"Оценен\" отсутствует. Добавьте его в справочник статусов.",
                Data = null
            });
        }

        // Проверяем, что фильм находится в статусе "Просмотрено" перед оценкой
        var watchedStatus = await _context.Statuses.FirstOrDefaultAsync(s => s.Name == "Просмотрено");
        if (watchedStatus == null)
        {
            return BadRequest(new ApiResponse<UserMovieResponseDto>
            {
                Status = "Ошибка",
                Message = "Статус \"Просмотрено\" отсутствует. Добавьте его в справочник статусов.",
                Data = null
            });
        }

        var userMovie = await _context.UserMovies
            .Include(um => um.Status)
            .FirstOrDefaultAsync(um => um.UserId == userId && um.MovieId == request.MovieId);

        // Проверяем, что фильм уже просмотрен (имеет статус "Просмотрено") или уже оценен (статус "Оценен")
        // Разрешаем изменение оценки для уже оцененных фильмов
        if (userMovie == null || (userMovie.StatusId != watchedStatus.StatusId && userMovie.StatusId != ratedStatus.StatusId))
        {
            return BadRequest(new ApiResponse<UserMovieResponseDto>
            {
                Status = "Ошибка",
                Message = "Нельзя оценить фильм, пока он не добавлен в статус \"Просмотрено\".",
                Data = null
            });
        }

        userMovie.Score = request.Score;
        userMovie.StatusId = ratedStatus.StatusId;
        userMovie.Comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment!.Trim();

        await _context.SaveChangesAsync();

        var responseEntry = await LoadUserMovieAsync(userId, request.MovieId);

        return Ok(new ApiResponse<UserMovieResponseDto>
        {
            Status = "Успешно",
            Message = "Оценка сохранена",
            Data = MapToResponse(responseEntry!)
        });
    }

    [HttpDelete("{movieId:int}")]
    public async Task<ActionResult<ApiResponse<UserMovieResponseDto>>> RemoveFromList(int movieId)
    {
        if (movieId <= 0)
        {
            return BadRequest(new ApiResponse<UserMovieResponseDto>
            {
                Status = "Ошибка",
                Message = "Некорректный идентификатор фильма.",
                Data = null
            });
        }

        var (success, userId, errorResult) = await TryGetUserIdAsync<UserMovieResponseDto>();
        if (!success)
        {
            return errorResult!;
        }

        var userMovie = await _context.UserMovies
            .FirstOrDefaultAsync(um => um.UserId == userId && um.MovieId == movieId);

        if (userMovie == null)
        {
            return NotFound(new ApiResponse<UserMovieResponseDto>
            {
                Status = "Ошибка",
                Message = "Фильм не найден в вашем списке.",
                Data = null
            });
        }

        _context.UserMovies.Remove(userMovie);
        await _context.SaveChangesAsync();

        return Ok(new ApiResponse<UserMovieResponseDto>
        {
            Status = "Успешно",
            Message = "Фильм удалён из списка.",
            Data = null
        });
    }

    private async Task<UserMovie?> LoadUserMovieAsync(int userId, int movieId)
    {
        return await BuildUserMoviesQuery()
            .FirstOrDefaultAsync(um => um.UserId == userId && um.MovieId == movieId);
    }

    private IQueryable<UserMovie> BuildUserMoviesQuery()
    {
        return _context.UserMovies
            .Include(um => um.Movie)
                .ThenInclude(m => m.MovieGenres)
                    .ThenInclude(mg => mg.Genre)
            .Include(um => um.Movie)
                .ThenInclude(m => m.MovieTags)
                    .ThenInclude(mt => mt.Tag)
            .Include(um => um.Movie)
                .ThenInclude(m => m.MovieCountries)
                    .ThenInclude(mc => mc.Country)
            .Include(um => um.Movie)
                .ThenInclude(m => m.Trailers)
            .Include(um => um.Status);
    }

    private bool TryGetUserId<T>(out int userId, out ActionResult<ApiResponse<T>>? errorResult)
    {
        userId = 0;
        errorResult = null;

        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdValue) || !int.TryParse(userIdValue, out userId))
        {
            errorResult = Unauthorized(new ApiResponse<T>
            {
                Status = "Ошибка",
                Message = "Не удалось определить пользователя.",
                Data = default
            });

            return false;
        }

        return true;
    }

    /// <summary>
    /// Асинхронная версия TryGetUserId с проверкой существования пользователя в базе данных.
    /// Используется для обработки случая, когда пользователь был удален, но его токен еще валиден.
    /// </summary>
    private async Task<(bool Success, int UserId, ActionResult<ApiResponse<T>>? ErrorResult)> TryGetUserIdAsync<T>()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdValue) || !int.TryParse(userIdValue, out var userId))
        {
            var errorResult = Unauthorized(new ApiResponse<T>
            {
                Status = "Ошибка",
                Message = "Не удалось определить пользователя.",
                Data = default
            });

            return (false, 0, errorResult);
        }

        // Проверяем, существует ли пользователь в базе данных
        // Это обрабатывает случай, когда админ удалил пользователя, но его токен еще валиден
        var userExists = await _context.Users.AnyAsync(u => u.UserId == userId);
        if (!userExists)
        {
            var errorResult = Unauthorized(new ApiResponse<T>
            {
                Status = "Ошибка",
                Message = "Пользователь не найден. Возможно, ваш аккаунт был удален.",
                Data = default
            });

            return (false, userId, errorResult);
        }

        return (true, userId, null);
    }

    private string? ExtractModelStateError()
    {
        return ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage) ? e.Exception?.Message : e.ErrorMessage)
            .FirstOrDefault(message => !string.IsNullOrWhiteSpace(message));
    }

    private static UserMovieResponseDto MapToResponse(UserMovie entity)
    {
        return new UserMovieResponseDto
        {
            MovieId = entity.MovieId,
            MovieTitle = entity.Movie?.Title ?? string.Empty,
            StatusId = entity.StatusId,
            StatusName = entity.Status?.Name,
            Score = entity.Score,
            Comment = entity.Comment,
            Movie = entity.Movie != null ? MovieMapper.Map(entity.Movie) : null
        };
    }
}


