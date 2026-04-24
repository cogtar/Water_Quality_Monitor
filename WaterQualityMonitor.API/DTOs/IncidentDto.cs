namespace WaterQualityMonitor.API.DTOs;

public record IncidentCreateDto(int LineId, string Parameter, double Value);

public record IncidentResponseDto(int Id, int LineId, string LineName, string Parameter, double Value, DateTime Timestamp, bool ResolvedStatus);

public record IncidentResolveDto(bool ResolvedStatus);
