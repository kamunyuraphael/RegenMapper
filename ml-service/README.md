# ReGen Mapper — Vegetation Analysis Service

A small FastAPI service that analyzes NDVI (vegetation greenness) trends for
a restoration zone, given its coordinates. Called by the Express backend at
`GET /api/zones/:id/vegetation`, not meant to be hit directly by the frontend.

## Run it (sample data — zero setup)

```
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --port 8000
```

`NDVI_SOURCE=sample` (the default) generates deterministic, zone-specific
synthetic NDVI data — same zone always produces the same series, different
zones look different. This is enough to fully exercise the pipeline and the
dashboard, but it is **not real satellite data**.

## Switch to real data (Google Earth Engine, free for individual/noncommercial use)

1. Register a Google Cloud project for Earth Engine at
   https://earthengine.google.com/noncommercial/ (free — select the
   Community tier when asked).
2. In that project, create a service account, grant it the "Earth Engine
   Resource Viewer" role, and download its JSON key.
3. In `.env`, set:
   ```
   NDVI_SOURCE=gee
   GEE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   GEE_SERVICE_ACCOUNT_KEY_PATH=/path/to/key.json
   ```
4. Restart the service.

`app/ndvi/gee_source.py` pulls real MODIS NDVI (MOD13Q1, 16-day 250m
composites) for the zone's coordinates. This has not been exercised against
Google's live servers in development — this repo's dev environment has no
network path to Earth Engine — so treat it as a solid starting point to
verify against your own credentials, not as pre-verified.

## API

`POST /analyze`
```json
{ "latitude": -1.045, "longitude": 37.07, "months": 24 }
```
Returns the NDVI series, a linear trend (slope, R², direction), and a
6-month forecast. See `app/schemas.py` for the exact shape.
