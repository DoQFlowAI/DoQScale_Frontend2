FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.30-alpine
COPY nginx/ /etc/nginx/templates/

ENV BACKEND_URL=http://backend:8080
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
ENV NGINX_ENVSUBST_TEMPLATE_DIR=/etc/nginx/templates/http

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80 443
