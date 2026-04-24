namespace WaterQualityMonitor.API.Models;

public class Threshold
{
    public int Id { get; set; }
    public int LineId { get; set; }
    public string ParameterName { get; set; } = string.Empty;
    public double MinValue { get; set; }
    public double MaxValue { get; set; }

    public Line Line { get; set; } = null!;
}
