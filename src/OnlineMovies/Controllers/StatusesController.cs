namespace OnlineMovies.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineMovies.Database;
using OnlineMovies.DTO;
using OnlineMovies.Responses;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
public class StatusesController : ControllerBase
{
    private readonly AppDbContext _context;

    public StatusesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<StatusResponseDto>>>> GetStatuses()
    {
        var statuses = await _context.Statuses
            .AsNoTracking()
            .OrderBy(s => s.StatusId)
            .Select(s => new StatusResponseDto
            {
                StatusId = s.StatusId,
                Name = s.Name
            })
            .ToListAsync();

        return Ok(new ApiResponse<IEnumerable<StatusResponseDto>>
        {
            Status = "Успешно",
            Message = "Справочник статусов получен",
            Data = statuses
        });
    }
}


