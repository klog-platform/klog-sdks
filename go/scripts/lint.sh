#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

go vet ./...

unformatted=$(gofmt -l .)
if [ -n "$unformatted" ]; then
  echo "gofmt pendiente:" >&2
  echo "$unformatted" >&2
  exit 1
fi
