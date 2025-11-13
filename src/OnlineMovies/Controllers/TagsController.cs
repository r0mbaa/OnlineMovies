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
public class TagsController : ControllerBase
{
    private readonly AppDbContext _context;

    public TagsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/tags
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<Tag>>>> GetTags()
    {
        var tags = await _context.Tags.ToListAsync();
        return Ok(new ApiResponse<IEnumerable<Tag>>
        {
            Status = "Успешно",
            Message = "Список тегов получен",
            Data = tags
        });
    }

    // GET: api/tags/5
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<Tag>>> GetTag(int id)
    {
        var tag = await _context.Tags.FindAsync(id);

        if (tag == null)
        {
            return NotFound(new ApiResponse
            {
                Status = "Ошибка",
                Message = "Тег не найден"
            });
        }

        return Ok(new ApiResponse<Tag>
        {
            Status = "Успешно",
            Message = "Тег найден",
            Data = tag
        });
    }

    // POST: api/tags
    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse<Tag>>> PostTag(Tag tag)
    {
        if (await _context.Tags.AnyAsync(t => t.Name == tag.Name))
        {
            return BadRequest(new ApiResponse { Status = "Ошибка", Message = "Тег с таким названием уже существует." });
        }

        _context.Tags.Add(tag);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTag), new { id = tag.TagId }, new ApiResponse<Tag>
        {
            Status = "Успешно",
            Message = "Тег успешно создан",
            Data = tag
        });
    }

    // PUT: api/tags/5
    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> PutTag(int id, Tag tag)
    {
        if (id != tag.TagId)
        {
            return BadRequest(new ApiResponse { Status = "Ошибка", Message = "ID тега не совпадает." });
        }

        if (await _context.Tags.AnyAsync(t => t.Name == tag.Name && t.TagId != id))
        {
            return BadRequest(new ApiResponse { Status = "Ошибка", Message = "Тег с таким названием уже существует." });
        }

        _context.Entry(tag).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Tags.Any(e => e.TagId == id))
            {
                return NotFound(new ApiResponse { Status = "Ошибка", Message = "Тег не найден." });
            }
            else
            {
                throw;
            }
        }

        return Ok(new ApiResponse<Tag>
        {
            Status = "Успешно",
            Message = "Тег успешно обновлен",
            Data = tag
        });
    }

    // DELETE: api/tags/5
    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteTag(int id)
    {
        var tag = await _context.Tags.FindAsync(id);
        if (tag == null)
        {
            return NotFound(new ApiResponse { Status = "Ошибка", Message = "Тег не найден." });
        }

        _context.Tags.Remove(tag);
        await _context.SaveChangesAsync();

        return Ok(new ApiResponse
        {
            Status = "Успешно",
            Message = "Тег успешно удален"
        });
    }
} 
