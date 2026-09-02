# ARGUS Services

Each directory is independently runnable after Core creates the shared Docker
network:

```bash
cd argus-core && docker compose up -d
cd ../argus-services/capture && docker compose up --build
```

Every project joins the external `argus_dev` network.  Service wire models are
provided by the separately versioned `argus-libs` contracts package; this
skeleton deliberately contains no Core source mounts.

Core's Caddy gateway terminates HTTPS for public services. The public URLs are
capture `https://development.argus.com:3000`, triage
`https://development.argus.com:3001`, and realtime
`https://development.argus.com:3002`. Notifications and analysis expose only
their internal health endpoint on `8080`.
