FROM node:22-alpine

WORKDIR .

COPY package*.json ./
RUN npm install --production

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["node", "dist/server.js"]