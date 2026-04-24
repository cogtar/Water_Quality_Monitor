using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WaterQualityMonitor.API.Migrations;

public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Lines",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                Name = table.Column<string>(maxLength: 100, nullable: false),
                Location = table.Column<string>(maxLength: 200, nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_Lines", x => x.Id));

        migrationBuilder.CreateTable(
            name: "WaterSensors",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                LineId = table.Column<int>(nullable: false),
                Type = table.Column<string>(maxLength: 50, nullable: false),
                LastCalibration = table.Column<DateTime>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_WaterSensors", x => x.Id);
                table.ForeignKey("FK_WaterSensors_Lines_LineId", x => x.LineId, "Lines", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "QualityReadings",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                LineId = table.Column<int>(nullable: false),
                pH = table.Column<double>(precision: 10, scale: 4, nullable: false),
                Turbidity = table.Column<double>(precision: 10, scale: 4, nullable: false),
                Conductivity = table.Column<double>(precision: 10, scale: 4, nullable: false),
                Timestamp = table.Column<DateTime>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_QualityReadings", x => x.Id);
                table.ForeignKey("FK_QualityReadings_Lines_LineId", x => x.LineId, "Lines", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "Thresholds",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                LineId = table.Column<int>(nullable: false),
                ParameterName = table.Column<string>(maxLength: 50, nullable: false),
                MinValue = table.Column<double>(precision: 10, scale: 4, nullable: false),
                MaxValue = table.Column<double>(precision: 10, scale: 4, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Thresholds", x => x.Id);
                table.ForeignKey("FK_Thresholds_Lines_LineId", x => x.LineId, "Lines", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "Incidents",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                LineId = table.Column<int>(nullable: false),
                Parameter = table.Column<string>(maxLength: 50, nullable: false),
                Value = table.Column<double>(precision: 10, scale: 4, nullable: false),
                Timestamp = table.Column<DateTime>(nullable: false),
                ResolvedStatus = table.Column<bool>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Incidents", x => x.Id);
                table.ForeignKey("FK_Incidents_Lines_LineId", x => x.LineId, "Lines", "Id", onDelete: ReferentialAction.Cascade);
            });

        // Seed data
        migrationBuilder.InsertData("Lines", new[] { "Id", "Name", "Location" },
            new object[,]
            {
                { 1, "Line A", "Plant North Wing" },
                { 2, "Line B", "Plant South Wing" }
            });

        migrationBuilder.InsertData("Thresholds",
            new[] { "Id", "LineId", "ParameterName", "MinValue", "MaxValue" },
            new object[,]
            {
                { 1, 1, "pH", 6.5, 8.5 },
                { 2, 1, "Turbidity", 0.0, 4.0 },
                { 3, 1, "Conductivity", 100.0, 800.0 },
                { 4, 2, "pH", 6.5, 8.5 },
                { 5, 2, "Turbidity", 0.0, 4.0 },
                { 6, 2, "Conductivity", 100.0, 800.0 }
            });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable("Incidents");
        migrationBuilder.DropTable("Thresholds");
        migrationBuilder.DropTable("QualityReadings");
        migrationBuilder.DropTable("WaterSensors");
        migrationBuilder.DropTable("Lines");
    }
}
