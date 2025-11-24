namespace OnlineMovies.Mappers;

using OnlineMovies.DTO;
using OnlineMovies.Models;
using System.Collections.Generic;
using System.Linq;

public static class MovieMapper
{
    public static MovieResponseDto Map(Movie movie)
    {
        return new MovieResponseDto
        {
            MovieId = movie.MovieId,
            Title = movie.Title,
            Description = movie.Description,
            ReleaseYear = movie.ReleaseYear,
            Director = movie.Director,
            PosterUrl = movie.PosterUrl,
            DurationMinutes = movie.DurationMinutes,
            Genres = movie.MovieGenres?
                .Where(mg => mg.Genre != null)
                .Select(mg => new LookupDto
                {
                    Id = mg.GenreId,
                    Name = mg.Genre!.Name
                })
                .OrderBy(g => g.Name)
                .ToList() ?? new List<LookupDto>(),
            Tags = movie.MovieTags?
                .Where(mt => mt.Tag != null)
                .Select(mt => new LookupDto
                {
                    Id = mt.TagId,
                    Name = mt.Tag!.Name
                })
                .OrderBy(t => t.Name)
                .ToList() ?? new List<LookupDto>(),
            Countries = movie.MovieCountries?
                .Where(mc => mc.Country != null)
                .Select(mc => new LookupDto
                {
                    Id = mc.CountryId,
                    Name = mc.Country!.Name
                })
                .OrderBy(c => c.Name)
                .ToList() ?? new List<LookupDto>(),
            Trailers = movie.Trailers?
                .Select(trailer => new TrailerDto
                {
                    Id = trailer.TrailerId,
                    Url = trailer.TrailerUrl
                })
                .ToList() ?? new List<TrailerDto>()
        };
    }
}



