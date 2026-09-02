# Self-contained runtime bundle for the extracted argus-services repository.
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONPATH=/app/src

WORKDIR /app
COPY runtime/requirements.txt runtime/pyproject.toml runtime/README.md ./
COPY runtime/src ./src
RUN pip install --no-cache-dir -r requirements.txt

FROM base AS api-ingest
ENV SERVICE_ROLE=api-ingest API_PORT=3001
EXPOSE 8001
CMD ["python", "-m", "argus.main"]

FROM base AS ws-gateway
ENV SERVICE_ROLE=ws-gateway API_PORT=3003
EXPOSE 8002
CMD ["python", "-m", "argus.main"]

FROM base AS worker
ENV SERVICE_ROLE=worker-vlm
CMD ["python", "-m", "argus.main"]
