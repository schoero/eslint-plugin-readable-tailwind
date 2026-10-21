FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY . .

RUN npm i

CMD ["npm", "t"]