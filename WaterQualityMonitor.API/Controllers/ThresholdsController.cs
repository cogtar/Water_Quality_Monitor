using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WaterQualityMonitor.API.Data;
using WaterQualityMonitor.API.DTOs;
using WaterQualityMonitor.API.Models;

namespace WaterQualityMonitor.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ThresholdsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ThresholdsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? lineId)
    {
        var query = _db.Thresholds.AsQueryable();
        if (lineId.HasValue) query = query.Where(t => t.LineId == lineId);
        var result = await query
            .Select(t => new ThresholdResponseDto(t.Id, t.LineId, t.ParameterName, t.MinValue, t.MaxValue))
            .ToListAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var t = await _db.Thresholds.FindAsync(id);
        return t is null ? NotFound() : Ok(new ThresholdResponseDto(t.Id, t.LineId, t.ParameterName, t.MinValue, t.MaxValue));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ThresholdCreateDto dto)
    {
        var threshold = new Threshold
        {
            LineId = dto.LineId,
            ParameterName = dto.ParameterName,
            MinValue = dto.MinValue,
            MaxValue = dto.MaxValue
        };
        _db.Thresholds.Add(threshold);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = threshold.Id },
            new ThresholdResponseDto(threshold.Id, threshold.LineId, threshold.ParameterName, threshold.MinValue, threshold.MaxValue));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ThresholdUpdateDto dto)
    {
        var threshold = await _db.Thresholds.FindAsync(id);
        if (threshold is null) return NotFound();
        threshold.MinValue = dto.MinValue;
        threshold.MaxValue = dto.MaxValue;
        await _db.SaveChangesAsync();
        return Ok(new ThresholdResponseDto(threshold.Id, threshold.LineId, threshold.ParameterName, threshold.MinValue, threshold.MaxValue));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var t = await _db.Thresholds.FindAsync(id);
        if (t is null) return NotFound();
        _db.Thresholds.Remove(t);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
