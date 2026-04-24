using Microsoft.EntityFrameworkCore;
using WaterQualityMonitor.API.Data;
using WaterQualityMonitor.API.DTOs;
using WaterQualityMonitor.API.Models;

namespace WaterQualityMonitor.API.Services;

public class QualityService
{
    private readonly AppDbContext _db;

    public QualityService(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Persists a quality reading and auto-creates incidents for any parameter outside thresholds.
    /// Returns the list of incident messages generated (ABT format).
    /// </summary>
    public async Task<(QualityReading Reading, List<string> AbtMessages)> CheckAsync(ReadingCreateDto dto)
    {
        var reading = new QualityReading
        {
            LineId = dto.LineId,
            pH = dto.pH,
            Turbidity = dto.Turbidity,
            Conductivity = dto.Conductivity,
            Timestamp = DateTime.UtcNow
        };

        _db.QualityReadings.Add(reading);

        var thresholds = await _db.Thresholds
            .Where(t => t.LineId == dto.LineId)
            .ToListAsync();

        var abtMessages = new List<string>();

        var checks = new[]
        {
            ("pH", dto.pH),
            ("Turbidity", dto.Turbidity),
            ("Conductivity", dto.Conductivity)
        };

        foreach (var (param, value) in checks)
        {
            var threshold = thresholds.FirstOrDefault(t =>
                string.Equals(t.ParameterName, param, StringComparison.OrdinalIgnoreCase));

            if (threshold is null) continue;

            bool outOfRange = value < threshold.MinValue || value > threshold.MaxValue;

            if (outOfRange)
            {
                var incident = new Incident
                {
                    LineId = dto.LineId,
                    Parameter = param,
                    Value = value,
                    Timestamp = reading.Timestamp,
                    ResolvedStatus = false
                };
                _db.Incidents.Add(incident);

                string direction = value < threshold.MinValue ? "below minimum" : "above maximum";
                double limit = value < threshold.MinValue ? threshold.MinValue : threshold.MaxValue;

                string abt = $"Reading {param} is {value:F2} and limit is {limit:F2}, " +
                             $"but the value is {direction} by {Math.Abs(value - limit):F2} units, " +
                             $"therefore an incident was automatically created.";
                abtMessages.Add(abt);
            }
        }

        await _db.SaveChangesAsync();
        return (reading, abtMessages);
    }

    /// <summary>
    /// Returns sensor drift by comparing the latest reading against the 24-hour rolling average.
    /// </summary>
    public async Task<List<SensorDriftDto>> GetSensorDriftAsync()
    {
        var cutoff = DateTime.UtcNow.AddHours(-24);

        var lines = await _db.Lines.ToListAsync();
        var result = new List<SensorDriftDto>();

        foreach (var line in lines)
        {
            var latest = await _db.QualityReadings
                .Where(r => r.LineId == line.Id)
                .OrderByDescending(r => r.Timestamp)
                .FirstOrDefaultAsync();

            if (latest is null) continue;

            var avg = await _db.QualityReadings
                .Where(r => r.LineId == line.Id && r.Timestamp >= cutoff)
                .GroupBy(r => r.LineId)
                .Select(g => new
                {
                    AvgPH = g.Average(r => r.pH),
                    AvgTurbidity = g.Average(r => r.Turbidity),
                    AvgConductivity = g.Average(r => r.Conductivity)
                })
                .FirstOrDefaultAsync();

            if (avg is null) continue;

            result.Add(new SensorDriftDto(
                LineId: line.Id,
                LineName: line.Name,
                CurrentPH: latest.pH,
                AvgPH24h: avg.AvgPH,
                PHDrift: latest.pH - avg.AvgPH,
                CurrentTurbidity: latest.Turbidity,
                AvgTurbidity24h: avg.AvgTurbidity,
                TurbidityDrift: latest.Turbidity - avg.AvgTurbidity,
                CurrentConductivity: latest.Conductivity,
                AvgConductivity24h: avg.AvgConductivity,
                ConductivityDrift: latest.Conductivity - avg.AvgConductivity
            ));
        }

        return result;
    }
}
