# @/Dockerfile
FROM node:20-alpine

WORKDIR /app

# ▼ 修正: openssl に加えて ffmpeg をインストール
RUN apk add --no-cache openssl ffmpeg

COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "dev"]