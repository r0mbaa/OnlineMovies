namespace OnlineMovies.DTO;

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

public class MovieCreateUpdateDto
{
    [Required]
    [MaxLength(255)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int? ReleaseYear { get; set; }

    [MaxLength(255)]
    public string? Director { get; set; }

    [MaxLength(255)]
    public string? PosterUrl { get; set; }

    public int? DurationMinutes { get; set; }

    public List<int> GenreIds { get; set; } = new();

    public List<int> TagIds { get; set; } = new();

    public List<int> CountryIds { get; set; } = new();

    public List<string> TrailerUrls { get; set; } = new();
}

public class LookupDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;
}

public class TrailerDto
{
    public int Id { get; set; }

    public string Url { get; set; } = string.Empty;
}

public class MovieResponseDto
{
    public int MovieId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int? ReleaseYear { get; set; }

    public string? Director { get; set; }

    public string? PosterUrl { get; set; }

    public int? DurationMinutes { get; set; }

    public IReadOnlyCollection<LookupDto> Genres { get; set; } = new List<LookupDto>();

    public IReadOnlyCollection<LookupDto> Tags { get; set; } = new List<LookupDto>();

    public IReadOnlyCollection<LookupDto> Countries { get; set; } = new List<LookupDto>();

    public IReadOnlyCollection<TrailerDto> Trailers { get; set; } = new List<TrailerDto>();
}


