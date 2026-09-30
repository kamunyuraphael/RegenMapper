import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import AnalyzeRequest, AnalyzeResponse
from app.analysis import analyze_trend

load_dotenv()

NDVI_SOURCE = os.getenv("NDVI_SOURCE", "sample")
CLIENT_ORIGIN = os.getenv("CLIENT_ORIGIN", "*")

app = FastAPI(title="ReGen Mapper Vegetation Analysis Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[CLIENT_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "ndvi_source": NDVI_SOURCE}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest):
    if NDVI_SOURCE == "gee":
        from app.ndvi.gee_source import get_ndvi_series
    else:
        from app.ndvi.sample_source import get_ndvi_series

    try:
        series = get_ndvi_series(payload.latitude, payload.longitude, payload.months)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"NDVI source failed: {exc}") from exc

    if not series:
        raise HTTPException(status_code=404, detail="No NDVI data available for this location")

    trend = analyze_trend(series)

    return AnalyzeResponse(source=NDVI_SOURCE, series=series, trend=trend)
