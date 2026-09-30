"""
Generates a deterministic, zone-specific synthetic NDVI time series.

Not real satellite data — this exists so the analysis pipeline and dashboard
are fully testable with zero external setup. Swap NDVI_SOURCE=gee once a
Google Earth Engine service account is configured (see gee_source.py).

The series is seeded from the zone's coordinates so the same zone always
produces the same series, and different zones look meaningfully different —
useful for demoing without it being obviously random.
"""

import hashlib
from datetime import date
from dateutil.relativedelta import relativedelta
import numpy as np

from app.schemas import NdviPoint


def _seed_from_coords(latitude: float, longitude: float) -> int:
    key = f"{round(latitude, 4)},{round(longitude, 4)}".encode()
    return int(hashlib.sha256(key).hexdigest(), 16) % (2**32)


def get_ndvi_series(latitude: float, longitude: float, months: int) -> list[NdviPoint]:
    rng = np.random.default_rng(_seed_from_coords(latitude, longitude))

    baseline = 0.35 + rng.uniform(-0.05, 0.05)
    # Simulated gradual recovery — restoration zones trend upward over time.
    monthly_recovery = rng.uniform(0.0015, 0.006)
    noise_scale = 0.02

    today = date.today().replace(day=1)
    points: list[NdviPoint] = []

    for i in range(months, 0, -1):
        month_date = today - relativedelta(months=i)
        seasonal = 0.08 * np.sin(2 * np.pi * (month_date.month / 12))
        trend = monthly_recovery * (months - i)
        noise = rng.normal(0, noise_scale)
        ndvi = float(np.clip(baseline + seasonal + trend + noise, 0.05, 0.95))
        points.append(NdviPoint(date=month_date, ndvi=round(ndvi, 4)))

    return points
