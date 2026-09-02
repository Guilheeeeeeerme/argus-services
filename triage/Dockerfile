FROM node:22-alpine AS build
WORKDIR /app
COPY triage/client/package.json triage/client/tsconfig.json triage/client/vite.config.ts triage/client/index.html ./
COPY triage/client/src ./src
RUN npm install && npm run build

FROM nginx:1.27-alpine
COPY triage/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY triage/env.js.template /usr/share/nginx/html/env.js.template
COPY triage/docker-entrypoint.d/40-render-triage-env.sh /docker-entrypoint.d/40-render-triage-env.sh
RUN chmod +x /docker-entrypoint.d/40-render-triage-env.sh
EXPOSE 3002
