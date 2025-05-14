
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 514/udp 514/tcp

CMD ["node", "index.js"]
