"""Download with an incremental cache and retries (spec, section 14, step 1)."""

import calendar
import ftplib
import gzip
import itertools
import os
import shutil
import threading
import time
import urllib.error
import urllib.request
from collections.abc import Callable, Iterator
from concurrent.futures import ThreadPoolExecutor
from contextlib import AbstractContextManager, contextmanager
from dataclasses import dataclass
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import BinaryIO, Protocol
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


_CHUNK_BYTES = 1 << 20
"""How much one read or write moves at a time."""

RANGED_FROM = 64 << 20
"""Below this size, a single stream is fast enough and costs fewer FTP sessions."""

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
            shutil.copyfileobj(body, file, length=_CHUNK_BYTES)


def download_ranges(
    open_range: Callable[[int], AbstractContextManager[BinaryIO]],
    size: int,
    dest: Path,
    *,
    workers: int = 4,
    attempts: int = 5,
    sleep: Callable[[float], None] = time.sleep,
) -> None:
    """Download `size` bytes into `dest` over `workers` streams, each from its own offset.

    A lost stream reopens from where it stopped. A range gives up after `attempts`
    consecutive failures without a new byte, and that stops the other ranges too.
    """
    failed = threading.Event()

    def download_range(fd: int, start: int, end: int) -> None:
        position = start
        failures = 0
        while position < end and not failed.is_set():
            try:
                with open_range(position) as stream:
                    while position < end and not failed.is_set():
                        chunk = stream.read(min(_CHUNK_BYTES, end - position))
                        if not chunk:
                            raise DownloadError(f"stream ended at byte {position} of {end}")
                        os.pwrite(fd, chunk, position)
                        position += len(chunk)
                        failures = 0
            except (OSError, DownloadError) as error:
                failures += 1
                if failures >= attempts:
                    failed.set()
                    raise DownloadError(f"range stuck at byte {position}: {error}") from error
                sleep(2.0**failures)

    with dest.open("wb") as file:
        file.truncate(size)
        bounds = [size * i // workers for i in range(workers + 1)]
        with ThreadPoolExecutor(workers) as pool:
            futures = [
                pool.submit(download_range, file.fileno(), start, end)
                for start, end in itertools.pairwise(bounds)
            ]
        for future in futures:
            future.result()


class _ExtendedPassiveFTP(ftplib.FTP):
    def makepasv(self) -> tuple[str, int]:
        """Prefer EPSV: DATASUS PASV sessions can stall when negotiating REST."""
        assert self.sock is not None
        try:
            return ftplib.parse229(self.sendcmd('EPSV'), self.sock.getpeername())
        except ftplib.error_perm as error:
            if str(error)[:3] not in {'500', '502'}:
                raise
            return super().makepasv()


def _connect_ftp(url: str, timeout: float) -> tuple[ftplib.FTP, str]:
    """An anonymous binary-mode session on the URL's host, and the path on it."""
    parts = urlsplit(url)
    ftp = _ExtendedPassiveFTP(parts.hostname or "", timeout=timeout)
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
        with ftp:
            size = ftp.size(path)
            if size is None or size < RANGED_FROM:
                with dest.open("wb") as file:
                    ftp.retrbinary(f"RETR {path}", file.write, blocksize=_CHUNK_BYTES)
                return
        download_ranges(lambda offset: self._open_range(url, offset), size, dest)

    @contextmanager
    def _open_range(self, url: str, offset: int) -> Iterator[BinaryIO]:
        try:
            ftp, path = _connect_ftp(url, self._timeout)
        except (ftplib.Error, EOFError) as error:
            raise DownloadError(f"could not connect: {error}") from error
        try:
            try:
                data = ftp.transfercmd(f"RETR {path}", rest=offset if offset else None)
            except (ftplib.Error, EOFError) as error:
                raise DownloadError(f"could not open byte {offset}: {error}") from error
            with data, data.makefile("rb") as stream:
                yield stream
        finally:
            # Not QUIT: the server would only answer after the unfinished transfer.
            ftp.close()


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
