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
public class CountriesController : ControllerBase
{
    private readonly AppDbContext _context;

    public CountriesController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/countries
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<Country>>>> GetCountries()
    {
        var countries = await _context.Countries.ToListAsync();
        return Ok(new ApiResponse<IEnumerable<Country>>
        {
            Status = "Успешно",
            Message = "Список стран получен",
            Data = countries
        });
    }

    // GET: api/countries/5
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<Country>>> GetCountry(int id)
    {
        var country = await _context.Countries.FindAsync(id);

        if (country == null)
        {
            return NotFound(new ApiResponse
            {
                Status = "Ошибка",
                Message = "Страна не найдена"
            });
        }

        return Ok(new ApiResponse<Country>
        {
            Status = "Успешно",
            Message = "Страна найдена",
            Data = country
        });
    }

    // POST: api/countries
    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse<Country>>> PostCountry(Country country)
    {
        if (await _context.Countries.AnyAsync(c => c.Name == country.Name))
        {
            return BadRequest(new ApiResponse { Status = "Ошибка", Message = "Страна с таким названием уже существует." });
        }

        _context.Countries.Add(country);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCountry), new { id = country.CountryId }, new ApiResponse<Country>
        {
            Status = "Успешно",
            Message = "Страна успешно создана",
            Data = country
        });
    }

    // PUT: api/countries/5
    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> PutCountry(int id, Country country)
    {
        if (id != country.CountryId)
        {
            return BadRequest(new ApiResponse { Status = "Ошибка", Message = "ID страны не совпадает." });
        }

        if (await _context.Countries.AnyAsync(c => c.Name == country.Name && c.CountryId != id))
        {
            return BadRequest(new ApiResponse { Status = "Ошибка", Message = "Страна с таким названием уже существует." });
        }

        _context.Entry(country).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Countries.Any(e => e.CountryId == id))
            {
                return NotFound(new ApiResponse { Status = "Ошибка", Message = "Страна не найдена." });
            }
            else
            {
                throw;
            }
        }

        return Ok(new ApiResponse<Country>
        {
            Status = "Успешно",
            Message = "Страна успешно обновлена",
            Data = country
        });
    }

    // DELETE: api/countries/5
    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteCountry(int id)
    {
        var country = await _context.Countries.FindAsync(id);
        if (country == null)
        {
            return NotFound(new ApiResponse { Status = "Ошибка", Message = "Страна не найдена." });
        }

        _context.Countries.Remove(country);
        await _context.SaveChangesAsync();

        return Ok(new ApiResponse
        {
            Status = "Успешно",
            Message = "Страна успешно удалена"
        });
    }
}
