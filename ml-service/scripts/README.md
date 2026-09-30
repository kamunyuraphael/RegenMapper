# Forest-Loss Hexagon Pipeline

Offline batch pipeline that turns Hansen Global Forest Change tiles into a
small H3-hexagon GeoJSON file, which Express serves as-is at
`GET /api/forest-hexes`. This is separate from the NDVI FastAPI service in
`ml-service/app/` — that one answers live per-zone requests; this one runs
once by hand and produces a static file.

## Quick start — demo data (no downloads needed)

```
pip install -r requirements.txt
python make_demo_hexes.py
```

Writes `server/data/forest_hexes.geojson` from synthetic tiles (same
generator the test suite uses). This is **not real data** — the file's
`metadata.source` is `"demo"` and the frontend shows a "demo data" label
whenever it's serving this file. Good enough to build and test the whole
pipeline (map layer, legend, year selector) before touching real tiles.

## Real data

1. Download Hansen Global Forest Change tiles covering Kenya (roughly
   34–42°E, 5°N–5°S) from https://glad.earthengine.app/view/global-forest-change
   or the GLAD download page — you need the matching `treecover2000` and
   `lossyear` GeoTIFFs for each 10×10° tile that overlaps Kenya (Kenya
   straddles the equator, so expect 2–4 tiles).
2. Put them all in one directory.
3. Optionally get a Kenya boundary GeoJSON (e.g. from Natural Earth or
   GADM) to clip hexes to the actual border rather than a bounding box.
4. Run:
   ```
   python build_forest_hexes.py \
       --tiles-dir /path/to/tiles \
       --out ../../server/data/forest_hexes.geojson \
       --boundary /path/to/kenya.geojson
   ```

This has not been run against real Hansen tiles in this environment (no
network access to download them here) — it's been verified against
synthetic tiles instead (see Testing below). Sanity-check the first real run:
compare `treeHa2000` summed across all hexes against GFW's published Kenya
tree-cover figure as a rough cross-check.

## What "tree cover loss" means here

- A pixel counts as tree cover if its year-2000 canopy density was at least
  30% (`hex_common.CANOPY_THRESHOLD`) — this is the commonly used default,
  not a legal or ecological definition.
- "Loss" is *any* complete removal of that canopy in a given year, for any
  reason — this includes plantation harvest cycles (common in Kenya's tea
  and eucalyptus areas) and fire, not only clearing for other land use. It
  is not the same thing as deforestation.
- The Hansen gain layer only covers 2000–2012 and isn't included, so this
  pipeline shows loss only, not regrowth. The NDVI-per-zone feature is the
  place to look for recovery signal.

## Testing

```
python test_pipeline.py
```

Builds synthetic tiles, runs the real `build_forest_hexes.py` against them,
and checks the hex totals against an independent brute-force per-pixel
calculation — covering the full extent, a windowed bounding box, boundary
clipping, and a hex that spans two tiles. This caught a real floating-point
bug during development (chained `ceil()` calls amplifying floating-point
noise into a whole extra block at certain bounding-box edges) — worth
rerunning this if you change the windowing math.

## Performance note

The block-then-H3 aggregation avoids calling the H3 index function per
30m pixel (would be well over a billion calls for Kenya). Pixels are first
summed into ~1km blocks with numpy, and only the resulting block grid
(a few thousand cells) gets H3-indexed. This hasn't been benchmarked against
real full-size Hansen tiles — `--block-deg` and `--strip-blocks` are there to
tune memory/speed if a real run is too slow or uses too much RAM.
