#!/usr/bin/env python3
"""
Aggregate Hansen Global Forest Change tiles into an H3 hexagon GeoJSON.

Run this once, offline, on tiles you've downloaded yourself (see the README) —
the app never touches the rasters, it only serves the small GeoJSON this writes.

    python build_forest_hexes.py \
        --tiles-dir /path/to/hansen_tiles \
        --out ../../server/data/forest_hexes.geojson \
        --boundary /path/to/kenya.geojson        # optional but recommended

Expected files in --tiles-dir (Hansen's naming; tiles are named by the tile's
top-left corner, and Kenya straddles the equator so you'll need several):

    *treecover2000*_<tile>.tif   canopy cover in 2000, 0-100 %
    *lossyear*_<tile>.tif        0 = no loss, 1..N = loss in year 2000+value

Each lossyear file is paired with the treecover2000 file whose name is the same
with "lossyear" swapped for "treecover2000".

How the aggregation works
-------------------------
Calling H3 once per 30 m pixel would mean over a billion calls for Kenya. Instead:
  1. Stream each tile in strips of rows (memory stays flat).
  2. Sum pixels into small square blocks (~1 km) with numpy.
  3. Assign each block to the hex containing the block's centre.
So a block is placed by its centre point, which can misplace edge blocks by up
to ~half a block (~500 m) — negligible against hexes several km across.

"Tree cover" and "loss" use the canopy threshold in hex_common.CANOPY_THRESHOLD
(pixels with >= 30 % canopy in 2000). Loss is hectares of that tree cover lost
per year. Note this is tree cover loss, not deforestation: it includes plantation
harvest, fire, and other causes.
"""

import argparse
import glob
import math
import os
import sys

import h3
import numpy as np
import rasterio
from rasterio.windows import Window

from hex_common import CANOPY_THRESHOLD, hex_feature, write_geojson

# Approximate Kenya bounding box (min lon, min lat, max lon, max lat), padded a little.
KENYA_BBOX = (33.8, -4.9, 42.0, 5.2)


