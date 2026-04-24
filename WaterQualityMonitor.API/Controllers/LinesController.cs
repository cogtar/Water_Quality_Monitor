using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WaterQualityMonitor.API.Data;
using WaterQualityMonitor.API.Models;

namespace WaterQualityMonitor.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LinesController : ControllerBase
{
    private readonly AppDbContext _db;

    public LinesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Lines.ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var line = await _db.Lines.FindAsync(id);
        return line is null ? NotFound() : Ok(line);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Line dto)
    {
        _db.Lines.Add(dto);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Line dto)
    {
        var line = await _db.Lines.FindAsync(id);
        if (line is null) return NotFound();
        line.Name = dto.Name;
        line.Location = dto.Location;
        await _db.SaveChangesAsync();
        return Ok(line);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var line = await _db.Lines.FindAsync(id);
        if (line is null) return NotFound();
        _db.Lines.Remove(line);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
