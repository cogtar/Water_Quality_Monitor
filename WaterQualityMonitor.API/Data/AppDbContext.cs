using Microsoft.EntityFrameworkCore;
using WaterQualityMonitor.API.Models;

namespace WaterQualityMonitor.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Line> Lines => Set<Line>();
    public DbSet<WaterSensor> WaterSensors => Set<WaterSensor>();
    public DbSet<QualityReading> QualityReadings => Set<QualityReading>();
    public DbSet<Threshold> Thresholds => Set<Threshold>();
    public DbSet<Incident> Incidents => Set<Incident>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Line>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(100);
            e.Property(x => x.Location).IsRequired().HasMaxLength(200);
        });

        modelBuilder.Entity<WaterSensor>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Type).IsRequired().HasMaxLength(50);
            e.HasOne(x => x.Line)
             .WithMany(l => l.WaterSensors)
             .HasForeignKey(x => x.LineId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QualityReading>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.pH).HasPrecision(10, 4);
            e.Property(x => x.Turbidity).HasPrecision(10, 4);
            e.Property(x => x.Conductivity).HasPrecision(10, 4);
            e.HasOne(x => x.Line)
             .WithMany(l => l.QualityReadings)
             .HasForeignKey(x => x.LineId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Threshold>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.ParameterName).IsRequired().HasMaxLength(50);
            e.Property(x => x.MinValue).HasPrecision(10, 4);
            e.Property(x => x.MaxValue).HasPrecision(10, 4);
            e.HasOne(x => x.Line)
             .WithMany(l => l.Thresholds)
             .HasForeignKey(x => x.LineId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Incident>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Parameter).IsRequired().HasMaxLength(50);
            e.Property(x => x.Value).HasPrecision(10, 4);
            e.HasOne(x => x.Line)
             .WithMany(l => l.Incidents)
             .HasForeignKey(x => x.LineId)
             .OnDelete(DeleteBehavior.Cascade);
        });

    }
}
