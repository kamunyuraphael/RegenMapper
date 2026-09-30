from datetime import date
from typing import List, Literal
from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    months: int = Field(24, ge=6, le=60, description="How many months of history to analyze")


class NdviPoint(BaseModel):
    date: date
    ndvi: float


class ForecastPoint(BaseModel):
    date: date
    ndvi: float


class Trend(BaseModel):
    slope_per_month: float
    r_squared: float
    direction: Literal["improving", "declining", "stable"]
    forecast: List[ForecastPoint]


class AnalyzeResponse(BaseModel):
    source: Literal["sample", "gee"]
    series: List[NdviPoint]
    trend: Trend
