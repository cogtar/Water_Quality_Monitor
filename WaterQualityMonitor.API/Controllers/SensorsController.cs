using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WaterQualityMonitor.API.Data;
using WaterQualityMonitor.API.Models;

namespace WaterQualityMonitor.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SensorsController : ControllerBase
{
    private readonly AppDbContext _db;

    public SensorsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.WaterSensors.Include(s => s.Line).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var sensor = await _db.WaterSensors.Include(s => s.Line).FirstOrDefaultAsync(s => s.Id == id);
        return sensor is null ? NotFound() : Ok(sensor);
    }

    [HttpGet("by-line/{lineId}")]
    public async Task<IActionResult> GetByLine(int lineId) =>
        Ok(await _db.WaterSensors.Where(s => s.LineId == lineId).ToListAsync());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] WaterSensor dto)
    {
        _db.WaterSensors.Add(dto);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] WaterSensor dto)
    {
        var sensor = await _db.WaterSensors.FindAsync(id);
        if (sensor is null) return NotFound();
        sensor.Type = dto.Type;
        sensor.LastCalibration = dto.LastCalibration;
        sensor.LineId = dto.LineId;
        await _db.SaveChangesAsync();
        return Ok(sensor);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var sensor = await _db.WaterSensors.FindAsync(id);
        if (sensor is null) return NotFound();
        _db.WaterSensors.Remove(sensor);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
