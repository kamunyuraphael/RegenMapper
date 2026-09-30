from datetime import date
from dateutil.relativedelta import relativedelta

import pandas as pd
from sklearn.linear_model import LinearRegression

from app.schemas import NdviPoint, Trend, ForecastPoint

# Below this slope-per-month magnitude, we call it "stable" rather than
# reading noise as a real trend.
STABLE_THRESHOLD = 0.001
FORECAST_MONTHS = 6


def analyze_trend(series: list[NdviPoint]) -> Trend:
    df = pd.DataFrame([{"date": p.date, "ndvi": p.ndvi} for p in series])
    df["month_index"] = range(len(df))

    X = df[["month_index"]].values
    y = df["ndvi"].values

    model = LinearRegression()
    model.fit(X, y)

    slope = float(model.coef_[0])
    r_squared = float(model.score(X, y))

    if abs(slope) < STABLE_THRESHOLD:
        direction = "stable"
    elif slope > 0:
        direction = "improving"
    else:
        direction = "declining"

    last_index = int(df["month_index"].iloc[-1])
    last_date = df["date"].iloc[-1]

    forecast: list[ForecastPoint] = []
    for i in range(1, FORECAST_MONTHS + 1):
        future_index = last_index + i
        predicted = float(model.predict([[future_index]])[0])
        predicted = max(0.0, min(1.0, predicted))
        future_date = last_date + relativedelta(months=i)
        forecast.append(ForecastPoint(date=future_date, ndvi=round(predicted, 4)))

    return Trend(
        slope_per_month=round(slope, 5),
        r_squared=round(r_squared, 4),
        direction=direction,
        forecast=forecast,
    )
