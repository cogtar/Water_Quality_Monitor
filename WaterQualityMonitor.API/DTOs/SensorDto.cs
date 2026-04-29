namespace WaterQualityMonitor.API.DTOs;

public record SensorCreateDto(int LineId, string Type, DateTime LastCalibration);
