#!/usr/bin/env python3

from __future__ import annotations

import os
from typing import Any, cast
from urllib.parse import urlparse

from kernel import Kernel
from vibium.sync_api import browser


def require_string(payload: dict[str, Any], key: str) -> str:
    value = payload.get(key)
    if not isinstance(value, str) or not value:
        raise RuntimeError(f"expected {key} to be a non-empty string")
    return value


def mask_ws_url(raw_url: str) -> str:
    parsed = urlparse(raw_url)
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"


def main() -> None:
    client = Kernel()

    session_id: str | None = None
    bro = None

    try:
        # TODO: replace raw response parsing once the published SDK exposes webdriver_ws_url.
        raw_response = client.browsers.with_raw_response.create()
        raw_browser = cast(dict[str, Any], raw_response.json())

        session_id = require_string(raw_browser, "session_id")
        webdriver_ws_url = require_string(raw_browser, "webdriver_ws_url")

        print(f"created Kernel browser session {session_id}")
        print(f"using BiDi endpoint {mask_ws_url(webdriver_ws_url)}")

        bro = browser.start(webdriver_ws_url)
        page = bro.page()

        page.go("https://example.com")
        title = page.title()
        heading = page.find("h1").text()

        print(f"page title: {title}")
        print(f"h1 text: {heading}")

        if title != "Example Domain":
            raise RuntimeError(f'expected title "Example Domain", got "{title}"')

        if heading != "Example Domain":
            raise RuntimeError(f'expected h1 "Example Domain", got "{heading}"')

        print("Python example completed successfully")
    finally:
        if bro is not None:
            bro.stop()

        if session_id:
            client.browsers.delete_by_id(session_id)


if __name__ == "__main__":
    main()
