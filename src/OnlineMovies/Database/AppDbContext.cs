namespace OnlineMovies.Database;
using Microsoft.EntityFrameworkCore;
using OnlineMovies.Models;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<Status> Statuses => Set<Status>();
    public DbSet<Genre> Genres => Set<Genre>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<Country> Countries => Set<Country>();
    public DbSet<Movie> Movies => Set<Movie>();
    public DbSet<Trailer> Trailers => Set<Trailer>();
    public DbSet<MovieGenre> MovieGenres => Set<MovieGenre>();
    public DbSet<MovieTag> MovieTags => Set<MovieTag>();
    public DbSet<MovieCountry> MovieCountries => Set<MovieCountry>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserGenreInterest> UserGenreInterests => Set<UserGenreInterest>();
    public DbSet<UserMovie> UserMovies => Set<UserMovie>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<MovieGenre>()
            .HasKey(mg => new { mg.MovieId, mg.GenreId });

        modelBuilder.Entity<MovieGenre>()
            .HasOne(mg => mg.Movie)
            .WithMany(m => m.MovieGenres)
            .HasForeignKey(mg => mg.MovieId);

        modelBuilder.Entity<MovieGenre>()
            .HasOne(mg => mg.Genre)
            .WithMany(g => g.MovieGenres)
            .HasForeignKey(mg => mg.GenreId);

        modelBuilder.Entity<MovieTag>()
            .HasKey(mt => new { mt.MovieId, mt.TagId });

        modelBuilder.Entity<MovieTag>()
            .HasOne(mt => mt.Movie)
            .WithMany(m => m.MovieTags)
            .HasForeignKey(mt => mt.MovieId);

        modelBuilder.Entity<MovieTag>()
            .HasOne(mt => mt.Tag)
            .WithMany(t => t.MovieTags)
            .HasForeignKey(mt => mt.TagId);

        modelBuilder.Entity<MovieCountry>()
            .HasKey(mc => new { mc.MovieId, mc.CountryId });

        modelBuilder.Entity<MovieCountry>()
            .HasOne(mc => mc.Movie)
            .WithMany(m => m.MovieCountries)
            .HasForeignKey(mc => mc.MovieId);

        modelBuilder.Entity<MovieCountry>()
            .HasOne(mc => mc.Country)
            .WithMany(c => c.MovieCountries)
            .HasForeignKey(mc => mc.CountryId);

        modelBuilder.Entity<UserGenreInterest>()
            .HasKey(ugi => new { ugi.UserId, ugi.GenreId });

        modelBuilder.Entity<UserGenreInterest>()
            .HasOne(ugi => ugi.User)
            .WithMany(u => u.GenreInterests)
            .HasForeignKey(ugi => ugi.UserId);

        modelBuilder.Entity<UserGenreInterest>()
            .HasOne(ugi => ugi.Genre)
            .WithMany(g => g.UserGenreInterests)
            .HasForeignKey(ugi => ugi.GenreId);

        modelBuilder.Entity<UserMovie>()
            .HasOne(um => um.User)
            .WithMany(u => u.UserMovies)
            .HasForeignKey(um => um.UserId);

        modelBuilder.Entity<UserMovie>()
            .HasOne(um => um.Movie)
            .WithMany(m => m.UserMovies)
            .HasForeignKey(um => um.MovieId);

        modelBuilder.Entity<UserMovie>()
            .HasOne(um => um.Status)
            .WithMany(s => s.UserMovies)
            .HasForeignKey(um => um.StatusId);

        modelBuilder.Entity<Status>()
            .HasIndex(s => s.Name)
            .IsUnique();

        modelBuilder.Entity<Genre>()
            .HasIndex(g => g.Name)
            .IsUnique();

        modelBuilder.Entity<Tag>()
            .HasIndex(t => t.Name)
            .IsUnique();

        modelBuilder.Entity<Country>()
            .HasIndex(c => c.Name)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<UserMovie>()
            .HasIndex(um => new { um.UserId, um.MovieId })
            .IsUnique();
    }
}

