namespace OnlineMovies.Models;

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("movies")]
public class Movie
{
    [Key]
    [Column("movie_id")]
    public int MovieId { get; set; }

    [Required]
    [MaxLength(255)]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("release_year")]
    public int? ReleaseYear { get; set; }

    [MaxLength(255)]
    [Column("director")]
    public string? Director { get; set; }

    [MaxLength(255)]
    [Column("poster_url")]
    public string? PosterUrl { get; set; }

    [Column("duration_minutes")]
    public int? DurationMinutes { get; set; }

    public ICollection<Trailer> Trailers { get; set; } = new List<Trailer>();
    public ICollection<MovieGenre> MovieGenres { get; set; } = new List<MovieGenre>();
    public ICollection<MovieTag> MovieTags { get; set; } = new List<MovieTag>();
    public ICollection<MovieCountry> MovieCountries { get; set; } = new List<MovieCountry>();
    public ICollection<UserMovie> UserMovies { get; set; } = new List<UserMovie>();
}

