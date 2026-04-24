namespace WaterQualityMonitor.API.DTOs;

public record ThresholdCreateDto(int LineId, string ParameterName, double MinValue, double MaxValue);

public record ThresholdUpdateDto(double MinValue, double MaxValue);

public record ThresholdResponseDto(int Id, int LineId, string ParameterName, double MinValue, double MaxValue);
