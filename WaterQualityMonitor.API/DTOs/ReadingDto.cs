namespace WaterQualityMonitor.API.DTOs;

public record ReadingCreateDto(int LineId, double pH, double Turbidity, double Conductivity);

public record ReadingResponseDto(int Id, int LineId, double pH, double Turbidity, double Conductivity, DateTime Timestamp);

public record SensorDriftDto(
    int LineId,
    string LineName,
    double CurrentPH,
    double AvgPH24h,
    double PHDrift,
    double CurrentTurbidity,
    double AvgTurbidity24h,
    double TurbidityDrift,
    double CurrentConductivity,
    double AvgConductivity24h,
    double ConductivityDrift
);
