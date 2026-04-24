using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WaterQualityMonitor.API.Data;
using WaterQualityMonitor.API.DTOs;
using WaterQualityMonitor.API.Services;

namespace WaterQualityMonitor.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReadingsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly QualityService _qualityService;

    public ReadingsController(AppDbContext db, QualityService qualityService)
    {
        _db = db;
        _qualityService = qualityService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? lineId,
        [FromQuery] int limit = 100)
    {
        var query = _db.QualityReadings.AsQueryable();
        if (lineId.HasValue) query = query.Where(r => r.LineId == lineId);
        var readings = await query
            .OrderByDescending(r => r.Timestamp)
            .Take(limit)
            .Select(r => new ReadingResponseDto(r.Id, r.LineId, r.pH, r.Turbidity, r.Conductivity, r.Timestamp))
            .ToListAsync();
        return Ok(readings);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var r = await _db.QualityReadings.FindAsync(id);
        if (r is null) return NotFound();
        return Ok(new ReadingResponseDto(r.Id, r.LineId, r.pH, r.Turbidity, r.Conductivity, r.Timestamp));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ReadingCreateDto dto)
    {
        var lineExists = await _db.Lines.AnyAsync(l => l.Id == dto.LineId);
        if (!lineExists) return BadRequest("Line not found.");

        var (reading, messages) = await _qualityService.CheckAsync(dto);

        return Ok(new
        {
            Reading = new ReadingResponseDto(reading.Id, reading.LineId, reading.pH, reading.Turbidity, reading.Conductivity, reading.Timestamp),
            AbtNotifications = messages
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var r = await _db.QualityReadings.FindAsync(id);
        if (r is null) return NotFound();
        _db.QualityReadings.Remove(r);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("sensor-drift")]
    public async Task<IActionResult> GetSensorDrift() =>
        Ok(await _qualityService.GetSensorDriftAsync());
}
