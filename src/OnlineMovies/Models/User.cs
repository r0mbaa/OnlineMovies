namespace OnlineMovies.Models;

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("users")]
public class User
{
    [Key]
    [Column("user_id")]
    public int UserId { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("username")]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    [Column("hashed_password")]
    public string HashedPassword { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    [Column("role")]
    public string Role { get; set; } = "user";

    [MaxLength(255)]
    [Column("avatar_url")]
    public string? AvatarUrl { get; set; }

    [Column("profile_description")]
    public string? ProfileDescription { get; set; }

    public ICollection<UserGenreInterest> GenreInterests { get; set; } = new List<UserGenreInterest>();
    public ICollection<UserMovie> UserMovies { get; set; } = new List<UserMovie>();
}


