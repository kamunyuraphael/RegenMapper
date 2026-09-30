"""Shared helpers for building the forest-loss hexagon GeoJSON."""

import json
from datetime import datetime, timezone

import h3

CANOPY_THRESHOLD = 30  # % canopy in 2000 that counts as "tree cover" (GFW's common default)


def hex_polygon(cell: str) -> list[list[float]]:
    """GeoJSON ring ([lng, lat], closed) for an H3 cell."""
    ring = [[round(lng, 4), round(lat, 4)] for lat, lng in h3.cell_to_boundary(cell)]
    ring.append(ring[0])
    return ring


def hex_feature(cell: str, canopy2000: float, tree_ha_2000: float, loss: list[float]) -> dict:
    return {
        "type": "Feature",
        "properties": {
            "h3": cell,
            "canopy2000": round(canopy2000, 1),
            "treeHa2000": round(tree_ha_2000, 1),
            "loss": [round(v, 1) for v in loss],
        },
        "geometry": {"type": "Polygon", "coordinates": [hex_polygon(cell)]},
    }


def write_geojson(path: str, features: list[dict], *, source: str, years: list[int],
                  resolution: int, note: str) -> None:
    collection = {
        "type": "FeatureCollection",
        "metadata": {
            "source": source,  # "hansen-gfc" for real data, "demo" for synthetic
            "years": years,
            "resolution": resolution,
            "canopyThreshold": CANOPY_THRESHOLD,
            "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "note": note,
        },
        "features": features,
    }
    with open(path, "w") as f:
        json.dump(collection, f, separators=(",", ":"))
