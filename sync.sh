#!/bin/bash
# Mirror the CitC workspace sources into this scratch build dir (which owns node_modules).
set -e
SRC=/path/to/source
DST=$(cd "$(dirname "$0")" && pwd)
rm -rf "$DST/src" "$DST/tools"
cp -r "$SRC/src" "$DST/src"
cp -r "$SRC/tools" "$DST/tools"
cp "$SRC/package.json" "$SRC/tsconfig.json" "$SRC/index.html" "$SRC/vite.config.js" "$DST/"
