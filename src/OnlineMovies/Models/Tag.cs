namespace OnlineMovies.Models;

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("tags")]
public class Tag
{
    [Key]
    [Column("tag_id")]
    public int TagId { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    public ICollection<MovieTag> MovieTags { get; set; } = new List<MovieTag>();
}


