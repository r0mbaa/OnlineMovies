namespace OnlineMovies.Models;

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("statuses")]
public class Status
{
    [Key]
    [Column("status_id")]
    public int StatusId { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    public ICollection<UserMovie> UserMovies { get; set; } = new List<UserMovie>();
}


