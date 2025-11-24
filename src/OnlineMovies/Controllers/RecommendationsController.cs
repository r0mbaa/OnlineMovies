namespace OnlineMovies.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineMovies.Database;
using OnlineMovies.DTO;
using OnlineMovies.Mappers;
using OnlineMovies.Models;
using OnlineMovies.Responses;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RecommendationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public RecommendationsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("movies")]
    public async Task<ActionResult<ApiResponse<IEnumerable<MovieRecommendationDto>>>> GetMovieRecommendations()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdValue) || !int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized(new ApiResponse<IEnumerable<MovieRecommendationDto>>
            {
                Status = "Ошибка",
                Message = "Не удалось определить пользователя.",
                Data = null
            });
        }

        var excludedMovieIds = await _context.UserMovies
            .Where(um => um.UserId == userId)
            .Select(um => um.MovieId)
            .ToListAsync();

        var preferences = await _context.UserGenreInterests
            .Where(ugi => ugi.UserId == userId)
            .Select(ugi => new { ugi.GenreId, ugi.Weight })
            .ToListAsync();

        if (!preferences.Any())
        {
            var randomMovie = await GetRandomMovieAsync(excludedMovieIds);
            if (randomMovie == null)
            {
                return Ok(new ApiResponse<IEnumerable<MovieRecommendationDto>>
                {
                    Status = "Успешно",
                    Message = "В каталоге не осталось фильмов вне вашего списка.",
                    Data = new List<MovieRecommendationDto>()
                });
            }

            return Ok(new ApiResponse<IEnumerable<MovieRecommendationDto>>
            {
                Status = "Успешно",
                Message = "Предпочтения не заданы, показан случайный фильм.",
                Data = new List<MovieRecommendationDto>
                {
                    new MovieRecommendationDto
                    {
                        Movie = MovieMapper.Map(randomMovie),
                        Score = 0
                    }
                }
            });
        }

        var weights = preferences
            .GroupBy(p => p.GenreId)
            .ToDictionary(group => group.Key, group => group.Average(item => item.Weight));

        var genreIds = weights.Keys.ToList();

        var moviesQuery = BuildMovieQuery()
            .Where(m => m.MovieGenres.Any(mg => genreIds.Contains(mg.GenreId)));

        if (excludedMovieIds.Any())
        {
            moviesQuery = moviesQuery.Where(m => !excludedMovieIds.Contains(m.MovieId));
        }

        var movies = await moviesQuery.ToListAsync();

        var recommendations = movies
            .Select(movie =>
            {
                var score = movie.MovieGenres
                    .Where(mg => weights.ContainsKey(mg.GenreId))
                    .Sum(mg => weights[mg.GenreId]);

                return new MovieRecommendationDto
                {
                    Movie = MovieMapper.Map(movie),
                    Score = (float)score
                };
            })
            .Where(dto => dto.Score > 0)
            .OrderByDescending(dto => dto.Score)
            .ThenBy(dto => dto.Movie.Title)
            .Take(20)
            .ToList();

        return Ok(new ApiResponse<IEnumerable<MovieRecommendationDto>>
        {
            Status = "Успешно",
            Message = recommendations.Any()
                ? "Рекомендации сформированы на основе любимых жанров."
                : "Не удалось сформировать рекомендации по текущим предпочтениям.",
            Data = recommendations
        });
    }

    private IQueryable<Movie> BuildMovieQuery()
    {
        return _context.Movies
            .Include(m => m.MovieGenres)
                .ThenInclude(mg => mg.Genre)
            .Include(m => m.MovieTags)
                .ThenInclude(mt => mt.Tag)
            .Include(m => m.MovieCountries)
                .ThenInclude(mc => mc.Country)
            .Include(m => m.Trailers);
    }

    private async Task<Movie?> GetRandomMovieAsync(IReadOnlyCollection<int> excludedMovieIds)
    {
        var query = BuildMovieQuery();

        if (excludedMovieIds.Any())
        {
            query = query.Where(m => !excludedMovieIds.Contains(m.MovieId));
        }

        return await query
            .OrderBy(_ => EF.Functions.Random())
            .FirstOrDefaultAsync();
    }
}



