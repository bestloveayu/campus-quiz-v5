"""Regression test: V5 must start on a separate port when its old port is in use."""

import socket
import subprocess
import sys
import time
import unittest
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen


ROOT = Path(__file__).resolve().parent


def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


class ServerLaunchTests(unittest.TestCase):
    def test_custom_port_serves_v5_even_when_another_port_is_busy(self):
        with socket.socket() as occupied:
            occupied.bind(("127.0.0.1", 0))
            occupied.listen()
            other_port = occupied.getsockname()[1]
            new_port = free_port()
            process = subprocess.Popen(
                [sys.executable, str(ROOT / "server.py"), "--port", str(new_port)],
                cwd=ROOT,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            try:
                for _ in range(30):
                    try:
                        with urlopen(f"http://127.0.0.1:{new_port}/author.js", timeout=0.3) as response:
                            source = response.read().decode("utf-8")
                        break
                    except (URLError, TimeoutError):
                        if process.poll() is not None:
                            self.fail(f"Server exited before launch: {process.communicate()!r}")
                        time.sleep(0.1)
                else:
                    self.fail("New port never became reachable")
                self.assertIn("manageDoors", source)
                self.assertNotEqual(new_port, other_port)
            finally:
                process.terminate()
                try:
                    process.communicate(timeout=3)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.communicate(timeout=3)


if __name__ == "__main__":
    unittest.main()
