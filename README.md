# Water Quality Monitor (Lite)

ASP.NET Core 8 Web API + React 18 (Vite + Tailwind CSS) industrial dashboard.

## Quick Start

### Backend
```bash
cd WaterQualityMonitor.API
# Update connection string in appsettings.json if needed
dotnet run
# API runs on http://localhost:5000
# Swagger UI: http://localhost:5000/swagger
```

### Frontend
```bash
cd water-quality-frontend
npm install
npm run dev
# Dashboard at http://localhost:5173
```

## Project Structure

```
Water Quality Monitor Project/
├── WaterQualityMonitor.API/
│   ├── Controllers/
│   │   ├── LinesController.cs
│   │   ├── SensorsController.cs
│   │   ├── ReadingsController.cs      ← includes /sensor-drift endpoint
│   │   ├── ThresholdsController.cs
│   │   └── IncidentsController.cs
│   ├── Models/
│   │   ├── Line.cs
│   │   ├── WaterSensor.cs
│   │   ├── QualityReading.cs
│   │   ├── Threshold.cs
│   │   └── Incident.cs
│   ├── Data/
│   │   └── AppDbContext.cs
│   ├── DTOs/
│   │   ├── ReadingDto.cs
│   │   ├── ThresholdDto.cs
│   │   └── IncidentDto.cs
│   ├── Services/
│   │   └── QualityService.cs          ← Check() auto-creates incidents + ABT messages
│   └── Migrations/
│       └── 20240101000000_InitialCreate.cs
│
├── water-quality-frontend/
│   └── src/
│       ├── features/
│       │   ├── dashboard/
│       │   │   ├── DashboardPage.jsx
│       │   │   ├── LineStatusGrid.jsx  ← glassmorphism cards + status pulses
│       │   │   └── SensorDrift.jsx
│       │   ├── charts/
│       │   │   └── QualityChart.jsx    ← Recharts multi-series + spec bands
│       │   ├── incidents/
│       │   │   ├── IncidentModal.jsx   ← centered modal + ABT notifications
│       │   │   └── IncidentsPage.jsx
│       │   ├── thresholds/
│       │   │   ├── ThresholdForm.jsx   ← slide-over panel
│       │   │   └── ThresholdsPage.jsx
│       │   ├── readings/
│       │   │   └── ReadingsPage.jsx
│       │   └── sensors/
│       │       └── SensorsPage.jsx
│       ├── services/
│       │   └── api.js                  ← axios wrappers for all endpoints
│       ├── hooks/
│       │   └── useTheme.js
│       └── components/
│           ├── Sidebar.jsx             ← collapsible, mobile-responsive
│           └── Topbar.jsx
│
└── schema.sql                          ← raw SQL schema + seed data
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/POST/PUT/DELETE | `/api/lines` | Line CRUD |
| GET/POST/PUT/DELETE | `/api/sensors` | Sensor CRUD |
| GET/POST/DELETE | `/api/readings` | Reading CRUD |
| GET | `/api/readings/sensor-drift` | 24-hour drift analysis |
| GET/POST/PUT/DELETE | `/api/thresholds` | Threshold CRUD |
| GET/POST | `/api/incidents` | Incident CRUD |
| PATCH | `/api/incidents/{id}/resolve` | Resolve incident |

## Key Design Decisions

- **QualityService.CheckAsync()** — every reading submission checks all 3 parameters against thresholds and auto-creates incidents with ABT-format messages.
- **ABT Notifications** — "Reading X is Y and limit is Z, but the value is above/below by N units, therefore an incident was automatically created."
- **Spec Bands** — Recharts `ReferenceLine` pairs mark min/max thresholds as dashed overlays on the chart.
- **React Query** — 15-second polling keeps the dashboard live without websockets.
- **Sensor Drift** — compares latest reading against rolling 24-hour average per parameter per line.
