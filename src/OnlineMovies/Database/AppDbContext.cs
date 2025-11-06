namespace OnlineMovies.Database;
using Microsoft.EntityFrameworkCore;
using OnlineMovies.Models;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Item> Items => Set<Item>();
}

