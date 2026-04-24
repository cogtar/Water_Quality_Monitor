namespace WaterQualityMonitor.API.Models;

public class QualityReading
{
    public int Id { get; set; }
    public int LineId { get; set; }
    public double pH { get; set; }
    public double Turbidity { get; set; }
    public double Conductivity { get; set; }
    public DateTime Timestamp { get; set; }

    public Line Line { get; set; } = null!;
}
