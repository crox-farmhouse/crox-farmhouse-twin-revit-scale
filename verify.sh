#!/bin/bash
# Sync workspace -> scratch, then typecheck and compare the scene snapshot against the pristine golden.
set -e
cd "$(dirname "$0")"
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
./sync.sh
npx tsc --noEmit -p tsconfig.json
node tools/snapshot/run.mjs check .snapshots/scene.golden.snap
