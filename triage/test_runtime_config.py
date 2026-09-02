from pathlib import Path
import unittest


SERVICE_ROOT = Path(__file__).parent


class RuntimeConfigImageTest(unittest.TestCase):
    def test_image_renders_runtime_config_into_document_root(self) -> None:
        """Removing the entrypoint would leave /env.js to fall back to index.html."""
        dockerfile = (SERVICE_ROOT / "Dockerfile").read_text()
        entrypoint_path = SERVICE_ROOT / "docker-entrypoint.d" / "40-render-triage-env.sh"

        self.assertTrue(entrypoint_path.is_file())
        entrypoint = entrypoint_path.read_text()

        self.assertIn(
            "COPY triage/env.js.template /usr/share/nginx/html/env.js.template", dockerfile
        )
        self.assertIn(
            "COPY triage/docker-entrypoint.d/40-render-triage-env.sh /docker-entrypoint.d/40-render-triage-env.sh",
            dockerfile,
        )
        self.assertIn("TRIAGE_API_URL", entrypoint)
        self.assertIn("TRIAGE_WS_URL", entrypoint)
        self.assertIn("/usr/share/nginx/html/env.js", entrypoint)

    def test_built_client_loads_and_consumes_runtime_websocket_config(self) -> None:
        index = (SERVICE_ROOT / "client/index.html").read_text()
        client = (SERVICE_ROOT / "client/src/main.tsx").read_text()

        self.assertIn('<script src="/env.js"></script>', index)
        self.assertIn("window.ARGUS_TRIAGE_CONFIG", client)
        self.assertIn("wss://development.argus.com:3002", client)


if __name__ == "__main__":
    unittest.main()
