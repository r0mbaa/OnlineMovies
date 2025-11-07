namespace OnlineMovies.Models;

using System.ComponentModel.DataAnnotations.Schema;

[Table("movie_tags")]
public class MovieTag
{
    [Column("movie_id")]
    public int MovieId { get; set; }

    public Movie? Movie { get; set; }

    [Column("tag_id")]
    public int TagId { get; set; }

    public Tag? Tag { get; set; }
}

