#!/usr/bin/env python3
"""
Generate a demo forest_hexes.geojson by running the real pipeline
(build_forest_hexes.py) against synthetic tiles, so the app has something to
render before real Hansen tiles are downloaded. Clearly marked as demo data
in the output's metadata.source field — swap it for the real thing by running
build_forest_hexes.py against actual Hansen tiles (see README.md).

Covers a patch of real Kenyan coordinates around Thika (lon 36-38, lat -1..0)
so the demo map view lands somewhere meaningful.
"""

import json
import os
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from test_pipeline import make_tile

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "server", "data", "forest_hexes.geojson")


def main():
    with tempfile.TemporaryDirectory() as tmp:
        make_tile(tmp, "A", 36.0, 0.0)
        make_tile(tmp, "B", 37.0, 0.0)

        cmd = [
            sys.executable, os.path.join(HERE, "build_forest_hexes.py"),
            "--tiles-dir", tmp,
            "--out", OUT,
            "--resolution", "5",
            "--last-year", "2024",
            "--bbox", "36.0", "-1.0", "38.0", "0.0",
        ]
        res = subprocess.run(cmd, cwd=HERE)
        if res.returncode != 0:
            sys.exit("pipeline failed")

    with open(OUT) as f:
        data = json.load(f)
    data["metadata"]["source"] = "demo"
    data["metadata"]["note"] = (
        "Synthetic demo data, not real satellite data — see ml-service/scripts/README.md "
        "to generate this from real Hansen Global Forest Change tiles."
    )
    with open(OUT, "w") as f:
        json.dump(data, f, separators=(",", ":"))

    print(f"Wrote {len(data['features'])} demo hexes to {OUT}")


if __name__ == "__main__":
    main()
