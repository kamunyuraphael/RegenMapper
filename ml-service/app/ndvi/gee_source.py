"""
Real NDVI from Google Earth Engine (MODIS MOD13Q1, 16-day 250m composites).

Requires a free Earth Engine account registered for noncommercial/individual
use (see https://earthengine.google.com/noncommercial/), plus a service
account with the Earth Engine API enabled and its JSON key downloaded.

Setup (one-time, outside this codebase):
  1. Register a Google Cloud project for Earth Engine (noncommercial tier).
  2. Create a service account in that project, grant it the "Earth Engine
     Resource Viewer" role, and download its JSON key.
  3. Set GEE_SERVICE_ACCOUNT_EMAIL and GEE_SERVICE_ACCOUNT_KEY_PATH in .env.
  4. Set NDVI_SOURCE=gee in .env.

This module is not exercised by default (NDVI_SOURCE=sample) since this
environment has no network path to Google's servers to verify it live —
it's written to the real Earth Engine Python API surface and is ready to
run once the account is configured.
"""

import os
from datetime import date
from dateutil.relativedelta import relativedelta

from app.schemas import NdviPoint

_initialized = False


def _ensure_initialized() -> None:
    global _initialized
    if _initialized:
        return

    import ee

    email = os.environ["GEE_SERVICE_ACCOUNT_EMAIL"]
    key_path = os.environ["GEE_SERVICE_ACCOUNT_KEY_PATH"]

    credentials = ee.ServiceAccountCredentials(email, key_path)
    ee.Initialize(credentials)
    _initialized = True


def get_ndvi_series(latitude: float, longitude: float, months: int) -> list[NdviPoint]:
    _ensure_initialized()
    import ee

    point = ee.Geometry.Point([longitude, latitude])
    end = date.today().replace(day=1)
    start = end - relativedelta(months=months)

    collection = (
        ee.ImageCollection("MODIS/061/MOD13Q1")
        .filterDate(str(start), str(end))
        .filterBounds(point)
        .select("NDVI")
    )

    def sample_image(image):
        value = image.reduceRegion(
            reducer=ee.Reducer.mean(), geometry=point, scale=250
        ).get("NDVI")
        return ee.Feature(None, {"date": image.date().format("YYYY-MM-dd"), "ndvi": value})

    features = collection.map(sample_image).getInfo()["features"]

    points: list[NdviPoint] = []
    for f in features:
        props = f["properties"]
        if props.get("ndvi") is None:
            continue
        # MOD13Q1 NDVI is scaled by 10000
        points.append(
            NdviPoint(date=date.fromisoformat(props["date"]), ndvi=round(props["ndvi"] / 10000, 4))
        )

    return points
