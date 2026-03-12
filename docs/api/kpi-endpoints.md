# API Documentation - KPI Endpoints

## Overview

Base URL: `/api/kpis`

All endpoints support the following common filters via query parameters:

| Parameter           | Type                | Description                    |
| ------------------- | ------------------- | ------------------------------ |
| `aseguradora`       | string              | Filter by insurer ID           |
| `asegurado`         | string              | Filter by insured ID           |
| `ramo`              | string              | Filter by line of business ID  |
| `vendedor`          | string              | Filter by seller ID            |
| `valorMin`          | number              | Minimum claim value            |
| `valorMax`          | number              | Maximum claim value            |
| `fechaDesde`        | string (YYYY-MM-DD) | Start date filter              |
| `fechaHasta`        | string (YYYY-MM-DD) | End date filter                |
| `siniestroSS`       | string              | Filter by SS claim number      |
| `siniestroCompania` | string              | Filter by company claim number |

---

## Endpoints

### GET /api/kpis/overview

Returns a summary of all main KPIs.

#### Response

```json
{
  "leadTimeAvg": 24.5,
  "tasaDesistimiento": 8.3,
  "tasaObjetados": 12.1,
  "tasaPrescritos": 2.4,
  "porcentajeCerradosPlazo": 15.7,
  "backlogActivos": 156
}
```

#### Fields

| Field                     | Type   | Description                                     |
| ------------------------- | ------ | ----------------------------------------------- |
| `leadTimeAvg`             | number | Average business days from notice to completion |
| `tasaDesistimiento`       | number | Percentage of withdrawn claims                  |
| `tasaObjetados`           | number | Percentage of objected claims                   |
| `tasaPrescritos`          | number | Percentage of prescribed claims                 |
| `porcentajeCerradosPlazo` | number | Percentage closed within SLA                    |
| `backlogActivos`          | number | Count of active (non-completed) claims          |

---

### GET /api/kpis/lead-time

Returns lead time metrics with optional percentiles and grouping.

#### Query Parameters

| Parameter            | Type    | Description                                    |
| -------------------- | ------- | ---------------------------------------------- |
| `includePercentiles` | boolean | Include P50, P75, P90, P95 percentiles         |
| `groupBy`            | string  | Group by: 'aseguradora', 'ramo', or 'vendedor' |

#### Response

```json
{
  "average": 24.5,
  "percentiles": {
    "p50": 22,
    "p75": 28,
    "p90": 35,
    "p95": 42
  },
  "byCategory": [
    {
      "category": "Seguros ABC",
      "average": 21.3
    },
    {
      "category": "Aseguradora XYZ",
      "average": 26.8
    }
  ]
}
```

---

### GET /api/kpis/tasas

Returns rates (withdrawal, objection, prescription).

#### Query Parameters

| Parameter       | Type    | Description                    |
| --------------- | ------- | ------------------------------ |
| `includeCounts` | boolean | Include absolute counts        |
| `historico`     | boolean | Include last 12 months history |

#### Response

```json
{
  "tasaDesistimiento": 8.3,
  "tasaObjetados": 12.1,
  "tasaPrescritos": 2.4,
  "counts": {
    "desistimiento": 42,
    "objetados": 61,
    "prescritos": 12,
    "total": 505
  },
  "historico": [
    {
      "month": "2024-01",
      "tasaDesistimiento": 7.8,
      "tasaObjetados": 11.5,
      "tasaPrescritos": 2.1
    }
  ]
}
```

---

### GET /api/kpis/backlog

Returns backlog metrics with optional grouping.

#### Query Parameters

| Parameter      | Type    | Description            |
| -------------- | ------- | ---------------------- |
| `groupByAge`   | boolean | Group by age ranges    |
| `groupByStage` | boolean | Group by current stage |

#### Response

```json
{
  "total": 156,
  "byAge": [
    { "range": "0-30 días", "count": 45 },
    { "range": "31-60 días", "count": 38 },
    { "range": "61-90 días", "count": 42 },
    { "range": "90+ días", "count": 31 }
  ],
  "byStage": [
    { "stage": 1, "count": 12 },
    { "stage": 2, "count": 18 },
    { "stage": 3, "count": 25 }
  ]
}
```

---

### GET /api/kpis/frecuencia-siniestralidad

Returns loss frequency by line of business.

#### Response

```json
[
  {
    "ramo": "Autos",
    "frecuencia": 0.15,
    "siniestrosCount": 150,
    "polizasVigentes": 1000
  },
  {
    "ramo": "Hogar",
    "frecuencia": 0.08,
    "siniestrosCount": 40,
    "polizasVigentes": 500
  }
]
```

#### Error Response

```json
{
  "error": "Insufficient policy data for calculation"
}
```

Status: 400

---

### GET /api/kpis/retencion-post-siniestro

Returns post-claim retention rate.

#### Response

```json
{
  "tasaRetencion": 85.5,
  "clientesConSiniestro": 320,
  "clientesRenovaron": 274
}
```

#### Error Response

```json
{
  "error": "Insufficient renewal data for calculation"
}
```

Status: 400

---

### GET /api/kpis/severidad

Returns severity metrics by line of business and coverage.

#### Response

```json
[
  {
    "ramo": "Autos",
    "amparo": "Daños",
    "severidad": 2500000,
    "costoTotal": 125000000,
    "siniestrosCount": 50
  }
]
```

---

## Error Handling

All endpoints return consistent error responses:

### 400 Bad Request

```json
{
  "error": "Invalid filter parameter: fechaDesde"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

---

## Example Usage

### Get overview with filters

```bash
curl "https://api.example.com/api/kpis/overview?aseguradora=abc123&fechaDesde=2024-01-01&fechaHasta=2024-12-31"
```

### Get lead time with percentiles

```bash
curl "https://api.example.com/api/kpis/lead-time?includePercentiles=true&ramo=autos"
```

### Get backlog grouped by age

```bash
curl "https://api.example.com/api/kpis/backlog?groupByAge=true"
```

---

## Rate Limiting

- Rate limit: 100 requests per minute per API key
- Rate limit headers included in all responses:
  - `X-RateLimit-Limit`: 100
  - `X-RateLimit-Remaining`: 95
  - `X-RateLimit-Reset`: 1640995200

## Authentication

All endpoints require authentication via Bearer token:

```
Authorization: Bearer <your-api-token>
```
