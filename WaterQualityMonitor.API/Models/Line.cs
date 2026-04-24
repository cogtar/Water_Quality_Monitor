namespace WaterQualityMonitor.API.Models;

public class Line
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;

    public ICollection<WaterSensor> WaterSensors { get; set; } = new List<WaterSensor>();
    public ICollection<QualityReading> QualityReadings { get; set; } = new List<QualityReading>();
    public ICollection<Threshold> Thresholds { get; set; } = new List<Threshold>();
    public ICollection<Incident> Incidents { get; set; } = new List<Incident>();
}
