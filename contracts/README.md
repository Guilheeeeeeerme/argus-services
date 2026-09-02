# Service communication boundary

Services use HTTPS REST through the Core Caddy DMZ for synchronous requests.
The DMZ allowlist, request-size limit, bearer-token boundary, and correlation
header propagation are defined in Core's `infra/caddy/Caddyfile`.

Durable application events use the Core RabbitMQ broker on the durable
`argus.events` exchange with publisher confirms. Redis is limited to
short-lived idempotency state and WebSocket pub/sub; it is not the durable
event transport.
