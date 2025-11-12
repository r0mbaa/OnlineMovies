namespace OnlineMovies.DTO
{
    using System.ComponentModel.DataAnnotations;

    public class UserLoginDto
        {
            [Required(ErrorMessage = "Имя пользователя обязательно для входа.")]
            public string Username { get; set; } = string.Empty;

            [Required(ErrorMessage = "Пароль не может быть пустым.")]
            public string Password { get; set; } = string.Empty;
        }
    
}
