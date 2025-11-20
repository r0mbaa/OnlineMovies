namespace OnlineMovies.Models;

using System.ComponentModel.DataAnnotations.Schema;

[Table("movie_genres")]
public class MovieGenre
{
    [Column("movie_id")]
    public int MovieId { get; set; }

    public Movie? Movie { get; set; }

    [Column("genre_id")]
    public int GenreId { get; set; }

    public Genre? Genre { get; set; }
}


