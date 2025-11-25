namespace OnlineMovies.DTO;

using System.Collections.Generic;

public class MovieFilterQuery
{
    public string? Title { get; set; }

    public List<int> GenreIds { get; set; } = new();

    public List<int> TagIds { get; set; } = new();

    public List<int> CountryIds { get; set; } = new();

    public int? ReleaseYearFrom { get; set; }

    public int? ReleaseYearTo { get; set; }

    public int? DurationFrom { get; set; }

    public int? DurationTo { get; set; }

    public string? SortBy { get; set; }

    public string? SortDirection { get; set; }
}


