import os

import pytest

from pipeline.download import DownloadError, RemoteInfo, fetch

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
