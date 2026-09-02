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

Public development ports are capture `3001`, triage `3002`, and
realtime `3003`. Notifications and analysis expose only their internal health
endpoint on `8080`.
