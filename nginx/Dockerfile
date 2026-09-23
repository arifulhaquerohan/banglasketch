FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /var/www/certbot /var/www/staticfiles

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
