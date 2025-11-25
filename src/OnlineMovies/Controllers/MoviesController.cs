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
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
public class MoviesController : ControllerBase
{
    private readonly AppDbContext _context;

    public MoviesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<MovieResponseDto>>>> GetMovies([FromQuery] MovieFilterQuery? filter)
    {
        var query = LoadMoviesQuery();

        if (filter != null)
        {
            query = ApplyFilters(query, filter);
        }

        query = ApplySorting(query, filter);

        var movies = await query.ToListAsync();

        var movieDtos = movies.Select(MovieMapper.Map).ToList();

        return Ok(new ApiResponse<IEnumerable<MovieResponseDto>>
        {
            Status = "Успешно",
            Message = "Список фильмов получен",
            Data = movieDtos
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<MovieResponseDto>>> GetMovie(int id)
    {
        var movie = await LoadMoviesQuery()
            .FirstOrDefaultAsync(m => m.MovieId == id);

        if (movie == null)
        {
            return NotFound(new ApiResponse
            {
                Status = "Ошибка",
                Message = "Фильм не найден"
            });
        }

        return Ok(new ApiResponse<MovieResponseDto>
        {
            Status = "Успешно",
            Message = "Фильм найден",
            Data = MovieMapper.Map(movie)
        });
    }

    [HttpGet("by-title/{title}")]
    public async Task<ActionResult<ApiResponse<MovieResponseDto>>> GetMovieByTitle(string title)
    {
        var trimmedTitle = title?.Trim();
        if (string.IsNullOrWhiteSpace(trimmedTitle))
        {
            return BadRequest(new ApiResponse
            {
                Status = "Ошибка",
                Message = "Название фильма не может быть пустым."
            });
        }

        var movie = await LoadMoviesQuery()
            .FirstOrDefaultAsync(m => m.Title == trimmedTitle);

        if (movie == null)
        {
            return NotFound(new ApiResponse
            {
                Status = "Ошибка",
                Message = "Фильм не найден"
            });
        }

        return Ok(new ApiResponse<MovieResponseDto>
        {
            Status = "Успешно",
            Message = "Фильм найден",
            Data = MovieMapper.Map(movie)
        });
    }

    [HttpGet("random")]
    public async Task<ActionResult<ApiResponse<MovieResponseDto>>> GetRandomMovie()
    {
        var movie = await LoadMoviesQuery()
            .OrderBy(_ => EF.Functions.Random())
            .FirstOrDefaultAsync();

        if (movie == null)
        {
            return NotFound(new ApiResponse
            {
                Status = "Ошибка",
                Message = "В базе нет фильмов."
            });
        }

        return Ok(new ApiResponse<MovieResponseDto>
        {
            Status = "Успешно",
            Message = "Случайный фильм получен",
            Data = MovieMapper.Map(movie)
        });
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse<MovieResponseDto>>> PostMovie(MovieCreateUpdateDto request)
    {
        var modelStateError = ExtractModelStateError();
        if (modelStateError != null)
        {
            return BadRequest(new ApiResponse
            {
                Status = "Ошибка",
                Message = modelStateError
            });
        }

        var validationError = await ValidateRequestAsync(request);
        if (validationError != null)
        {
            return BadRequest(new ApiResponse
            {
                Status = "Ошибка",
                Message = validationError
            });
        }

        var movie = new Movie
        {
            Title = request.Title.Trim(),
            Description = request.Description,
            ReleaseYear = request.ReleaseYear,
            Director = string.IsNullOrWhiteSpace(request.Director) ? null : request.Director.Trim(),
            PosterUrl = string.IsNullOrWhiteSpace(request.PosterUrl) ? null : request.PosterUrl.Trim(),
            DurationMinutes = request.DurationMinutes
        };

        ApplyRelationshipsForCreate(movie, request);

        _context.Movies.Add(movie);
        await _context.SaveChangesAsync();

        var createdMovie = await LoadMoviesQuery()
            .FirstAsync(m => m.MovieId == movie.MovieId);

        return CreatedAtAction(nameof(GetMovie), new { id = movie.MovieId }, new ApiResponse<MovieResponseDto>
        {
            Status = "Успешно",
            Message = "Фильм успешно создан",
            Data = MovieMapper.Map(createdMovie)
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse<MovieResponseDto>>> PutMovie(int id, MovieCreateUpdateDto request)
    {
        var modelStateError = ExtractModelStateError();
        if (modelStateError != null)
        {
            return BadRequest(new ApiResponse
            {
                Status = "Ошибка",
                Message = modelStateError
            });
        }

        var movie = await LoadMoviesQuery()
            .FirstOrDefaultAsync(m => m.MovieId == id);

        if (movie == null)
        {
            return NotFound(new ApiResponse
            {
                Status = "Ошибка",
                Message = "Фильм не найден"
            });
        }

        var validationError = await ValidateRequestAsync(request);
        if (validationError != null)
        {
            return BadRequest(new ApiResponse
            {
                Status = "Ошибка",
                Message = validationError
            });
        }

        movie.Title = request.Title.Trim();
        movie.Description = request.Description;
        movie.ReleaseYear = request.ReleaseYear;
        movie.Director = string.IsNullOrWhiteSpace(request.Director) ? null : request.Director.Trim();
        movie.PosterUrl = string.IsNullOrWhiteSpace(request.PosterUrl) ? null : request.PosterUrl.Trim();
        movie.DurationMinutes = request.DurationMinutes;

        UpdateRelationships(movie, request);

        await _context.SaveChangesAsync();

        var updatedMovie = await LoadMoviesQuery()
            .FirstAsync(m => m.MovieId == movie.MovieId);

        return Ok(new ApiResponse<MovieResponseDto>
        {
            Status = "Успешно",
            Message = "Фильм успешно обновлен",
            Data = MovieMapper.Map(updatedMovie)
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteMovie(int id)
    {
        var movie = await _context.Movies.FindAsync(id);
        if (movie == null)
        {
            return NotFound(new ApiResponse
            {
                Status = "Ошибка",
                Message = "Фильм не найден"
            });
        }

        _context.Movies.Remove(movie);
        await _context.SaveChangesAsync();

        return Ok(new ApiResponse
        {
            Status = "Успешно",
            Message = "Фильм успешно удален"
        });
    }

    private IQueryable<Movie> LoadMoviesQuery()
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

    private static IQueryable<Movie> ApplyFilters(IQueryable<Movie> query, MovieFilterQuery filter)
    {
        var trimmedTitle = filter.Title?.Trim();
        if (!string.IsNullOrWhiteSpace(trimmedTitle))
        {
            query = query.Where(m => EF.Functions.Like(m.Title, $"%{trimmedTitle}%"));
        }

        if (filter.GenreIds?.Any() == true)
        {
            var genreIds = filter.GenreIds.Distinct().ToList();
            query = query.Where(m => m.MovieGenres.Any(mg => genreIds.Contains(mg.GenreId)));
        }

        if (filter.TagIds?.Any() == true)
        {
            var tagIds = filter.TagIds.Distinct().ToList();
            query = query.Where(m => m.MovieTags.Any(mt => tagIds.Contains(mt.TagId)));
        }

        if (filter.CountryIds?.Any() == true)
        {
            var countryIds = filter.CountryIds.Distinct().ToList();
            query = query.Where(m => m.MovieCountries.Any(mc => countryIds.Contains(mc.CountryId)));
        }

        if (filter.ReleaseYearFrom.HasValue)
        {
            query = query.Where(m => m.ReleaseYear.HasValue && m.ReleaseYear.Value >= filter.ReleaseYearFrom.Value);
        }

        if (filter.ReleaseYearTo.HasValue)
        {
            query = query.Where(m => m.ReleaseYear.HasValue && m.ReleaseYear.Value <= filter.ReleaseYearTo.Value);
        }

        if (filter.DurationFrom.HasValue)
        {
            query = query.Where(m => m.DurationMinutes.HasValue && m.DurationMinutes.Value >= filter.DurationFrom.Value);
        }

        if (filter.DurationTo.HasValue)
        {
            query = query.Where(m => m.DurationMinutes.HasValue && m.DurationMinutes.Value <= filter.DurationTo.Value);
        }

        return query;
    }

    private static IQueryable<Movie> ApplySorting(IQueryable<Movie> query, MovieFilterQuery? filter)
    {
        var sortBy = filter?.SortBy?.Trim().ToLowerInvariant();
        var isDesc = string.Equals(filter?.SortDirection, "desc", StringComparison.OrdinalIgnoreCase);

        return sortBy switch
        {
            "releaseyear" => isDesc
                ? query.OrderByDescending(m => m.ReleaseYear ?? int.MinValue).ThenBy(m => m.Title)
                : query.OrderBy(m => m.ReleaseYear ?? int.MaxValue).ThenBy(m => m.Title),
            "duration" => isDesc
                ? query.OrderByDescending(m => m.DurationMinutes ?? int.MinValue).ThenBy(m => m.Title)
                : query.OrderBy(m => m.DurationMinutes ?? int.MaxValue).ThenBy(m => m.Title),
            "recent" => isDesc
                ? query.OrderByDescending(m => m.MovieId)
                : query.OrderBy(m => m.MovieId),
            "title" or _ => isDesc
                ? query.OrderByDescending(m => m.Title).ThenByDescending(m => m.MovieId)
                : query.OrderBy(m => m.Title).ThenBy(m => m.MovieId)
        };
    }

    private async Task<string?> ValidateRequestAsync(MovieCreateUpdateDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return "Название фильма обязательно для заполнения.";
        }

        if (request.DurationMinutes.HasValue && request.DurationMinutes.Value <= 0)
        {
            return "Продолжительность должна быть положительным числом.";
        }

        if (request.ReleaseYear.HasValue && request.ReleaseYear.Value < 1888)
        {
            return "Год релиза не может быть меньше 1888.";
        }

        if (!string.IsNullOrWhiteSpace(request.PosterUrl) && request.PosterUrl.Trim().Length > 255)
        {
            return "Ссылка на постер не может превышать 255 символов.";
        }

        if (!string.IsNullOrWhiteSpace(request.Director) && request.Director.Trim().Length > 255)
        {
            return "Имя режиссёра не может превышать 255 символов.";
        }

        var cleanedTrailerUrls = PrepareTrailerUrls(request);
        if (cleanedTrailerUrls.Any(url => url.Length > 255))
        {
            return "Ссылка на трейлер не может превышать 255 символов.";
        }

        var genreIds = (request.GenreIds ?? new List<int>()).Distinct().ToList();
        if (genreIds.Any())
        {
            var existing = await _context.Genres
                .AsNoTracking()
                .Where(g => genreIds.Contains(g.GenreId))
                .Select(g => g.GenreId)
                .ToListAsync();

            var missing = genreIds.Except(existing).ToList();
            if (missing.Any())
            {
                return $"Не найдены жанры с идентификаторами: {string.Join(", ", missing)}.";
            }
        }

        var tagIds = (request.TagIds ?? new List<int>()).Distinct().ToList();
        if (tagIds.Any())
        {
            var existing = await _context.Tags
                .AsNoTracking()
                .Where(t => tagIds.Contains(t.TagId))
                .Select(t => t.TagId)
                .ToListAsync();

            var missing = tagIds.Except(existing).ToList();
            if (missing.Any())
            {
                return $"Не найдены теги с идентификаторами: {string.Join(", ", missing)}.";
            }
        }

        var countryIds = (request.CountryIds ?? new List<int>()).Distinct().ToList();
        if (countryIds.Any())
        {
            var existing = await _context.Countries
                .AsNoTracking()
                .Where(c => countryIds.Contains(c.CountryId))
                .Select(c => c.CountryId)
                .ToListAsync();

            var missing = countryIds.Except(existing).ToList();
            if (missing.Any())
            {
                return $"Не найдены страны с идентификаторами: {string.Join(", ", missing)}.";
            }
        }

        return null;
    }

    private void ApplyRelationshipsForCreate(Movie movie, MovieCreateUpdateDto request)
    {
        var genreIds = (request.GenreIds ?? new List<int>()).Distinct().ToList();
        if (genreIds.Any())
        {
            movie.MovieGenres = genreIds
                .Select(id => new MovieGenre { GenreId = id })
                .ToList();
        }

        var tagIds = (request.TagIds ?? new List<int>()).Distinct().ToList();
        if (tagIds.Any())
        {
            movie.MovieTags = tagIds
                .Select(id => new MovieTag { TagId = id })
                .ToList();
        }

        var countryIds = (request.CountryIds ?? new List<int>()).Distinct().ToList();
        if (countryIds.Any())
        {
            movie.MovieCountries = countryIds
                .Select(id => new MovieCountry { CountryId = id })
                .ToList();
        }

        var trailers = PrepareTrailerUrls(request);
        if (trailers.Any())
        {
            movie.Trailers = trailers
                .Select(url => new Trailer { TrailerUrl = url })
                .ToList();
        }
    }

    private void UpdateRelationships(Movie movie, MovieCreateUpdateDto request)
    {
        movie.MovieGenres = UpdateLookupCollection(
            movie.MovieGenres,
            request.GenreIds,
            id => new MovieGenre { MovieId = movie.MovieId, GenreId = id });

        movie.MovieTags = UpdateLookupCollection(
            movie.MovieTags,
            request.TagIds,
            id => new MovieTag { MovieId = movie.MovieId, TagId = id });

        movie.MovieCountries = UpdateLookupCollection(
            movie.MovieCountries,
            request.CountryIds,
            id => new MovieCountry { MovieId = movie.MovieId, CountryId = id });

        var trailers = PrepareTrailerUrls(request);

        foreach (var trailer in movie.Trailers?.ToList() ?? new List<Trailer>())
        {
            _context.Trailers.Remove(trailer);
            movie.Trailers.Remove(trailer);
        }

        if (trailers.Any())
        {
            foreach (var url in trailers)
            {
                movie.Trailers.Add(new Trailer
                {
                    MovieId = movie.MovieId,
                    TrailerUrl = url
                });
            }
        }
    }

    private ICollection<TLookup> UpdateLookupCollection<TLookup>(
        ICollection<TLookup>? currentItems,
        IEnumerable<int>? incomingIds,
        System.Func<int, TLookup> factory)
        where TLookup : class
    {
        var targetCollection = currentItems ?? new List<TLookup>();

        var desiredIds = (incomingIds ?? Enumerable.Empty<int>())
            .Distinct()
            .ToList();

        foreach (var item in targetCollection.ToList())
        {
            var itemId = ExtractLookupId(item);
            if (!desiredIds.Contains(itemId))
            {
                _context.Remove(item);
                targetCollection.Remove(item);
            }
        }

        var existingIds = targetCollection
            .Select(ExtractLookupId)
            .ToHashSet();

        foreach (var id in desiredIds)
        {
            if (!existingIds.Contains(id))
            {
                targetCollection.Add(factory(id));
            }
        }

        return targetCollection;
    }

    private static int ExtractLookupId<TLookup>(TLookup item)
    {
        return item switch
        {
            MovieGenre mg => mg.GenreId,
            MovieTag mt => mt.TagId,
            MovieCountry mc => mc.CountryId,
            _ => 0
        };
    }

    private static List<string> PrepareTrailerUrls(MovieCreateUpdateDto request)
    {
        return (request.TrailerUrls ?? new List<string>())
            .Where(url => !string.IsNullOrWhiteSpace(url))
            .Select(url => url.Trim())
            .Distinct()
            .ToList();
    }

    private string? ExtractModelStateError()
    {
        if (ModelState.IsValid)
        {
            return null;
        }

        var errors = ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage) ? e.Exception?.Message : e.ErrorMessage)
            .Where(message => !string.IsNullOrWhiteSpace(message))
            .Distinct()
            .ToList();

        if (!errors.Any())
        {
            return "Переданы некорректные данные.";
        }

        return string.Join(" ", errors);
    }
}


