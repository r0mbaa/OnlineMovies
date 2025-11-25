namespace OnlineMovies.DTO;

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

public class GenreInterestUpdateItemDto
{
    [Required]
    public int GenreId { get; set; }

    [Range(0.01, 1.0)]
    public float Weight { get; set; } = 1.0f;
}

public class UserGenreInterestsUpdateDto
{
    [Required]
    public List<GenreInterestUpdateItemDto> Interests { get; set; } = new();
}

public class UserGenreInterestResponseDto
{
    public int GenreId { get; set; }

    public string GenreName { get; set; } = string.Empty;

    public float Weight { get; set; }
}




