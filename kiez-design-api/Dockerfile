FROM node:20-slim
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .
VOLUME ["/app/storage"]
EXPOSE 3100
CMD ["node", "server.js"]
