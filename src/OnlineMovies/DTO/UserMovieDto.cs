namespace OnlineMovies.DTO;

using System.ComponentModel.DataAnnotations;

public class UserMovieRequestDto
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Идентификатор фильма должен быть положительным.")]
    public int MovieId { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Идентификатор статуса должен быть положительным.")]
    public int StatusId { get; set; }

    [MaxLength(2000)]
    public string? Comment { get; set; }
}

public class UserMovieRateRequestDto
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Идентификатор фильма должен быть положительным.")]
    public int MovieId { get; set; }

    [Range(1, 10, ErrorMessage = "Оценка должна быть в диапазоне от 1 до 10.")]
    public int Score { get; set; }

    [MaxLength(2000)]
    public string? Comment { get; set; }
}

public class UserMovieResponseDto
{
    public int MovieId { get; set; }

    public string MovieTitle { get; set; } = string.Empty;

    public int? StatusId { get; set; }

    public string? StatusName { get; set; }

    public int? Score { get; set; }

    public string? Comment { get; set; }

    public MovieResponseDto? Movie { get; set; }
}


