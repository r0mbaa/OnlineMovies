namespace OnlineMovies.Models;

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("countries")]
public class Country
{
    [Key]
    [Column("country_id")]
    public int CountryId { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    public ICollection<MovieCountry> MovieCountries { get; set; } = new List<MovieCountry>();
}

