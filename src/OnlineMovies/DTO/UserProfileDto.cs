namespace OnlineMovies.DTO;

using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

public class UserProfileResponseDto
{
    public int UserId { get; set; }

    public string Username { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string? AvatarUrl { get; set; }

    public string? ProfileDescription { get; set; }
}

public class UserProfileDescriptionDto
{
    [MaxLength(2000)]
    public string? ProfileDescription { get; set; }
}

public class UserAvatarUploadDto
{
    [Required]
    public IFormFile? Avatar { get; set; }
}


