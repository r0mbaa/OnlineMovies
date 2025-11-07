namespace OnlineMovies.Models;

using System.ComponentModel.DataAnnotations.Schema;

[Table("user_genre_interests")]
public class UserGenreInterest
{
    [Column("user_id")]
    public int UserId { get; set; }

    public User? User { get; set; }

    [Column("genre_id")]
    public int GenreId { get; set; }

    public Genre? Genre { get; set; }

    [Column("weight")]
    public float Weight { get; set; } = 1.0f;
}

