#!/usr/bin/env bash

set -euo pipefail

browser_json=""
session_id=""

cleanup() {
  if [[ -n "${session_id}" ]]; then
    kernel browsers delete "${session_id}" >/dev/null 2>&1 || true
  fi

  if [[ -n "${browser_json}" && -f "${browser_json}" ]]; then
    rm -f "${browser_json}"
  fi
}

trap cleanup EXIT

mask_ws_url() {
  python3 - "$1" <<'PY'
import sys
from urllib.parse import urlparse

value = sys.argv[1]
parsed = urlparse(value)
print(f"{parsed.scheme}://{parsed.netloc}{parsed.path}")
PY
}

main() {
  browser_json="$(mktemp)"
  kernel browsers create -o json >"${browser_json}"

  session_id="$(jq -r '.session_id // empty' "${browser_json}")"
  local webdriver_ws_url
  webdriver_ws_url="$(jq -r '.webdriver_ws_url // empty' "${browser_json}")"

  if [[ -z "${session_id}" || -z "${webdriver_ws_url}" ]]; then
    echo "browser create response did not include session_id and webdriver_ws_url" >&2
    exit 1
  fi

  export VIBIUM_CONNECT_URL="${webdriver_ws_url}"

  echo "created Kernel browser session ${session_id}"
  echo "using BiDi endpoint $(mask_ws_url "${webdriver_ws_url}")"
  echo "navigating to https://example.com"

  vibium go https://example.com

  local title
  title="$(vibium title)"
  echo "page title: ${title}"
  [[ "${title}" == "Example Domain" ]]

  local heading
  heading="$(vibium text h1)"
  echo "h1 text: ${heading}"
  [[ "${heading}" == "Example Domain" ]]

  echo "CLI example completed successfully"
}

main "$@"
