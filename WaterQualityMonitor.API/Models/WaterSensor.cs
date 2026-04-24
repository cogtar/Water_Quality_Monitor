namespace WaterQualityMonitor.API.Models;

public class WaterSensor
{
    public int Id { get; set; }
    public int LineId { get; set; }
    public string Type { get; set; } = string.Empty;
    public DateTime LastCalibration { get; set; }

    public Line Line { get; set; } = null!;
}
