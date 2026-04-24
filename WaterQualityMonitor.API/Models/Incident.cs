namespace WaterQualityMonitor.API.Models;

public class Incident
{
    public int Id { get; set; }
    public int LineId { get; set; }
    public string Parameter { get; set; } = string.Empty;
    public double Value { get; set; }
    public DateTime Timestamp { get; set; }
    public bool ResolvedStatus { get; set; }

    public Line Line { get; set; } = null!;
}
