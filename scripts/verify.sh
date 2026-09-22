#!/usr/bin/env bash
# Definition of done for PaymentLab. Run this before claiming a task is finished.
#
#   ./scripts/verify.sh            backend + frontend
#   ./scripts/verify.sh backend    backend only
#   ./scripts/verify.sh frontend   frontend only

set -uo pipefail

cd "$(dirname "$0")/.." || exit 1
scope="${1:-all}"
failures=()

run() {
  local label="$1"
  shift
  echo ""
  echo "=== $label ==="
  if "$@"; then
    echo "--- $label OK"
  else
    echo "--- $label FAILED"
    failures+=("$label")
  fi
}

if [ "$scope" = "all" ] || [ "$scope" = "backend" ]; then
  if command -v dotnet >/dev/null 2>&1; then
    run "backend tests" dotnet test backend/PaymentLab.sln --nologo
  else
    echo "dotnet not found on PATH — install the .NET 8 SDK (see labs/LAB-0-setup.md)"
    failures+=("backend tests (dotnet missing)")
  fi
fi

if [ "$scope" = "all" ] || [ "$scope" = "frontend" ]; then
  if command -v npm >/dev/null 2>&1; then
    run "frontend tests" npm --prefix frontend test
    run "frontend typecheck + build" npm --prefix frontend run build
  else
    echo "npm not found on PATH — install Node 20+ (see labs/LAB-0-setup.md)"
    failures+=("frontend (npm missing)")
  fi
fi

echo ""
echo "==============================================="
if [ ${#failures[@]} -eq 0 ]; then
  echo "  VERIFY PASSED"
  echo "==============================================="
  exit 0
fi

echo "  VERIFY FAILED:"
for failure in "${failures[@]}"; do
  echo "    - $failure"
done
echo "==============================================="
exit 1
