from pathlib import Path

import yaml


SERVICES_ROOT = Path(__file__).parents[1]

PUBLIC_PROJECTS = {
    "capture": 3001,
    "triage": 3002,
    "realtime": 3003,
}
PRIVATE_PROJECTS = {"notifications", "analysis"}


def _compose(project: str) -> dict:
    return yaml.safe_load((SERVICES_ROOT / project / "docker-compose.yml").read_text())


def _service(compose: dict) -> dict:
    assert len(compose["services"]) == 1
    return next(iter(compose["services"].values()))


def test_each_service_project_can_join_the_core_external_network() -> None:
    """Omitting a project or external network makes standalone startup impossible."""
    for project in {*PUBLIC_PROJECTS, *PRIVATE_PROJECTS}:
        compose = _compose(project)

        assert compose["networks"]["argus_dev"] == {
            "external": True,
            "name": "${ARGUS_NETWORK:-argus_dev}",
        }
        assert _service(compose)["networks"] == ["argus_dev"]


def test_public_services_use_the_documented_non_core_ports() -> None:
    """A wrong host port collides with Core Admin or breaks the documented local URL."""
    for project, port in PUBLIC_PROJECTS.items():
        service = _service(_compose(project))
        internal_port = {"capture": 8001, "realtime": 8002}.get(project, port)
        assert service["ports"] == [f"${{ARGUS_BIND_HOST:-127.0.0.1}}:{port}:{internal_port}"]

    for project in PRIVATE_PROJECTS:
        assert "ports" not in _service(_compose(project))


def test_services_do_not_mount_a_core_checkout() -> None:
    """Mounting Core source couples a service checkout to a separate repository."""
    for project in {*PUBLIC_PROJECTS, *PRIVATE_PROJECTS}:
        volumes = _service(_compose(project)).get("volumes", [])
        assert all("../backend" not in volume and "../apps" not in volume for volume in volumes)


def test_runtime_services_use_the_real_service_entrypoints() -> None:
    """Health-only placeholder images must not replace the existing deployables."""
    expected = {
        "capture": "api-ingest",
        "realtime": "ws-gateway",
        "analysis": "worker",
        "notifications": "worker",
    }
    for project, target in expected.items():
        service = _service(_compose(project))
        assert service["build"]["dockerfile"] == "runtime/Dockerfile"
        assert service["build"]["target"] == target

    triage = _service(_compose("triage"))
    assert triage["build"]["dockerfile"] == "triage/Dockerfile"

    runtime_dockerfile = (SERVICES_ROOT / "runtime" / "Dockerfile").read_text()
    assert runtime_dockerfile.count('CMD ["python", "-m", "argus.main"]') == 3

    for project in ("analysis", "notifications"):
        healthcheck = _service(_compose(project))["healthcheck"]["test"]
        assert "celery" in " ".join(healthcheck)
        assert "/health" not in " ".join(healthcheck)
