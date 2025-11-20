namespace OnlineMovies.Models;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("user_movies")]
public class UserMovie
{
    [Key]
    [Column("user_movie_id")]
    public int UserMovieId { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    public User? User { get; set; }

    [Column("movie_id")]
    public int MovieId { get; set; }

    public Movie? Movie { get; set; }

    [Column("status_id")]
    public int? StatusId { get; set; }

    public Status? Status { get; set; }

    [Column("score")]
    public int? Score { get; set; }

    [Column("comment")]
    public string? Comment { get; set; }

    [Column("added_at")]
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}


