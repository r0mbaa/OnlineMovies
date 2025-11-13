namespace OnlineMovies.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineMovies.Database;
using OnlineMovies.Models;
using OnlineMovies.Responses;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]

public class GenresController : ControllerBase
{
    private readonly AppDbContext _context;

    public GenresController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/genres
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<Genre>>>> GetGenres()
    {
        var genres = await _context.Genres.ToListAsync();
        return Ok(new ApiResponse<IEnumerable<Genre>>
        {
            Status = "Успешно",
            Message = "Список жанров получен",
            Data = genres
        });
    }

    // GET: api/genres/5
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<Genre>>> GetGenre(int id)
    {
        var genre = await _context.Genres.FindAsync(id);

        if (genre == null)
        {
            return NotFound(new ApiResponse
            {
                Status = "Ошибка",
                Message = "Жанр не найден"
            });
        }

        return Ok(new ApiResponse<Genre>
        {
            Status = "Успешно",
            Message = "Жанр найден",
            Data = genre
        });
    }

    // POST: api/genres
    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse<Genre>>> PostGenre(Genre genre)
    {
        if (await _context.Genres.AnyAsync(g => g.Name == genre.Name))
        {
            return BadRequest(new ApiResponse { Status = "Ошибка", Message = "Жанр с таким названием уже существует." });
        }

        _context.Genres.Add(genre);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetGenre), new { id = genre.GenreId }, new ApiResponse<Genre>
        {
            Status = "Успешно",
            Message = "Жанр успешно создан",
            Data = genre
        });
    }

    // PUT: api/genres/5
    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> PutGenre(int id, Genre genre)
    {
        if (id != genre.GenreId)
        {
            return BadRequest(new ApiResponse { Status = "Ошибка", Message = "ID жанра не совпадает." });
        }

        if (await _context.Genres.AnyAsync(g => g.Name == genre.Name && g.GenreId != id))
        {
            return BadRequest(new ApiResponse { Status = "Ошибка", Message = "Жанр с таким названием уже существует." });
        }

        _context.Entry(genre).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Genres.Any(e => e.GenreId == id))
            {
                return NotFound(new ApiResponse { Status = "Ошибка", Message = "Жанр не найден." });
            }
            else
            {
                throw;
            }
        }

        return Ok(new ApiResponse<Genre>
        {
            Status = "Успешно",
            Message = "Жанр успешно обновлен",
            Data = genre
        });
    }

    // DELETE: api/genres/5
    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteGenre(int id)
    {
        var genre = await _context.Genres.FindAsync(id);
        if (genre == null)
        {
            return NotFound(new ApiResponse { Status = "Ошибка", Message = "Жанр не найден." });
        }

        _context.Genres.Remove(genre);
        await _context.SaveChangesAsync();

        return Ok(new ApiResponse
        {
            Status = "Успешно",
            Message = "Жанр успешно удален"
        });
    }
}
