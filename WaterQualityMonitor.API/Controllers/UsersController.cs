using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WaterQualityMonitor.API.Data;
using WaterQualityMonitor.API.DTOs;
using WaterQualityMonitor.API.Models;
using System.Security.Cryptography;
using System.Text;

namespace WaterQualityMonitor.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db)
    {
        _db = db;
    }

    // POST api/users/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        // Check if email already exists
        bool emailExists = await _db.Users.AnyAsync(u => u.Email == dto.Email);
        if (emailExists)
            return BadRequest("An account with this email already exists.");

        // Hash the password using SHA256
        string passwordHash = HashPassword(dto.Password);

        var user = new User
        {
            Name     = dto.Name,
            Email    = dto.Email,
            PasswordHash = passwordHash,
            CreatedAt    = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(new UserResponseDto(user.Id, user.Name, user.Email));
    }

    // POST api/users/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (user is null)
            return Unauthorized("No account found with this email.");

        string passwordHash = HashPassword(dto.Password);
        if (user.PasswordHash != passwordHash)
            return Unauthorized("Incorrect password.");

        return Ok(new UserResponseDto(user.Id, user.Name, user.Email));
    }

    // Simple SHA256 password hashing
    private static string HashPassword(string password)
    {
        byte[] bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes);
    }
}
