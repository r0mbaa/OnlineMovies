namespace OnlineMovies.Tests;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineMovies.Controllers;
using OnlineMovies.Database;
using OnlineMovies.DTO;
using OnlineMovies.Models;
using OnlineMovies.Responses;
using System.Security.Claims;
using Xunit;

/// <summary>
/// Unit тесты для UserMoviesController.
/// Тестирует логику оценки фильмов и проверки существования пользователя.
/// </summary>
public class UserMoviesControllerTests
{
    /// <summary>
    /// Создает in-memory базу данных для тестирования.
    /// </summary>
    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    /// <summary>
    /// Создает контроллер с настроенным контекстом и пользователем.
    /// </summary>
    private UserMoviesController CreateController(AppDbContext context, int userId, string username = "testuser", string role = "user")
    {
        var controller = new UserMoviesController(context)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                        new Claim(ClaimTypes.Name, username),
                        new Claim(ClaimTypes.Role, role)
                    }, "test"))
                }
            }
        };

        return controller;
    }

    /// <summary>
    /// Тест: Нельзя оценить фильм, если он не находится в статусе "Просмотрено".
    /// Проверяет, что система корректно отклоняет попытку оценить фильм,
    /// который еще не был просмотрен пользователем.
    /// </summary>
    [Fact]
    public async Task RateMovie_ShouldReject_WhenMovieNotWatched()
    {
        // Arrange - подготовка данных
        using var context = CreateDbContext();

        // Создаем пользователя
        var user = new User
        {
            UserId = 1,
            Username = "testuser",
            Email = "test@example.com",
            HashedPassword = "hashed",
            Role = "user"
        };
        context.Users.Add(user);

        // Создаем фильм
        var movie = new Movie
        {
            MovieId = 1,
            Title = "Test Movie",
            Description = "Test Description",
            ReleaseYear = 2020
        };
        context.Movies.Add(movie);

        // Создаем статусы
        var watchedStatus = new Status { StatusId = 1, Name = "Просмотрено" };
        var ratedStatus = new Status { StatusId = 2, Name = "Оценен" };
        var plannedStatus = new Status { StatusId = 3, Name = "Буду смотреть" };
        context.Statuses.AddRange(watchedStatus, ratedStatus, plannedStatus);

        // Создаем запись о фильме со статусом "Буду смотреть" (не просмотрен)
        var userMovie = new UserMovie
        {
            UserId = 1,
            MovieId = 1,
            StatusId = 3, // "Буду смотреть"
            AddedAt = DateTime.UtcNow
        };
        context.UserMovies.Add(userMovie);

        await context.SaveChangesAsync();

        var controller = CreateController(context, 1);

        var request = new UserMovieRateRequestDto
        {
            MovieId = 1,
            Score = 8,
            Comment = "Great movie"
        };

        // Act - выполнение действия
        var result = await controller.RateMovie(request);

        // Assert - проверка результата
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        var response = Assert.IsType<ApiResponse<UserMovieResponseDto>>(badRequestResult.Value);
        Assert.Equal("Ошибка", response.Status);
        Assert.Contains("Просмотрено", response.Message);
    }

    /// <summary>
    /// Тест: Можно оценить фильм, если он находится в статусе "Просмотрено".
    /// Проверяет успешную оценку фильма после его просмотра.
    /// </summary>
    [Fact]
    public async Task RateMovie_ShouldSucceed_WhenMovieWatched()
    {
        // Arrange - подготовка данных
        using var context = CreateDbContext();

        // Создаем пользователя
        var user = new User
        {
            UserId = 1,
            Username = "testuser",
            Email = "test@example.com",
            HashedPassword = "hashed",
            Role = "user"
        };
        context.Users.Add(user);

        // Создаем фильм
        var movie = new Movie
        {
            MovieId = 1,
            Title = "Test Movie",
            Description = "Test Description",
            ReleaseYear = 2020
        };
        context.Movies.Add(movie);

        // Создаем статусы
        var watchedStatus = new Status { StatusId = 1, Name = "Просмотрено" };
        var ratedStatus = new Status { StatusId = 2, Name = "Оценен" };
        context.Statuses.AddRange(watchedStatus, ratedStatus);

        // Создаем запись о фильме со статусом "Просмотрено"
        var userMovie = new UserMovie
        {
            UserId = 1,
            MovieId = 1,
            StatusId = 1, // "Просмотрено"
            AddedAt = DateTime.UtcNow
        };
        context.UserMovies.Add(userMovie);

        await context.SaveChangesAsync();

        var controller = CreateController(context, 1);

        var request = new UserMovieRateRequestDto
        {
            MovieId = 1,
            Score = 8,
            Comment = "Great movie"
        };

        // Act - выполнение действия
        var result = await controller.RateMovie(request);

        // Assert - проверка результата
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<ApiResponse<UserMovieResponseDto>>(okResult.Value);
        Assert.Equal("Успешно", response.Status);
        Assert.NotNull(response.Data);
        Assert.Equal(8, response.Data.Score);
        Assert.Equal("Оценен", response.Data.StatusName);

        // Проверяем, что статус изменился на "Оценен" в базе данных
        var updatedUserMovie = await context.UserMovies
            .Include(um => um.Status)
            .FirstOrDefaultAsync(um => um.UserId == 1 && um.MovieId == 1);
        Assert.NotNull(updatedUserMovie);
        Assert.Equal(2, updatedUserMovie.StatusId); // "Оценен"
        Assert.Equal(8, updatedUserMovie.Score);
    }

    /// <summary>
    /// Тест: Нельзя оценить фильм, если запись о фильме отсутствует.
    /// Проверяет, что система корректно отклоняет попытку оценить фильм,
    /// который вообще не добавлен в список пользователя.
    /// </summary>
    [Fact]
    public async Task RateMovie_ShouldReject_WhenMovieNotInList()
    {
        // Arrange - подготовка данных
        using var context = CreateDbContext();

        // Создаем пользователя
        var user = new User
        {
            UserId = 1,
            Username = "testuser",
            Email = "test@example.com",
            HashedPassword = "hashed",
            Role = "user"
        };
        context.Users.Add(user);

        // Создаем фильм
        var movie = new Movie
        {
            MovieId = 1,
            Title = "Test Movie",
            Description = "Test Description",
            ReleaseYear = 2020
        };
        context.Movies.Add(movie);

        // Создаем статусы
        var watchedStatus = new Status { StatusId = 1, Name = "Просмотрено" };
        var ratedStatus = new Status { StatusId = 2, Name = "Оценен" };
        context.Statuses.AddRange(watchedStatus, ratedStatus);

        await context.SaveChangesAsync();

        var controller = CreateController(context, 1);

        var request = new UserMovieRateRequestDto
        {
            MovieId = 1,
            Score = 8,
            Comment = "Great movie"
        };

        // Act - выполнение действия
        var result = await controller.RateMovie(request);

        // Assert - проверка результата
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        var response = Assert.IsType<ApiResponse<UserMovieResponseDto>>(badRequestResult.Value);
        Assert.Equal("Ошибка", response.Status);
        Assert.Contains("Просмотрено", response.Message);
    }

    /// <summary>
    /// Тест: Проверка существования пользователя при работе с токеном.
    /// Проверяет, что система корректно обрабатывает случай, когда пользователь
    /// был удален администратором, но его токен еще валиден.
    /// </summary>
    [Fact]
    public async Task GetUserMovies_ShouldReject_WhenUserDeleted()
    {
        // Arrange - подготовка данных
        using var context = CreateDbContext();

        // Пользователь НЕ создается в базе данных (симулируем удаление)
        // Но токен все еще содержит его ID

        var controller = CreateController(context, 1); // userId = 1, но пользователя нет в БД

        // Act - выполнение действия
        var result = await controller.GetUserMovies();

        // Assert - проверка результата
        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result.Result);
        var response = Assert.IsType<ApiResponse<IEnumerable<UserMovieResponseDto>>>(unauthorizedResult.Value);
        Assert.Equal("Ошибка", response.Status);
        Assert.Contains("не найден", response.Message);
    }

    /// <summary>
    /// Тест: Проверка существования пользователя при оценке фильма.
    /// Проверяет, что система корректно обрабатывает случай удаленного пользователя
    /// при попытке оценить фильм.
    /// </summary>
    [Fact]
    public async Task RateMovie_ShouldReject_WhenUserDeleted()
    {
        // Arrange - подготовка данных
        using var context = CreateDbContext();

        // Пользователь НЕ создается в базе данных (симулируем удаление)
        // Но токен все еще содержит его ID

        // Создаем фильм и статусы для полноты теста
        var movie = new Movie
        {
            MovieId = 1,
            Title = "Test Movie",
            Description = "Test Description",
            ReleaseYear = 2020
        };
        context.Movies.Add(movie);

        var watchedStatus = new Status { StatusId = 1, Name = "Просмотрено" };
        var ratedStatus = new Status { StatusId = 2, Name = "Оценен" };
        context.Statuses.AddRange(watchedStatus, ratedStatus);

        await context.SaveChangesAsync();

        var controller = CreateController(context, 1); // userId = 1, но пользователя нет в БД

        var request = new UserMovieRateRequestDto
        {
            MovieId = 1,
            Score = 8,
            Comment = "Great movie"
        };

        // Act - выполнение действия
        var result = await controller.RateMovie(request);

        // Assert - проверка результата
        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result.Result);
        var response = Assert.IsType<ApiResponse<UserMovieResponseDto>>(unauthorizedResult.Value);
        Assert.Equal("Ошибка", response.Status);
        Assert.Contains("не найден", response.Message);
    }
}

