"""Regression contracts for the REST DMZ and private messaging boundary."""

from pathlib import Path

import yaml


SERVICES_ROOT = Path(__file__).parents[1]


def _compose(project: str) -> dict:
    return yaml.safe_load((SERVICES_ROOT / project / "docker-compose.yml").read_text())


def _environment(project: str) -> dict[str, str]:
    service = next(iter(_compose(project)["services"].values()))
    return service["environment"]


def test_service_messaging_configuration_uses_durable_events_and_limited_redis_roles() -> None:
    """A service must not quietly use Redis as durable transport or omit RabbitMQ durability."""
    expected_events = {
        "capture": "sequence.ingested.v1",
        "realtime": "decision.created.v1,decision.resolved.v1",
        "analysis": "sequence.ingested.v1,decision.created.v1,decision.resolved.v1",
    }
    expected_redis_roles = {
        "capture": "idempotency",
        "realtime": "pubsub,short-lived-state",
        "analysis": "short-lived-state",
    }

    for project, event_names in expected_events.items():
        environment = _environment(project)
        assert environment["RABBITMQ_EVENT_EXCHANGE"] == "argus.events"
        assert environment["RABBITMQ_EVENT_DURABLE"] == "true"
        assert environment["RABBITMQ_EVENT_PUBLISH_CONFIRM"] == "true"
        assert environment["RABBITMQ_EVENT_NAMES"] == event_names
        assert environment["REDIS_ROLE"] == expected_redis_roles[project]


def test_service_projects_publish_only_their_application_ports() -> None:
    """Publishing database, Redis, or broker ports would bypass the private network boundary."""
    for project in ("capture", "realtime", "analysis"):
        compose = _compose(project)
        service = next(iter(compose["services"].values()))
        published = " ".join(service.get("ports", []))
        assert ":5432" not in published
        assert ":6379" not in published
        assert ":5672" not in published
        assert ":15672" not in published
