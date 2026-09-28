#!/bin/bash
# shot.sh <distDir> <out.png> [query] — headless Chrome screenshot of a built bundle
DIST=$1; OUT=$2; Q=${3:-}
PORT=$((8700 + RANDOM % 200))
(cd "$DIST" && python3 -m http.server $PORT >/dev/null 2>&1) & SRV=$!
sleep 0.5
google-chrome --headless=new --no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars \
  --window-size=1280,800 --virtual-time-budget=8000 --screenshot="$OUT" "http://127.0.0.1:$PORT/index.html$Q" >/dev/null 2>&1
kill $SRV
