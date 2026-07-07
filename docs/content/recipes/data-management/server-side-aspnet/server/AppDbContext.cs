using Microsoft.EntityFrameworkCore;
using OrdersApi.Models;

namespace OrdersApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Order> Orders => Set<Order>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // SQLite has no native decimal type. Without this conversion, Total is
        // stored as TEXT, and ORDER BY and range filters (gt/gte/lt/lte) on it
        // sort lexicographically instead of numerically.
        modelBuilder.Entity<Order>()
            .Property(o => o.Total)
            .HasConversion<double>();
    }
}
