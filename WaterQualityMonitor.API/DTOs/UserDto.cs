namespace WaterQualityMonitor.API.DTOs;

public record RegisterDto(string Name, string Email, string Password);
public record LoginDto(string Email, string Password);
public record UserResponseDto(int Id, string Name, string Email);
