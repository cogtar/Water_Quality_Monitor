using Microsoft.EntityFrameworkCore;
using WaterQualityMonitor.API.Data;
using WaterQualityMonitor.API.Models;
using WaterQualityMonitor.API.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<QualityService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors();
app.UseAuthorization();
app.MapControllers();

// Create tables and seed data on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // Creates all tables from the model if they don't exist
    db.Database.EnsureCreated();

    // Create Users table manually if it doesn't exist yet
    db.Database.ExecuteSqlRaw(@"
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
        CREATE TABLE Users (
            Id          INT IDENTITY(1,1) PRIMARY KEY,
            Name        NVARCHAR(200) NOT NULL,
            Email       NVARCHAR(200) NOT NULL,
            PasswordHash NVARCHAR(500) NOT NULL,
            CreatedAt   DATETIME2 NOT NULL DEFAULT GETUTCDATE()
        )
    ");

    // Seed Lines
    if (!db.Lines.Any())
    {
        db.Lines.AddRange(
            new Line { Name = "Line A", Location = "Plant North Wing" },
            new Line { Name = "Line B", Location = "Plant South Wing" },
            new Line { Name = "Line C", Location = "Treatment Block 1" },
            new Line { Name = "Line D", Location = "Treatment Block 2" },
            new Line { Name = "Line E", Location = "Distribution Hub" }
        );
        db.SaveChanges();
    }

    // Seed Thresholds for all lines
    if (!db.Thresholds.Any())
    {
        var lines = db.Lines.ToList();
        foreach (var line in lines)
        {
            db.Thresholds.AddRange(
                new Threshold { LineId = line.Id, ParameterName = "pH",           MinValue = 6.5,   MaxValue = 8.5   },
                new Threshold { LineId = line.Id, ParameterName = "Turbidity",    MinValue = 0.0,   MaxValue = 4.0   },
                new Threshold { LineId = line.Id, ParameterName = "Conductivity", MinValue = 100.0, MaxValue = 800.0 }
            );
        }
        db.SaveChanges();
    }
}

app.Run();
