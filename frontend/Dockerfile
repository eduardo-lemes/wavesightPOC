FROM nginx:1.27-alpine

COPY frontend/index.html /usr/share/nginx/html/index.html
COPY frontend/styles.css /usr/share/nginx/html/styles.css
COPY logo-resize.png /usr/share/nginx/html/assets/logo.png
COPY frontend/assets /usr/share/nginx/html/assets
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