def meters_per_degree(lat_deg: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """(meters per degree of latitude, meters per degree of longitude) on WGS84."""
    phi = np.radians(lat_deg)
    m_lat = 111132.92 - 559.82 * np.cos(2 * phi) + 1.175 * np.cos(4 * phi)
    m_lon = 111412.84 * np.cos(phi) - 93.5 * np.cos(3 * phi) + 0.118 * np.cos(5 * phi)
    return m_lat, m_lon


def _snap(x: float, eps: float = 1e-6) -> float:
    """Snap a float that's extremely close to an integer to that integer.

    Pixel-boundary math below does ceil(ceil(x)/block)*block — a value that
    is mathematically an exact integer (e.g. a bbox edge chosen to land on a
    block boundary) can come out of floating-point division a hair above it
    (e.g. 2400.0000000000005). The inner ceil then rounds that up to 2401,
    and the outer ceil amplifies that single stray pixel into a whole extra
    block. Snapping near-integer floats back to the integer before
    flooring/ceiling avoids this; genuine partial-pixel overhang (fractions
    like 0.1-0.9) is far larger than eps and is unaffected.
    """
    r = round(x)
    return float(r) if abs(x - r) < eps else x


def find_tile_pairs(tiles_dir: str) -> list[tuple[str, str]]:
    pairs = []
    for canopy in sorted(glob.glob(os.path.join(tiles_dir, "*treecover2000*.tif"))):
        loss = canopy.replace("treecover2000", "lossyear")
        if not os.path.exists(loss):
            sys.exit(f"Missing lossyear tile for {os.path.basename(canopy)}: expected {os.path.basename(loss)}")
        pairs.append((canopy, loss))
    if not pairs:
        sys.exit(f"No *treecover2000*.tif files found in {tiles_dir}")
    return pairs


def process_tile(canopy_path, loss_path, bbox, block_deg, strip_blocks, resolution, n_years, acc):
    with rasterio.open(canopy_path) as cs, rasterio.open(loss_path) as ls:
        if cs.shape != ls.shape or cs.transform != ls.transform:
            sys.exit(f"{os.path.basename(canopy_path)} and its lossyear tile don't share a grid")

        t = cs.transform
        px, py = t.a, -t.e  # pixel width / height in degrees (both positive)
        left, top = t.c, t.f
        block = max(1, round(block_deg / px))

        west = max(bbox[0], cs.bounds.left)
        east = min(bbox[2], cs.bounds.right)
        south = max(bbox[1], cs.bounds.bottom)
        north = min(bbox[3], cs.bounds.top)
        if west >= east or south >= north:
            print(f"  {os.path.basename(canopy_path)}: outside bounding box, skipped")
            return

        # Window in pixel space, expanded outward to whole blocks (clipped to the tile).
        col0 = int(math.floor(_snap((west - left) / px)) // block * block)
        row0 = int(math.floor(_snap((top - north) / py)) // block * block)
        col1 = min(int(math.ceil(_snap(math.ceil(_snap((east - left) / px)) / block)) * block), cs.width)
        row1 = min(int(math.ceil(_snap(math.ceil(_snap((top - south) / py)) / block)) * block), cs.height)
        ncols = (col1 - col0) // block * block
        nrows = (row1 - row0) // block * block
        nbx = ncols // block

        # Block-centre longitudes are the same for every strip.
        lon_centers = left + (col0 + (np.arange(nbx) + 0.5) * block) * px

        strip_rows = block * strip_blocks
        for r in range(row0, row0 + nrows, strip_rows):
            h = min(strip_rows, row0 + nrows - r)
            nby = h // block
            win = Window(col0, r, ncols, h)
            canopy = cs.read(1, window=win)
            lossyr = ls.read(1, window=win)

            # Pixel area per row (varies a little with latitude).
            row_lat = top - (r + np.arange(h) + 0.5) * py
            m_lat, m_lon = meters_per_degree(row_lat)
            area_ha = (py * m_lat) * (px * m_lon) / 10_000.0

            tree = canopy >= CANOPY_THRESHOLD

            # Per-block sums.
            canopy_sum = canopy.reshape(nby, block, nbx, block).sum(axis=(1, 3), dtype=np.float64)
            tree_counts = tree.reshape(nby, block, nbx, block).sum(axis=3)  # (nby, block, nbx)
            tree_ha = (tree_counts * area_ha.reshape(nby, block)[:, :, None]).sum(axis=1)  # (nby, nbx)

            # Loss per block per year — only touch the (rare) loss pixels.
            loss_blocks = np.zeros((nby, nbx, n_years))
            rows, cols = np.nonzero(tree & (lossyr > 0) & (lossyr <= n_years))
            if rows.size:
                years = lossyr[rows, cols].astype(np.int64)
                key = ((rows // block) * nbx + (cols // block)) * (n_years + 1) + years
                hist = np.bincount(key, weights=area_ha[rows], minlength=nby * nbx * (n_years + 1))
                loss_blocks = hist.reshape(nby, nbx, n_years + 1)[:, :, 1:]

            # Assign each block to a hex by its centre point.
            lat_centers = top - (r + (np.arange(nby) + 0.5) * block) * py
            cells = np.array([
                h3.latlng_to_cell(lat, lon, resolution)
                for lat in lat_centers for lon in lon_centers
            ])
            uniq, inv = np.unique(cells, return_inverse=True)
            n = len(uniq)

            csum = np.bincount(inv, weights=canopy_sum.ravel(), minlength=n)
            cnt = np.bincount(inv, minlength=n) * float(block * block)
            tha = np.bincount(inv, weights=tree_ha.ravel(), minlength=n)
            loss = np.stack(
                [np.bincount(inv, weights=loss_blocks[:, :, y].ravel(), minlength=n) for y in range(n_years)],
                axis=1,
            )

            for i, cell in enumerate(uniq):
                entry = acc.get(cell)
                if entry is None:
                    acc[cell] = [csum[i], cnt[i], tha[i], loss[i].copy()]
                else:
                    entry[0] += csum[i]
                    entry[1] += cnt[i]
                    entry[2] += tha[i]
                    entry[3] += loss[i]

            print(f"  {os.path.basename(canopy_path)}: rows {r - row0 + h}/{nrows}", end="\r")
        print()


def load_boundary(path):
    from shapely.geometry import shape
    from shapely.ops import unary_union
    from shapely.prepared import prep
    import json

    with open(path) as f:
        gj = json.load(f)
    feats = gj["features"] if gj.get("type") == "FeatureCollection" else [gj]
    geoms = [shape(f["geometry"] if "geometry" in f else f) for f in feats]
    return prep(unary_union(geoms))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--tiles-dir", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--resolution", type=int, default=5, help="H3 resolution (5 ~ 250 km2 hexes, 6 ~ 36 km2)")
    ap.add_argument("--last-year", type=int, default=2024, help="Last year covered by the lossyear layer")
    ap.add_argument("--bbox", type=float, nargs=4, metavar=("W", "S", "E", "N"), default=KENYA_BBOX)
    ap.add_argument("--boundary", help="GeoJSON of Kenya's border; hexes whose centre is outside are dropped")
    ap.add_argument("--block-deg", type=float, default=0.01, help="Intermediate block size in degrees")
    ap.add_argument("--strip-blocks", type=int, default=20, help="Block-rows read per strip (memory knob)")
    args = ap.parse_args()

    n_years = args.last_year - 2000
    pairs = find_tile_pairs(args.tiles_dir)
    print(f"{len(pairs)} tile pair(s), H3 resolution {args.resolution}, loss years 2001-{args.last_year}")

    acc: dict[str, list] = {}
    for canopy_path, loss_path in pairs:
        process_tile(canopy_path, loss_path, tuple(args.bbox), args.block_deg,
                     args.strip_blocks, args.resolution, n_years, acc)

    boundary = load_boundary(args.boundary) if args.boundary else None
    if boundary is None:
        print("WARNING: no --boundary given; hexes over neighbouring countries inside the bbox are kept.")

    features = []
    for cell, (csum, cnt, tha, loss) in acc.items():
        if tha <= 0:  # keep only hexes that contain tree cover
            continue
        if boundary is not None:
            from shapely.geometry import Point
            lat, lng = h3.cell_to_latlng(cell)
            if not boundary.contains(Point(lng, lat)):
                continue
        features.append(hex_feature(cell, csum / cnt, tha, list(loss)))

    write_geojson(
        args.out, features,
        source="hansen-gfc",
        years=list(range(2001, args.last_year + 1)),
        resolution=args.resolution,
        note="Tree cover loss (>=30% canopy in 2000) aggregated from Hansen Global Forest Change tiles.",
    )
    print(f"Wrote {len(features)} hexes to {args.out}")


if __name__ == "__main__":
    main()
