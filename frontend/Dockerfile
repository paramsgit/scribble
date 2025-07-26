FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY vite.config.* ./
COPY tsconfig.* ./
RUN npm install

COPY . .
RUN npm install --save-dev @types/express
RUN npm install -g typescript
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
