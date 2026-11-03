import io
import os

import pytest

from pipeline.download import DownloadError, RemoteInfo, download_ranges, fetch

URL = "https://example.org/mesh.zip"
MODIFIED = 1_772_136_168.0  # 2026-02-26 20:02:48 UTC


class FakeTransport:
    """In-memory server: serves `body` with the given date, failing the first `failures` calls."""

    def __init__(self, body=b"mesh-v1", modified=MODIFIED, known=True, failures=0, truncate=False):
        self.body = body
        self.modified = modified
        self.known = known
        self.failures = failures
        self.truncate = truncate
        self.gets = 0

    def _maybe_fail(self):
        if self.failures > 0:
            self.failures -= 1
            raise ConnectionError("FTP hiccup")

    def head(self, url):
        self._maybe_fail()
        if not self.known:
            return RemoteInfo(size=None, modified=None)
        return RemoteInfo(size=len(self.body), modified=self.modified)

    def get(self, url, dest):
        self._maybe_fail()
        self.gets += 1
        dest.write_bytes(self.body[:-1] if self.truncate else self.body)


def no_sleep(_seconds):
    pass


def test_first_fetch_downloads_and_stamps_the_remote_date(tmp_path):
    dest = tmp_path / "raw" / "mesh.zip"
    server = FakeTransport()

    downloaded = fetch(URL, dest, transport=server, sleep=no_sleep)

    assert downloaded is True
    assert dest.read_bytes() == b"mesh-v1"
    assert os.path.getmtime(dest) == MODIFIED


def test_same_size_and_date_uses_the_cache(tmp_path):
    dest = tmp_path / "mesh.zip"
    server = FakeTransport()
    fetch(URL, dest, transport=server, sleep=no_sleep)

    downloaded = fetch(URL, dest, transport=server, sleep=no_sleep)

    assert downloaded is False
    assert server.gets == 1


def test_new_remote_date_downloads_again(tmp_path):
    dest = tmp_path / "mesh.zip"
    fetch(URL, dest, transport=FakeTransport(), sleep=no_sleep)

    newer = FakeTransport(body=b"mesh-v2", modified=MODIFIED + 86_400)
    downloaded = fetch(URL, dest, transport=newer, sleep=no_sleep)

    assert downloaded is True
    assert dest.read_bytes() == b"mesh-v2"


def test_new_remote_size_downloads_again(tmp_path):
    dest = tmp_path / "mesh.zip"
    fetch(URL, dest, transport=FakeTransport(), sleep=no_sleep)

    downloaded = fetch(URL, dest, transport=FakeTransport(body=b"mesh-v1-fixed"), sleep=no_sleep)

    assert downloaded is True
    assert dest.read_bytes() == b"mesh-v1-fixed"


def test_server_without_size_or_date_always_downloads(tmp_path):
    dest = tmp_path / "list.json"
    server = FakeTransport(known=False)
    fetch(URL, dest, transport=server, sleep=no_sleep)

    downloaded = fetch(URL, dest, transport=server, sleep=no_sleep)

    assert downloaded is True
    assert server.gets == 2


def test_transient_failures_are_retried(tmp_path):
    dest = tmp_path / "mesh.zip"
    waits: list[float] = []

    downloaded = fetch(URL, dest, transport=FakeTransport(failures=2), sleep=waits.append)

    assert downloaded is True
    assert dest.read_bytes() == b"mesh-v1"
    assert len(waits) == 2


def test_gives_up_after_the_last_attempt_and_keeps_the_old_file(tmp_path):
    dest = tmp_path / "mesh.zip"
    dest.write_bytes(b"old")

    with pytest.raises(DownloadError, match=URL):
        fetch(URL, dest, transport=FakeTransport(failures=99), attempts=3, sleep=no_sleep)

    assert dest.read_bytes() == b"old"
    assert list(tmp_path.iterdir()) == [dest]


def test_truncated_download_is_rejected_and_not_kept(tmp_path):
    dest = tmp_path / "mesh.zip"

    with pytest.raises(DownloadError):
        fetch(URL, dest, transport=FakeTransport(truncate=True), attempts=2, sleep=no_sleep)

    assert list(tmp_path.iterdir()) == []


CONTENT = bytes(range(256)) * 1000


def test_ranges_reassemble_the_file_byte_for_byte(tmp_path):
    dest = tmp_path / "file.csv"

    download_ranges(lambda offset: io.BytesIO(CONTENT[offset:]), len(CONTENT), dest, workers=4)

    assert dest.read_bytes() == CONTENT


class DroppingStream(io.BytesIO):
    """Serves `limit` bytes and then loses the connection."""

    def __init__(self, content: bytes, limit: int) -> None:
        super().__init__(content)
        self._left = limit

    def read(self, size: int | None = -1) -> bytes:
        if self._left <= 0:
            raise ConnectionError("connection lost")
        chunk = super().read(min(size if size and size > 0 else self._left, self._left))
        self._left -= len(chunk)
        return chunk


def test_a_lost_connection_resumes_from_where_the_range_stopped(tmp_path):
    dest = tmp_path / "file.csv"
    offsets = []

    def open_range(offset):
        offsets.append(offset)
        return DroppingStream(CONTENT[offset:], 50_000)

    download_ranges(open_range, len(CONTENT), dest, workers=2, sleep=no_sleep)

    assert dest.read_bytes() == CONTENT
    assert 50_000 in offsets  # first range resumed, not restarted from zero
    assert offsets.count(0) == 1


def test_a_range_that_stops_advancing_fails_the_download(tmp_path):
    def open_range(offset):
        return DroppingStream(CONTENT[offset:], 0 if offset else 1000)

    with pytest.raises(DownloadError):
        download_ranges(open_range, len(CONTENT), tmp_path / "file.csv", workers=2, sleep=no_sleep)


def test_a_stream_that_ends_early_is_not_taken_for_a_complete_file(tmp_path):
    with pytest.raises(DownloadError):
        download_ranges(lambda offset: io.BytesIO(b""), len(CONTENT), tmp_path / "file.csv", sleep=no_sleep)
