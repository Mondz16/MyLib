using System;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MyLib.Api.Models;

namespace MyLib.Api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions options) : base (options) {}

    public DbSet<Favorite> Favorites {get;set;}

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Favorite>()
            .HasIndex(f => new {f.UserId, f.OpenLibraryKey})
            .IsUnique();
    }
}
