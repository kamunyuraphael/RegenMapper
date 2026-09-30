#!/usr/bin/env python3
"""
Sanity test for build_forest_hexes.py using synthetic Hansen-style tiles.

Builds two adjacent 1x1 degree tiles, runs the real script, and checks that
the hexagon totals match a brute-force per-pixel calculation (so blocking,
strip reads, H3 assignment and bincount indexing don't lose or duplicate
anything). Also covers a windowed bbox, the boundary clip, and a hex that
spans two tiles.

    python test_pipeline.py
"""

import json
import os
import subprocess
import sys
import tempfile

import numpy as np
import rasterio
from rasterio.transform import from_origin

from build_forest_hexes import meters_per_degree
from hex_common import CANOPY_THRESHOLD

HERE = os.path.dirname(os.path.abspath(__file__))
PIX = 0.00025          # degrees per pixel (Hansen tiles are ~40000 px per 10 degrees)
SIZE = 4000            # 1 degree per tile side
N_YEARS = 24
rng = np.random.default_rng(7)


def make_tile(dirpath, name, west, north):
    transform = from_origin(west, north, PIX, PIX)
    yy, xx = np.mgrid[0:SIZE, 0:SIZE]
    smooth = 60 + 40 * np.sin(xx / 500.0) * np.cos(yy / 700.0)
    canopy = np.clip(smooth + rng.normal(0, 15, (SIZE, SIZE)), 0, 100).astype(np.uint8)
    canopy[:, : SIZE // 5] = 0  # a treeless strip so some hexes must be dropped/empty
    lossyear = np.zeros((SIZE, SIZE), dtype=np.uint8)
    loss_mask = rng.random((SIZE, SIZE)) < 0.02
    lossyear[loss_mask] = rng.integers(1, N_YEARS + 1, loss_mask.sum())  # includes non-tree pixels

    profile = dict(driver="GTiff", height=SIZE, width=SIZE, count=1, dtype="uint8",
                   crs="EPSG:4326", transform=transform)
    for layer, data in (("treecover2000", canopy), ("lossyear", lossyear)):
        with rasterio.open(os.path.join(dirpath, f"Hansen_test_{layer}_{name}.tif"), "w", **profile) as dst:
            dst.write(data, 1)
    return canopy, lossyear, transform


def truth_totals(canopy, lossyear, west, north, window=None):
    """Brute-force per-pixel totals: (tree ha in 2000, loss ha per year)."""
    r0, r1, c0, c1 = window or (0, SIZE, 0, SIZE)
    row_lat = north - (np.arange(r0, r1) + 0.5) * PIX
    m_lat, m_lon = meters_per_degree(row_lat)
    area = ((PIX * m_lat) * (PIX * m_lon) / 10_000.0)[:, None]
    cs = canopy[r0:r1, c0:c1]
    ls = lossyear[r0:r1, c0:c1]
    tree = cs >= CANOPY_THRESHOLD
    tree_ha = float((tree * area).sum())
    loss = np.zeros(N_YEARS)
    for y in range(1, N_YEARS + 1):
        loss[y - 1] = float((((ls == y) & tree) * area).sum())
    return tree_ha, loss


def run(tiles_dir, out, *extra):
    cmd = [sys.executable, os.path.join(HERE, "build_forest_hexes.py"),
           "--tiles-dir", tiles_dir, "--out", out, "--last-year", str(2000 + N_YEARS), *extra]
    res = subprocess.run(cmd, capture_output=True, text=True, cwd=HERE)
    if res.returncode != 0:
        print(res.stdout, res.stderr)
        raise SystemExit("pipeline script failed")
    with open(out) as f:
        return json.load(f)


def sums(collection):
    feats = collection["features"]
    tree = sum(f["properties"]["treeHa2000"] for f in feats)
    loss = np.sum([f["properties"]["loss"] for f in feats], axis=0)
    return tree, loss


def assert_close(a, b, what, n_hexes):
    """Each hex value is rounded to 0.1 ha, so summing n hexes can drift by at most 0.05 * n."""
    a, b = np.asarray(a, dtype=float), np.asarray(b, dtype=float)
    tol = 0.05 * n_hexes + 1e-6
    worst = float(np.max(np.abs(a - b)))
    if worst > tol:
        raise AssertionError(f"{what}: worst diff {worst:.3f} ha exceeds rounding bound {tol:.3f} ha")
    print(f"  ok  {what}: {a.sum():,.1f} ha vs {b.sum():,.1f} ha (worst diff {worst:.3f}, bound {tol:.2f})")


def main():
    # Sanity-check the geodesy: a 0.00025 deg pixel at the equator is ~0.077 ha.
    m_lat, m_lon = meters_per_degree(np.array([0.0]))
    equator_ha = float((PIX * m_lat[0]) * (PIX * m_lon[0]) / 10_000.0)
    assert 0.075 < equator_ha < 0.079, equator_ha
    print(f"  ok  pixel area at equator: {equator_ha:.4f} ha")

    with tempfile.TemporaryDirectory() as tmp:
        # Two side-by-side tiles: lon 36-37 and 37-38, lat -1..0
        c1, l1, _ = make_tile(tmp, "A", 36.0, 0.0)
        c2, l2, _ = make_tile(tmp, "B", 37.0, 0.0)
        full_bbox = ("--bbox", "36.0", "-1.0", "38.0", "0.0")

        # 1. Whole extent, both tiles: hex totals must equal per-pixel totals.
        out = os.path.join(tmp, "full.geojson")
        coll = run(tmp, out, *full_bbox)
        t1, s1 = truth_totals(c1, l1, 36.0, 0.0)
        t2, s2 = truth_totals(c2, l2, 37.0, 0.0)
        tree, loss = sums(coll)
        n = len(coll["features"])
        assert_close([tree], [t1 + t2], "tree cover, two tiles", n)
        assert_close(loss, s1 + s2, "loss by year, two tiles", n)
        assert coll["metadata"]["source"] == "hansen-gfc"
        assert coll["metadata"]["years"][0] == 2001 and len(coll["metadata"]["years"]) == N_YEARS
        assert all(len(f["properties"]["loss"]) == N_YEARS for f in coll["features"])
        assert all(f["properties"]["treeHa2000"] > 0 for f in coll["features"]), "treeless hexes must be dropped"
        assert all(0 <= f["properties"]["canopy2000"] <= 100 for f in coll["features"])
        print(f"  ok  {len(coll['features'])} hexes, all with tree cover, canopy in 0-100")

        # 2. Windowed bbox aligned to the 0.01 degree block grid, inside tile A.
        out = os.path.join(tmp, "window.geojson")
        coll = run(tmp, out, "--bbox", "36.2", "-0.7", "36.6", "-0.3")
        r0, r1 = int(round((0.0 - -0.3) / PIX)), int(round((0.0 - -0.7) / PIX))
        c0, c1_ = int(round((36.2 - 36.0) / PIX)), int(round((36.6 - 36.0) / PIX))
        tw, sw = truth_totals(c1, l1, 36.0, 0.0, window=(r0, r1, c0, c1_))
        tree, loss = sums(coll)
        n = len(coll["features"])
        assert_close([tree], [tw], "tree cover, windowed bbox", n)
        assert_close(loss, sw, "loss by year, windowed bbox", n)

        # 3. Boundary clip: only the western half; every kept hex centre must be inside it.
        import h3
        boundary = os.path.join(tmp, "boundary.geojson")
        poly = {"type": "Feature", "properties": {}, "geometry": {"type": "Polygon", "coordinates": [[
            [35.9, -1.1], [37.0, -1.1], [37.0, 0.1], [35.9, 0.1], [35.9, -1.1]]]}}
        with open(boundary, "w") as f:
            json.dump(poly, f)
        clipped = run(tmp, os.path.join(tmp, "clipped.geojson"), *full_bbox, "--boundary", boundary)
        assert 0 < len(clipped["features"]) < len(json.load(open(os.path.join(tmp, "full.geojson")))["features"])
        for feat in clipped["features"]:
            lat, lng = h3.cell_to_latlng(feat["properties"]["h3"])
            assert lng <= 37.0, f"hex centre outside boundary: {lng}"
        print(f"  ok  boundary clip keeps {len(clipped['features'])} hexes, all inside")

        # 4. A hex straddling the tile seam exists and carries data from both sides.
        seam = [f for f in coll_full_features(tmp) if straddles_seam(f, 37.0)]
        assert seam, "expected at least one hex spanning the 37.0 seam"
        print(f"  ok  {len(seam)} hex(es) span the tile seam")

    print("\nAll pipeline checks passed.")


def coll_full_features(tmp):
    with open(os.path.join(tmp, "full.geojson")) as f:
        return json.load(f)["features"]


def straddles_seam(feature, seam_lon):
    lons = [pt[0] for pt in feature["geometry"]["coordinates"][0]]
    return min(lons) < seam_lon < max(lons)


if __name__ == "__main__":
    main()
