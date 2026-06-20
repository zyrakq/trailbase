#!/bin/sh
set -eu

DEPOT="${TRAILDEPOT_DIR:-/workspace/app/traildepot}"
SEED="/usr/local/share/traildepot-seed"

mkdir -p "$DEPOT/migrations"
cp -a "$SEED/migrations/." "$DEPOT/migrations/"

exec "$@"
