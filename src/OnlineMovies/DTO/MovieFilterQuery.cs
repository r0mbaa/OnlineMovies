namespace OnlineMovies.DTO;

using System.Collections.Generic;

public class MovieFilterQuery
{
    public string? Title { get; set; }

    public List<int> GenreIds { get; set; } = new();

    public List<int> TagIds { get; set; } = new();

    public List<int> CountryIds { get; set; } = new();
}


