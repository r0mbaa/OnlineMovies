namespace OnlineMovies.Models;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("trailers")]
public class Trailer
{
    [Key]
    [Column("trailer_id")]
    public int TrailerId { get; set; }

    [Column("movie_id")]
    public int MovieId { get; set; }

    [Required]
    [MaxLength(255)]
    [Column("trailer_url")]
    public string TrailerUrl { get; set; } = string.Empty;

    public Movie? Movie { get; set; }
}


