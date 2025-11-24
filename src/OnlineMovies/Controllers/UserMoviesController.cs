namespace OnlineMovies.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineMovies.Database;
using OnlineMovies.DTO;
using OnlineMovies.Models;
using OnlineMovies.Responses;
using System;
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

        if (!TryGetUserId(out var userId, out var errorResult))
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

        if (!TryGetUserId(out var userId, out var errorResult))
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

        if (!TryGetUserId(out var userId, out var errorResult))
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
        return await _context.UserMovies
            .Include(um => um.Movie)
            .Include(um => um.Status)
            .FirstOrDefaultAsync(um => um.UserId == userId && um.MovieId == movieId);
    }

    private bool TryGetUserId(out int userId, out ActionResult<ApiResponse<UserMovieResponseDto>>? errorResult)
    {
        userId = 0;
        errorResult = null;

        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdValue) || !int.TryParse(userIdValue, out userId))
        {
            errorResult = Unauthorized(new ApiResponse<UserMovieResponseDto>
            {
                Status = "Ошибка",
                Message = "Не удалось определить пользователя.",
                Data = null
            });

            return false;
        }

        return true;
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
            Comment = entity.Comment
        };
    }
}


