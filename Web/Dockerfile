FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG API_URL=http://localhost:3000
RUN sed -i "s#apiUrl: 'http://localhost:3000'#apiUrl: '${API_URL}'#g" src/environments/environment.ts \
  && npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/Web/browser /usr/share/nginx/html

EXPOSE 80
