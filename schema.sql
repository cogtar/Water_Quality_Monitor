-- Water Quality Monitor Database Schema
-- Run against SQL Server after creating the database: WaterQualityMonitorDb

CREATE TABLE Lines (
    Id          INT           IDENTITY(1,1) PRIMARY KEY,
    Name        NVARCHAR(100) NOT NULL,
    Location    NVARCHAR(200) NOT NULL
);

CREATE TABLE WaterSensors (
    Id              INT          IDENTITY(1,1) PRIMARY KEY,
    LineId          INT          NOT NULL REFERENCES Lines(Id) ON DELETE CASCADE,
    Type            NVARCHAR(50) NOT NULL,
    LastCalibration DATETIME2    NOT NULL
);

CREATE TABLE QualityReadings (
    Id           INT        IDENTITY(1,1) PRIMARY KEY,
    LineId       INT        NOT NULL REFERENCES Lines(Id) ON DELETE CASCADE,
    pH           FLOAT      NOT NULL,
    Turbidity    FLOAT      NOT NULL,
    Conductivity FLOAT      NOT NULL,
    Timestamp    DATETIME2  NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Thresholds (
    Id            INT          IDENTITY(1,1) PRIMARY KEY,
    LineId        INT          NOT NULL REFERENCES Lines(Id) ON DELETE CASCADE,
    ParameterName NVARCHAR(50) NOT NULL,
    MinValue      FLOAT        NOT NULL,
    MaxValue      FLOAT        NOT NULL
);

CREATE TABLE Incidents (
    Id             INT          IDENTITY(1,1) PRIMARY KEY,
    LineId         INT          NOT NULL REFERENCES Lines(Id) ON DELETE CASCADE,
    Parameter      NVARCHAR(50) NOT NULL,
    Value          FLOAT        NOT NULL,
    Timestamp      DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    ResolvedStatus BIT          NOT NULL DEFAULT 0
);

-- Seed data
INSERT INTO Lines (Name, Location) VALUES
    ('Line A', 'Plant North Wing'),
    ('Line B', 'Plant South Wing');

INSERT INTO Thresholds (LineId, ParameterName, MinValue, MaxValue) VALUES
    (1, 'pH',           6.5, 8.5),
    (1, 'Turbidity',    0.0, 4.0),
    (1, 'Conductivity', 100.0, 800.0),
    (2, 'pH',           6.5, 8.5),
    (2, 'Turbidity',    0.0, 4.0),
    (2, 'Conductivity', 100.0, 800.0);

-- Useful queries
-- Sensor drift (current vs. 24-hour average)
SELECT
    l.Name,
    r.pH   AS CurrentPH,
    AVG(h.pH) OVER (PARTITION BY h.LineId) AS AvgPH_24h,
    r.pH - AVG(h.pH) OVER (PARTITION BY h.LineId) AS PHDrift
FROM Lines l
CROSS APPLY (
    SELECT TOP 1 * FROM QualityReadings
    WHERE LineId = l.Id ORDER BY Timestamp DESC
) r
JOIN QualityReadings h ON h.LineId = l.Id
    AND h.Timestamp >= DATEADD(HOUR, -24, SYSUTCDATETIME());
