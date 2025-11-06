
using Microsoft.EntityFrameworkCore;
using OnlineMovies.Database;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

builder.Services.AddControllers();

var app = builder.Build();

// Создаём БД и добавляем тестовые данные
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.EnsureCreated();

    if (!context.Items.Any())
    {
        context.Items.AddRange(
            new OnlineMovies.Models.Item { Name = "MySQL предмет 1" },
            new OnlineMovies.Models.Item { Name = "MySQL предмет 2" }
        );
        context.SaveChanges();
    }
}

app.MapControllers();
app.Run();