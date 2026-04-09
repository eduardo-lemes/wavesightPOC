FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend-new/package*.json ./
RUN npm ci
COPY frontend-new/ ./
COPY logo-resize.png ./public/assets/logo.png
COPY frontend/assets ./public/assets
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
