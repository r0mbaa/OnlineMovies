namespace OnlineMovies.DTO;

public class MovieRecommendationDto
{
    public MovieResponseDto Movie { get; set; } = new();

    public float Score { get; set; }
}




