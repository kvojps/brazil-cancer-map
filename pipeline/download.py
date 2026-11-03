"""Download with an incremental cache and retries (spec, section 14, step 1)."""

import gzip
import os
import shutil
import time
import urllib.error
import urllib.request
from collections.abc import Callable
from dataclasses import dataclass
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Protocol


@dataclass(frozen=True)
class RemoteInfo:
    """What the server says about a file. `None` means the server did not say."""

    size: int | None
    modified: float | None
    """Last modification, as a Unix timestamp."""


class Transport(Protocol):
    def head(self, url: str) -> RemoteInfo:
        """Return the remote file's size and date without downloading it."""
        ...

    def get(self, url: str, dest: Path) -> None:
        """Download the whole file into `dest`."""
        ...


class DownloadError(Exception):
    pass


METHOD_NOT_SUPPORTED = {405, 501}
"""HEAD refused (IBGE's localities API answers 405): size and date are unknown."""


class HttpTransport:
    """Transport over HTTP(S) using the standard library."""

    def __init__(self, timeout: float = 120) -> None:
        self._timeout = timeout

    def head(self, url: str) -> RemoteInfo:
        request = urllib.request.Request(url, method="HEAD")
        try:
            with urllib.request.urlopen(request, timeout=self._timeout) as response:
                # A compressed body's length is not the file's size.
                compressed = response.headers.get("Content-Encoding") == "gzip"
                length = None if compressed else response.headers.get("Content-Length")
                modified = response.headers.get("Last-Modified")
        except urllib.error.HTTPError as error:
            if error.code in METHOD_NOT_SUPPORTED:
                return RemoteInfo(size=None, modified=None)
            raise
        return RemoteInfo(
            size=int(length) if length is not None else None,
            modified=parsedate_to_datetime(modified).timestamp() if modified else None,
        )

    def get(self, url: str, dest: Path) -> None:
        with (
            urllib.request.urlopen(url, timeout=self._timeout) as response,
            dest.open("wb") as file,
        ):
            body = (
                gzip.GzipFile(fileobj=response)
                if response.headers.get("Content-Encoding") == "gzip"
                else response
            )
            shutil.copyfileobj(body, file, length=1 << 20)


def fetch(
    url: str,
    dest: Path,
    *,
    transport: Transport | None = None,
    attempts: int = 4,
    sleep: Callable[[float], None] = time.sleep,
) -> bool:
    """Bring `dest` up to date with `url` and return whether it downloaded.

    The local copy counts as current when its size and date match the
    server's. When the server gives neither, it always downloads. Failures are
    retried with a growing wait; a download that fails or comes back truncated
    leaves the previous file untouched.
    """
    transport = transport or HttpTransport()
    dest.parent.mkdir(parents=True, exist_ok=True)
    partial = dest.with_name(dest.name + ".part")
    last_error: Exception | None = None

    for attempt in range(attempts):
        if attempt > 0:
            sleep(2.0**attempt)
        try:
            remote = transport.head(url)
            if _is_current(dest, remote):
                return False
            transport.get(url, partial)
            size = partial.stat().st_size
            if remote.size is not None and size != remote.size:
                raise DownloadError(f"expected {remote.size} bytes, got {size}")
            if remote.modified is not None:
                os.utime(partial, (remote.modified, remote.modified))
            partial.replace(dest)
            return True
        except Exception as error:
            last_error = error
            partial.unlink(missing_ok=True)

    raise DownloadError(f"could not download {url} after {attempts} attempts: {last_error}")


def _is_current(dest: Path, remote: RemoteInfo) -> bool:
    if remote.size is None or remote.modified is None or not dest.exists():
        return False
    local = dest.stat()
    return local.st_size == remote.size and local.st_mtime == remote.modified
