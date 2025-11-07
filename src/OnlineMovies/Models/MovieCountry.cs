namespace OnlineMovies.Models;

using System.ComponentModel.DataAnnotations.Schema;

[Table("movie_countries")]
public class MovieCountry
{
    [Column("movie_id")]
    public int MovieId { get; set; }

    public Movie? Movie { get; set; }

    [Column("country_id")]
    public int CountryId { get; set; }

    public Country? Country { get; set; }
}

