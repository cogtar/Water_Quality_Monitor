using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WaterQualityMonitor.API.Data;
using WaterQualityMonitor.API.DTOs;
using WaterQualityMonitor.API.Models;

namespace WaterQualityMonitor.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IncidentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public IncidentsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? lineId,
        [FromQuery] bool? resolved)
    {
        var query = _db.Incidents.Include(i => i.Line).AsQueryable();
        if (lineId.HasValue) query = query.Where(i => i.LineId == lineId);
        if (resolved.HasValue) query = query.Where(i => i.ResolvedStatus == resolved);
        var result = await query
            .OrderByDescending(i => i.Timestamp)
            .Select(i => new IncidentResponseDto(i.Id, i.LineId, i.Line.Name, i.Parameter, i.Value, i.Timestamp, i.ResolvedStatus))
            .ToListAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var i = await _db.Incidents.Include(x => x.Line).FirstOrDefaultAsync(x => x.Id == id);
        if (i is null) return NotFound();
        return Ok(new IncidentResponseDto(i.Id, i.LineId, i.Line.Name, i.Parameter, i.Value, i.Timestamp, i.ResolvedStatus));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] IncidentCreateDto dto)
    {
        var lineExists = await _db.Lines.AnyAsync(l => l.Id == dto.LineId);
        if (!lineExists) return BadRequest("Line not found.");

        var incident = new Incident
        {
            LineId = dto.LineId,
            Parameter = dto.Parameter,
            Value = dto.Value,
            Timestamp = DateTime.UtcNow,
            ResolvedStatus = false
        };
        _db.Incidents.Add(incident);
        await _db.SaveChangesAsync();

        var line = await _db.Lines.FindAsync(dto.LineId);
        return CreatedAtAction(nameof(GetById), new { id = incident.Id },
            new IncidentResponseDto(incident.Id, incident.LineId, line!.Name, incident.Parameter, incident.Value, incident.Timestamp, incident.ResolvedStatus));
    }

    [HttpPatch("{id}/resolve")]
    public async Task<IActionResult> Resolve(int id, [FromBody] IncidentResolveDto dto)
    {
        var incident = await _db.Incidents.FindAsync(id);
        if (incident is null) return NotFound();
        incident.ResolvedStatus = dto.ResolvedStatus;
        await _db.SaveChangesAsync();
        return Ok(new { incident.Id, incident.ResolvedStatus });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var incident = await _db.Incidents.FindAsync(id);
        if (incident is null) return NotFound();
        _db.Incidents.Remove(incident);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
