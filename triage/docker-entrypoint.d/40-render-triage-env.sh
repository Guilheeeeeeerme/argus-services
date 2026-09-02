#!/bin/sh
set -eu

envsubst '${TRIAGE_API_URL} ${TRIAGE_WS_URL}' \
  < /usr/share/nginx/html/env.js.template \
  > /usr/share/nginx/html/env.js
