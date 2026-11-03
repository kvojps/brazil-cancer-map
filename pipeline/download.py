"""Download with an incremental cache and retries (spec, section 14, step 1)."""

import calendar
import ftplib
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
from urllib.parse import urlsplit


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


def _connect_ftp(url: str, timeout: float) -> tuple[ftplib.FTP, str]:
    """An anonymous binary-mode session on the URL's host, and the path on it."""
    parts = urlsplit(url)
    ftp = ftplib.FTP(parts.hostname or "", timeout=timeout)
    ftp.login()
    ftp.voidcmd("TYPE I")
    return ftp, parts.path


class FtpTransport:
    """Transport over anonymous FTP (DATASUS), using SIZE and MDTM for the cache check."""

    def __init__(self, timeout: float = 120) -> None:
        self._timeout = timeout

    def head(self, url: str) -> RemoteInfo:
        ftp, path = _connect_ftp(url, self._timeout)
        with ftp:
            size = ftp.size(path)
            # MDTM answers "213 YYYYMMDDHHMMSS" in UTC.
            stamp = ftp.voidcmd(f"MDTM {path}").split()[-1][:14]
        modified = float(calendar.timegm(time.strptime(stamp, "%Y%m%d%H%M%S")))
        return RemoteInfo(size=size, modified=modified)

    def get(self, url: str, dest: Path) -> None:
        ftp, path = _connect_ftp(url, self._timeout)
        with ftp, dest.open("wb") as file:
            ftp.retrbinary(f"RETR {path}", file.write, blocksize=1 << 20)


def with_retries[T](
    action: Callable[[], T],
    what: str,
    *,
    attempts: int = 4,
    sleep: Callable[[float], None] = time.sleep,
) -> T:
    """Run `action`, retrying failures with a growing wait like `fetch`."""
    last_error: Exception | None = None
    for attempt in range(attempts):
        if attempt > 0:
            sleep(2.0**attempt)
        try:
            return action()
        except Exception as error:
            last_error = error
    raise DownloadError(f"could not {what} after {attempts} attempts: {last_error}")


def list_ftp(url: str) -> list[str]:
    """Names of the files in an FTP directory."""

    def listing() -> list[str]:
        ftp, path = _connect_ftp(url, timeout=120)
        with ftp:
            return [name.rsplit("/", 1)[-1] for name in ftp.nlst(path)]

    return with_retries(listing, f"list {url}")


def transport_for(url: str) -> Transport:
    """The transport that speaks the URL's scheme."""
    return FtpTransport() if url.startswith("ftp://") else HttpTransport()


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
    transport = transport or transport_for(url)
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
