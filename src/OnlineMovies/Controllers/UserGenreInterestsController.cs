namespace OnlineMovies.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineMovies.Database;
using OnlineMovies.DTO;
using OnlineMovies.Models;
using OnlineMovies.Responses;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

[ApiController]
[Route("api/user/genre-interests")]
[Authorize]
public class UserGenreInterestsController : ControllerBase
{
    private readonly AppDbContext _context;

    public UserGenreInterestsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<UserGenreInterestResponseDto>>>> GetGenreInterests()
    {
        if (!TryGetUserId(out var userId, out var errorResult))
        {
            return errorResult!;
        }

        var interests = await _context.UserGenreInterests
            .Where(ugi => ugi.UserId == userId)
            .Include(ugi => ugi.Genre)
            .OrderBy(ugi => ugi.Genre!.Name)
            .ToListAsync();

        var response = interests
            .Where(ugi => ugi.Genre != null)
            .Select(ugi => new UserGenreInterestResponseDto
            {
                GenreId = ugi.GenreId,
                GenreName = ugi.Genre!.Name,
                Weight = ugi.Weight
            })
            .ToList();

        return Ok(new ApiResponse<IEnumerable<UserGenreInterestResponseDto>>
        {
            Status = "Успешно",
            Message = "Предпочтения пользователя получены",
            Data = response
        });
    }

    [HttpPut]
    public async Task<ActionResult<ApiResponse<IEnumerable<UserGenreInterestResponseDto>>>> UpdateGenreInterests(UserGenreInterestsUpdateDto request)
    {
        if (!TryGetUserId(out var userId, out var errorResult))
        {
            return errorResult!;
        }

        if (!ModelState.IsValid)
        {
            var errorMessage = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage) ? e.Exception?.Message : e.ErrorMessage)
                .FirstOrDefault(message => !string.IsNullOrWhiteSpace(message));

            return BadRequest(new ApiResponse<IEnumerable<UserGenreInterestResponseDto>>
            {
                Status = "Ошибка",
                Message = errorMessage ?? "Переданы некорректные данные.",
                Data = null
            });
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return Unauthorized(new ApiResponse<IEnumerable<UserGenreInterestResponseDto>>
            {
                Status = "Ошибка",
                Message = "Пользователь не найден или больше не существует.",
                Data = null
            });
        }

        var incoming = (request.Interests ?? new List<GenreInterestUpdateItemDto>())
            .Where(item => item != null)
            .GroupBy(item => item.GenreId)
            .Select(group => new
            {
                GenreId = group.Key,
                Weight = group.Last().Weight
            })
            .ToList();

        if (incoming.Any(item => item.GenreId <= 0))
        {
            return BadRequest(new ApiResponse<IEnumerable<UserGenreInterestResponseDto>>
            {
                Status = "Ошибка",
                Message = "Идентификатор жанра должен быть положительным числом.",
                Data = null
            });
        }

        if (incoming.Any(item => item.Weight <= 0 || item.Weight > 1))
        {
            return BadRequest(new ApiResponse<IEnumerable<UserGenreInterestResponseDto>>
            {
                Status = "Ошибка",
                Message = "Вес предпочтения должен быть в диапазоне (0; 1].",
                Data = null
            });
        }

        var requestedGenreIds = incoming.Select(item => item.GenreId).ToList();

        if (requestedGenreIds.Any())
        {
            var existingGenres = await _context.Genres
                .Where(g => requestedGenreIds.Contains(g.GenreId))
                .Select(g => g.GenreId)
                .ToListAsync();

            var missing = requestedGenreIds.Except(existingGenres).ToList();
            if (missing.Any())
            {
                return BadRequest(new ApiResponse<IEnumerable<UserGenreInterestResponseDto>>
                {
                    Status = "Ошибка",
                    Message = $"Некоторые жанры не найдены: {string.Join(", ", missing)}.",
                    Data = null
                });
            }
        }

        var currentInterests = await _context.UserGenreInterests
            .Where(ugi => ugi.UserId == userId)
            .ToListAsync();

        if (!requestedGenreIds.Any())
        {
            if (currentInterests.Any())
            {
                _context.UserGenreInterests.RemoveRange(currentInterests);
                await _context.SaveChangesAsync();
            }
        }
        else
        {
            foreach (var interest in currentInterests.ToList())
            {
                if (!requestedGenreIds.Contains(interest.GenreId))
                {
                    _context.UserGenreInterests.Remove(interest);
                    currentInterests.Remove(interest);
                }
            }

            foreach (var item in incoming)
            {
                var existing = currentInterests.FirstOrDefault(ugi => ugi.GenreId == item.GenreId);
                if (existing != null)
                {
                    existing.Weight = item.Weight;
                }
                else
                {
                    var newInterest = new UserGenreInterest
                    {
                        UserId = userId,
                        GenreId = item.GenreId,
                        Weight = item.Weight
                    };

                    _context.UserGenreInterests.Add(newInterest);
                    currentInterests.Add(newInterest);
                }
            }

            await _context.SaveChangesAsync();
        }

        var updatedInterests = await _context.UserGenreInterests
            .Where(ugi => ugi.UserId == userId)
            .Include(ugi => ugi.Genre)
            .OrderBy(ugi => ugi.Genre!.Name)
            .ToListAsync();

        var response = updatedInterests
            .Where(ugi => ugi.Genre != null)
            .Select(ugi => new UserGenreInterestResponseDto
            {
                GenreId = ugi.GenreId,
                GenreName = ugi.Genre!.Name,
                Weight = ugi.Weight
            })
            .ToList();

        return Ok(new ApiResponse<IEnumerable<UserGenreInterestResponseDto>>
        {
            Status = "Успешно",
            Message = "Предпочтения обновлены",
            Data = response
        });
    }

    private bool TryGetUserId(out int userId, out ActionResult<ApiResponse<IEnumerable<UserGenreInterestResponseDto>>>? errorResult)
    {
        userId = 0;
        errorResult = null;

        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdValue) || !int.TryParse(userIdValue, out userId))
        {
            errorResult = Unauthorized(new ApiResponse<IEnumerable<UserGenreInterestResponseDto>>
            {
                Status = "Ошибка",
                Message = "Не удалось определить пользователя.",
                Data = null
            });
            return false;
        }

        return true;
    }
}


